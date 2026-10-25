// NavigationScreen: In-app turn-by-turn road navigation for waste pickers
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CirculoMap, CirculoMapRef } from '../../../src/components/map';
import { HouseholdPin, PickerMarker } from '../../../src/components/map/markers';
import { useAppStore } from '../../../src/stores/appStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useLocationStore } from '../../../src/lib/location/locationStore';
import { liveLocationService } from '../../../src/lib/realtime';
import { getRoute, RouteResult } from '../../../src/lib/maps/routing';
import {
  LatLng,
  distance,
  pointToPolylineDistance,
  isWithin,
  formatDistance,
  formatDuration,
} from '../../../src/lib/maps/geo';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../../src/constants';

export default function NavigationScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapRef = useRef<CirculoMapRef>(null);

  const { user } = useAuthStore();
  const { pickupJobs, updatePickupJobStatus } = useAppStore();
  const liveGpsCoords = useLocationStore((s) => s.coords);

  const job = pickupJobs.find((j) => j.id === jobId);

  // Household destination coordinates
  const destinationCoords: LatLng = {
    latitude: job?.location?.latitude ?? job?.lat ?? 12.9345,
    longitude: job?.location?.longitude ?? job?.lng ?? 77.6245,
  };

  // Picker's current coordinates
  const [currentCoords, setCurrentCoords] = useState<LatLng>({
    latitude: liveGpsCoords?.latitude ?? user?.lat ?? 12.9280,
    longitude: liveGpsCoords?.longitude ?? user?.lng ?? 77.6180,
  });

  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(job?.status === 'en_route');
  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);

  // Off-route & reroute tracking refs
  const offRouteTimerRef = useRef<number>(0);
  const lastRerouteTimestampRef = useRef<number>(0);
  const broadcastStopRef = useRef<(() => void) | null>(null);

  // Update current coords when live GPS changes
  useEffect(() => {
    if (liveGpsCoords && typeof liveGpsCoords.latitude === 'number') {
      setCurrentCoords({
        latitude: liveGpsCoords.latitude,
        longitude: liveGpsCoords.longitude,
      });
    }
  }, [liveGpsCoords]);

  // Fetch initial route
  const fetchRoute = useCallback(async (fromPos: LatLng) => {
    setIsLoadingRoute(true);
    try {
      const result = await getRoute(fromPos, destinationCoords, 'picker');
      setRouteResult(result);
      lastRerouteTimestampRef.current = Date.now();
      setIsOffRoute(false);
      offRouteTimerRef.current = 0;
    } catch (e) {
      if (__DEV__) console.warn('[NavigationScreen] Route fetch error:', e);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [destinationCoords.latitude, destinationCoords.longitude]);

  useEffect(() => {
    fetchRoute(currentCoords);
  }, []);

  // Monitor off-route & arrival conditions
  useEffect(() => {
    if (!routeResult || routeResult.geometry.length === 0) return;

    // 1. Arrival check (within 50 meters of household doorstep)
    if (isWithin(currentCoords, destinationCoords, 50)) {
      if (!hasArrived) {
        setHasArrived(true);
      }
      return;
    }

    // 2. Off-route detection (picker > 50 m off polyline for > 10 s)
    const distToPolyline = pointToPolylineDistance(currentCoords, routeResult.geometry);
    if (distToPolyline > 50) {
      offRouteTimerRef.current += 1;
      setIsOffRoute(true);

      const now = Date.now();
      if (
        offRouteTimerRef.current >= 10 &&
        now - lastRerouteTimestampRef.current > 15000
      ) {
        if (__DEV__) console.log('[NavigationScreen] Off route detected (>50m for >10s), rerouting...');
        fetchRoute(currentCoords);
      }
    } else {
      offRouteTimerRef.current = 0;
      setIsOffRoute(false);
    }
  }, [currentCoords, routeResult, destinationCoords, hasArrived, fetchRoute]);

  // Start live location broadcast when navigating
  const startNavigation = () => {
    if (!job) return;

    // 1. Set status en_route in shared record layer
    updatePickupJobStatus(job.id, 'en_route');
    setIsNavigating(true);

    // 2. Start throttled live broadcast channel
    if (broadcastStopRef.current) broadcastStopRef.current();
    broadcastStopRef.current = liveLocationService.startBroadcasting(
      job.id,
      () => ({
        lat: currentCoords.latitude,
        lng: currentCoords.longitude,
        heading: 45,
        speed: 3.5,
      }),
      user?.id || 'demo-picker-1'
    );
  };

  // Stop broadcasting on unmount
  useEffect(() => {
    return () => {
      if (broadcastStopRef.current) {
        broadcastStopRef.current();
      }
    };
  }, []);

  // External GPS launch
  const openExternalMaps = () => {
    const lat = destinationCoords.latitude;
    const lng = destinationCoords.longitude;
    const address = encodeURIComponent(job?.householdAddress || 'Household Pickup');

    const url = Platform.select({
      ios: `maps:0,0?q=${address}@${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    Linking.openURL(url!).catch(() => {
      // Fallback to web Google Maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  if (!job) {
    return (
      <View style={[styles.fallbackContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.fallbackTitle}>Job Not Found</Text>
        <TouchableOpacity style={styles.fallbackBtn} onPress={() => router.back()}>
          <Text style={styles.fallbackBtnText}>Return to Marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = routeResult?.steps?.[0];
  const totalDistanceM = routeResult?.distanceM ?? distance(currentCoords, destinationCoords);
  const totalDurationS = routeResult?.durationS ?? Math.round(totalDistanceM / 5.5);

  return (
    <View style={styles.container}>
      {/* Interactive Map */}
      <CirculoMap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        userLocation={currentCoords}
        routeGeometry={routeResult?.geometry}
        isFallbackRoute={routeResult?.source === 'fallback'}
        markersToFit={[currentCoords, destinationCoords]}
        gloveFriendly={true}
      >
        {/* Exact Household Pin */}
        <HouseholdPin
          id={`hh-${job.id}`}
          coordinate={destinationCoords}
          name={job.householdName || 'Household'}
          address={job.householdAddress}
          isExact={true}
        />

        {/* Live Picker Marker */}
        <PickerMarker
          id="picker-me"
          coordinate={currentCoords}
          name={user?.name || 'Meena Devi'}
          isLive={true}
        />
      </CirculoMap>

      {/* Top Header & Turn-by-Turn Maneuver Banner */}
      <View style={[styles.topOverlay, { paddingTop: Math.max(insets.top + Spacing[1], 16) }]} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1B5E20" />
          </TouchableOpacity>

          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: isNavigating ? '#00E676' : '#FFB300' }]} />
            <Text style={styles.statusPillText}>
              {isNavigating ? t('map.liveLocationActive', 'Live location on') : 'Navigation Ready'}
            </Text>
          </View>
        </View>

        {/* Next Maneuver Card */}
        {currentStep && (
          <View style={styles.maneuverCard}>
            <View style={styles.maneuverIconBox}>
              <Ionicons
                name={
                  currentStep.modifier?.includes('left')
                    ? 'arrow-back'
                    : currentStep.modifier?.includes('right')
                    ? 'arrow-forward'
                    : 'arrow-up'
                }
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.maneuverInfo}>
              <Text style={styles.maneuverDist}>
                {formatDistance(currentStep.distanceM || 100)}
              </Text>
              <Text style={styles.maneuverInstruction} numberOfLines={2}>
                {currentStep.instruction}
              </Text>
            </View>
          </View>
        )}

        {/* Off-Route Alert Banner */}
        {isOffRoute && (
          <View style={styles.offRouteBanner}>
            <Ionicons name="warning" size={16} color="#C62828" />
            <Text style={styles.offRouteText}>Off route detected. Rerouting...</Text>
          </View>
        )}
      </View>

      {/* Bottom Control & Job Summary Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + Spacing[2], 20) }]}>
        {/* Metric Bar: Remaining Distance & ETA */}
        <View style={styles.metricRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricVal}>{formatDistance(totalDistanceM)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Est. Arrival</Text>
            <Text style={styles.metricVal}>{formatDuration(totalDurationS)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Payout</Text>
            <Text style={styles.metricVal}>
              ₹{((job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15) * job.estimatedKg).toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Job Details Card */}
        <View style={styles.jobBriefCard}>
          <View style={styles.jobBriefIcon}>
            <Ionicons name="cube" size={20} color="#1B5E20" />
          </View>
          <View style={styles.jobBriefText}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.estimatedKg} kg {job.material.toUpperCase()} • {job.householdName || 'Citizen'}
            </Text>
            <Text style={styles.jobSub} numberOfLines={1}>
              {job.householdAddress || job.location.ward}
            </Text>
          </View>
        </View>

        {/* Glove-Friendly Action Buttons (>= 56px height) */}
        <View style={styles.actionRow}>
          {!isNavigating ? (
            <TouchableOpacity
              style={[styles.primaryNavBtn, { height: 56 }]}
              onPress={startNavigation}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start route and live tracking"
            >
              <Ionicons name="navigate" size={22} color="#FFFFFF" />
              <Text style={styles.primaryNavBtnText}>Start / I'm On My Way</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.arrivedNavBtn, { height: 56 }]}
              onPress={() => setHasArrived(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Confirm doorstep arrival"
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.primaryNavBtnText}>I've Arrived at Doorstep</Text>
            </TouchableOpacity>
          )}

          {/* External Google / Apple Maps voice navigation launcher */}
          <TouchableOpacity
            style={styles.externalAppBtn}
            onPress={openExternalMaps}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('map.openGoogleMaps', 'Open in Google Maps')}
          >
            <Ionicons name="map-outline" size={22} color="#1B5E20" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arrival Confirmation Modal */}
      <Modal
        visible={hasArrived}
        transparent
        animationType="fade"
        onRequestClose={() => setHasArrived(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="home" size={32} color="#1B5E20" />
            </View>

            <Text style={styles.modalTitle}>You've Arrived!</Text>
            <Text style={styles.modalMessage}>
              You are at {job.householdName || 'Household'}'s doorstep for {job.estimatedKg} kg of {job.material.toUpperCase()}.
              Proceed to weigh the materials on your portable scale and verify the single-use QR handoff seal.
            </Text>

            <TouchableOpacity
              style={[styles.modalActionBtn, { height: 56 }]}
              activeOpacity={0.85}
              onPress={() => {
                setHasArrived(false);
                if (broadcastStopRef.current) broadcastStopRef.current();
                router.push('/(picker)/jobs');
              }}
            >
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
              <Text style={styles.modalActionText}>Proceed to Weigh-In & QR Handoff</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[4],
    zIndex: 100,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2.5],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  maneuverCard: {
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.lg,
  },
  maneuverIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maneuverInfo: {
    flex: 1,
  },
  maneuverDist: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  maneuverInstruction: {
    fontSize: FontSize.sm,
    color: '#C8E6C9',
    marginTop: 2,
  },
  offRouteBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: '#EF9A9A',
    ...Shadow.sm,
  },
  offRouteText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    ...Shadow.lg,
    elevation: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing[3],
    paddingBottom: Spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  metricBlock: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
  },
  jobBriefCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    padding: Spacing[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2.5],
    marginBottom: Spacing[3],
  },
  jobBriefIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobBriefText: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  jobSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2.5],
  },
  primaryNavBtn: {
    flex: 1,
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.md,
  },
  arrivedNavBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.md,
  },
  primaryNavBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  externalAppBtn: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
    backgroundColor: '#FFFFFF',
  },
  fallbackTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
  },
  fallbackBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.lg,
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    alignItems: 'center',
    ...Shadow.lg,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    marginBottom: Spacing[2],
  },
  modalMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing[5],
  },
  modalActionBtn: {
    width: '100%',
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
