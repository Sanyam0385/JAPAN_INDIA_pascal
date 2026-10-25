// App-level Realtime Synchronization Hook
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { useToastStore } from '../../stores/toastStore';
import { subscribeToTable, SubscriptionHandle } from './subscribeToTable';
import { isBackendEnabled } from '../supabase/client';
import type { PickupJob, Receipt, Complaint, AppNotification } from '../../types';

export function useRealtimeSync() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    hydrateAll,
  } = useAppStore();
  const { showToast } = useToastStore();

  const subscriptionsRef = useRef<SubscriptionHandle[]>([]);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active');

  const cleanupSubscriptions = () => {
    subscriptionsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
        if (__DEV__) console.warn('[useRealtimeSync] Error unsubscribing:', e);
      }
    });
    subscriptionsRef.current = [];
  };

  const setupSubscriptions = () => {
    cleanupSubscriptions();

    if (!isBackendEnabled() || !isAuthenticated || !user) {
      return;
    }

    const handles: SubscriptionHandle[] = [];

    // ────────────────────────────────────────────────────────────────────────
    // 1. INFORMAL PICKER / COLLECTOR: New opportunities in their ward & job updates
    // ────────────────────────────────────────────────────────────────────────
    if (user.role === 'informal_picker' || user.role === 'formal_collector' || (user.role as string) === 'picker') {
      const userWard = user.wardName || 'Ward 151';

      // Subscribe to all jobs in the picker's ward
      const jobsSub = subscribeToTable<any>({
        table: 'pickup_jobs',
        filter: `ward=eq.${userWard}`,
        onInsert: (row) => {
          // New doorstep request nearby!
          showToast({
            title: 'New Request Nearby!',
            message: `${row.estimated_kg} kg ${row.material} in ${row.ward}`,
            type: 'success',
            icon: 'leaf',
          });

          // Add to local jobs store
          const newJob: PickupJob = {
            id: row.id,
            householdId: row.household_id,
            householdName: row.household_name || 'Household User',
            householdAddress: row.household_address || undefined,
            pickerId: row.picker_id || undefined,
            pickerName: row.picker_name || undefined,
            material: row.material,
            estimatedKg: Number(row.estimated_kg),
            status: row.status,
            proposedRatePerKg: row.proposed_rate_per_kg ? Number(row.proposed_rate_per_kg) : undefined,
            lockedRatePerKg: row.locked_rate_per_kg ? Number(row.locked_rate_per_kg) : undefined,
            window: row.pickup_window || 'Morning (8am - 12pm)',
            pickupWindow: row.pickup_window || 'Morning (8am - 12pm)',
            location: {
              ward: row.ward,
              address: row.household_address || undefined,
              latitude: row.lat ?? undefined,
              longitude: row.lng ?? undefined,
            },
            ward: row.ward,
            cityKey: row.city_key || 'BLR',
            notes: row.notes || undefined,
            qrCode: row.qr_code || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };

          useAppStore.setState((s) => {
            if (s.pickupJobs.some((j) => j.id === newJob.id)) return s;
            return { pickupJobs: [newJob, ...s.pickupJobs] };
          });

          // Add in-app notification
          const notif: AppNotification = {
            id: `notif-${Date.now().toString(36)}`,
            userId: user.id,
            title: 'New Pickup Opportunity',
            body: `${newJob.estimatedKg} kg ${newJob.material} requested in ${newJob.location.ward}`,
            message: `${newJob.estimatedKg} kg ${newJob.material} requested in ${newJob.location.ward}`,
            type: 'new_request',
            isRead: false,
            read: false,
            jobId: newJob.id,
            createdAt: new Date().toISOString(),
          };
          useAppStore.setState((s) => ({
            notifications: [notif, ...s.notifications],
            unreadNotifications: s.unreadNotifications + 1,
          }));
        },
        onUpdate: (row) => {
          useAppStore.setState((s) => ({
            pickupJobs: s.pickupJobs.map((j) =>
              j.id === row.id
                ? {
                    ...j,
                    status: row.status,
                    pickerId: row.picker_id || j.pickerId,
                    pickerName: row.picker_name || j.pickerName,
                    lockedRatePerKg: row.locked_rate_per_kg ? Number(row.locked_rate_per_kg) : j.lockedRatePerKg,
                    measuredKg: row.measured_kg ? Number(row.measured_kg) : j.measuredKg,
                    updatedAt: row.updated_at,
                  }
                : j
            ),
          }));
        },
      });

      handles.push(jobsSub);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. HOUSEHOLD: Updates to user's pickup requests & receipts
    // ────────────────────────────────────────────────────────────────────────
    if (user.role === 'household') {
      const householdJobsSub = subscribeToTable<any>({
        table: 'pickup_jobs',
        filter: `household_id=eq.${user.id}`,
        onUpdate: (row, oldRow) => {
          const oldStatus = oldRow?.status;
          const newStatus = row.status;

          if (newStatus === 'claimed' && oldStatus !== 'claimed') {
            showToast({
              title: 'Pickup Accepted!',
              message: `${row.picker_name || 'An accredited collector'} accepted your ${row.material} request!`,
              type: 'success',
              icon: 'person-circle',
            });
          } else if (newStatus === 'en_route' && oldStatus !== 'en_route') {
            showToast({
              title: 'Collector En Route!',
              message: `${row.picker_name || 'Collector'} is heading to your doorstep!`,
              type: 'info',
              icon: 'navigate',
            });
          } else if (newStatus === 'completed' && oldStatus !== 'completed') {
            showToast({
              title: 'Pickup Completed!',
              message: `Your ${row.material} pickup has been finalized. Receipt ready.`,
              type: 'success',
              icon: 'checkmark-circle',
            });
          }

          useAppStore.setState((s) => ({
            pickupJobs: s.pickupJobs.map((j) =>
              j.id === row.id
                ? {
                    ...j,
                    status: row.status,
                    pickerId: row.picker_id || j.pickerId,
                    pickerName: row.picker_name || j.pickerName,
                    lockedRatePerKg: row.locked_rate_per_kg ? Number(row.locked_rate_per_kg) : j.lockedRatePerKg,
                    measuredKg: row.measured_kg ? Number(row.measured_kg) : j.measuredKg,
                    updatedAt: row.updated_at,
                  }
                : j
            ),
          }));
        },
      });

      const householdReceiptsSub = subscribeToTable<any>({
        table: 'receipts',
        filter: `household_id=eq.${user.id}`,
        onInsert: (row) => {
          showToast({
            title: 'Receipt Generated!',
            message: `₹${row.total} recorded for ${row.measured_kg} kg ${row.material}.`,
            type: 'success',
            icon: 'receipt',
          });

          const newReceipt: Receipt = {
            id: row.id,
            jobId: row.job_id,
            receiptNumber: row.receipt_number,
            material: row.material,
            measuredKg: Number(row.measured_kg),
            ratePerKg: Number(row.rate_per_kg),
            lineItems: (row.line_items as any) || [],
            total: Number(row.total),
            paymentStatus: row.payment_status as any,
            destinationId: row.destination_id || undefined,
            destinationName: row.destination_name || undefined,
            issuedAt: row.issued_at || row.created_at,
            householdId: row.household_id || undefined,
            householdName: row.household_name || undefined,
            pickerId: row.picker_id || undefined,
            pickerName: row.picker_name || undefined,
            collectorName: row.picker_name || undefined,
            ledgerHash: row.ledger_hash || undefined,
          };

          useAppStore.setState((s) => ({
            receipts: [newReceipt, ...s.receipts.filter((r) => r.id !== newReceipt.id)],
          }));
        },
      });

      handles.push(householdJobsSub, householdReceiptsSub);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. RECYCLER / MRF: Incoming intakes
    // ────────────────────────────────────────────────────────────────────────
    if (user.role === 'recycler') {
      const intakesSub = subscribeToTable<any>({
        table: 'recycler_intakes',
        filter: `recycler_id=eq.${user.id}`,
        onInsert: (row) => {
          showToast({
            title: 'New Intake Arrived!',
            message: `${row.declared_kg} kg delivered for grading & weighing.`,
            type: 'info',
            icon: 'cube',
          });
        },
      });

      handles.push(intakesSub);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. MUNICIPAL ADMIN: Citizen grievances and public complaints
    // ────────────────────────────────────────────────────────────────────────
    if (user.role === 'municipal_admin' || (user.role as string) === 'admin') {
      const complaintsSub = subscribeToTable<any>({
        table: 'complaints',
        onInsert: (row) => {
          showToast({
            title: 'New Citizen Grievance',
            message: `Ref #${row.reference_number}: ${row.category}`,
            type: 'alert',
            icon: 'alert-circle',
          });

          const newComplaint: Complaint = {
            id: row.id,
            referenceNumber: row.reference_number,
            submittedBy: row.submitted_by || undefined,
            category: row.category,
            status: row.status,
            locality: row.locality || row.ward,
            address: row.address || undefined,
            description: row.description,
            photoUrl: row.photo_url || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at,
          };

          useAppStore.setState((s) => ({
            complaints: [newComplaint, ...s.complaints.filter((c) => c.id !== newComplaint.id)],
          }));
        },
      });

      handles.push(complaintsSub);
    }

    subscriptionsRef.current = handles;
  };

  // Setup / teardown subscriptions on user login / logout / role change
  useEffect(() => {
    setupSubscriptions();

    return () => {
      cleanupSubscriptions();
    };
  }, [user?.id, user?.role, isAuthenticated]);

  // AppState listener for battery efficiency and background socket management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (__DEV__) console.log('[useRealtimeSync] App returned to foreground, reconnecting...');
        setupSubscriptions();
        if (user?.id) {
          hydrateAll(user.id);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        if (__DEV__) console.log('[useRealtimeSync] App going to background, pausing subscriptions...');
        cleanupSubscriptions();
      }

      appStateRef.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      sub.remove();
    };
  }, [user?.id]);
}
