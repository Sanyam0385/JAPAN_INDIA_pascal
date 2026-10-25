// CIRCULO Collector Route: Real-Time Map Navigation, Stop Sequencing, & Waste Verification
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
import { StopPin } from '../../src/components/map/markers/StopPin';
import { CollectorVehicleMarker } from '../../src/components/map/markers/CollectorVehicleMarker';
import { ComplaintPin } from '../../src/components/map/markers/ComplaintPin';
import { RecyclerPin } from '../../src/components/map/markers/RecyclerPin';
import {
  LatLng,
  distance,
  formatDistance,
  formatDuration,
  optimizeStops,
  isWithin,
} from '../../src/lib/maps/geo';
import { getRoute, getMultiStopRoute, RouteResult } from '../../src/lib/maps/routing';
import { useLiveLocation } from '../../src/lib/location/useLiveLocation';
import { useLocationStore } from '../../src/lib/location/locationStore';
import {
  collectorRouteApi,
  WARD_TRANSFER_STATION,
} from '../../src/lib/api/collectorRouteApi';
import { locationApi } from '../../src/lib/api/locationApi';
import { issuesApi } from '../../src/lib/api/issuesApi';
import type { RouteStopData, RouteStopStatus, WasteCategory, Issue } from '../../src/types';

const WASTE_COLORS: Record<string, string> = {
  wet: Colors.success,
  dry: Colors.collectorAccent,
  recyclable: Colors.warning,
  hazardous: Colors.error,
};

const DEFAULT_COLLECTOR_POS: LatLng = {
  latitude: 12.9352,
  longitude: 77.6245,
};

export default function CollectorRouteScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapRef = useRef<CirculoMapRef>(null);

  // Live Location
  const {
    coords: liveCoords,
    shareLiveLocation,
    setShareLiveLocation,
    startTracking,
    stopTracking,
  } = useLiveLocation(false);

  const [isOnShift, setIsOnShift] = useState(false);

  // Current collector position (falls back to demo pos if no GPS fix)
  const collectorPos: LatLng = useMemo(() => {
    if (liveCoords && typeof liveCoords.latitude === 'number' && typeof liveCoords.longitude === 'number') {
      return { latitude: liveCoords.latitude, longitude: liveCoords.longitude };
    }
    return DEFAULT_COLLECTOR_POS;
  }, [liveCoords]);

  const collectorHeading = liveCoords?.heading || 90;

  // View Mode
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Route & Stops State
  const [stops, setStops] = useState<RouteStopData[]>([]);
  const [truckCapacityKg, setTruckCapacityKg] = useState(5000);
  const [currentLoadKg, setCurrentLoadKg] = useState(3600);
  const [routeId, setRouteId] = useState('route-today-151');
  const [loadingRoute, setLoadingRoute] = useState(true);

  // Navigation & Polyline State
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  const [isNavigatingToStation, setIsNavigatingToStation] = useState(false);
  const [reportedIssues, setReportedIssues] = useState<Issue[]>([]);

  // Optimization Modal State
  const [optModalVisible, setOptModalVisible] = useState(false);
  const [optResult, setOptResult] = useState<{
    originalDistM: number;
    optimizedDistM: number;
    originalDurationS: number;
    optimizedDurationS: number;
    optimizedStops: RouteStopData[];
  } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [previousStopsOrder, setPreviousStopsOrder] = useState<RouteStopData[] | null>(null);

  // Verification & Collection Modal State
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [targetStopForCollection, setTargetStopForCollection] = useState<RouteStopData | null>(null);
  const [collectionWeight, setCollectionWeight] = useState('5.0');
  const [collectionWasteType, setCollectionWasteType] = useState<WasteCategory>('wet');
  const [segregationRating, setSegregationRating] = useState<number>(5);
  const [hasContamination, setHasContamination] = useState(false);
  const [collectionNotes, setCollectionNotes] = useState('');

  // Issue Reporting Modal State
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueCoordinate, setIssueCoordinate] = useState<LatLng | null>(null);
  const [issueAddress, setIssueAddress] = useState('');
  const [issueType, setIssueType] = useState<'missed_pickup' | 'contamination' | 'overflow' | 'other'>('contamination');
  const [issueNote, setIssueNote] = useState('');
  const [issuePhotoUri, setIssuePhotoUri] = useState<string | null>(null);

  // Proximity Alert Banner
  const [proximityAlertDismissed, setProximityAlertDismissed] = useState<string | null>(null);

  // Load Route Data on mount
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const routeData = await collectorRouteApi.getTodayRoute('demo-collector-1');
        if (mounted) {
          setStops(routeData.stops);
          setTruckCapacityKg(routeData.truckCapacityKg);
          setCurrentLoadKg(routeData.currentLoadKg);
          setRouteId(routeData.id);
        }

        const issuesList = await issuesApi.listIssues();
        if (mounted) {
          setReportedIssues(issuesList);
        }
      } catch (err) {
        if (__DEV__) console.warn('[CollectorRoute] Error loading initial data:', err);
      } finally {
        if (mounted) setLoadingRoute(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Real-time synchronization of route stops across devices
  useEffect(() => {
    const unsub = collectorRouteApi.subscribeToRouteStops(routeId, (latestStops) => {
      setStops(latestStops);
    });
    return unsub;
  }, [routeId]);

  // Push live location updates when on shift
  useEffect(() => {
    if (!isOnShift) return;

    locationApi.upsertLiveLocation({
      userId: 'demo-collector-1',
      role: 'formal_collector',
      name: 'Ramesh Kumar',
      vehicleNumber: 'KA-01-EA-4412',
      ward: 'Ward 151 (Koramangala)',
      lat: collectorPos.latitude,
      lng: collectorPos.longitude,
      heading: collectorHeading,
      speed: 18,
    });
  }, [isOnShift, collectorPos, collectorHeading]);

  // Compute Current Target Stop (First 'current' or first non-completed stop)
  const currentStop = useMemo(() => {
    const explicitCurrent = stops.find((s) => s.status === 'current');
    if (explicitCurrent) return explicitCurrent;
    return stops.find((s) => s.status === 'pending') || null;
  }, [stops]);

  // Compute stats
  const completedCount = useMemo(() => stops.filter((s) => s.status === 'completed').length, [stops]);
  const progressPercent = stops.length > 0 ? Math.round((completedCount / stops.length) * 100) : 0;
  const truckPercentFull = Math.min(100, Math.round((currentLoadKg / truckCapacityKg) * 100));
  const isTruckNearlyFull = truckPercentFull >= 90;

  // Proximity detection to current stop (< 40m)
  const isAtCurrentStop = useMemo(() => {
    if (!currentStop) return false;
    const stopLoc: LatLng = { latitude: currentStop.latitude, longitude: currentStop.longitude };
    return isWithin(collectorPos, stopLoc, 40);
  }, [collectorPos, currentStop]);

  // Distance and ETA to current stop
  const currentStopDistanceM = useMemo(() => {
    if (!currentStop) return 0;
    return distance(collectorPos, {
      latitude: currentStop.latitude,
      longitude: currentStop.longitude,
    });
  }, [collectorPos, currentStop]);

  // Update Route Polyline whenever collector position, stops, or station navigation changes
  useEffect(() => {
    let active = true;

    async function calculatePolylines() {
      if (isNavigatingToStation) {
        // Direct route to Transfer Station
        const stationCoord: LatLng = {
          latitude: WARD_TRANSFER_STATION.latitude,
          longitude: WARD_TRANSFER_STATION.longitude,
        };
        const res = await getRoute(collectorPos, stationCoord, 'collector');
        if (active && res) {
          setRoutePolyline(res.geometry);
        }
        return;
      }

      // Route through remaining pending stops
      const pendingStops = stops.filter((s) => s.status === 'current' || s.status === 'pending');
      if (pendingStops.length === 0) {
        if (active) setRoutePolyline([]);
        return;
      }

      const pointsToVisit: LatLng[] = [
        collectorPos,
        ...pendingStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
      ];

      try {
        const res: RouteResult = await getMultiStopRoute(pointsToVisit, 'collector');
        if (active && res.geometry) {
          setRoutePolyline(res.geometry);
        }
      } catch (err) {
        if (__DEV__) console.warn('[CollectorRoute] Route calculation failed:', err);
        if (active) {
          setRoutePolyline(pointsToVisit);
        }
      }
    }

    calculatePolylines();

    return () => {
      active = false;
    };
  }, [collectorPos, stops, isNavigatingToStation]);

  // Handle Shift Toggle
  const toggleShift = useCallback(
    async (value: boolean) => {
      setIsOnShift(value);
      setShareLiveLocation(value);

      if (value) {
        startTracking();
        await locationApi.upsertLocation({
          userId: 'demo-collector-1',
          role: 'formal_collector',
          lat: collectorPos.latitude,
          lng: collectorPos.longitude,
          heading: collectorHeading,
          speed: 18,
        });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        stopTracking();
        await locationApi.clearLocation('demo-collector-1');
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [collectorPos, collectorHeading, setShareLiveLocation, startTracking, stopTracking]
  );

  // Run Route Optimization
  const handleOptimizeRoute = useCallback(async () => {
    setIsOptimizing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Isolate completed stops and pending stops
    const completedStops = stops.filter((s) => s.status === 'completed');
    const pendingStops = stops.filter((s) => s.status !== 'completed');

    if (pendingStops.length <= 1) {
      Alert.alert(
        t('collector.optimizationTitle', 'Route Optimization'),
        'Only 1 pending stop remaining. Route is already optimal.'
      );
      setIsOptimizing(false);
      return;
    }

    // Calculate current order distance
    let origDistM = 0;
    const origPoints: LatLng[] = [
      collectorPos,
      ...pendingStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
    ];
    for (let i = 0; i < origPoints.length - 1; i++) {
      origDistM += distance(origPoints[i], origPoints[i + 1]);
    }
    const origDurationS = Math.round((origDistM / (25 * 1000)) * 3600); // at 25 km/h

    // Run Nearest-Neighbour
    const stopsWithCoords = pendingStops.map((s) => ({
      ...s,
      coordinate: { latitude: s.latitude, longitude: s.longitude },
    }));
    const optimized = optimizeStops(collectorPos, stopsWithCoords);

    // Calculate optimized distance
    let optDistM = 0;
    const optPoints: LatLng[] = [
      collectorPos,
      ...optimized.map((s) => s.coordinate),
    ];
    for (let i = 0; i < optPoints.length - 1; i++) {
      optDistM += distance(optPoints[i], optPoints[i + 1]);
    }
    const optDurationS = Math.round((optDistM / (25 * 1000)) * 3600);

    // Clean structure without extra coordinate prop
    const resequencedPending: RouteStopData[] = optimized.map((s, index) => ({
      id: s.id,
      routeId: s.routeId,
      sequence: completedStops.length + index + 1,
      householdId: s.householdId,
      houseNumber: s.houseNumber,
      address: s.address,
      locality: s.locality,
      ward: s.ward,
      latitude: s.latitude,
      longitude: s.longitude,
      wasteType: s.wasteType,
      timeSlot: s.timeSlot,
      status: index === 0 ? 'current' : 'pending',
      collectedKg: s.collectedKg,
      segregationRating: s.segregationRating,
      completedAt: s.completedAt,
      notes: s.notes,
    }));

    const finalOptimizedStops = [...completedStops, ...resequencedPending];

    setOptResult({
      originalDistM: Math.round(origDistM),
      optimizedDistM: Math.round(optDistM),
      originalDurationS: origDurationS,
      optimizedDurationS: optDurationS,
      optimizedStops: finalOptimizedStops,
    });

    setIsOptimizing(false);
    setOptModalVisible(true);
  }, [stops, collectorPos, t]);

  // Apply Optimization
  const applyOptimizedStops = useCallback(async () => {
    if (!optResult) return;

    setPreviousStopsOrder([...stops]);
    setStops(optResult.optimizedStops);
    setOptModalVisible(false);

    // Save to API
    const stopIdsInOrder = optResult.optimizedStops.map((s) => s.id);
    await collectorRouteApi.reorderStops(routeId, stopIdsInOrder);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [optResult, stops, routeId]);

  // Open Verification & Collection Modal
  const handleOpenVerification = useCallback((stop: RouteStopData) => {
    setTargetStopForCollection(stop);
    setCollectionWasteType(stop.wasteType);
    setCollectionWeight('5.0');
    setSegregationRating(5);
    setHasContamination(false);
    setCollectionNotes('');
    setVerifyModalVisible(true);
  }, []);

  // Confirm Collection
  const handleConfirmCollection = useCallback(async () => {
    if (!targetStopForCollection) return;

    const parsedWeight = parseFloat(collectionWeight) || 4.5;

    // Update stop via API
    await collectorRouteApi.updateStopStatus(targetStopForCollection.id, 'completed', {
      weightKg: parsedWeight,
      wasteType: collectionWasteType,
      segregationRating,
      notes: hasContamination
        ? `[Contamination Flagged] ${collectionNotes}`
        : collectionNotes,
    });

    // Update state locally
    setStops((prevStops) => {
      let foundNextCurrent = false;
      return prevStops.map((s) => {
        if (s.id === targetStopForCollection.id) {
          return {
            ...s,
            status: 'completed',
            collectedKg: parsedWeight,
            segregationRating,
            completedAt: new Date().toISOString(),
          };
        }
        // Auto-advance to the next pending stop
        if (!foundNextCurrent && s.status === 'pending') {
          foundNextCurrent = true;
          return { ...s, status: 'current' };
        }
        return s;
      });
    });

    // Increment truck load
    setCurrentLoadKg((prev) => Math.min(truckCapacityKg, prev + parsedWeight));

    setVerifyModalVisible(false);
    setTargetStopForCollection(null);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [
    targetStopForCollection,
    collectionWeight,
    collectionWasteType,
    segregationRating,
    hasContamination,
    collectionNotes,
    truckCapacityKg,
  ]);

  // Skip Stop
  const handleSkipStop = useCallback(
    async (stop: RouteStopData) => {
      Alert.alert(
        t('collector.skipStop', 'Skip Stop'),
        `Mark stop #${stop.sequence} (${stop.houseNumber}) as skipped?`,
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('collector.skipStop', 'Skip'),
            style: 'destructive',
            onPress: async () => {
              await collectorRouteApi.updateStopStatus(stop.id, 'skipped');
              setStops((prev) => {
                let foundNext = false;
                return prev.map((s) => {
                  if (s.id === stop.id) return { ...s, status: 'skipped' };
                  if (!foundNext && s.status === 'pending') {
                    foundNext = true;
                    return { ...s, status: 'current' };
                  }
                  return s;
                });
              });
            },
          },
        ]
      );
    },
    [t]
  );

  // Report Field Issue
  const handleOpenIssueModal = useCallback(
    (coord?: LatLng) => {
      const targetCoord = coord || (currentStop ? { latitude: currentStop.latitude, longitude: currentStop.longitude } : collectorPos);
      setIssueCoordinate(targetCoord);
      setIssueAddress(currentStop ? `${currentStop.houseNumber} ${currentStop.address}` : 'Koramangala Ward 151');
      setIssueType('contamination');
      setIssueNote('');
      setIssuePhotoUri(null);
      setIssueModalVisible(true);
    },
    [currentStop, collectorPos]
  );

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIssuePhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      if (__DEV__) console.warn('Photo picker error:', e);
    }
  };

  const handleSubmitIssue = async () => {
    if (!issueNote.trim()) {
      Alert.alert('Note required', 'Please describe the field issue.');
      return;
    }

    try {
      const newIssue = await issuesApi.createIssue({
        raisedByRole: 'formal_collector',
        raisedByUserId: 'demo-collector-1',
        locality: currentStop?.locality || 'Koramangala',
        ward: 'Ward 151',
        type: issueType,
        note: `${issueAddress}: ${issueNote}${issuePhotoUri ? ' [Photo Attached]' : ''}`,
      });

      setReportedIssues((prev) => [newIssue, ...prev]);
      setIssueModalVisible(false);

      Alert.alert(
        'Issue Reported ✓',
        t('collector.issueReportedSuccess', {
          address: issueAddress,
          defaultValue: `Field issue logged at ${issueAddress}`,
        })
      );
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not log issue');
    }
  };

  // Launch External Maps (Google Maps / Apple Maps)
  const openExternalMaps = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  // Prepare map pins
  const allCoordinatesToFit = useMemo(() => {
    const list: LatLng[] = [collectorPos];
    stops.forEach((s) => {
      list.push({ latitude: s.latitude, longitude: s.longitude });
    });
    return list;
  }, [collectorPos, stops]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[3] }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>{t('collector.todayRoute', "Today's Route")}</Text>
            <Text style={styles.headerSub}>Ward 151 · Koramangala · KA-01-EA-4412</Text>
          </View>

          {/* Shift GPS Toggle */}
          <View style={styles.shiftPill}>
            <Text style={styles.shiftLabel}>
              {isOnShift
                ? t('collector.onShiftLiveGps', 'On Shift')
                : t('collector.offShiftLiveGps', 'Off Shift')}
            </Text>
            <Switch
              value={isOnShift}
              onValueChange={toggleShift}
              trackColor={{ false: Colors.gray400, true: Colors.success }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>

        {/* View Mode Toggle & Optimize Route Button */}
        <View style={styles.actionRow}>
          {/* Map / List View Segment */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'map' && styles.segmentBtnActive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="map"
                size={16}
                color={viewMode === 'map' ? Colors.surface : Colors.textSecondary}
              />
              <Text
                style={[styles.segmentBtnText, viewMode === 'map' && styles.segmentBtnTextActive]}
              >
                {t('collector.mapView', 'Map')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? Colors.surface : Colors.textSecondary}
              />
              <Text
                style={[styles.segmentBtnText, viewMode === 'list' && styles.segmentBtnTextActive]}
              >
                {t('collector.listView', 'List')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optimize Route Button */}
          <TouchableOpacity
            style={styles.optimizeBtn}
            onPress={handleOptimizeRoute}
            disabled={isOptimizing}
            activeOpacity={0.8}
          >
            {isOptimizing ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <Ionicons name="flash" size={16} color={Colors.surface} />
            )}
            <Text style={styles.optimizeBtnText}>
              {t('collector.optimizeRoute', 'Optimize')}
            </Text>
          </TouchableOpacity>

          {/* Report Issue Button */}
          <TouchableOpacity
            style={styles.reportIssueHeaderBtn}
            onPress={() => handleOpenIssueModal()}
            activeOpacity={0.8}
          >
            <Ionicons name="warning-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Compactor Truck Capacity Bar */}
        <View style={styles.truckCapacityContainer}>
          <View style={styles.truckCapacityHeader}>
            <Text style={styles.truckCapacityLabel}>
              🚛 {t('collector.truckCapacity', 'Truck Capacity')}:
            </Text>
            <Text
              style={[
                styles.truckCapacityValue,
                isTruckNearlyFull ? { color: Colors.error } : { color: Colors.textInverse },
              ]}
            >
              {t('collector.truckCapacityFull', {
                percent: truckPercentFull,
                current: (currentLoadKg / 1000).toFixed(1),
                max: (truckCapacityKg / 1000).toFixed(1),
                defaultValue: `${truckPercentFull}% Full (${(currentLoadKg / 1000).toFixed(1)} / ${(truckCapacityKg / 1000).toFixed(1)} t)`,
              })}
            </Text>
          </View>
          <View style={styles.capacityTrack}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${truckPercentFull}%`,
                  backgroundColor:
                    truckPercentFull >= 90
                      ? Colors.error
                      : truckPercentFull >= 70
                      ? Colors.warning
                      : Colors.success,
                },
              ]}
            />
          </View>
        </View>

        {/* Urgent Transfer Station Banner if >= 90% */}
        {isTruckNearlyFull && (
          <View style={styles.stationAlertBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.surface} />
            <Text style={styles.stationAlertText} numberOfLines={2}>
              {t('collector.truckNearlyFull', {
                percent: truckPercentFull,
                defaultValue: `Truck nearly full (${truckPercentFull}%) — Route to Ward Transfer Station`,
              })}
            </Text>
            <TouchableOpacity
              style={styles.stationAlertBtn}
              onPress={() => setIsNavigatingToStation(!isNavigatingToStation)}
            >
              <Text style={styles.stationAlertBtnText}>
                {isNavigatingToStation ? 'Resume Route' : 'Route to Station 🏭'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content: Map View or List View */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <CirculoMap
            ref={mapRef}
            userLocation={collectorPos}
            routeGeometry={routePolyline}
            routeColor={isNavigatingToStation ? '#D32F2F' : Colors.collectorAccent}
            routeWidth={5}
            markersToFit={allCoordinatesToFit}
            gloveFriendly={true}
            onLongPress={(coord) => handleOpenIssueModal(coord)}
          >
            {/* Collector Vehicle Marker */}
            <CollectorVehicleMarker
              id="collector-vehicle"
              coordinate={collectorPos}
              heading={collectorHeading}
              name="KA-01-EA-4412"
              vehicleNumber="KA-01-EA-4412"
            />

            {/* Ward 151 Transfer Station Pin */}
            <RecyclerPin
              id="transfer-station"
              coordinate={{
                latitude: WARD_TRANSFER_STATION.latitude,
                longitude: WARD_TRANSFER_STATION.longitude,
              }}
              name={WARD_TRANSFER_STATION.name}
              hours="06:00 - 20:00"
              onPress={() => {
                Alert.alert(
                  WARD_TRANSFER_STATION.name,
                  `${WARD_TRANSFER_STATION.address}\nCapacity: ${WARD_TRANSFER_STATION.capacityTonnes}t\nHours: ${WARD_TRANSFER_STATION.operatingHours}`,
                  [
                    { text: 'Close', style: 'cancel' },
                    {
                      text: 'Navigate Here',
                      onPress: () =>
                        openExternalMaps(
                          WARD_TRANSFER_STATION.latitude,
                          WARD_TRANSFER_STATION.longitude,
                          WARD_TRANSFER_STATION.name
                        ),
                    },
                  ]
                );
              }}
            />

            {/* Route Stop Pins */}
            {stops.map((stop) => {
              const isCurrent = currentStop?.id === stop.id;
              const pinState =
                stop.status === 'completed'
                  ? 'done'
                  : isCurrent
                  ? 'current'
                  : stop.status === 'skipped'
                  ? 'skipped'
                  : 'pending';

              return (
                <StopPin
                  key={stop.id}
                  id={stop.id}
                  sequence={stop.sequence}
                  coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                  state={pinState}
                  label={`${stop.houseNumber}`}
                  onPress={() => {
                    handleOpenVerification(stop);
                  }}
                />
              );
            })}

            {/* Reported Field Issue Pins */}
            {reportedIssues.map((issue, idx) => (
              <ComplaintPin
                key={issue.id || `issue-${idx}`}
                id={issue.id || `issue-${idx}`}
                coordinate={collectorPos} // Near collector
                referenceNumber={`ISSUE-${idx + 1}`}
                onPress={() => {
                  Alert.alert('Field Issue', `${issue.type.toUpperCase()}: ${issue.note}`);
                }}
              />
            ))}
          </CirculoMap>

          {/* Floating Shift Beacon Badge */}
          {isOnShift && (
            <View style={styles.liveBeaconBadge}>
              <View style={styles.liveBeaconDot} />
              <Text style={styles.liveBeaconText}>
                {t('collector.liveLocationActive', 'Live GPS Active')}
              </Text>
            </View>
          )}

          {/* Proximity Auto-Arrival Alert Banner */}
          {isAtCurrentStop && currentStop && proximityAlertDismissed !== currentStop.id && (
            <View style={styles.proximityArrivalBanner}>
              <View style={styles.proximityLeft}>
                <Text style={styles.proximityBadge}>
                  {t('collector.atLocation', 'At Location (< 40m)')}
                </Text>
                <Text style={styles.proximityText} numberOfLines={1}>
                  {currentStop.houseNumber} · {currentStop.address}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.proximityActionBtn}
                onPress={() => handleOpenVerification(currentStop)}
              >
                <Text style={styles.proximityActionText}>Collect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setProximityAlertDismissed(currentStop.id)}
                style={styles.proximityCloseBtn}
              >
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom "Next Stop" Card */}
          {currentStop && (
            <Card style={[styles.bottomNextStopCard, { bottom: TAB_BAR_HEIGHT + insets.bottom + 8 }]}>
              <View style={styles.nextStopHeaderRow}>
                <View style={styles.nextStopBadge}>
                  <Text style={styles.nextStopBadgeText}>STOP #{currentStop.sequence}</Text>
                </View>

                <View
                  style={[
                    styles.wastePill,
                    { backgroundColor: WASTE_COLORS[currentStop.wasteType] + '20' },
                  ]}
                >
                  <Text
                    style={[styles.wastePillText, { color: WASTE_COLORS[currentStop.wasteType] }]}
                  >
                    {t(`materials.${currentStop.wasteType}_waste`, {
                      defaultValue: currentStop.wasteType.toUpperCase(),
                    })}
                  </Text>
                </View>

                <View style={styles.etaBadge}>
                  <Ionicons name="navigate-outline" size={14} color={Colors.collectorAccent} />
                  <Text style={styles.etaText}>
                    {formatDistance(currentStopDistanceM)} ·{' '}
                    {formatDuration(Math.round((currentStopDistanceM / (25 * 1000)) * 3600))}
                  </Text>
                </View>
              </View>

              <Text style={styles.nextStopAddress}>
                <Text style={styles.nextStopHouseNum}>{currentStop.houseNumber}</Text>{' '}
                {currentStop.address}
              </Text>

              <View style={styles.nextStopActionsRow}>
                {/* Primary Collect Button (>= 56px touch target) */}
                <TouchableOpacity
                  style={styles.collectPrimaryBtn}
                  onPress={() => handleOpenVerification(currentStop)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={22} color={Colors.surface} />
                  <Text style={styles.collectPrimaryBtnText}>
                    {t('collector.arrivedCollect', 'Arrived / Collect Waste')}
                  </Text>
                </TouchableOpacity>

                {/* Secondary Skip Button */}
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => handleSkipStop(currentStop)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} />
                  <Text style={styles.skipBtnText}>{t('collector.skipStop', 'Skip')}</Text>
                </TouchableOpacity>

                {/* External GPS App */}
                <TouchableOpacity
                  style={styles.externalNavBtn}
                  onPress={() =>
                    openExternalMaps(
                      currentStop.latitude,
                      currentStop.longitude,
                      currentStop.address
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={18} color={Colors.collectorAccent} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>
      ) : (
        /* List View */
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Card */}
          <Card style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressTitle}>
                {t('collector.routeProgress', "Today's Route Progress")}
              </Text>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.progressStatsRow}>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatVal, { color: Colors.success }]}>
                  {completedCount}
                </Text>
                <Text style={styles.progressStatLbl}>{t('collector.done', 'Done')}</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatVal, { color: Colors.collectorAccent }]}>
                  {currentStop ? 1 : 0}
                </Text>
                <Text style={styles.progressStatLbl}>{t('collector.current', 'Current')}</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatVal, { color: Colors.textSecondary }]}>
                  {stops.length - completedCount - (currentStop ? 1 : 0)}
                </Text>
                <Text style={styles.progressStatLbl}>{t('collector.pending', 'Pending')}</Text>
              </View>
            </View>
          </Card>

          {/* Stops List */}
          <View style={styles.stopsHeaderRow}>
            <Text style={styles.sectionTitle}>
              {t('collector.fullDailyRoute', {
                count: stops.length,
                defaultValue: `Full Daily Route (${stops.length} households)`,
              })}
            </Text>
            {previousStopsOrder && (
              <TouchableOpacity
                onPress={() => {
                  setStops(previousStopsOrder);
                  setPreviousStopsOrder(null);
                }}
              >
                <Text style={styles.undoText}>{t('collector.undoOptimization', 'Undo Order')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {stops.map((stop) => {
            const isCurr = currentStop?.id === stop.id;
            return (
              <View
                key={stop.id}
                style={[
                  styles.stopCard,
                  stop.status === 'completed' && styles.stopCardCompleted,
                  isCurr && styles.stopCardCurrent,
                  stop.status === 'skipped' && styles.stopCardSkipped,
                ]}
              >
                {/* Sequence Circle */}
                <View
                  style={[
                    styles.indexCircle,
                    {
                      backgroundColor:
                        stop.status === 'completed'
                          ? Colors.success
                          : isCurr
                          ? Colors.collectorAccent
                          : stop.status === 'skipped'
                          ? Colors.warning
                          : Colors.gray300,
                    },
                  ]}
                >
                  {stop.status === 'completed' ? (
                    <Ionicons name="checkmark" size={16} color={Colors.surface} />
                  ) : stop.status === 'skipped' ? (
                    <Ionicons name="close" size={16} color={Colors.surface} />
                  ) : (
                    <Text style={styles.indexCircleText}>{stop.sequence}</Text>
                  )}
                </View>

                {/* Stop Info */}
                <View style={styles.stopInfo}>
                  <Text style={styles.stopAddressText}>
                    <Text style={styles.stopHouseText}>{stop.houseNumber}</Text> {stop.address}
                  </Text>
                  <Text style={styles.stopLocalityText}>{stop.locality}</Text>

                  <View style={styles.stopBadgeRow}>
                    <View
                      style={[
                        styles.wastePill,
                        { backgroundColor: WASTE_COLORS[stop.wasteType] + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.wastePillText,
                          { color: WASTE_COLORS[stop.wasteType] },
                        ]}
                      >
                        {t(`materials.${stop.wasteType}_waste`, {
                          defaultValue: stop.wasteType,
                        })}
                      </Text>
                    </View>
                    <Text style={styles.timeSlotText}>🕐 {stop.timeSlot}</Text>
                    {stop.collectedKg && (
                      <Text style={styles.kgBadgeText}>⚖️ {stop.collectedKg} kg</Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.stopActionsCol}>
                  {stop.status === 'completed' ? (
                    <Text style={styles.completedTag}>{t('collector.done', 'Done')}</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.stopActionBtn}
                      onPress={() => {
                        setViewMode('map');
                        handleOpenVerification(stop);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.stopActionBtnText}>Collect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ─── MODAL 1: Route Optimization Preview ─── */}
      <Modal
        visible={optModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.optModalCard}>
            <View style={styles.optModalHeader}>
              <Ionicons name="flash" size={24} color={Colors.collectorAccent} />
              <Text style={styles.optModalTitle}>
                {t('collector.optimizationTitle', 'Route Optimization')}
              </Text>
            </View>

            {optResult && (
              <View style={styles.optStatsContainer}>
                <View style={styles.savedPill}>
                  <Text style={styles.savedPillText}>
                    🎉{' '}
                    {t('collector.optimizationSaved', {
                      distance: formatDistance(
                        Math.max(0, optResult.originalDistM - optResult.optimizedDistM)
                      ),
                      time: formatDuration(
                        Math.max(0, optResult.originalDurationS - optResult.optimizedDurationS)
                      ),
                      defaultValue: `Saves ${formatDistance(
                        Math.max(0, optResult.originalDistM - optResult.optimizedDistM)
                      )} (${formatDuration(
                        Math.max(0, optResult.originalDurationS - optResult.optimizedDurationS)
                      )})`,
                    })}
                  </Text>
                </View>

                <View style={styles.comparisonBox}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Current Distance:</Text>
                    <Text style={styles.comparisonVal}>
                      {formatDistance(optResult.originalDistM)} (
                      {formatDuration(optResult.originalDurationS)})
                    </Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Optimized Distance:</Text>
                    <Text style={[styles.comparisonVal, { color: Colors.success }]}>
                      {formatDistance(optResult.optimizedDistM)} (
                      {formatDuration(optResult.optimizedDurationS)})
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.optModalBtns}>
              <TouchableOpacity
                style={styles.optApplyBtn}
                onPress={applyOptimizedStops}
                activeOpacity={0.8}
              >
                <Text style={styles.optApplyBtnText}>
                  {t('collector.applyOptimization', 'Apply Optimized Route')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optCancelBtn}
                onPress={() => setOptModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.optCancelBtnText}>
                  {t('collector.cancelOptimization', 'Keep Current Order')}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ─── MODAL 2: Waste Verification & Collection ─── */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.verifyModalCard}>
            <View style={styles.verifyModalHeader}>
              <View>
                <Text style={styles.verifyModalTitle}>
                  {t('collector.verifyAndCollect', 'Waste Collection Verification')}
                </Text>
                <Text style={styles.verifyModalSub}>
                  Stop #{targetStopForCollection?.sequence} ·{' '}
                  {targetStopForCollection?.houseNumber} {targetStopForCollection?.address}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            {/* Waste Category Selector */}
            <Text style={styles.inputSectionLabel}>Waste Category</Text>
            <View style={styles.wasteCategorySelector}>
              {(['wet', 'dry', 'recyclable', 'hazardous'] as WasteCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.wasteCatBtn,
                    collectionWasteType === cat && {
                      backgroundColor: WASTE_COLORS[cat],
                      borderColor: WASTE_COLORS[cat],
                    },
                  ]}
                  onPress={() => setCollectionWasteType(cat)}
                >
                  <Text
                    style={[
                      styles.wasteCatBtnText,
                      collectionWasteType === cat && { color: Colors.surface, fontWeight: '700' },
                    ]}
                  >
                    {t(`materials.${cat}_waste`, { defaultValue: cat })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weight Input with Steppers */}
            <Text style={styles.inputSectionLabel}>Measured Weight (kg)</Text>
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightTextInput}
                value={collectionWeight}
                onChangeText={setCollectionWeight}
                keyboardType="decimal-pad"
                placeholder="5.0"
              />
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setCollectionWeight((prev) =>
                    Math.max(1, (parseFloat(prev) || 0) + 1).toFixed(1)
                  )
                }
              >
                <Text style={styles.stepperBtnText}>+1 kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setCollectionWeight((prev) =>
                    Math.max(1, (parseFloat(prev) || 0) + 5).toFixed(1)
                  )
                }
              >
                <Text style={styles.stepperBtnText}>+5 kg</Text>
              </TouchableOpacity>
            </View>

            {/* Segregation Rating (1 - 5 stars) */}
            <Text style={styles.inputSectionLabel}>
              {t('collector.segregationRating', 'Segregation Quality')}
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSegregationRating(star)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= segregationRating ? 'star' : 'star-outline'}
                    size={28}
                    color="#F57C00"
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.starRatingLabel}>
                {segregationRating === 5
                  ? 'Perfect'
                  : segregationRating >= 4
                  ? 'Good'
                  : segregationRating >= 3
                  ? 'Fair'
                  : 'Poor'}
              </Text>
            </View>

            {/* Contamination Toggle */}
            <View style={styles.contaminationToggleRow}>
              <View>
                <Text style={styles.contaminationLabel}>
                  {t('collector.contaminationDetected', 'Contamination Detected')}
                </Text>
                <Text style={styles.contaminationSub}>Flag mixed or hazardous residue</Text>
              </View>
              <Switch
                value={hasContamination}
                onValueChange={setHasContamination}
                trackColor={{ false: Colors.gray300, true: Colors.error }}
              />
            </View>

            {/* Notes Input */}
            <TextInput
              style={styles.notesInput}
              value={collectionNotes}
              onChangeText={setCollectionNotes}
              placeholder="Add optional notes (e.g. wet waste mixed in dry bag)"
              placeholderTextColor={Colors.gray400}
            />

            {/* Primary Confirm Button (>= 56px) */}
            <TouchableOpacity
              style={styles.confirmCollectionBtn}
              onPress={handleConfirmCollection}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={22} color={Colors.surface} />
              <Text style={styles.confirmCollectionBtnText}>
                {t('collector.confirmCollection', 'Confirm Collection & Advance')}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </Modal>

      {/* ─── MODAL 3: Hazardous Issue / Missed Stop Reporting ─── */}
      <Modal
        visible={issueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.issueModalCard}>
            <View style={styles.issueModalHeader}>
              <Ionicons name="warning" size={24} color={Colors.error} />
              <Text style={styles.issueModalTitle}>
                {t('collector.reportHazardousIssue', 'Report Issue at Stop')}
              </Text>
              <TouchableOpacity onPress={() => setIssueModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <Text style={styles.issueLocationText}>📍 Location: {issueAddress}</Text>

            {/* Issue Category */}
            <Text style={styles.inputSectionLabel}>
              {t('collector.issueCategory', 'Issue Category')}
            </Text>
            <View style={styles.issueCategoryGrid}>
              {[
                { key: 'missed_pickup', label: 'Missed Pickup' },
                { key: 'contamination', label: 'Contaminated Bin' },
                { key: 'overflow', label: 'Overflowing Waste' },
                { key: 'other', label: 'Blocked Road / Hazard' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.issueCatBtn,
                    issueType === item.key && styles.issueCatBtnActive,
                  ]}
                  onPress={() => setIssueType(item.key as any)}
                >
                  <Text
                    style={[
                      styles.issueCatBtnText,
                      issueType === item.key && styles.issueCatBtnTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo Attachment */}
            <View style={styles.photoSectionRow}>
              <TouchableOpacity style={styles.attachPhotoBtn} onPress={handlePickPhoto}>
                <Ionicons name="camera" size={20} color={Colors.collectorAccent} />
                <Text style={styles.attachPhotoText}>
                  {issuePhotoUri
                    ? t('collector.photoAttached', 'Photo Attached ✓')
                    : t('collector.takePhoto', 'Attach Photo')}
                </Text>
              </TouchableOpacity>
              {issuePhotoUri && (
                <TouchableOpacity onPress={() => setIssuePhotoUri(null)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Description Notes */}
            <TextInput
              style={styles.issueNotesInput}
              value={issueNote}
              onChangeText={setIssueNote}
              placeholder="Describe the issue (e.g. hazardous medical waste in household bin)"
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitIssueBtn}
              onPress={handleSubmitIssue}
              activeOpacity={0.8}
            >
              <Text style={styles.submitIssueBtnText}>Log Municipal Field Issue</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.collectorAccent,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    ...Shadow.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 77, 64, 0.5)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: Spacing[1],
  },
  shiftLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[1],
    marginBottom: Spacing[2],
  },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.base,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.surface,
  },
  segmentBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  segmentBtnTextActive: {
    color: Colors.collectorAccent,
  },
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF8F00',
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.base,
    ...Shadow.sm,
  },
  optimizeBtnText: {
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  reportIssueHeaderBtn: {
    backgroundColor: Colors.surface,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },

  // Truck Capacity Indicator
  truckCapacityContainer: {
    marginTop: Spacing[1],
    backgroundColor: 'rgba(0, 50, 40, 0.4)',
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  truckCapacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  truckCapacityLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  truckCapacityValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  capacityTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  // Station Alert
  stationAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C62828',
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
    marginTop: Spacing[2],
    gap: Spacing[2],
  },
  stationAlertText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
  },
  stationAlertBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[2],
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  stationAlertBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },

  // Map Container
  mapContainer: { flex: 1, position: 'relative' },
  liveBeaconBadge: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004D40',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    borderWidth: 1,
    borderColor: '#80CBC4',
    ...Shadow.md,
    zIndex: 10,
  },
  liveBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  liveBeaconText: {
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Proximity Alert Banner
  proximityArrivalBanner: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    left: Spacing[3],
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.md,
    padding: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.success,
    ...Shadow.lg,
    zIndex: 15,
  },
  proximityLeft: { flex: 1 },
  proximityBadge: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    textTransform: 'uppercase',
  },
  proximityText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  proximityActionBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  proximityActionText: {
    color: Colors.surface,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.xs,
  },
  proximityCloseBtn: { padding: 4, marginLeft: 4 },

  // Bottom Next Stop Card
  bottomNextStopCard: {
    position: 'absolute',
    left: Spacing[3],
    right: Spacing[3],
    padding: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  nextStopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  nextStopBadge: {
    backgroundColor: Colors.collectorAccent,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  nextStopBadgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  wastePill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  wastePillText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textTransform: 'capitalize',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  etaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  nextStopAddress: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginVertical: Spacing[1],
  },
  nextStopHouseNum: { fontWeight: FontWeight.bold },

  // Next Stop Actions Row
  nextStopActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  collectPrimaryBtn: {
    flex: 1,
    minHeight: 56, // >= 56px touch target
    backgroundColor: Colors.collectorAccent,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.md,
  },
  collectPrimaryBtnText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  skipBtn: {
    minHeight: 56,
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  externalNavBtn: {
    minHeight: 56,
    width: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List View Styles
  listContainer: { flex: 1 },
  listContent: { padding: Spacing[4], gap: Spacing[3] },
  progressCard: { padding: Spacing[4] },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  progressTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  progressPercentText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.collectorAccent,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  progressStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  progressStatItem: { alignItems: 'center' },
  progressStatVal: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  progressStatLbl: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  stopsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  undoText: {
    fontSize: FontSize.xs,
    color: Colors.collectorAccent,
    fontWeight: FontWeight.bold,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: Spacing[3],
    minHeight: 56,
    ...Shadow.sm,
  },
  stopCardCompleted: { opacity: 0.65 },
  stopCardCurrent: {
    borderWidth: 2,
    borderColor: Colors.collectorAccent,
  },
  stopCardSkipped: { opacity: 0.5 },
  indexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  stopInfo: { flex: 1 },
  stopAddressText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stopHouseText: { fontWeight: FontWeight.bold },
  stopLocalityText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  stopBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  timeSlotText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  kgBadgeText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  stopActionsCol: { alignItems: 'flex-end' },
  completedTag: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  stopActionBtn: {
    backgroundColor: Colors.collectorAccent,
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopActionBtnText: {
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Modals Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing[4],
  },

  // Modal 1: Optimization
  optModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  optModalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  optModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  optStatsContainer: { gap: Spacing[2] },
  savedPill: {
    backgroundColor: '#E8F5E9',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  savedPillText: {
    color: '#1B5E20',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  comparisonBox: {
    backgroundColor: Colors.gray100,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[1],
  },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  comparisonLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  comparisonVal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  optModalBtns: { gap: Spacing[2], marginTop: Spacing[2] },
  optApplyBtn: {
    backgroundColor: Colors.collectorAccent,
    minHeight: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optApplyBtnText: {
    color: Colors.surface,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  optCancelBtn: {
    minHeight: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optCancelBtnText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },

  // Modal 2: Verification
  verifyModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  verifyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  verifyModalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  verifyModalSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  wasteCategorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  wasteCatBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wasteCatBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  weightTextInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  stepperBtn: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing[3],
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  starBtn: { padding: 4 },
  starRatingLabel: {
    marginLeft: Spacing[2],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#E65100',
  },
  contaminationToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  contaminationLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
  contaminationSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: FontSize.sm,
    minHeight: 44,
  },
  confirmCollectionBtn: {
    minHeight: 56,
    backgroundColor: Colors.collectorAccent,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[1],
    ...Shadow.md,
  },
  confirmCollectionBtnText: {
    color: Colors.surface,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },

  // Modal 3: Issue Reporting
  issueModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  issueModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  issueModalTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  issueLocationText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  issueCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  issueCatBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  issueCatBtnActive: {
    backgroundColor: '#FFEBEE',
    borderColor: Colors.error,
  },
  issueCatBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  issueCatBtnTextActive: {
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },
  photoSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  attachPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#E0F2F1',
    paddingHorizontal: Spacing[3],
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  attachPhotoText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.collectorAccent,
  },
  issueNotesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: FontSize.sm,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitIssueBtn: {
    minHeight: 56,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIssueBtnText: {
    color: Colors.surface,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
