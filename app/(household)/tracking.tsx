// CIRCULO Household: Live Doorstep Collection Tracking Screen
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
  TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card } from '../../src/components/ui';
import { CirculoMap, CirculoMapRef } from '../../src/components/map/CirculoMap';
import { HouseholdPin } from '../../src/components/map/markers/HouseholdPin';
import { CollectorVehicleMarker } from '../../src/components/map/markers/CollectorVehicleMarker';
import { PickerMarker } from '../../src/components/map/markers/PickerMarker';
import { LatLng, distance, formatDistance, formatDuration } from '../../src/lib/maps/geo';
import { getRoute, RouteResult } from '../../src/lib/maps/routing';
import { locationApi } from '../../src/lib/api/locationApi';
import { useLocationStore } from '../../src/lib/location/locationStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';

// Household doorstep location (Priya Sharma in Koramangala 4th Block)
const HOUSEHOLD_DOORSTEP: LatLng = {
  latitude: 12.9345,
  longitude: 77.6245,
};

// Initial worker positions in Koramangala area
const INITIAL_COLLECTOR_POS: LatLng = {
  latitude: 12.9460,
  longitude: 77.6320,
};

const INITIAL_PICKER_POS: LatLng = {
  latitude: 12.9390,
  longitude: 77.6280,
};

export default function HouseholdTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const mapRef = useRef<CirculoMapRef>(null);

  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const initialMode = params.type === 'picker' ? 'picker' : 'collector';

  const [trackingType, setTrackingType] = useState<'collector' | 'picker'>(initialMode);
  const [workerPos, setWorkerPos] = useState<LatLng>(
    initialMode === 'picker' ? INITIAL_PICKER_POS : INITIAL_COLLECTOR_POS
  );
  const [workerHeading, setWorkerHeading] = useState<number>(140);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  const [routeEtaSeconds, setRouteEtaSeconds] = useState<number>(360); // 6 mins
  const [routeDistanceMeters, setRouteDistanceMeters] = useState<number>(1200); // 1.2 km
  const [simulationIndex, setSimulationIndex] = useState<number>(0);

  const user = useAuthStore((s) => s.user);

  // Real-time synchronization of municipal collection route stops
  const [routeStops, setRouteStops] = useState<any[]>([]);
  useEffect(() => {
    const unsub = locationApi.subscribeToRouteStops('route-today-151', (stops) => {
      setRouteStops(stops);
    });
    return unsub;
  }, []);

  // Real-time subscription to worker live location (Supabase Realtime + dual-mode heartbeat)
  useEffect(() => {
    let active = true;
    const targetUserId =
      trackingType === 'collector' ? 'demo-collector-1' : 'demo-picker-1';

    const unsubscribe = locationApi.subscribeToWorkerLocation(targetUserId, (loc) => {
      if (!active) return;
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        setWorkerPos({ latitude: loc.lat, longitude: loc.lng });
        if (typeof loc.heading === 'number') {
          setWorkerHeading(loc.heading);
        }
        setIsLiveActive(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [trackingType]);

  // Compute road polyline from worker to doorstep
  useEffect(() => {
    let active = true;

    async function calculateRoute() {
      const mode = trackingType === 'collector' ? 'collector' : 'picker';
      try {
        const res: RouteResult = await getRoute(workerPos, HOUSEHOLD_DOORSTEP, mode);
        if (active && res && res.geometry) {
          setRoutePolyline(res.geometry);
          setRouteDistanceMeters(res.distanceM);
          setRouteEtaSeconds(res.durationS);
        }
      } catch (err) {
        if (active) {
          const directDist = distance(workerPos, HOUSEHOLD_DOORSTEP);
          setRoutePolyline([workerPos, HOUSEHOLD_DOORSTEP]);
          setRouteDistanceMeters(directDist);
          setRouteEtaSeconds(Math.round((directDist / 6.94)));
        }
      }
    }

    calculateRoute();

    return () => {
      active = false;
    };
  }, [workerPos, trackingType]);

  // Demo movement simulator: smoothly animates worker along polyline
  useEffect(() => {
    if (routePolyline.length < 2) return;

    const timer = setInterval(() => {
      setSimulationIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % routePolyline.length;
        // Don't jump all the way to 0 immediately if arriving
        if (nextIdx > 0 && nextIdx < routePolyline.length) {
          const p = routePolyline[nextIdx];
          setWorkerPos(p);
          // calculate heading to next point
          if (nextIdx < routePolyline.length - 1) {
            const nextP = routePolyline[nextIdx + 1];
            const dLat = nextP.latitude - p.latitude;
            const dLng = nextP.longitude - p.longitude;
            const angleDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
            setWorkerHeading((angleDeg + 360) % 360);
          }
        }
        return nextIdx;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [routePolyline]);

  // Calculate live proximity (< 500m)
  const isWithin500m = useMemo(() => {
    return routeDistanceMeters <= 500;
  }, [routeDistanceMeters]);

  // Marker bounds for initial fit
  const markersToFit: LatLng[] = useMemo(() => {
    return [workerPos, HOUSEHOLD_DOORSTEP];
  }, [workerPos]);

  // Direct Phone Call
  const handleCallWorker = () => {
    const phone = trackingType === 'collector' ? '+919876543211' : '+919876543212';
    const name = trackingType === 'collector' ? 'Ramesh Kumar (Collector)' : 'Meena Devi (Picker)';

    if (Platform.OS === 'web') {
      Alert.alert(
        'Call Worker (Demo)',
        `Calling ${name} at ${phone}.\nIn native build, this opens the phone dialer.`
      );
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Direct Message
  const handleMessageWorker = () => {
    const name = trackingType === 'collector' ? 'Ramesh Kumar' : 'Meena Devi';
    Alert.alert(
      'Message Sent ✓',
      `Notification sent to ${name}: "Priya Sharma is ready for doorstep collection."`
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[3] }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {t('household.liveTrackingTitle', 'Live Doorstep Tracking')}
            </Text>
            <Text style={styles.headerSub}>
              {user?.name || 'Priya Sharma'} · 42, 5th Cross, Koramangala
            </Text>
          </View>

          {/* Recenter Map button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => mapRef.current?.fitAll(markersToFit)}
            activeOpacity={0.8}
          >
            <Ionicons name="scan" size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Tracking Target Selector: Municipal Truck vs. Recyclable Picker */}
        <View style={styles.targetSelectorRow}>
          <TouchableOpacity
            style={[
              styles.targetBtn,
              trackingType === 'collector' && styles.targetBtnActive,
            ]}
            onPress={() => {
              setTrackingType('collector');
              setWorkerPos(INITIAL_COLLECTOR_POS);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.targetIcon}>🚛</Text>
            <Text
              style={[
                styles.targetBtnText,
                trackingType === 'collector' && styles.targetBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {t('household.trackCollector', 'Municipal Truck')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.targetBtn,
              trackingType === 'picker' && styles.targetBtnActive,
            ]}
            onPress={() => {
              setTrackingType('picker');
              setWorkerPos(INITIAL_PICKER_POS);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.targetIcon}>🚲</Text>
            <Text
              style={[
                styles.targetBtnText,
                trackingType === 'picker' && styles.targetBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {t('household.trackPicker', 'Doorstep Picker')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Map Content */}
      <View style={styles.mapWrapper}>
        <CirculoMap
          ref={mapRef}
          userLocation={HOUSEHOLD_DOORSTEP}
          routeGeometry={routePolyline}
          routeColor={trackingType === 'collector' ? '#00695C' : '#2E7D32'}
          routeWidth={5}
          markersToFit={markersToFit}
          gloveFriendly={false}
        >
          {/* Household Doorstep Pin (Exact Doorstep) */}
          <HouseholdPin
            id="household-doorstep"
            coordinate={HOUSEHOLD_DOORSTEP}
            name="Your Home"
            address="42, 5th Cross, Koramangala 4th Block"
            isExact={true}
          />

          {/* Worker Marker */}
          {trackingType === 'collector' ? (
            <CollectorVehicleMarker
              id="collector-truck"
              coordinate={workerPos}
              heading={workerHeading}
              name="Ramesh Kumar"
              vehicleNumber="KA-01-EA-4412"
            />
          ) : (
            <PickerMarker
              id="recyclable-picker"
              coordinate={workerPos}
              name="Meena Devi (Picker)"
              isLive={isLiveActive}
            />
          )}
        </CirculoMap>

        {/* Floating ETA & Distance Pill (Top Overlay) */}
        <View style={styles.floatingEtaContainer}>
          <View style={styles.etaCard}>
            <View style={styles.etaHeaderRow}>
              <View
                style={[
                  styles.statusBadge,
                  isLiveActive ? styles.statusBadgeLive : styles.statusBadgeOffline,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isLiveActive ? styles.statusDotLive : styles.statusDotOffline,
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    isLiveActive ? styles.statusTextLive : styles.statusTextOffline,
                  ]}
                >
                  {isLiveActive
                    ? t('household.liveGpsPill', 'Live GPS Active')
                    : t('household.offlineEstimatePill', 'Scheduled Estimate')}
                </Text>
              </View>

              <Text style={styles.etaDistanceText}>
                {t('household.distanceAway', {
                  distance: formatDistance(routeDistanceMeters),
                  defaultValue: `${formatDistance(routeDistanceMeters)} away`,
                })}
              </Text>
            </View>

            <Text style={styles.etaBigText}>
              {t('household.arrivingIn', {
                time: formatDuration(routeEtaSeconds),
                defaultValue: `Arriving in ${formatDuration(routeEtaSeconds)}`,
              })}
            </Text>
          </View>
        </View>

        {/* Proximity Alert Banner (< 500m) */}
        {isWithin500m && (
          <View style={styles.proximityAlertBanner}>
            <View style={styles.proximityAlertHeader}>
              <Ionicons name="notifications" size={20} color="#C62828" />
              <Text style={styles.proximityAlertTitle}>
                {t('household.proximityAlertTitle', 'Collector Approaching! (< 500m)')}
              </Text>
            </View>
            <Text style={styles.proximityAlertBody}>
              {t(
                'household.proximityAlertBody',
                'Your collection vehicle is within 500m. Please place your segregated bins at your doorstep.'
              )}
            </Text>
          </View>
        )}

        {/* Bottom Floating Control Card */}
        <Card style={[styles.bottomControlCard, { bottom: TAB_BAR_HEIGHT + insets.bottom + 8 }]}>
          {/* Worker Profile Strip */}
          <View style={styles.workerStrip}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarEmoji}>
                {trackingType === 'collector' ? '👨🏽‍💼' : '👩🏽'}
              </Text>
            </View>

            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>
                {trackingType === 'collector' ? 'Ramesh Kumar' : 'Meena Devi'}
              </Text>
              <Text style={styles.workerRole}>
                {trackingType === 'collector'
                  ? 'Municipal Sanitation Collector · BBMP Ward 151'
                  : 'Verified Scrap Picker · 4.9 ★ (120+ pickups)'}
              </Text>
              <Text style={styles.vehicleRegText}>
                {trackingType === 'collector'
                  ? t('household.vehicleReg', { reg: 'KA-01-EA-4412', defaultValue: 'Vehicle: KA-01-EA-4412' })
                  : 'Hand-cart · Calibrated Digital Scale'}
              </Text>
            </View>
          </View>

          {/* Collection Details Pill */}
          <View style={styles.detailsPill}>
            <Ionicons name="layers-outline" size={16} color={Colors.primary} />
            <Text style={styles.detailsPillText}>
              {trackingType === 'collector'
                ? routeStops.length > 0
                  ? `Scheduled Collection · Stop #1 of ${routeStops.length} (Next: Your Doorstep)`
                  : 'Scheduled Wet & Dry Segregated Doorstep Collection'
                : 'Locked Request: 5.0 kg Cardboard · Payout ₹70 via UPI'}
            </Text>
          </View>

          {/* Action Buttons: Call & Message */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallWorker}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={18} color={Colors.surface} />
              <Text style={styles.callButtonText}>
                {t('household.callWorker', 'Call Worker')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessageWorker}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.messageButtonText}>
                {t('household.messageWorker', 'Message')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Footnote */}
          <Text style={styles.privacyFootnote}>
            🔒 {t('household.privacyNotice', 'Live GPS is shared only during active shifts to respect municipal worker privacy.')}
          </Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    ...Shadow.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Target Selector Segment
  targetSelectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.base,
    padding: 3,
    gap: 4,
    marginTop: 4,
  },
  targetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  targetBtnActive: {
    backgroundColor: Colors.surface,
  },
  targetIcon: { fontSize: 14 },
  targetBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  targetBtnTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },

  // Map
  mapWrapper: { flex: 1, position: 'relative' },

  // Floating ETA Card
  floatingEtaContainer: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
    right: Spacing[3],
    zIndex: 10,
  },
  etaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  etaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  statusBadgeLive: { backgroundColor: '#E8F5E9' },
  statusBadgeOffline: { backgroundColor: Colors.gray100 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusDotLive: { backgroundColor: '#2E7D32' },
  statusDotOffline: { backgroundColor: Colors.gray500 },
  statusBadgeText: { fontSize: 10, fontWeight: FontWeight.bold },
  statusTextLive: { color: '#1B5E20' },
  statusTextOffline: { color: Colors.textSecondary },
  etaDistanceText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  etaBigText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },

  // Proximity Alert Banner
  proximityAlertBanner: {
    position: 'absolute',
    top: 96,
    left: Spacing[3],
    right: Spacing[3],
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    borderWidth: 1.5,
    borderColor: '#EF5350',
    ...Shadow.md,
    zIndex: 12,
  },
  proximityAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 2,
  },
  proximityAlertTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },
  proximityAlertBody: {
    fontSize: FontSize.xs,
    color: '#424242',
    lineHeight: 16,
  },

  // Bottom Control Card
  bottomControlCard: {
    position: 'absolute',
    left: Spacing[3],
    right: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing[3],
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarEmoji: { fontSize: 24 },
  workerInfo: { flex: 1 },
  workerName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  workerRole: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  vehicleRegText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginTop: 2,
  },
  detailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    gap: Spacing[2],
  },
  detailsPillText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  callButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.sm,
  },
  callButtonText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  messageButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  privacyFootnote: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
