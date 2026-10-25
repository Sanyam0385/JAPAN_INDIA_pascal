import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
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
import type { PickupJob } from '../../src/types';
import { calculateDistanceKm } from '../../src/lib/location/distance';
import { useLocationStore } from '../../src/lib/location/locationStore';
import { CirculoMap, CirculoMapRef } from '../../src/components/map/CirculoMap';
import { PickupPin, PickerMarker } from '../../src/components/map/markers';
import { formatDistance, formatDuration, LatLng } from '../../src/lib/maps/geo';
import { getResolvedUserCenter, getInitialMapRegion, seedCoordsAround } from '../../src/lib/maps/config';

const RADIUS_OPTIONS: (number | 'all')[] = [1, 3, 5, 10, 'all'];

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { pickupJobs, proposeRate, respondToRateOffer, claimPickupJob, rateOffers, hydrateJobs, currentCityConfig } = useAppStore();
  const liveCoords = useLocationStore((s) => s.coords);
  const mapRef = useRef<CirculoMapRef>(null);
  const radiusScrollRef = useRef<any>(null);
  const listRadiusScrollRef = useRef<any>(null);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [radiusFilter, setRadiusFilter] = useState<number | 'all'>(3);
  const [sortBy, setSortBy] = useState<'distance' | 'payout'>('distance');
  const [selectedMapJob, setSelectedMapJob] = useState<PickupJob | null>(null);

  useEffect(() => {
    hydrateJobs();
  }, []);

  // Modal state for Rate Negotiation
  const [negotiateJob, setNegotiateJob] = useState<PickupJob | null>(null);
  const [counterRateInput, setCounterRateInput] = useState<string>('');

  // Geographic user resolution: Live GPS -> profile lat/lng -> resolved city config (e.g. Patiala) -> India default
  const resolvedUserCenter = useMemo(() => {
    return getResolvedUserCenter(user, liveCoords, currentCityConfig);
  }, [user, liveCoords, currentCityConfig]);

  const initialRegion = useMemo(() => {
    return getInitialMapRegion(user, liveCoords, currentCityConfig);
  }, [user, liveCoords, currentCityConfig]);

  const isRealAccount = Boolean(user?.id && !user.id.startsWith('demo-'));
  const isNonBengaluru = Boolean(currentCityConfig?.cityCode && currentCityConfig.cityCode !== 'bengaluru');

  // Adapt seeded demo requests around the real user's resolved city (0.3 - 2 km offsets)
  const localizedJobs = useMemo(() => {
    const shouldLocalize = isRealAccount || isNonBengaluru;
    if (!shouldLocalize) return pickupJobs;

    const seededCoords = seedCoordsAround(resolvedUserCenter, pickupJobs.length);
    const wardName = currentCityConfig?.wardName || currentCityConfig?.cityName || 'Central Ward';

    return pickupJobs.map((job, idx) => {
      if (job.id.startsWith('job-') && seededCoords[idx]) {
        const coord = seededCoords[idx];
        const distKm = calculateDistanceKm(
          resolvedUserCenter.latitude,
          resolvedUserCenter.longitude,
          coord.latitude,
          coord.longitude
        );
        return {
          ...job,
          location: {
            ...job.location,
            ward: `${wardName} Sector ${((idx * 3) % 9) + 1}`,
            address: `${10 + idx * 4}, Sector ${((idx * 3) % 9) + 1}, ${currentCityConfig?.cityName || 'Local Area'}`,
            latitude: coord.latitude,
            longitude: coord.longitude,
            distanceKm: Number(distKm.toFixed(1)),
          },
          lat: coord.latitude,
          lng: coord.longitude,
        };
      }
      return job;
    });
  }, [pickupJobs, isRealAccount, isNonBengaluru, resolvedUserCenter, currentCityConfig]);

  // Helper to get distance for job
  const getJobDistance = useCallback((job: PickupJob) => {
    const targetCenter = liveCoords || resolvedUserCenter;
    if (targetCenter && job.location.latitude && job.location.longitude) {
      return calculateDistanceKm(
        targetCenter.latitude,
        targetCenter.longitude,
        job.location.latitude,
        job.location.longitude
      );
    }
    return job.location.distanceKm ?? 1.5;
  }, [liveCoords, resolvedUserCenter]);

  // Filter available jobs (listed, rate_proposed, rate_locked without assigned picker)
  const availableJobs = localizedJobs.filter(job => {
    const isUnclaimed = ['listed', 'rate_proposed', 'rate_locked', 'claimed'].includes(job.status) && (!job.pickerId || job.pickerId === user?.id || job.pickerId === 'demo-picker-1');
    if (!isUnclaimed) return false;

    if (selectedCategory !== 'all' && job.material.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    const dist = getJobDistance(job);
    if (radiusFilter !== 'all' && dist > radiusFilter) {
      return false;
    }

    return true;
  });

  // Sort jobs
  const sortedJobs = [...availableJobs].sort((a, b) => {
    const rateA = a.lockedRatePerKg ?? a.proposedRatePerKg ?? 15;
    const rateB = b.lockedRatePerKg ?? b.proposedRatePerKg ?? 15;
    const payoutA = rateA * a.estimatedKg;
    const payoutB = rateB * b.estimatedKg;

    if (sortBy === 'distance') {
      return getJobDistance(a) - getJobDistance(b);
    } else {
      return payoutB - payoutA;
    }
  });

  const mapMarkersToFit = useMemo(() => {
    const list: LatLng[] = [resolvedUserCenter];
    sortedJobs.forEach((j) => {
      if (typeof j.location.latitude === 'number' && typeof j.location.longitude === 'number') {
        list.push({ latitude: j.location.latitude, longitude: j.location.longitude });
      }
    });
    return list;
  }, [resolvedUserCenter, sortedJobs]);

  // On first render in map mode or when radiusFilter changes, call fitToCoordinates with padding
  useEffect(() => {
    if (viewMode === 'map' && mapMarkersToFit.length > 0) {
      const timer = setTimeout(() => {
        mapRef.current?.fitAll(mapMarkersToFit);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [viewMode, radiusFilter, mapMarkersToFit.length]);

  // Auto-scroll selected radius chip into view
  const handleSelectRadius = (r: number | 'all', index: number) => {
    setRadiusFilter(r);
    radiusScrollRef.current?.scrollTo({
      x: Math.max(0, index * 60 - 20),
      animated: true,
    });
    listRadiusScrollRef.current?.scrollTo({
      x: Math.max(0, index * 60 - 20),
      animated: true,
    });
  };

  const handleClaimLockedJob = (job: PickupJob) => {
    const lockedRate = job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15;
    Alert.alert(
      t('picker.claimPromptTitle', 'Claim Pickup Job 🔒'),
      `Rate is locked at ₹${lockedRate.toFixed(2)}/kg for ${job.estimatedKg} kg of ${job.material.toUpperCase()} (Est. Payout ₹${(lockedRate * job.estimatedKg).toFixed(2)}).\n\nClaim this job now?`,
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.confirm', 'Confirm & Claim'),
          onPress: () => {
            claimPickupJob(job.id, user?.id || 'demo-picker-1', user?.name || 'Meena Devi');
            Alert.alert(
              t('picker.claimPromptTitle', 'Job Claimed! 📦'),
              `You have claimed this pickup. Would you like to start GPS navigation now?`,
              [
                { text: t('common.later', 'Later'), style: 'cancel' },
                {
                  text: t('picker.startNavigation', 'Start Navigation 🧭'),
                  onPress: () => router.push(`/(picker)/navigate/${job.id}` as any),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleQuickLockAndClaim = (job: PickupJob) => {
    const askingRate = job.proposedRatePerKg ?? 15;
    Alert.alert(
      'Lock Asking Rate & Claim',
      `Lock rate at asking price ₹${askingRate.toFixed(2)}/kg and claim this pickup?`,
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: 'Lock & Claim',
          onPress: () => {
            respondToRateOffer(job.id, 'accept', askingRate);
            claimPickupJob(job.id, user?.id || 'demo-picker-1', user?.name || 'Meena Devi');
            Alert.alert(
              t('picker.claimPromptTitle', 'Rate Locked & Job Claimed! ✅'),
              `Rate locked at ₹${askingRate.toFixed(2)}/kg. Would you like to start GPS navigation now?`,
              [
                { text: t('common.later', 'Later'), style: 'cancel' },
                {
                  text: t('picker.startNavigation', 'Start Navigation 🧭'),
                  onPress: () => router.push(`/(picker)/navigate/${job.id}` as any),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleOpenNegotiate = (job: PickupJob) => {
    setNegotiateJob(job);
    const defaultRate = job.proposedRatePerKg ?? 15;
    setCounterRateInput(String(defaultRate));
  };

  const handleAcceptNegotiatedRate = () => {
    if (!negotiateJob) return;
    const currentRate = negotiateJob.proposedRatePerKg ?? 15;
    respondToRateOffer(negotiateJob.id, 'accept', currentRate);
    setNegotiateJob(null);
    Alert.alert('Rate Locked! 🔒', `Rate officially locked at ₹${currentRate.toFixed(2)}/kg before collection. You can now claim the job.`);
  };

  const handleSendCounterOffer = () => {
    if (!negotiateJob) return;
    const counterRate = parseFloat(counterRateInput);
    if (isNaN(counterRate) || counterRate <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid rate per kg.');
      return;
    }

    const latestOffer = rateOffers.find(o => o.jobId === negotiateJob.id);
    if (latestOffer?.counterOffer) {
      Alert.alert('Limit Reached', 'Only 1 counter-offer is permitted per transaction to maintain transparency.');
      return;
    }

    if (!latestOffer) {
      proposeRate(negotiateJob.id, 'picker', counterRate);
    } else {
      respondToRateOffer(negotiateJob.id, 'counter', counterRate);
    }

    setNegotiateJob(null);
    Alert.alert('Counter-Offer Sent 💬', `Proposed ₹${counterRate.toFixed(2)}/kg sent to household. The rate will lock once confirmed.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {t('picker.opportunities', 'Opportunities')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t('picker.nearbyRequests', 'Open recyclable waste pickups & rate negotiation')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('picker.viewModeList', 'List')}
            >
              <Ionicons name="list" size={13} color={viewMode === 'list' ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>
                {t('picker.viewModeList', 'List')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('picker.viewModeMap', 'Map')}
            >
              <Ionicons name="map" size={13} color={viewMode === 'map' ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>
                {t('picker.viewModeMap', 'Map')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter and Sort Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
              {t('common.all', 'All Materials')}
            </Text>
          </TouchableOpacity>
          {MATERIAL_CATEGORIES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.filterChip, selectedCategory === m.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(m.id)}
            >
              <Text style={styles.filterChipIcon}>{m.icon}</Text>
              <Text style={[styles.filterChipText, selectedCategory === m.id && styles.filterChipTextActive]}>
                {t('materials.' + m.id, m.label.split(' ')[0])}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Radius Filter & Sort Row in List Mode */}
        {viewMode === 'list' && (
          <View style={styles.quickControlsRow}>
            <View style={styles.radiusButtonGroup}>
              <Text style={styles.radiusLabel}>{t('picker.radiusLabel', 'Radius')}:</Text>
              <ScrollView
                ref={listRadiusScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.radiusScroll}
              >
                {RADIUS_OPTIONS.map((r, index) => {
                  const isActive = radiusFilter === r;
                  return (
                    <TouchableOpacity
                      key={String(r)}
                      style={[styles.radiusChip, isActive && styles.radiusChipActive]}
                      onPress={() => handleSelectRadius(r, index)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.radiusChipText, isActive && styles.radiusChipTextActive]}>
                        {r === 'all' ? t('picker.radiusAll', 'All') : `${r} km`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.sortButtonGroup}>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'distance' && styles.sortBtnActive]}
                onPress={() => setSortBy('distance')}
                activeOpacity={0.8}
              >
                <Text style={[styles.sortBtnText, sortBy === 'distance' && styles.sortBtnTextActive]}>
                  Nearest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'payout' && styles.sortBtnActive]}
                onPress={() => setSortBy('payout')}
                activeOpacity={0.8}
              >
                <Text style={[styles.sortBtnText, sortBy === 'payout' && styles.sortBtnTextActive]}>
                  Payout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {viewMode === 'list' ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Fair Trade Banner */}
          <Card variant="filled" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#B78103" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Locked Rates Before Pickup</Text>
                <Text style={styles.infoBody}>
                  Once you and the household agree, rates are locked in the Shared Record Layer so weights are paid accurately at doorstep.
                </Text>
              </View>
            </View>
          </Card>

          {sortedJobs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No Pickups Found</Text>
              <Text style={styles.emptyText}>No open listings match your current filters. Try turning off "Within 3 km" or selecting "All Materials".</Text>
            </Card>
          ) : (
            sortedJobs.map((job) => {
              const mat = MATERIAL_CATEGORIES.find(m => m.id === job.material.toLowerCase());
              const rate = job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15;
              const estPayout = rate * job.estimatedKg;
              const isRateLocked = job.status === 'rate_locked';
              const isOfferPending = job.status === 'rate_proposed';
              const isClaimed = job.status === 'claimed';

              return (
                <Card key={job.id} style={styles.jobCard}>
                  {/* Header: Material & Distance */}
                  <View style={styles.jobCardHeader}>
                    <View style={styles.matInfo}>
                      <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                      <View>
                        <Text style={styles.matTitle}>{mat?.label || job.material.toUpperCase()}</Text>
                        <View style={styles.distanceRow}>
                          <Ionicons name="location-sharp" size={13} color={Colors.pickerAccent} />
                          <Text style={styles.distanceText}>
                            {job.location.ward} • {getJobDistance(job).toFixed(1)} km away
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Badge */}
                    {isClaimed ? (
                      <Badge label="Claimed" variant="info" size="sm" />
                    ) : isRateLocked ? (
                      <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={12} color="#1B5E20" />
                        <Text style={styles.lockedBadgeText}>Rate Locked</Text>
                      </View>
                    ) : isOfferPending ? (
                      <View style={styles.offerBadge}>
                        <Ionicons name="chatbubbles" size={12} color="#E65100" />
                        <Text style={styles.offerBadgeText}>Offer Active</Text>
                      </View>
                    ) : (
                      <Badge label="Listed" variant="info" size="sm" />
                    )}
                  </View>

                  {/* Transparent Price & Weight Metrics Box */}
                  <View style={styles.metricsBox}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>EST. WEIGHT</Text>
                      <Text style={styles.metricValue}>{job.estimatedKg.toFixed(1)} kg</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>AGREED RATE</Text>
                      <Text style={[styles.metricValue, isRateLocked && { color: '#1B5E20' }]}>
                        ₹{rate.toFixed(2)}/kg
                      </Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>EST. PAYOUT</Text>
                      <Text style={[styles.metricValue, styles.payoutHighlight]}>
                        ₹{estPayout.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* Details snippet */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailText} numberOfLines={1}>
                      👤 Household: <Text style={styles.detailBold}>{job.householdName || 'Verified Resident'}</Text>
                    </Text>
                    <Text style={styles.detailText} numberOfLines={1}>
                      ⏰ Window: <Text style={styles.detailBold}>{job.window}</Text>
                    </Text>
                    <Text style={styles.detailText} numberOfLines={1}>
                      📍 Address: {job.location.address || job.householdAddress}
                    </Text>
                  </View>

                  {/* Action Buttons with Glove-friendly touch targets (>= 56px) */}
                  <View style={styles.actionGroup}>
                    {isClaimed ? (
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => router.push(`/(picker)/navigate/${job.id}` as any)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="navigate" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryActionBtnText}>
                          {t('picker.startNavigation', 'Start Navigation 🧭')}
                        </Text>
                      </TouchableOpacity>
                    ) : isRateLocked ? (
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: '#1B5E20' }]}
                        onPress={() => handleClaimLockedJob(job)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryActionBtnText}>Claim Job @ ₹{rate.toFixed(2)}/kg</Text>
                      </TouchableOpacity>
                    ) : isOfferPending ? (
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: Colors.pickerAccent }]}
                        onPress={() => handleOpenNegotiate(job)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="pricetags" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryActionBtnText}>Review Offer & Lock Rate</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.splitActionRow}>
                        <TouchableOpacity
                          style={styles.negotiateBtn}
                          onPress={() => handleOpenNegotiate(job)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.pickerAccent} />
                          <Text style={styles.negotiateBtnText}>Negotiate Rate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickLockBtn}
                          onPress={() => handleQuickLockAndClaim(job)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                          <Text style={styles.quickLockBtnText}>Lock & Claim</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        <View style={styles.mapWrapper}>
          <CirculoMap
            ref={mapRef}
            initialRegion={initialRegion}
            userLocation={resolvedUserCenter}
            markersToFit={mapMarkersToFit}
            showControls={true}
            controlsTopOffset={62}
            gloveFriendly={true}
            style={StyleSheet.absoluteFill}
          >
            <PickerMarker
              id={user?.id || 'picker-me'}
              coordinate={resolvedUserCenter}
              name={user?.name || 'Meena Devi'}
              isLive={!!liveCoords}
            />

            {sortedJobs.map((job) => {
              const lat = job.location.latitude;
              const lng = job.location.longitude;
              if (typeof lat !== 'number' || typeof lng !== 'number') return null;
              return (
                <PickupPin
                  key={job.id}
                  id={job.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  material={job.material}
                  estimatedKg={job.estimatedKg}
                  ratePerKg={job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15}
                  selected={selectedMapJob?.id === job.id}
                  onPress={() => setSelectedMapJob(job)}
                />
              );
            })}
          </CirculoMap>

          {/* Floating Radius Filter Chips Row: Horizontal scroll with selected chip visible */}
          <View style={styles.floatingRadiusBar}>
            <View style={styles.radiusPillContainer}>
              <Text style={styles.radiusLabel}>{t('picker.radiusLabel', 'Radius')}:</Text>
              <ScrollView
                ref={radiusScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.floatingRadiusScroll}
              >
                {RADIUS_OPTIONS.map((r, index) => {
                  const isActive = radiusFilter === r;
                  return (
                    <TouchableOpacity
                      key={String(r)}
                      style={[styles.floatingRadiusChip, isActive && styles.floatingRadiusChipActive]}
                      onPress={() => handleSelectRadius(r, index)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.floatingRadiusChipText, isActive && styles.floatingRadiusChipTextActive]}>
                        {r === 'all' ? t('picker.radiusAll', 'All') : `${r} km`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Selected Job Bottom Sheet */}
          {selectedMapJob && (
            <Card style={[styles.mapBottomCard, { bottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[2] }]}>
              <View style={styles.mapCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flex: 1 }}>
                  <Text style={styles.mapCardIcon}>
                    {MATERIAL_CATEGORIES.find(m => m.id === selectedMapJob.material.toLowerCase())?.icon || '♻️'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapCardTitle}>
                      {selectedMapJob.material.toUpperCase()} • {selectedMapJob.estimatedKg} kg
                    </Text>
                    <Text style={styles.mapCardWard} numberOfLines={1}>
                      📍 {selectedMapJob.location.ward || selectedMapJob.location.address}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeCardBtn}
                  onPress={() => setSelectedMapJob(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Stats Row */}
              <View style={styles.mapCardStats}>
                <View style={styles.mapCardStat}>
                  <Text style={styles.mapCardStatLabel}>RATE</Text>
                  <Text style={styles.mapCardStatVal}>
                    ₹{(selectedMapJob.lockedRatePerKg ?? selectedMapJob.proposedRatePerKg ?? 15).toFixed(2)}/kg
                  </Text>
                </View>
                <View style={styles.mapCardStatDivider} />
                <View style={styles.mapCardStat}>
                  <Text style={styles.mapCardStatLabel}>EST. PAYOUT</Text>
                  <Text style={[styles.mapCardStatVal, { color: Colors.pickerAccent }]}>
                    ₹{((selectedMapJob.lockedRatePerKg ?? selectedMapJob.proposedRatePerKg ?? 15) * selectedMapJob.estimatedKg).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.mapCardStatDivider} />
                <View style={styles.mapCardStat}>
                  <Text style={styles.mapCardStatLabel}>DISTANCE</Text>
                  <Text style={styles.mapCardStatVal}>
                    {formatDistance(getJobDistance(selectedMapJob) * 1000)}
                  </Text>
                </View>
                <View style={styles.mapCardStatDivider} />
                <View style={styles.mapCardStat}>
                  <Text style={styles.mapCardStatLabel}>ETA</Text>
                  <Text style={styles.mapCardStatVal}>
                    {formatDuration((getJobDistance(selectedMapJob) / 20) * 3600)}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.mapCardActions}>
                {selectedMapJob.status === 'claimed' ? (
                  <TouchableOpacity
                    style={styles.mapActionPrimaryBtn}
                    onPress={() => router.push(`/(picker)/navigate/${selectedMapJob.id}` as any)}
                  >
                    <Ionicons name="navigate" size={18} color="#FFFFFF" />
                    <Text style={styles.mapActionPrimaryText}>{t('picker.startNavigation', 'Start Navigation 🧭')}</Text>
                  </TouchableOpacity>
                ) : selectedMapJob.status === 'rate_locked' ? (
                  <TouchableOpacity
                    style={styles.mapActionPrimaryBtn}
                    onPress={() => handleClaimLockedJob(selectedMapJob)}
                  >
                    <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                    <Text style={styles.mapActionPrimaryText}>Claim Request (Rate Locked)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: 'row', gap: Spacing[2], width: '100%' }}>
                    <TouchableOpacity
                      style={styles.mapActionSecondaryBtn}
                      onPress={() => handleOpenNegotiate(selectedMapJob)}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.pickerAccent} />
                      <Text style={styles.mapActionSecondaryText}>Negotiate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.mapActionPrimaryBtn}
                      onPress={() => handleQuickLockAndClaim(selectedMapJob)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.mapActionPrimaryText}>Lock & Claim</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          )}
        </View>
      )}

      {/* Rate Negotiation Modal */}
      <Modal visible={!!negotiateJob} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rate Negotiation</Text>
                <Text style={styles.modalSubtitle}>Shared Record Layer rate lock before pickup</Text>
              </View>
              <TouchableOpacity onPress={() => setNegotiateJob(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {negotiateJob && (() => {
              const latestOffer = rateOffers.find(o => o.jobId === negotiateJob.id);
              const hasCounterOffer = !!latestOffer?.counterOffer;
              const currentRate = negotiateJob.proposedRatePerKg ?? 15;

              return (
                <View style={styles.modalBody}>
                  {/* Summary Card */}
                  <View style={styles.negotiateSummary}>
                    <Text style={styles.negotiateMaterial}>
                      {negotiateJob.estimatedKg} kg {negotiateJob.material.toUpperCase()}
                    </Text>
                    <Text style={styles.negotiateWard}>📍 {negotiateJob.location.ward}</Text>
                    <Text style={styles.negotiateResident}>Resident: {negotiateJob.householdName}</Text>
                  </View>

                  {/* Active Offer Status */}
                  <View style={styles.activeOfferBox}>
                    <Text style={styles.activeOfferLabel}>CURRENT OFFER:</Text>
                    <Text style={styles.activeOfferRate}>₹{currentRate.toFixed(2)} / kg</Text>
                    <Text style={styles.activeOfferPayout}>
                      Est. Total: ₹{(currentRate * negotiateJob.estimatedKg).toFixed(2)}
                    </Text>
                    <Text style={styles.activeOfferMeta}>
                      {latestOffer?.counterOffer
                        ? `Counter-offer from ${latestOffer.counterOffer.proposedBy === 'household' ? 'Household' : 'Picker'}`
                        : `Proposed by ${latestOffer?.proposedBy ?? 'Household'}`}
                    </Text>
                  </View>

                  {/* Counter-offer Limit Notice */}
                  <View style={styles.ruleNotice}>
                    <Ionicons name="information-circle" size={18} color={hasCounterOffer ? Colors.error : Colors.primary} />
                    <Text style={styles.ruleNoticeText}>
                      {hasCounterOffer
                        ? 'Maximum 1 counter-offer reached. You can accept this rate or decline.'
                        : 'CIRCULO allows strictly 1 counter-offer per job to guarantee prompt coordination.'}
                    </Text>
                  </View>

                  {!hasCounterOffer && (
                    <View style={styles.counterInputGroup}>
                      <Text style={styles.inputLabel}>Enter Counter Rate (₹/kg):</Text>
                      <TextInput
                        style={styles.counterInput}
                        keyboardType="numeric"
                        value={counterRateInput}
                        onChangeText={setCounterRateInput}
                        placeholder="e.g. 16.00"
                      />
                    </View>
                  )}

                  {/* Modal Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalAcceptBtn}
                      onPress={handleAcceptNegotiatedRate}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                      <Text style={styles.modalAcceptBtnText}>
                        Lock Rate at ₹{currentRate.toFixed(2)}/kg
                      </Text>
                    </TouchableOpacity>

                    {!hasCounterOffer && (
                      <TouchableOpacity
                        style={styles.modalCounterBtn}
                        onPress={handleSendCounterOffer}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="send" size={16} color={Colors.pickerAccent} />
                        <Text style={styles.modalCounterBtnText}>Send Counter-Offer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing[2],
    justifyContent: 'center',
  },
  headerRight: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.pickerAccent,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  floatingRadiusBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 30,
  },
  radiusPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
    elevation: 4,
    gap: Spacing[2],
  },
  floatingRadiusScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: Spacing[2],
  },
  floatingRadiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  floatingRadiusChipActive: {
    backgroundColor: '#FFF3E0',
    borderColor: Colors.pickerAccent,
  },
  floatingRadiusChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  floatingRadiusChipTextActive: {
    color: Colors.pickerAccent,
    fontWeight: FontWeight.bold,
  },
  radiusButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing[1.5],
  },
  radiusLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  radiusScroll: {
    gap: Spacing[1],
    alignItems: 'center',
    paddingRight: Spacing[2],
  },
  radiusChip: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  radiusChipActive: {
    backgroundColor: '#FFF3E0',
    borderColor: Colors.pickerAccent,
  },
  radiusChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  radiusChipTextActive: {
    color: Colors.pickerAccent,
    fontWeight: FontWeight.bold,
  },
  countPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.pickerAccent,
  },
  countText: { color: Colors.pickerAccent, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  toolbar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing[2],
  },
  filterScroll: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], gap: Spacing[2] },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing[1],
  },
  filterChipActive: { backgroundColor: Colors.pickerAccent, borderColor: Colors.pickerAccent },
  filterChipIcon: { fontSize: 14 },
  filterChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.textInverse, fontWeight: FontWeight.bold },
  quickControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.pickerAccent,
    backgroundColor: Colors.surface,
  },
  toggleBtnActive: {
    backgroundColor: Colors.pickerAccent,
  },
  toggleBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.pickerAccent,
  },
  toggleBtnTextActive: {
    color: Colors.textInverse,
  },
  sortButtonGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtn: {
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  sortBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  sortBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  sortBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  content: { padding: Spacing[4], gap: Spacing[3] },
  infoCard: { backgroundColor: '#FFF8E1', borderColor: '#FFE082' },
  infoRow: { flexDirection: 'row', gap: Spacing[2.5], alignItems: 'center' },
  infoTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#B78103' },
  infoBody: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  jobCard: { padding: Spacing[4], gap: Spacing[3] },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  matIcon: { fontSize: 32 },
  matTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  distanceText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  lockedBadgeText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#1B5E20' },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offerBadgeText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#E65100' },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2.5],
    paddingHorizontal: Spacing[3],
    alignItems: 'center',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  metricValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  payoutHighlight: { color: Colors.pickerAccent },
  detailsSection: { gap: 4 },
  detailText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  detailBold: { color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  actionGroup: { marginTop: Spacing[1] },
  primaryActionBtn: {
    minHeight: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.base,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  splitActionRow: { flexDirection: 'row', gap: Spacing[2] },
  negotiateBtn: {
    flex: 1,
    minHeight: 56,
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1.5],
  },
  negotiateBtnText: { color: Colors.pickerAccent, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  quickLockBtn: {
    flex: 1,
    minHeight: 56,
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1.5],
    ...Shadow.base,
  },
  quickLockBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[5],
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  modalBody: { gap: Spacing[3] },
  negotiateSummary: {
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: 3,
  },
  negotiateMaterial: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  negotiateWard: { fontSize: FontSize.xs, color: Colors.textSecondary },
  negotiateResident: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  activeOfferBox: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 2,
  },
  activeOfferLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: '#B78103', letterSpacing: 0.5 },
  activeOfferRate: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.pickerAccent },
  activeOfferPayout: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  activeOfferMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  ruleNotice: {
    flexDirection: 'row',
    gap: Spacing[2],
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  ruleNoticeText: { fontSize: 11, color: Colors.textSecondary, flex: 1, lineHeight: 16 },
  counterInputGroup: { gap: Spacing[1] },
  inputLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  counterInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalActions: { gap: Spacing[2], marginTop: Spacing[2] },
  modalAcceptBtn: {
    minHeight: 54,
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  modalAcceptBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  modalCounterBtn: {
    minHeight: 52,
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  modalCounterBtnText: { color: Colors.pickerAccent, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  mapBottomCard: {
    position: 'absolute',
    left: Spacing[3],
    right: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapCardIcon: {
    fontSize: 24,
  },
  mapCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  mapCardWard: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeCardBtn: {
    padding: Spacing[1],
  },
  mapCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  mapCardStat: {
    alignItems: 'center',
  },
  mapCardStatLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  mapCardStatVal: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  mapCardStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  mapCardActions: {
    width: '100%',
  },
  mapActionPrimaryBtn: {
    flex: 1,
    minHeight: 52,
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1.5],
    ...Shadow.base,
  },
  mapActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  mapActionSecondaryBtn: {
    flex: 1,
    minHeight: 52,
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.3)',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1.5],
  },
  mapActionSecondaryText: {
    color: Colors.pickerAccent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
