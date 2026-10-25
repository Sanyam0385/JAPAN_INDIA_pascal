// Informal Picker — My Jobs (Active & Completed Pickups)
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { FairValueReceiptModal, JourneyTimelineModal } from '../../src/components/shared';
import { liveLocationService } from '../../src/lib/realtime';
import type { RecyclingRequest, Receipt, PickupJob, Recycler } from '../../src/types';
import { CirculoMap } from '../../src/components/map/CirculoMap';
import { StopPin, PickerMarker, RecyclerPin } from '../../src/components/map/markers';
import { getRoute, getMultiStopRoute, RouteResult } from '../../src/lib/maps/routing';
import { formatDistance, formatDuration, optimizeStops, LatLng } from '../../src/lib/maps/geo';
import { useLocationStore } from '../../src/lib/location/locationStore';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    pickupJobs,
    recyclingRequests,
    updateRequestStatus,
    completeRequest,
    receipts,
    createReceipt,
    recyclers,
    disputes,
    confirmHandoffQR,
    hydrateJobs,
    hydrateReceipts,
  } = useAppStore();
  const liveCoords = useLocationStore((s) => s.coords);

  useEffect(() => {
    hydrateJobs();
    hydrateReceipts();
  }, []);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [completeModalJob, setCompleteModalJob] = useState<RecyclingRequest | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [scanJob, setScanJob] = useState<RecyclingRequest | null>(null);
  const [journeyReceipt, setJourneyReceipt] = useState<Receipt | null>(null);

  // Active Shared Record Layer jobs claimed by picker
  const activePickupJobs = pickupJobs.filter(j =>
    ['claimed', 'rate_locked', 'en_route', 'weighed'].includes(j.status) &&
    (!j.pickerId || j.pickerId === user?.id || j.pickerId === 'demo-picker-1')
  );

  // Jobs that belong to picker or assigned jobs
  const myActiveJobs = recyclingRequests.filter(r =>
    ['accepted', 'en_route', 'payment_pending'].includes(r.status)
  );

  const myCompletedJobs = recyclingRequests.filter(r =>
    ['completed', 'collected', 'disputed'].includes(r.status)
  );

  // Stops for "Plan My Round" (orders stops using nearest-neighbour)
  const roundStops = useMemo(() => {
    return activePickupJobs
      .filter(j => typeof j.location.latitude === 'number' && typeof j.location.longitude === 'number')
      .map(j => ({
        id: j.id,
        title: j.householdName || j.material.toUpperCase(),
        material: j.material,
        estimatedKg: j.estimatedKg,
        address: j.location.address || j.location.ward,
        coordinate: {
          latitude: j.location.latitude!,
          longitude: j.location.longitude!,
        },
      }));
  }, [activePickupJobs]);

  // Plan My Round Modal state
  const [isPlanRoundOpen, setIsPlanRoundOpen] = useState(false);
  const [roundRoute, setRoundRoute] = useState<RouteResult | null>(null);
  const [orderedRoundStops, setOrderedRoundStops] = useState<typeof roundStops>([]);
  const [isLoadingRound, setIsLoadingRound] = useState(false);

  const handleOpenPlanRound = async () => {
    setIsPlanRoundOpen(true);
    setIsLoadingRound(true);
    const startCoord = liveCoords || { latitude: 12.9345, longitude: 77.6245 };
    const optimized = optimizeStops(startCoord, roundStops);
    setOrderedRoundStops(optimized);

    const waypoints = [startCoord, ...optimized.map(s => s.coordinate)];
    try {
      const route = await getMultiStopRoute(waypoints, 'picker');
      setRoundRoute(route);
    } catch (e) {
      console.warn('Failed to calculate round route', e);
    } finally {
      setIsLoadingRound(false);
    }
  };

  // Recycler Hub Navigation modal state
  const [recyclerNavTarget, setRecyclerNavTarget] = useState<Recycler | null>(null);
  const [recyclerRoute, setRecyclerRoute] = useState<RouteResult | null>(null);
  const [isLoadingRecyclerRoute, setIsLoadingRecyclerRoute] = useState(false);

  const handleOpenRecyclerNav = async (destinationId?: string) => {
    const target = recyclers.find(r => r.id === destinationId) || recyclers[0];
    if (!target) return;
    setRecyclerNavTarget(target);
    setIsLoadingRecyclerRoute(true);

    const startCoord = liveCoords || { latitude: 12.9345, longitude: 77.6245 };
    const destCoord = {
      latitude: target.latitude ?? 13.0280,
      longitude: target.longitude ?? 77.5404,
    };

    try {
      const route = await getRoute(startCoord, destCoord, 'picker');
      setRecyclerRoute(route);
    } catch (e) {
      console.warn('Failed to calculate recycler route', e);
    } finally {
      setIsLoadingRecyclerRoute(false);
    }
  };

  const handleOpenRecyclerExternalMaps = () => {
    if (!recyclerNavTarget) return;
    const lat = recyclerNavTarget.latitude ?? 13.0280;
    const lng = recyclerNavTarget.longitude ?? 77.5404;
    const label = encodeURIComponent(recyclerNavTarget.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${label})`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  // Broadcast live location whenever an active job is en-route
  const enRouteJob = myActiveJobs.find(j => j.status === 'en_route') || activePickupJobs.find(j => j.status === 'en_route');
  useEffect(() => {
    if (!enRouteJob) return;
    const stop = liveLocationService.startBroadcasting(
      enRouteJob.id,
      () => ({
        lat: user?.lat ?? 12.9716,
        lng: user?.lng ?? 77.5946,
        heading: 45,
        speed: 3.5,
      }),
      user?.id || 'demo-picker-1'
    );
    return stop;
  }, [enRouteJob?.id, user?.id, user?.lat, user?.lng]);

  const handleUpdateStatus = (jobId: string, newStatus: 'en_route' | 'payment_pending') => {
    updateRequestStatus(jobId, newStatus);
    Alert.alert(t('common.status'), t('picker.statusUpdatedToast', { status: t('status.' + newStatus, { defaultValue: newStatus }) }));
  };

  const handleConfirmCompletion = () => {
    if (!completeModalJob) return;
    const amount = parseFloat(agreedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount.');
      return;
    }
    const weight = parseFloat(actualWeight) || completeModalJob.approximateQuantityKg;
    const rate = weight > 0 ? Math.round((amount / weight) * 10) / 10 : 15;
    const destination = recyclers[0];

    const newReceipt = createReceipt({
      jobId: completeModalJob.id,
      material: completeModalJob.materialCategory,
      measuredKg: weight,
      ratePerKg: rate,
      lineItems: [
        {
          label: `${weight.toFixed(2)} kg ${completeModalJob.materialCategory.toUpperCase()} @ ₹${rate.toFixed(2)}/kg`,
          amount,
        },
      ],
      total: amount,
      paymentStatus: 'cleared_upi_simulated',
      destinationId: destination?.id,
      destinationName: destination?.name,
      householdId: completeModalJob.householdId,
      householdName: completeModalJob.householdName || 'Household',
      pickerId: user?.id,
      pickerName: user?.name || 'Accredited Picker',
      recyclerId: destination?.id,
    });

    completeRequest(completeModalJob.id, amount);
    setCompleteModalJob(null);
    setActualWeight('');
    setAgreedAmount('');
    setSelectedReceipt(newReceipt);
    Alert.alert(
      t('common.verified'),
      t('picker.pickupFinishedToast', { amount: amount.toFixed(2), receipt: newReceipt.receiptNumber, defaultValue: `Pickup Finished! Payment of ₹${amount.toFixed(2)} recorded.` })
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.myJobs')}</Text>
        <Text style={styles.subtitle}>{t('picker.trackJobsSub')}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            {t('picker.activeTab')} ({myActiveJobs.length + activePickupJobs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            {t('picker.historyTab')} ({myCompletedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' ? (
          (myActiveJobs.length === 0 && activePickupJobs.length === 0) ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>{t('picker.noActiveJobs')}</Text>
              <Text style={styles.emptyText}>{t('picker.noOpportunities')}</Text>
            </Card>
          ) : (
            <>
              {/* Plan My Round Banner (shows when >= 2 pickup jobs with coordinates exist) */}
              {roundStops.length >= 2 && (
                <TouchableOpacity
                  style={styles.planRoundBanner}
                  onPress={handleOpenPlanRound}
                  activeOpacity={0.88}
                >
                  <View style={styles.planRoundLeft}>
                    <View style={styles.planRoundIconBox}>
                      <Ionicons name="map" size={22} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planRoundTitle}>{t('picker.planRound', 'Plan My Round')}</Text>
                      <Text style={styles.planRoundSubtitle}>
                        {t('picker.planRoundSubtitle', 'Optimize pickup sequence & save travel time')} ({roundStops.length} stops)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planRoundBadge}>
                    <Text style={styles.planRoundBadgeText}>Optimize</Text>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}

              {/* Shared Record Layer Claimed Jobs */}
              {activePickupJobs.map((job) => {
                const mat = MATERIAL_CATEGORIES.find(m => m.id === job.material.toLowerCase());
                const rate = job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15;
                const isWeighed = job.status === 'weighed';
                const isEnRoute = job.status === 'en_route';

                return (
                  <Card key={job.id} style={styles.jobCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.matInfo}>
                        <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                        <View>
                          <Text style={styles.matTitle}>
                            {t(`materials.${job.material.toLowerCase()}`, { defaultValue: mat?.label || job.material.toUpperCase() })}
                          </Text>
                          <Text style={styles.qtyText}>{job.estimatedKg} kg</Text>
                        </View>
                      </View>
                      <Badge
                        label={t(`status.${job.status}`, { defaultValue: job.status.replace(/_/g, ' ') })}
                        variant={isEnRoute ? 'warning' : isWeighed ? 'success' : 'info'}
                      />
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.detailText} numberOfLines={2}>{job.location.address || job.location.ward}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.detailText}>{t('recycle.pickupWindow')}: {job.window}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="pricetag" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.detailText}>
                          Rate: ₹{rate.toFixed(2)}/kg • Est. Payout: ₹{(rate * job.estimatedKg).toFixed(0)}
                        </Text>
                      </View>
                    </View>

                    {/* Actions for worker */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: Colors.primary }]}
                        onPress={() => router.push(`/(picker)/navigate/${job.id}` as any)}
                      >
                        <Ionicons name="navigate" size={18} color="#fff" />
                        <Text style={styles.bigButtonText}>{t('picker.navigateBtn', 'Navigate to Pickup')}</Text>
                      </TouchableOpacity>

                      {isWeighed ? (
                        <TouchableOpacity
                          style={[styles.bigButton, { backgroundColor: '#1B5E20' }]}
                          onPress={() => handleOpenRecyclerNav(job.destinationId)}
                        >
                          <Ionicons name="business" size={18} color="#fff" />
                          <Text style={styles.bigButtonText}>{t('picker.navigateToRecycler', 'Navigate to Recycler')}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.bigButton, { backgroundColor: '#1B5E20' }]}
                          onPress={() => {
                            setScanJob({
                              id: job.id,
                              householdId: job.householdId,
                              householdName: job.householdName,
                              materialCategory: job.material,
                              approximateQuantityKg: job.estimatedKg,
                              estimatedPriceMin: rate * job.estimatedKg,
                              estimatedPriceMax: rate * job.estimatedKg,
                              status: 'accepted',
                              pickupAddress: job.location.address || job.location.ward,
                              createdAt: job.createdAt,
                              updatedAt: job.updatedAt || job.createdAt,
                            });
                          }}
                        >
                          <Ionicons name="qr-code-outline" size={18} color="#fff" />
                          <Text style={styles.bigButtonText}>Scan Doorstep QR</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                );
              })}

              {/* Traditional recycling requests */}
              {myActiveJobs.map((job) => {
                const mat = MATERIAL_CATEGORIES.find(m => m.id === job.materialCategory);
                return (
                  <Card key={job.id} style={styles.jobCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.matInfo}>
                        <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                        <View>
                          <Text style={styles.matTitle}>
                            {t(`materials.${job.materialCategory}`, { defaultValue: mat?.label || job.materialCategory })}
                          </Text>
                          <Text style={styles.qtyText}>{job.approximateQuantityKg} {job.quantityUnit}</Text>
                        </View>
                      </View>
                      <Badge
                        label={t(`status.${job.status}`, { defaultValue: job.status.replace(/_/g, ' ') })}
                        variant={job.status === 'en_route' ? 'warning' : 'info'}
                      />
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.detailText} numberOfLines={2}>{job.pickupAddress}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.detailText}>{t('recycle.pickupWindow')}: {job.preferredPickupWindow}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="pricetag" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.detailText}>{t('recycle.estimatedPrice')}: ₹{job.estimatedPriceMin} - ₹{job.estimatedPriceMax}</Text>
                      </View>
                    </View>

                    {/* Actions for worker */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: Colors.primary }]}
                        onPress={() => router.push(`/(picker)/navigate/${job.id}` as any)}
                      >
                        <Ionicons name="navigate" size={18} color="#fff" />
                        <Text style={styles.bigButtonText}>{t('picker.navigateBtn', 'Navigate to Pickup')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: '#1B5E20' }]}
                        onPress={() => setScanJob(job)}
                      >
                        <Ionicons name="qr-code-outline" size={18} color="#fff" />
                        <Text style={styles.bigButtonText}>Scan Doorstep QR</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: Colors.success }]}
                        onPress={() => {
                          setCompleteModalJob(job);
                          setActualWeight(String(job.approximateQuantityKg));
                          setAgreedAmount(String(job.estimatedPriceMin));
                        }}
                      >
                        <Ionicons name="checkmark-done" size={18} color="#fff" />
                        <Text style={styles.bigButtonText}>{t('picker.recordCollection')}</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </>
          )
        ) : (
          myCompletedJobs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>{t('picker.noCompletedJobs')}</Text>
            </Card>
          ) : (
            myCompletedJobs.map((job) => {
              const mat = MATERIAL_CATEGORIES.find(m => m.id === job.materialCategory);
              const matchingReceipt = receipts.find(r => r.jobId === job.id) ||
                receipts.find(r => r.material.toLowerCase() === job.materialCategory.toLowerCase()) || receipts[0];

              const jobDispute = disputes.find(d => d.jobId === job.id);
              const isDisputed = job.status === 'disputed' || (jobDispute && jobDispute.status !== 'resolved');
              const isResolved = jobDispute?.status === 'resolved';

              return (
                <Card key={job.id} style={styles.completedCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.matInfo}>
                      <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                      <View>
                        <Text style={styles.matTitle}>{mat?.label || job.materialCategory}</Text>
                        <Text style={styles.dateText}>{new Date(job.updatedAt).toLocaleDateString('en-IN')}</Text>
                      </View>
                    </View>
                    <View style={styles.payout}>
                      <Text style={styles.payoutLabel}>
                        {isDisputed ? 'DISPUTED' : isResolved ? 'RECONCILED' : 'PAID'}
                      </Text>
                      <Text style={[
                        styles.payoutAmount,
                        isDisputed && { color: Colors.error },
                        isResolved && { color: '#2E7D32' },
                      ]}>
                        ₹{(isResolved && jobDispute?.adjustedTotal !== undefined ? jobDispute.adjustedTotal : job.agreedPrice)?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.addressSnippet} numberOfLines={1}>📍 {job.pickupAddress}</Text>

                  {jobDispute && (
                    <View style={[
                      styles.historyDisputeRow,
                      isResolved && { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }
                    ]}>
                      <Ionicons
                        name={isResolved ? 'checkmark-circle' : 'alert-circle'}
                        size={14}
                        color={isResolved ? '#2E7D32' : Colors.error}
                      />
                      <Text style={[
                        styles.historyDisputeText,
                        isResolved && { color: '#2E7D32' }
                      ]}>
                        {isResolved
                          ? `Arbitrated: ${jobDispute.resolution}`
                          : `Under Review: Case #${jobDispute.id.toUpperCase()}`}
                      </Text>
                    </View>
                  )}

                  {matchingReceipt ? (
                    <View style={styles.completedActionsRow}>
                      <TouchableOpacity
                        style={styles.viewReceiptBtn}
                        onPress={() => setSelectedReceipt(matchingReceipt)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="receipt-outline" size={15} color={Colors.pickerAccent} />
                        <Text style={styles.viewReceiptBtnText}>Receipt</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.viewReceiptBtn, styles.viewJourneyBtn]}
                        onPress={() => setJourneyReceipt(matchingReceipt)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="git-network-outline" size={15} color="#1B5E20" />
                        <Text style={styles.viewJourneyBtnText}>Traceability</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.viewReceiptBtn, styles.viewRecyclerBtn]}
                        onPress={() => handleOpenRecyclerNav(matchingReceipt.destinationId || matchingReceipt.recyclerId)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="business-outline" size={15} color="#1B5E20" />
                        <Text style={styles.viewRecyclerBtnText}>MRF Hub</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </Card>
              );
            })
          )
        )}
      </ScrollView>

      {/* Completion Modal */}
      <Modal visible={!!completeModalJob} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finalize Pickup</Text>
              <TouchableOpacity onPress={() => setCompleteModalJob(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Enter the verified weighed quantity and final negotiated amount handed to the household. A Fair Value Receipt will be generated.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Measured Weight (kg) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={actualWeight}
                  onChangeText={setActualWeight}
                  placeholder="e.g. 5.2"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Agreed Amount Paid (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={agreedAmount}
                  onChangeText={setAgreedAmount}
                  placeholder="e.g. 65"
                />
              </View>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmCompletion}
              >
                <Text style={styles.modalConfirmText}>Confirm, Pay & Issue Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scanner Simulation Modal */}
      <Modal visible={!!scanJob} transparent animationType="slide" onRequestClose={() => setScanJob(null)}>
        <View style={styles.scannerModalOverlay}>
          <View style={styles.scannerCard}>
            <View style={styles.scannerHeader}>
              <View>
                <Text style={styles.scannerTitle}>Scan Doorstep QR</Text>
                <Text style={styles.scannerSub}>Household handoff verification</Text>
              </View>
              <TouchableOpacity onPress={() => setScanJob(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Viewfinder Graphic */}
            <View style={styles.viewfinderBox}>
              <View style={styles.viewfinderFrame}>
                <Ionicons name="scan-outline" size={100} color={Colors.primary} />
              </View>
              <Text style={styles.scanTargetText}>
                Target: {scanJob?.approximateQuantityKg} kg {scanJob?.materialCategory.toUpperCase()}
              </Text>
              <Text style={styles.scanAddressText} numberOfLines={2}>
                📍 {scanJob?.pickupAddress}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.gloveVerifyBtn}
              onPress={() => {
                if (scanJob) {
                  confirmHandoffQR(scanJob.id, user?.id || 'picker-1', user?.name || 'Raju Collector');
                  setScanJob(null);
                  Alert.alert('Handoff Verified ✅', 'Doorstep QR verified and logged into Shared Record Layer.');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.gloveVerifyBtnText}>Simulate Instant Scan & Verify (56px)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Material Journey Timeline Modal */}
      <JourneyTimelineModal
        visible={!!journeyReceipt}
        onClose={() => setJourneyReceipt(null)}
        receipt={journeyReceipt}
      />

      {/* Fair Value Receipt Modal */}
      <FairValueReceiptModal
        visible={!!selectedReceipt}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Plan My Round Modal */}
      <Modal visible={isPlanRoundOpen} animationType="slide" transparent={false}>
        <View style={[styles.roundModalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.roundModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roundModalTitle}>{t('picker.planRound', 'Plan My Round')}</Text>
              <Text style={styles.roundModalSubtitle}>
                Sequenced collection sequence • {orderedRoundStops.length} stops
              </Text>
            </View>
            <TouchableOpacity
              style={styles.roundCloseBtn}
              onPress={() => setIsPlanRoundOpen(false)}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Metrics summary */}
          <View style={styles.roundMetricsRow}>
            <View style={styles.roundMetricBox}>
              <Text style={styles.roundMetricLabel}>{t('picker.totalDistance', 'Total Distance')}</Text>
              <Text style={styles.roundMetricValue}>
                {roundRoute ? formatDistance(roundRoute.distanceM) : '...'}
              </Text>
            </View>
            <View style={styles.roundMetricDivider} />
            <View style={styles.roundMetricBox}>
              <Text style={styles.roundMetricLabel}>{t('picker.estimatedTime', 'Est. Time')}</Text>
              <Text style={styles.roundMetricValue}>
                {roundRoute ? formatDuration(roundRoute.durationS) : '...'}
              </Text>
            </View>
            <View style={styles.roundMetricDivider} />
            <View style={styles.roundMetricBox}>
              <Text style={styles.roundMetricLabel}>Stops</Text>
              <Text style={[styles.roundMetricValue, { color: Colors.pickerAccent }]}>
                {orderedRoundStops.length}
              </Text>
            </View>
          </View>

          {/* Route Map Preview */}
          <View style={styles.roundMapContainer}>
            {isLoadingRound ? (
              <View style={styles.roundLoadingBox}>
                <ActivityIndicator size="large" color={Colors.pickerAccent} />
                <Text style={styles.roundLoadingText}>Optimizing sequence via nearest-neighbour...</Text>
              </View>
            ) : (
              <CirculoMap
                routeGeometry={roundRoute?.geometry}
                markersToFit={[
                  ...(liveCoords ? [liveCoords] : []),
                  ...orderedRoundStops.map(s => s.coordinate),
                ]}
                userLocation={liveCoords}
                showControls={true}
                gloveFriendly={true}
                style={StyleSheet.absoluteFill}
              >
                {liveCoords && (
                  <PickerMarker
                    id={user?.id || 'picker-me'}
                    coordinate={liveCoords}
                    name={user?.name || 'Meena Devi'}
                    isLive={true}
                  />
                )}
                {orderedRoundStops.map((stop, idx) => (
                  <StopPin
                    key={stop.id}
                    id={stop.id}
                    coordinate={stop.coordinate}
                    sequence={idx + 1}
                    state={idx === 0 ? 'current' : 'pending'}
                    label={stop.title}
                  />
                ))}
              </CirculoMap>
            )}
          </View>

          {/* Sequenced Stops List */}
          <ScrollView
            style={styles.roundStopsScroll}
            contentContainerStyle={styles.roundStopsContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.roundSectionTitle}>Optimized Stop Sequence</Text>
            {orderedRoundStops.map((stop, idx) => {
              const isFirst = idx === 0;
              return (
                <View key={stop.id} style={[styles.roundStopCard, isFirst && styles.roundStopCardFirst]}>
                  <View style={[styles.stopNumberBadge, isFirst && styles.stopNumberBadgeFirst]}>
                    <Text style={styles.stopNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopCardTitle}>{stop.title}</Text>
                    <Text style={styles.stopCardMat}>
                      {stop.material.toUpperCase()} • {stop.estimatedKg} kg
                    </Text>
                    <Text style={styles.stopCardAddress} numberOfLines={1}>
                      📍 {stop.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stopNavBtn, isFirst && styles.stopNavBtnFirst]}
                    onPress={() => {
                      setIsPlanRoundOpen(false);
                      router.push(`/(picker)/navigate/${stop.id}` as any);
                    }}
                  >
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={styles.stopNavBtnText}>Stop #{idx + 1}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Primary Action */}
          {orderedRoundStops.length > 0 && (
            <View style={[styles.roundFooter, { paddingBottom: insets.bottom + Spacing[3] }]}>
              <TouchableOpacity
                style={styles.startRoundBtn}
                onPress={() => {
                  setIsPlanRoundOpen(false);
                  router.push(`/(picker)/navigate/${orderedRoundStops[0].id}` as any);
                }}
              >
                <Ionicons name="rocket" size={20} color="#FFFFFF" />
                <Text style={styles.startRoundBtnText}>
                  {t('picker.startRound', 'Start Round')} (Stop #1)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Recycler / MRF Hub Navigation Modal */}
      <Modal visible={!!recyclerNavTarget} animationType="slide" transparent={false}>
        <View style={[styles.roundModalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.roundModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roundModalTitle}>{t('picker.recyclerHub', 'Recycler & MRF Hub')}</Text>
              <Text style={styles.roundModalSubtitle}>
                Handoff and weigh-in at licensed recovery facility
              </Text>
            </View>
            <TouchableOpacity
              style={styles.roundCloseBtn}
              onPress={() => setRecyclerNavTarget(null)}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Recycler Facility Card */}
          {recyclerNavTarget && (
            <View style={styles.recyclerCardHeader}>
              <View style={styles.recyclerCardIconBox}>
                <Ionicons name="business" size={24} color="#1B5E20" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recyclerName}>{recyclerNavTarget.name}</Text>
                <Text style={styles.recyclerAddress} numberOfLines={2}>
                  📍 {recyclerNavTarget.address}
                </Text>
                <View style={styles.recyclerHoursBadge}>
                  <Ionicons name="time" size={13} color="#1B5E20" />
                  <Text style={styles.recyclerHoursText}>
                    {t('picker.dropoffHours', 'Hours')}: {recyclerNavTarget.hours}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Route Metrics */}
          <View style={styles.roundMetricsRow}>
            <View style={styles.roundMetricBox}>
              <Text style={styles.roundMetricLabel}>Distance to MRF</Text>
              <Text style={styles.roundMetricValue}>
                {recyclerRoute ? formatDistance(recyclerRoute.distanceM) : '...'}
              </Text>
            </View>
            <View style={styles.roundMetricDivider} />
            <View style={styles.roundMetricBox}>
              <Text style={styles.roundMetricLabel}>Est. Travel Time</Text>
              <Text style={styles.roundMetricValue}>
                {recyclerRoute ? formatDuration(recyclerRoute.durationS) : '...'}
              </Text>
            </View>
            <View style={styles.roundMetricDivider} />
            <View style={styles.roundMetricBox}>
              <Text style={styles.roundMetricLabel}>Status</Text>
              <Text style={[styles.roundMetricValue, { color: '#1B5E20' }]}>Open Now</Text>
            </View>
          </View>

          {/* Map */}
          <View style={styles.recyclerMapContainer}>
            {isLoadingRecyclerRoute ? (
              <View style={styles.roundLoadingBox}>
                <ActivityIndicator size="large" color="#1B5E20" />
                <Text style={styles.roundLoadingText}>Routing to Recycler facility...</Text>
              </View>
            ) : (
              <CirculoMap
                routeGeometry={recyclerRoute?.geometry}
                userLocation={liveCoords}
                markersToFit={[
                  ...(liveCoords ? [liveCoords] : []),
                  {
                    latitude: recyclerNavTarget?.latitude ?? 13.0280,
                    longitude: recyclerNavTarget?.longitude ?? 77.5404,
                  },
                ]}
                showControls={true}
                gloveFriendly={true}
                style={StyleSheet.absoluteFill}
              >
                {liveCoords && (
                  <PickerMarker
                    id={user?.id || 'picker-me'}
                    coordinate={liveCoords}
                    name={user?.name || 'Meena Devi'}
                    isLive={true}
                  />
                )}
                {recyclerNavTarget && (
                  <RecyclerPin
                    id={recyclerNavTarget.id}
                    coordinate={{
                      latitude: recyclerNavTarget.latitude ?? 13.0280,
                      longitude: recyclerNavTarget.longitude ?? 77.5404,
                    }}
                    name={recyclerNavTarget.name}
                    hours={recyclerNavTarget.hours}
                  />
                )}
              </CirculoMap>
            )}
          </View>

          {/* Actions */}
          <View style={[styles.roundFooter, { paddingBottom: insets.bottom + Spacing[3] }]}>
            <TouchableOpacity
              style={styles.externalMapsBtn}
              onPress={handleOpenRecyclerExternalMaps}
            >
              <Ionicons name="map-outline" size={20} color="#FFFFFF" />
              <Text style={styles.externalMapsBtnText}>
                {t('picker.openInMaps', 'Open in External Maps')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.pickerAccent },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.pickerAccent, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  jobCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  matIcon: { fontSize: 32 },
  matTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  qtyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  dateText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  cardDetails: { backgroundColor: Colors.surfaceAlt, padding: Spacing[3], borderRadius: BorderRadius.md, gap: Spacing[1.5] },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  detailText: { fontSize: FontSize.xs, color: Colors.textPrimary, flex: 1 },
  actionRow: { gap: Spacing[2] },
  bigButton: {
    minHeight: 56,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  bigButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  completedCard: { padding: Spacing[4], gap: Spacing[2] },
  completedActionsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  payout: { alignItems: 'flex-end' },
  payoutLabel: { fontSize: 9, color: Colors.success, fontWeight: FontWeight.bold },
  payoutAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addressSnippet: { fontSize: FontSize.xs, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing[5] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalBody: { gap: Spacing[4] },
  modalSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  inputGroup: { gap: Spacing[1] },
  inputLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  modalConfirmBtn: {
    minHeight: 56,
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  modalConfirmText: { color: Colors.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  viewReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1.5],
    minHeight: 48,
    paddingVertical: Spacing[2],
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.25)',
  },
  viewReceiptBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.pickerAccent,
  },
  viewJourneyBtn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  viewJourneyBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  scannerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  scannerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    gap: Spacing[3],
    ...Shadow.lg,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  scannerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  viewfinderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  viewfinderFrame: {
    width: 140,
    height: 140,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  scanTargetText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  scanAddressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  gloveVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.md,
    minHeight: 56,
  },
  gloveVerifyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  historyDisputeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: Spacing[1.5],
    marginTop: Spacing[1],
  },
  historyDisputeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.error,
  },
  planRoundBanner: {
    backgroundColor: '#1E3A8A',
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[1],
    ...Shadow.md,
  },
  planRoundLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  planRoundIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRoundTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  planRoundSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  planRoundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.pickerAccent,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  planRoundBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  viewRecyclerBtn: {
    borderColor: '#1B5E20',
  },
  viewRecyclerBtnText: {
    color: '#1B5E20',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  roundModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  roundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roundModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  roundModalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roundCloseBtn: {
    padding: Spacing[1],
  },
  roundMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roundMetricBox: {
    alignItems: 'center',
  },
  roundMetricLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  roundMetricValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  roundMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  roundMapContainer: {
    height: 220,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
    overflow: 'hidden',
  },
  recyclerMapContainer: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  roundLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  roundLoadingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  roundStopsScroll: {
    flex: 1,
  },
  roundStopsContent: {
    padding: Spacing[4],
    gap: Spacing[2.5],
  },
  roundSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[1],
  },
  roundStopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    gap: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  roundStopCardFirst: {
    borderColor: Colors.pickerAccent,
    borderWidth: 1.5,
    backgroundColor: '#FFFDF9',
  },
  stopNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberBadgeFirst: {
    backgroundColor: Colors.pickerAccent,
  },
  stopNumberText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  stopCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  stopCardMat: {
    fontSize: FontSize.xs,
    color: Colors.pickerAccent,
    fontWeight: FontWeight.bold,
    marginTop: 1,
  },
  stopCardAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stopNavBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopNavBtnFirst: {
    backgroundColor: Colors.pickerAccent,
  },
  stopNavBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  roundFooter: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startRoundBtn: {
    minHeight: 54,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.md,
  },
  startRoundBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  recyclerCardHeader: {
    flexDirection: 'row',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recyclerCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recyclerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  recyclerAddress: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recyclerHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  recyclerHoursText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: '#1B5E20',
  },
  externalMapsBtn: {
    minHeight: 54,
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.md,
  },
  externalMapsBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
