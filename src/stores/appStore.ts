// App-wide store for shared record layer, recycling requests, complaints, notifications
import { create } from 'zustand';
import type {
  RecyclingRequest, Complaint, AppNotification,
  RecyclingRequestStatus, ComplaintStatus, VolunteerEvent,
  PickupJob, PickupJobStatus, RateOffer, Receipt, ReceiptLineItem, ReceiptPaymentStatus,
  Recycler, RecyclerIntake, Dispute, DisputeStatus, Issue, CityConfig,
} from '../types';
import {
  DEMO_RECYCLING_REQUESTS, DEMO_COMPLAINTS,
  DEMO_NOTIFICATIONS, DEMO_VOLUNTEER_EVENTS,
  INITIAL_PICKUP_JOBS, INITIAL_RATE_OFFERS, INITIAL_RECEIPTS,
  INITIAL_RECYCLERS, INITIAL_RECYCLER_INTAKES, INITIAL_DISPUTES,
  INITIAL_ISSUES,
} from '../lib/demo/demoData';
import { CITY_CONFIGS, DEFAULT_CITY, DEFAULT_CITY_CONFIG } from '../lib/config/cities';
import {
  jobsApi, offersApi, receiptsApi, intakesApi, disputesApi,
  issuesApi, complaintsApi, notificationsApi,
} from '../lib/api';

interface AppState {
  // Existing state
  recyclingRequests: RecyclingRequest[];
  complaints: Complaint[];
  notifications: AppNotification[];
  volunteerEvents: VolunteerEvent[];
  unreadNotifications: number;
  language: string;
  isOffline: boolean;
  isLoadingBackend: boolean;

  // Hydration from API Layer
  hydrateJobs: (filter?: any) => Promise<void>;
  hydrateReceipts: (filter?: any) => Promise<void>;
  hydrateComplaints: (userId?: string) => Promise<void>;
  hydrateNotifications: (userId?: string) => Promise<void>;
  hydrateAll: (userId?: string) => Promise<void>;

  // Shared Record Layer state
  pickupJobs: PickupJob[];
  rateOffers: RateOffer[];
  receipts: Receipt[];
  recyclers: Recycler[];
  recyclerIntakes: RecyclerIntake[];
  disputes: Dispute[];
  issues: Issue[];
  currentCity: string;
  currentCityConfig: CityConfig;
  contaminationBonusUnlocked: boolean;
  contaminationChallengeScore: number;
  householdMonthlyDivertedKg: number;
  householdStreakDays: number;

  // Recycling request actions (existing)
  createRecyclingRequest: (req: Omit<RecyclingRequest, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateRequestStatus: (id: string, status: RecyclingRequestStatus, updates?: Partial<RecyclingRequest>) => void;
  acceptRequest: (requestId: string, pickerId: string, pickerName: string) => void;
  completeRequest: (requestId: string, agreedPrice: number) => void;
  cancelRequest: (id: string) => void;

  // Complaint actions (existing)
  createComplaint: (c: Omit<Complaint, 'id' | 'referenceNumber' | 'createdAt' | 'updatedAt'>) => string;
  updateComplaintStatus: (id: string, status: ComplaintStatus, resolution?: string) => void;

  // Notification actions (existing)
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => void;

  // Events (existing)
  registerForEvent: (eventId: string) => void;
  unregisterFromEvent: (eventId: string) => void;

  // Language & connectivity
  setLanguage: (lang: string) => void;
  setOffline: (offline: boolean) => void;

  // Shared Record Layer actions
  createPickupJob: (job: Omit<PickupJob, 'id' | 'createdAt'>) => string;
  updatePickupJobStatus: (id: string, status: PickupJobStatus, updates?: Partial<PickupJob>) => void;
  proposeRate: (jobId: string, proposedBy: 'household' | 'picker', ratePerKg: number) => void;
  respondToRateOffer: (jobId: string, action: 'accept' | 'reject' | 'counter', counterRate?: number) => void;
  claimPickupJob: (jobId: string, pickerId: string, pickerName: string) => void;
  weighPickupJob: (
    jobId: string,
    measuredKg: number,
    deductions?: { label: string; amount: number; reason?: string }[],
    destinationId?: string
  ) => Receipt;
  createReceipt: (receipt: Omit<Receipt, 'id' | 'issuedAt' | 'receiptNumber'>) => Receipt;
  updateReceiptPayment: (receiptId: string, paymentStatus: ReceiptPaymentStatus) => void;
  createRecyclerIntake: (intake: Omit<RecyclerIntake, 'id' | 'createdAt'>) => string;
  updateRecyclerIntake: (id: string, updates: Partial<RecyclerIntake>) => void;
  updateRecyclerPrice: (recyclerId: string, material: string, rate: number) => void;
  createDispute: (dispute: Omit<Dispute, 'id' | 'createdAt'> & { status?: DisputeStatus }) => string;
  resolveDispute: (id: string, resolution: string, adminNote?: string, adjustedTotal?: number, resolutionAction?: 'uphold' | 'adjust' | 'split') => void;
  updateDisputeStatus: (id: string, status: DisputeStatus, adminNote?: string) => void;
  createIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'status'>) => string;
  resolveIssue: (id: string) => void;
  setCity: (cityCode: string) => void;
  unlockContaminationBonus: () => void;
  recordContaminationChallengeScore: (score: number) => void;
  quickRequestPickup: (material: string, kg: number, rate: number, address: string) => string;
  confirmHandoffQR: (jobId: string, verifiedByPickerId: string, verifiedByPickerName: string) => void;
  resetDemoData: () => void;
}

let idCounter = 2000;
let receiptCounter = 100;
function genId(prefix = 'local') { return `${prefix}-${++idCounter}`; }
function genRef() { return `CMP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(++idCounter).padStart(4, '0')}`; }
function genReceiptNum() { return `FVR-${new Date().getFullYear()}-${String(++receiptCounter).padStart(4, '0')}`; }
const now = () => new Date().toISOString();

export const useAppStore = create<AppState>((set, get) => ({
  // Existing state
  recyclingRequests: [...DEMO_RECYCLING_REQUESTS],
  complaints: [...DEMO_COMPLAINTS],
  notifications: [...DEMO_NOTIFICATIONS],
  volunteerEvents: [...DEMO_VOLUNTEER_EVENTS],
  unreadNotifications: DEMO_NOTIFICATIONS.filter(n => !n.isRead).length,
  language: 'en',
  isOffline: false,
  isLoadingBackend: false,

  // ── Hydration from Backend API Layer ──
  hydrateJobs: async (filter) => {
    try {
      const jobs = await jobsApi.listJobs(filter);
      if (jobs && jobs.length > 0) {
        set({ pickupJobs: jobs });
      }
    } catch (e) {
      if (__DEV__) console.warn('[appStore.hydrateJobs] Error:', e);
    }
  },

  hydrateReceipts: async (filter) => {
    try {
      const receipts = await receiptsApi.listReceipts(filter);
      if (receipts && receipts.length > 0) {
        set({ receipts });
      }
    } catch (e) {
      if (__DEV__) console.warn('[appStore.hydrateReceipts] Error:', e);
    }
  },

  hydrateComplaints: async (userId) => {
    try {
      const complaints = await complaintsApi.listComplaints(userId);
      if (complaints && complaints.length > 0) {
        set({ complaints });
      }
    } catch (e) {
      if (__DEV__) console.warn('[appStore.hydrateComplaints] Error:', e);
    }
  },

  hydrateNotifications: async (userId) => {
    if (!userId) return;
    try {
      const notifs = await notificationsApi.listNotifications(userId);
      if (notifs && notifs.length > 0) {
        set({
          notifications: notifs,
          unreadNotifications: notifs.filter((n) => !n.isRead && !n.read).length,
        });
      }
    } catch (e) {
      if (__DEV__) console.warn('[appStore.hydrateNotifications] Error:', e);
    }
  },

  hydrateAll: async (userId) => {
    set({ isLoadingBackend: true });
    try {
      await Promise.allSettled([
        get().hydrateJobs(),
        get().hydrateReceipts(),
        get().hydrateComplaints(userId),
        userId ? get().hydrateNotifications(userId) : Promise.resolve(),
      ]);
    } finally {
      set({ isLoadingBackend: false });
    }
  },

  // Shared Record Layer state
  pickupJobs: [...INITIAL_PICKUP_JOBS],
  rateOffers: [...INITIAL_RATE_OFFERS],
  receipts: [...INITIAL_RECEIPTS],
  recyclers: [...INITIAL_RECYCLERS],
  recyclerIntakes: [...INITIAL_RECYCLER_INTAKES],
  disputes: [...INITIAL_DISPUTES],
  issues: [...INITIAL_ISSUES],
  currentCity: DEFAULT_CITY,
  currentCityConfig: DEFAULT_CITY_CONFIG,
  contaminationBonusUnlocked: true,
  contaminationChallengeScore: 0,
  householdMonthlyDivertedKg: 28.5,
  householdStreakDays: 14,

  // ── Existing Recycling Request Actions ──
  createRecyclingRequest: (req) => {
    const id = genId('req');
    const request: RecyclingRequest = {
      ...req,
      id,
      status: 'open',
      createdAt: now(),
      updatedAt: now(),
    };
    set(s => ({ recyclingRequests: [request, ...s.recyclingRequests] }));
    return id;
  },

  updateRequestStatus: (id, status, updates = {}) => {
    set(s => ({
      recyclingRequests: s.recyclingRequests.map(r =>
        r.id === id ? { ...r, ...updates, status, updatedAt: now() } : r
      ),
    }));
  },

  acceptRequest: (requestId, pickerId, pickerName) => {
    get().updateRequestStatus(requestId, 'accepted', { assignedPickerId: pickerId, assignedPickerName: pickerName });
  },

  completeRequest: (requestId, agreedPrice) => {
    get().updateRequestStatus(requestId, 'completed', { agreedPrice });
    get().addNotification({
      userId: 'current',
      title: 'Recycling Pickup Completed',
      body: `Your recycling request has been completed. Amount: ₹${agreedPrice.toFixed(2)}`,
      type: 'request_completed',
      isRead: false,
    });
  },

  cancelRequest: (id) => {
    get().updateRequestStatus(id, 'cancelled');
  },

  // ── Existing Complaint Actions ──
  createComplaint: (c) => {
    const id = genId('cmp');
    const ref = genRef();
    const complaint: Complaint = {
      ...c,
      id,
      referenceNumber: ref,
      status: 'submitted',
      createdAt: now(),
      updatedAt: now(),
    };
    set(s => ({ complaints: [complaint, ...s.complaints] }));

    complaintsApi.createComplaint(c).catch(e => {
      if (__DEV__) console.warn('[appStore.createComplaint] Backend sync error:', e);
    });

    return ref;
  },

  updateComplaintStatus: (id, status, resolution) => {
    const prev = get().complaints.find(c => c.id === id);
    set(s => ({
      complaints: s.complaints.map(c =>
        c.id === id ? {
          ...c,
          status,
          resolution: resolution ?? c.resolution,
          resolvedAt: status === 'resolved' ? now() : c.resolvedAt,
          updatedAt: now(),
        } : c
      ),
    }));

    complaintsApi.updateComplaintStatus(id, status, resolution).catch(e => {
      if (__DEV__) console.warn('[appStore.updateComplaintStatus] Update failed, rolling back:', e);
      if (prev) {
        set(s => ({ complaints: s.complaints.map(c => c.id === id ? prev : c) }));
      }
    });
  },

  // ── Existing Notification Actions ──
  addNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id: genId('notif'),
      createdAt: now(),
    };
    set(s => ({
      notifications: [notification, ...s.notifications],
      unreadNotifications: s.unreadNotifications + 1,
    }));
  },

  markNotificationRead: (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadNotifications: Math.max(0, s.unreadNotifications - 1),
    }));
  },

  markAllRead: () => {
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
      unreadNotifications: 0,
    }));
  },

  // ── Existing Volunteer Event Actions ──
  registerForEvent: (eventId) => {
    set(s => ({
      volunteerEvents: s.volunteerEvents.map(e =>
        e.id === eventId
          ? { ...e, isRegistered: true, registeredCount: e.registeredCount + 1 }
          : e
      ),
    }));
  },

  unregisterFromEvent: (eventId) => {
    set(s => ({
      volunteerEvents: s.volunteerEvents.map(e =>
        e.id === eventId
          ? { ...e, isRegistered: false, registeredCount: Math.max(0, e.registeredCount - 1) }
          : e
      ),
    }));
  },

  setLanguage: (lang) => set({ language: lang }),
  setOffline: (offline) => set({ isOffline: offline }),

  // ── Shared Record Layer: Pickup Job Actions ──
  createPickupJob: (job) => {
    const id = genId('job');
    const newJob: PickupJob = {
      ...job,
      id,
      status: job.status || 'listed',
      createdAt: now(),
      updatedAt: now(),
    };

    set(s => ({ pickupJobs: [newJob, ...s.pickupJobs] }));

    // Async backend insert
    const pickupWindow = job.pickupWindow || job.window || 'Morning (8am - 12pm)';
    const ward = job.ward || job.location?.ward || 'Ward 151';
    const cityKey = job.cityKey || 'BLR';
    const lat = job.lat ?? job.location?.latitude;
    const lng = job.lng ?? job.location?.longitude;

    jobsApi.createJob({
      householdId: job.householdId,
      householdName: job.householdName,
      householdAddress: job.householdAddress,
      material: job.material,
      estimatedKg: job.estimatedKg,
      status: (job.status as any) || 'listed',
      proposedRatePerKg: job.proposedRatePerKg,
      lockedRatePerKg: job.lockedRatePerKg,
      window: pickupWindow,
      pickupWindow: pickupWindow,
      location: job.location || {
        ward,
        address: job.householdAddress,
        latitude: lat,
        longitude: lng,
      },
      ward,
      cityKey,
      lat,
      lng,
      notes: job.notes,
      qrCode: job.qrCode,
      hasContamination: job.hasContamination,
    }).then(created => {
      set(s => ({
        pickupJobs: s.pickupJobs.map(j => j.id === id ? { ...j, id: created.id } : j),
      }));
    }).catch(e => {
      if (__DEV__) console.warn('[appStore.createPickupJob] Backend sync error:', e);
    });

    if (job.proposedRatePerKg) {
      const offerId = genId('offer');
      const offer: RateOffer = {
        id: offerId,
        jobId: id,
        proposedBy: 'household',
        ratePerKg: job.proposedRatePerKg,
        status: 'pending',
        createdAt: now(),
      };
      set(s => ({ rateOffers: [offer, ...s.rateOffers] }));
      offersApi.createOffer(offer).catch(() => {});
    }

    get().addNotification({
      userId: 'current',
      title: 'Recyclables Listed',
      body: `Your listing for ${newJob.estimatedKg} kg ${newJob.material} is now active on the picker marketplace.`,
      type: 'job_created',
      isRead: false,
    });

    return id;
  },

  updatePickupJobStatus: (id, status, updates = {}) => {
    const prevJob = get().pickupJobs.find(j => j.id === id);

    // Optimistic Update
    set(s => ({
      pickupJobs: s.pickupJobs.map(j =>
        j.id === id ? { ...j, ...updates, status, updatedAt: now() } : j
      ),
    }));

    // Async API call with rollback
    jobsApi.updateJobStatus(id, status, updates).catch(err => {
      if (__DEV__) console.warn('[appStore.updatePickupJobStatus] Update failed, rolling back:', err);
      if (prevJob) {
        set(s => ({
          pickupJobs: s.pickupJobs.map(j => j.id === id ? prevJob : j),
        }));
      }
    });
  },

  proposeRate: (jobId, proposedBy, ratePerKg) => {
    const offerId = genId('offer');
    const offer: RateOffer = {
      id: offerId,
      jobId,
      proposedBy,
      ratePerKg,
      status: 'pending',
      createdAt: now(),
    };

    set(s => ({
      rateOffers: [offer, ...s.rateOffers],
      pickupJobs: s.pickupJobs.map(j =>
        j.id === jobId ? { ...j, status: 'rate_proposed', proposedRatePerKg: ratePerKg, activeOffer: offer, updatedAt: now() } : j
      ),
    }));

    get().addNotification({
      userId: 'current',
      title: 'New Rate Offer',
      body: `Rate of ₹${ratePerKg}/kg proposed by ${proposedBy === 'picker' ? 'picker' : 'household'}.`,
      type: 'rate_offer',
      isRead: false,
    });
  },

  respondToRateOffer: (jobId, action, counterRate) => {
    const offers = get().rateOffers.filter(o => o.jobId === jobId);
    const latestOffer = offers[0];

    if (action === 'accept') {
      const lockedRate = counterRate ?? latestOffer?.counterOffer?.ratePerKg ?? latestOffer?.ratePerKg ?? 15;
      set(s => ({
        rateOffers: s.rateOffers.map(o =>
          o.jobId === jobId ? { ...o, status: 'accepted', updatedAt: now() } : o
        ),
        pickupJobs: s.pickupJobs.map(j =>
          j.id === jobId ? {
            ...j,
            status: 'rate_locked',
            lockedRatePerKg: lockedRate,
            updatedAt: now(),
          } : j
        ),
      }));

      get().addNotification({
        userId: 'current',
        title: 'Rate Locked ✅',
        body: `Rate locked at ₹${lockedRate.toFixed(2)}/kg before collection. Measured weight will use this rate.`,
        type: 'rate_locked',
        isRead: false,
      });
    } else if (action === 'counter') {
      if (!counterRate) return;
      if (latestOffer?.counterOffer) {
        // Strictly one counter-offer allowed
        return;
      }

      const counterParty = latestOffer?.proposedBy === 'picker' ? 'household' : 'picker';
      const updatedOffer: RateOffer = {
        ...(latestOffer || {
          id: genId('offer'),
          jobId,
          proposedBy: 'picker',
          ratePerKg: counterRate,
          createdAt: now(),
        }),
        status: 'countered',
        counterOffer: {
          proposedBy: counterParty,
          ratePerKg: counterRate,
          createdAt: now(),
        },
        updatedAt: now(),
      };

      set(s => ({
        rateOffers: s.rateOffers.map(o => o.id === latestOffer?.id ? updatedOffer : o),
        pickupJobs: s.pickupJobs.map(j =>
          j.id === jobId ? {
            ...j,
            status: 'rate_proposed',
            proposedRatePerKg: counterRate,
            activeOffer: updatedOffer,
            updatedAt: now(),
          } : j
        ),
      }));

      get().addNotification({
        userId: 'current',
        title: 'Counter-Offer Submitted',
        body: `Counter rate of ₹${counterRate.toFixed(2)}/kg sent. Awaiting response.`,
        type: 'counter_offer',
        isRead: false,
      });
    } else if (action === 'reject') {
      set(s => ({
        rateOffers: s.rateOffers.map(o =>
          o.jobId === jobId ? { ...o, status: 'rejected', updatedAt: now() } : o
        ),
        pickupJobs: s.pickupJobs.map(j =>
          j.id === jobId ? {
            ...j,
            status: 'listed',
            proposedRatePerKg: undefined,
            updatedAt: now(),
          } : j
        ),
      }));

      get().addNotification({
        userId: 'current',
        title: 'Rate Offer Declined',
        body: 'The rate offer was declined. Listing returned to open marketplace.',
        type: 'offer_rejected',
        isRead: false,
      });
    }
  },

  claimPickupJob: (jobId, pickerId, pickerName) => {
    const prevJob = get().pickupJobs.find(j => j.id === jobId);

    // 1. Optimistic Update
    set(s => ({
      pickupJobs: s.pickupJobs.map(j =>
        j.id === jobId ? {
          ...j,
          status: 'claimed',
          pickerId,
          pickerName,
          updatedAt: now(),
        } : j
      ),
    }));

    // 2. Call atomic API
    jobsApi.claimJob(jobId, pickerName).catch(err => {
      if (__DEV__) console.warn('[appStore.claimPickupJob] Claim error, rolling back:', err);
      if (prevJob) {
        set(s => ({
          pickupJobs: s.pickupJobs.map(j => j.id === jobId ? prevJob : j),
        }));
      }
    });

    get().addNotification({
      userId: 'current',
      title: 'Job Claimed',
      body: `Pickup job claimed by ${pickerName}. Handoff window confirmed.`,
      type: 'job_claimed',
      isRead: false,
    });
  },

  weighPickupJob: (jobId, measuredKg, deductions = [], destinationId) => {
    const job = get().pickupJobs.find(j => j.id === jobId);
    const rate = job?.lockedRatePerKg ?? job?.proposedRatePerKg ?? 15;
    const baseAmount = Math.round(measuredKg * rate * 100) / 100;

    const lineItems: ReceiptLineItem[] = [
      {
        label: `${measuredKg.toFixed(2)} kg ${job?.material ?? 'Recyclable'} @ ₹${rate.toFixed(2)}/kg`,
        amount: baseAmount,
      },
    ];

    let deductionTotal = 0;
    deductions.forEach(d => {
      const deductionAmount = Math.abs(d.amount);
      deductionTotal += deductionAmount;
      lineItems.push({
        label: d.label,
        amount: -deductionAmount,
        isDeduction: true,
        reason: d.reason,
      });
    });

    const total = Math.max(0, Math.round((baseAmount - deductionTotal) * 100) / 100);
    const receiptId = genId('rcpt');
    const receiptNumber = genReceiptNum();
    const destination = get().recyclers.find(r => r.id === destinationId) ?? get().recyclers[0];

    const receipt: Receipt = {
      id: receiptId,
      jobId,
      receiptNumber,
      material: job?.material ?? 'plastic',
      measuredKg,
      ratePerKg: rate,
      lineItems,
      total,
      paymentStatus: 'cleared_upi_simulated',
      destinationId: destination?.id,
      destinationName: destination?.name,
      householdId: job?.householdId,
      householdName: job?.householdName,
      pickerId: job?.pickerId,
      pickerName: job?.pickerName,
      recyclerId: destination?.id,
      issuedAt: now(),
    };

    set(s => ({
      receipts: [receipt, ...s.receipts],
      pickupJobs: s.pickupJobs.map(j =>
        j.id === jobId ? {
          ...j,
          status: 'weighed',
          measuredKg,
          receiptId,
          destinationId: destination?.id,
          destinationName: destination?.name,
          updatedAt: now(),
        } : j
      ),
    }));

    get().addNotification({
      userId: 'current',
      title: 'Fair Value Receipt Issued',
      body: `Receipt ${receiptNumber} generated for ₹${total.toFixed(2)}. Simulated UPI payment cleared.`,
      type: 'receipt_issued',
      isRead: false,
    });

    return receipt;
  },

  createReceipt: (receiptData) => {
    const id = genId('rcpt');
    const receiptNumber = genReceiptNum();
    const receipt: Receipt = {
      ...receiptData,
      id,
      receiptNumber,
      issuedAt: now(),
    };

    set(s => ({ receipts: [receipt, ...s.receipts] }));
    return receipt;
  },

  updateReceiptPayment: (receiptId, paymentStatus) => {
    set(s => ({
      receipts: s.receipts.map(r =>
        r.id === receiptId ? { ...r, paymentStatus } : r
      ),
    }));
  },

  createRecyclerIntake: (intakeData) => {
    const id = genId('intake');
    const intake: RecyclerIntake = {
      ...intakeData,
      id,
      createdAt: now(),
    };

    const isContaminated = intake.qualityGrade === 'contaminated';

    set(s => ({
      recyclerIntakes: [intake, ...s.recyclerIntakes],
      pickupJobs: s.pickupJobs.map(j =>
        j.id === intake.jobId ? {
          ...j,
          status: 'completed',
          destinationId: intake.recyclerId,
          destinationName: intake.recyclerName,
          hasContamination: isContaminated,
          updatedAt: now(),
        } : j
      ),
    }));

    if (isContaminated) {
      set({ contaminationBonusUnlocked: true });
      get().addNotification({
        userId: 'current',
        title: '⚠️ Contamination Flagged in Delivered Lot',
        body: `Delivered lot flagged by facility for contamination (${intake.contaminationNote || 'food residue in dry recyclables'}). Inspect next time.`,
        type: 'contamination_alert',
        isRead: false,
      });
      get().addNotification({
        userId: 'current',
        title: '🍂 Segregation Alert: Dry Waste Contamination',
        body: `Your dry waste lot had contamination: ${intake.contaminationNote || 'Rinse containers before disposal'}. Bonus Contamination Challenge unlocked in Learn tab!`,
        type: 'contamination_alert',
        isRead: false,
      });
    }

    return id;
  },

  updateRecyclerIntake: (id, updates) => {
    set(s => ({
      recyclerIntakes: s.recyclerIntakes.map(i =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
  },

  updateRecyclerPrice: (recyclerId, material, rate) => {
    set(s => ({
      recyclers: s.recyclers.map(r =>
        r.id === recyclerId ? {
          ...r,
          priceListPerKg: {
            ...r.priceListPerKg,
            [material.toLowerCase()]: rate,
          },
        } : r
      ),
    }));
  },

  createDispute: (disputeData) => {
    const id = genId('disp');
    const dispute: Dispute = {
      ...disputeData,
      id,
      status: disputeData.status ?? 'under_review',
      createdAt: now(),
      updatedAt: now(),
    };

    set(s => ({
      disputes: [dispute, ...s.disputes],
      pickupJobs: s.pickupJobs.map(j =>
        j.id === disputeData.jobId ? { ...j, status: 'disputed', disputeId: id, updatedAt: now() } : j
      ),
      receipts: s.receipts.map(r =>
        (r.id === disputeData.receiptId || r.jobId === disputeData.jobId)
          ? { ...r, disputeId: id, disputeStatus: dispute.status }
          : r
      ),
    }));

    get().addNotification({
      userId: 'current',
      title: 'Dispute Raised',
      body: `Dispute on job #${disputeData.jobId.slice(0, 6)} submitted for human review by Municipal Admin.`,
      type: 'dispute_opened',
      isRead: false,
    });

    return id;
  },

  resolveDispute: (id, resolution, adminNote, adjustedTotal, resolutionAction) => {
    const dispute = get().disputes.find(d => d.id === id);
    const resolvedAtStr = now();

    set(s => ({
      disputes: s.disputes.map(d =>
        d.id === id ? {
          ...d,
          status: 'resolved',
          resolution,
          resolutionAction: resolutionAction ?? d.resolutionAction,
          adminNote: adminNote ?? d.adminNote,
          adjustedTotal: adjustedTotal ?? d.adjustedTotal,
          resolvedAt: resolvedAtStr,
          updatedAt: resolvedAtStr,
        } : d
      ),
      pickupJobs: s.pickupJobs.map(j =>
        j.id === dispute?.jobId ? { ...j, status: 'completed', updatedAt: resolvedAtStr } : j
      ),
      receipts: s.receipts.map(r => {
        if (r.id === dispute?.receiptId || r.jobId === dispute?.jobId) {
          return {
            ...r,
            disputeStatus: 'resolved',
            total: adjustedTotal !== undefined ? adjustedTotal : r.total,
          };
        }
        return r;
      }),
    }));

    get().addNotification({
      userId: 'current',
      title: 'Dispute Resolved',
      body: `Dispute on job #${dispute?.jobId.slice(0, 6)} resolved: ${resolution}`,
      type: 'dispute_resolved',
      isRead: false,
    });
  },

  updateDisputeStatus: (id, status, adminNote) => {
    set(s => ({
      disputes: s.disputes.map(d =>
        d.id === id ? { ...d, status, adminNote: adminNote ?? d.adminNote, updatedAt: now() } : d
      ),
    }));
  },

  createIssue: (issueData) => {
    const id = genId('iss');
    const issue: Issue = {
      ...issueData,
      id,
      status: 'open',
      createdAt: now(),
    };

    set(s => ({ issues: [issue, ...s.issues] }));

    get().addNotification({
      userId: 'current',
      title: 'Field Issue Recorded',
      body: `Issue (${issue.type}) recorded for ${issue.ward || 'ward'}. Visible in municipal desk.`,
      type: 'issue_reported',
      isRead: false,
    });

    return id;
  },

  resolveIssue: (id) => {
    set(s => ({
      issues: s.issues.map(i =>
        i.id === id ? { ...i, status: 'resolved', resolvedAt: now() } : i
      ),
    }));
  },

  setCity: (cityCode) => {
    const config = CITY_CONFIGS[cityCode] ?? DEFAULT_CITY_CONFIG;
    set({ currentCity: cityCode, currentCityConfig: config });
  },

  unlockContaminationBonus: () => set({ contaminationBonusUnlocked: true }),

  recordContaminationChallengeScore: (score) => set(s => ({
    contaminationChallengeScore: Math.max(s.contaminationChallengeScore, score),
  })),

  confirmHandoffQR: (jobId, verifiedByPickerId, verifiedByPickerName) => {
    const timestamp = now();
    set(s => ({
      pickupJobs: s.pickupJobs.map(j =>
        j.id === jobId ? {
          ...j,
          status: 'collected',
          pickerId: verifiedByPickerId,
          pickerName: verifiedByPickerName,
          updatedAt: timestamp,
        } : j
      ),
      recyclingRequests: s.recyclingRequests.map(r =>
        r.id === jobId ? { ...r, status: 'collected', updatedAt: timestamp } : r
      ),
      householdStreakDays: s.householdStreakDays + 1,
      householdMonthlyDivertedKg: s.householdMonthlyDivertedKg + 5.0,
    }));

    get().addNotification({
      userId: 'current',
      title: 'Doorstep Handoff Verified ✅',
      body: `Collector ${verifiedByPickerName} scanned and confirmed QR handoff for Job #${jobId.slice(0, 6)}. Weighed into transit.`,
      type: 'pickup_completed',
      isRead: false,
    });
  },

  quickRequestPickup: (material, kg, rate, address) => {
    const jobId = genId('job');
    const timestamp = now();
    const newJob: PickupJob = {
      id: jobId,
      householdId: 'hh-1',
      householdName: 'Priya Sharma',
      householdAddress: address,
      material,
      estimatedKg: kg,
      proposedRatePerKg: rate,
      lockedRatePerKg: rate,
      window: 'Today, 2:00 PM – 4:00 PM',
      location: {
        ward: 'Koramangala Ward 151',
        address,
        distanceKm: 0.8,
      },
      status: 'rate_locked',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    set(s => ({
      pickupJobs: [newJob, ...s.pickupJobs],
      recyclingRequests: [
        {
          id: jobId,
          householdId: 'hh-1',
          householdName: 'Priya Sharma',
          materialCategory: material.toLowerCase() as any,
          approximateQuantityKg: kg,
          quantityUnit: 'kg',
          status: 'accepted',
          pickupAddress: address,
          preferredPickupWindow: 'Today, 2:00 PM – 4:00 PM',
          estimatedPriceMin: kg * rate,
          estimatedPriceMax: kg * rate,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        ...s.recyclingRequests,
      ],
    }));

    get().addNotification({
      userId: 'current',
      title: 'Quick Pickup Dispatched ⚡',
      body: `One-Tap Request logged: ${kg} kg of ${material} locked at ₹${rate}/kg. Collector arriving in today's window.`,
      type: 'request_created',
      isRead: false,
    });

    return jobId;
  },

  resetDemoData: () => {
    set({
      pickupJobs: [...INITIAL_PICKUP_JOBS],
      rateOffers: [...INITIAL_RATE_OFFERS],
      receipts: [...INITIAL_RECEIPTS],
      recyclers: [...INITIAL_RECYCLERS],
      recyclerIntakes: [...INITIAL_RECYCLER_INTAKES],
      disputes: [...INITIAL_DISPUTES],
      issues: [...INITIAL_ISSUES],
      recyclingRequests: [...DEMO_RECYCLING_REQUESTS],
      complaints: [...DEMO_COMPLAINTS],
      notifications: [...DEMO_NOTIFICATIONS],
      volunteerEvents: [...DEMO_VOLUNTEER_EVENTS],
      unreadNotifications: DEMO_NOTIFICATIONS.filter(n => !n.isRead).length,
      currentCity: DEFAULT_CITY,
      currentCityConfig: DEFAULT_CITY_CONFIG,
    });
  },
}));
