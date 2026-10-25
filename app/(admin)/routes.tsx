// Municipal Administrator — Real-Time Fleet Telemetry, Hotspot Monitoring & Civic Broadcasts
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
} from 'react-native';
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
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { CirculoMap, CirculoMapRef, MapCircle } from '../../src/components/map/CirculoMap';
import { CollectorVehicleMarker } from '../../src/components/map/markers/CollectorVehicleMarker';
import { PickerMarker } from '../../src/components/map/markers/PickerMarker';
import { ComplaintPin } from '../../src/components/map/markers/ComplaintPin';
import { LatLng } from '../../src/lib/maps/geo';
import { complaintsApi } from '../../src/lib/api/complaintsApi';
import { notificationsApi } from '../../src/lib/api/notificationsApi';
import { locationApi } from '../../src/lib/api/locationApi';
import type { Complaint } from '../../src/types';

interface FleetVehicle {
  id: string;
  name: string;
  role: 'formal_collector' | 'informal_picker';
  vehicleNumber: string;
  ward: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  updatedAt: string;
}

interface CivicBroadcast {
  id: string;
  title: string;
  severity: 'urgent' | 'warning' | 'info';
  ward: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

// Initial Simulated Fleet Telemetry
const INITIAL_FLEET: FleetVehicle[] = [
  {
    id: 'fleet-1',
    name: 'Ramesh Kumar',
    role: 'formal_collector',
    vehicleNumber: 'KA-01-EA-4412',
    ward: 'Ward 151 (Koramangala)',
    latitude: 12.9352,
    longitude: 77.6245,
    heading: 90,
    speed: 18,
    updatedAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30s ago (Fresh)
  },
  {
    id: 'fleet-2',
    name: 'Suresh Babu',
    role: 'formal_collector',
    vehicleNumber: 'KA-01-EA-5102',
    ward: 'Ward 151 (Koramangala)',
    latitude: 12.9380,
    longitude: 77.6270,
    heading: 180,
    speed: 14,
    updatedAt: new Date(Date.now() - 45 * 1000).toISOString(), // 45s ago (Fresh)
  },
  {
    id: 'fleet-3',
    name: 'Venkatesh N.',
    role: 'formal_collector',
    vehicleNumber: 'KA-01-EA-3388',
    ward: 'Ward 111 (MG Road)',
    latitude: 12.9750,
    longitude: 77.6050,
    heading: 45,
    speed: 0,
    updatedAt: new Date(Date.now() - 190 * 1000).toISOString(), // > 2 min ago (STALE)
  },
  {
    id: 'fleet-4',
    name: 'Meena Devi',
    role: 'informal_picker',
    vehicleNumber: 'Hand-cart #08',
    ward: 'Ward 151 (Koramangala)',
    latitude: 12.9328,
    longitude: 77.6310,
    heading: 60,
    speed: 4,
    updatedAt: new Date(Date.now() - 20 * 1000).toISOString(), // 20s ago (Fresh)
  },
  {
    id: 'fleet-5',
    name: 'Lakshmi Bai',
    role: 'informal_picker',
    vehicleNumber: 'Cycle-cart #14',
    ward: 'Ward 134 (Indiranagar)',
    latitude: 12.9690,
    longitude: 77.6390,
    heading: 270,
    speed: 5,
    updatedAt: new Date(Date.now() - 50 * 1000).toISOString(), // 50s ago (Fresh)
  },
  {
    id: 'fleet-6',
    name: 'Raju Nayak',
    role: 'informal_picker',
    vehicleNumber: 'Push-cart #22',
    ward: 'Ward 174 (HSR Layout)',
    latitude: 12.9140,
    longitude: 77.6450,
    heading: 0,
    speed: 0,
    updatedAt: new Date(Date.now() - 260 * 1000).toISOString(), // > 2 min ago (STALE)
  },
];

// Municipal Waste Density / High Grievance Hotspots
const MUNICIPAL_HOTSPOTS: MapCircle[] = [
  {
    id: 'hotspot-1',
    center: { latitude: 12.9370, longitude: 77.6260 },
    radius: 400,
    fillColor: 'rgba(211, 47, 47, 0.28)',
    strokeColor: '#D32F2F',
    strokeWidth: 2,
  },
  {
    id: 'hotspot-2',
    center: { latitude: 12.9360, longitude: 77.6210 },
    radius: 320,
    fillColor: 'rgba(255, 152, 0, 0.28)',
    strokeColor: '#F57C00',
    strokeWidth: 2,
  },
  {
    id: 'hotspot-3',
    center: { latitude: 12.9715, longitude: 77.6415 },
    radius: 350,
    fillColor: 'rgba(255, 152, 0, 0.28)',
    strokeColor: '#F57C00',
    strokeWidth: 2,
  },
];

// Demo Coordinates for Grievance Pins
const COMPLAINT_COORDINATES: Record<string, LatLng> = {
  'cmp-1': { latitude: 12.9345, longitude: 77.6245 },
  'cmp-2': { latitude: 12.9365, longitude: 77.6215 },
  'cmp-3': { latitude: 12.9710, longitude: 77.6410 },
  'cmp-4': { latitude: 12.9540, longitude: 77.7010 },
};

export default function AdminRoutesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapRef = useRef<CirculoMapRef>(null);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [roleFilter, setRoleFilter] = useState<'all' | 'collectors' | 'pickers' | 'complaints'>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);

  // Fleet & Complaints
  const [fleet, setFleet] = useState<FleetVehicle[]>(INITIAL_FLEET);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Civic Broadcast State
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [broadcasts, setBroadcasts] = useState<CivicBroadcast[]>([
    {
      id: 'bc-1',
      title: 'Road Work on 80ft Road — Divert Compactor Route',
      severity: 'warning',
      ward: 'Ward 151',
      latitude: 12.9372,
      longitude: 77.6258,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'urgent' | 'warning' | 'info'>('warning');
  const [broadcastWard, setBroadcastWard] = useState('Ward 151');

  // Load complaints
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const list = await complaintsApi.listComplaints();
        if (active) setComplaints(list);
      } catch (e) {
        if (__DEV__) console.warn('Error loading complaints:', e);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Real-time municipal fleet telemetry subscription
  useEffect(() => {
    let active = true;

    const unsub = locationApi.subscribeToFleet(
      wardFilter !== 'all' ? wardFilter : undefined,
      (fleetData) => {
        if (!active) return;
        const mapped: FleetVehicle[] = fleetData.map((v) => ({
          id: v.userId,
          name: v.name || (v.role === 'formal_collector' ? 'Collector Fleet' : 'Picker Partner'),
          role: v.role === 'informal_picker' ? 'informal_picker' : 'formal_collector',
          vehicleNumber:
            v.vehicleNumber || (v.role === 'formal_collector' ? 'KA-01-EA-4412' : 'Hand-cart'),
          ward: v.ward || 'Ward 151 (Koramangala)',
          latitude: v.lat,
          longitude: v.lng,
          heading: v.heading ?? 0,
          speed: v.speed ?? 0,
          updatedAt: v.updatedAt || new Date().toISOString(),
        }));
        setFleet(mapped);
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, [wardFilter]);

  // Filtered Fleet
  const filteredFleet = useMemo(() => {
    return fleet.filter((v) => {
      if (roleFilter === 'collectors' && v.role !== 'formal_collector') return false;
      if (roleFilter === 'pickers' && v.role !== 'informal_picker') return false;
      if (roleFilter === 'complaints') return false;
      if (wardFilter !== 'all' && !v.ward.includes(wardFilter)) return false;
      return true;
    });
  }, [fleet, roleFilter, wardFilter]);

  // Filtered Complaints
  const filteredComplaints = useMemo(() => {
    if (roleFilter === 'collectors' || roleFilter === 'pickers') return [];
    return complaints.filter((c) => {
      if (wardFilter !== 'all' && c.locality && !c.locality.includes(wardFilter)) return false;
      return true;
    });
  }, [complaints, roleFilter, wardFilter]);

  // Check if telemetry is stale (> 2 minutes without update)
  const isStale = (updatedAt: string): boolean => {
    return Date.now() - new Date(updatedAt).getTime() > 120 * 1000;
  };

  // Assign Complaint to Ward Fleet Crew
  const handleAssignComplaint = async (complaint: Complaint) => {
    try {
      const updated = await complaintsApi.updateComplaintStatus(
        complaint.id,
        'in_progress',
        'Assigned to Ward 151 Municipal Sanitation Crew'
      );

      setComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? { ...c, status: 'in_progress' } : c))
      );

      setSelectedComplaint(null);
      Alert.alert(
        'Assigned ✓',
        t('admin.assignedSuccess', 'Grievance assigned to Ward 151 Sanitation Crew')
      );
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not assign grievance');
    }
  };

  // Submit Civic Broadcast
  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a broadcast advisory message.');
      return;
    }

    const newBroadcast: CivicBroadcast = {
      id: `bc-${Date.now().toString(36)}`,
      title: broadcastTitle,
      severity: broadcastSeverity,
      ward: broadcastWard,
      latitude: 12.9360,
      longitude: 77.6230,
      createdAt: new Date().toISOString(),
    };

    setBroadcasts((prev) => [newBroadcast, ...prev]);

    // Create system notification
    await notificationsApi.createNotification({
      userId: '', // Broadcast to all
      title: `Civic Alert: ${broadcastTitle}`,
      body: `Priority alert issued for ${broadcastWard}. All active collectors please review map route.`,
      type: 'warning',
      isRead: false,
    });

    setBroadcastModalVisible(false);
    setBroadcastTitle('');

    Alert.alert(
      'Alert Broadcasted 📢',
      t('admin.emergencyAlertDropped', {
        ward: broadcastWard,
        defaultValue: `Civic broadcast alert placed at ${broadcastWard}`,
      })
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Coordinates for all active markers to fit
  const markersToFit: LatLng[] = useMemo(() => {
    const list: LatLng[] = [];
    filteredFleet.forEach((v) => list.push({ latitude: v.latitude, longitude: v.longitude }));
    filteredComplaints.forEach((c) => {
      const coord = COMPLAINT_COORDINATES[c.id] || { latitude: 12.935, longitude: 77.625 };
      list.push(coord);
    });
    return list.length > 0 ? list : [{ latitude: 12.9352, longitude: 77.6245 }];
  }, [filteredFleet, filteredComplaints]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.title}>{t('admin.fleetMap', 'Fleet & Hotspots Map')}</Text>
            <Text style={styles.subtitle}>
              {t('admin.liveFleetCount', {
                count: filteredFleet.length,
                defaultValue: `${filteredFleet.length} Active Vehicles`,
              })}
            </Text>
          </View>

          {/* Broadcast Alert Button */}
          <TouchableOpacity
            style={styles.broadcastBtn}
            onPress={() => setBroadcastModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="megaphone" size={16} color={Colors.surface} />
            <Text style={styles.broadcastBtnText}>
              {t('admin.civicBroadcast', 'Broadcast')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Mode & Hotspot Toggle */}
        <View style={styles.modeAndHotspotsRow}>
          {/* Segment: Map vs. List */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'map' && styles.segmentBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons
                name="map"
                size={14}
                color={viewMode === 'map' ? Colors.surface : Colors.textSecondary}
              />
              <Text style={[styles.segmentText, viewMode === 'map' && styles.segmentTextActive]}>
                Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={14}
                color={viewMode === 'list' ? Colors.surface : Colors.textSecondary}
              />
              <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
                List
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hotspot Toggle */}
          <TouchableOpacity
            style={[styles.hotspotToggleBtn, showHotspots && styles.hotspotToggleBtnActive]}
            onPress={() => setShowHotspots(!showHotspots)}
            activeOpacity={0.8}
          >
            <Text style={styles.hotspotEmoji}>🔥</Text>
            <Text
              style={[styles.hotspotToggleText, showHotspots && styles.hotspotToggleTextActive]}
            >
              {showHotspots
                ? t('admin.hotspotsActive', 'Hotspots ON')
                : t('admin.hotspotsLayer', 'Hotspots')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips: Role Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          <TouchableOpacity
            style={[styles.chip, roleFilter === 'all' && styles.chipActive]}
            onPress={() => setRoleFilter('all')}
          >
            <Text style={[styles.chipText, roleFilter === 'all' && styles.chipTextActive]}>
              {t('admin.allFleet', 'All Fleet')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, roleFilter === 'collectors' && styles.chipActive]}
            onPress={() => setRoleFilter('collectors')}
          >
            <Text style={[styles.chipText, roleFilter === 'collectors' && styles.chipTextActive]}>
              🚛 {t('admin.collectorsOnly', 'Collectors')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, roleFilter === 'pickers' && styles.chipActive]}
            onPress={() => setRoleFilter('pickers')}
          >
            <Text style={[styles.chipText, roleFilter === 'pickers' && styles.chipTextActive]}>
              ♻️ {t('admin.pickersOnly', 'Pickers')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, roleFilter === 'complaints' && styles.chipActive]}
            onPress={() => setRoleFilter('complaints')}
          >
            <Text style={[styles.chipText, roleFilter === 'complaints' && styles.chipTextActive]}>
              ⚠️ {t('admin.complaintsOnly', 'Complaints')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main View: Map or List */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <CirculoMap
            ref={mapRef}
            userLocation={{ latitude: 12.9352, longitude: 77.6245 }}
            circles={showHotspots ? MUNICIPAL_HOTSPOTS : undefined}
            markersToFit={markersToFit}
            gloveFriendly={false}
          >
            {/* Fleet Vehicle Markers */}
            {filteredFleet.map((vehicle) => {
              const stale = isStale(vehicle.updatedAt);

              if (vehicle.role === 'formal_collector') {
                return (
                  <CollectorVehicleMarker
                    key={vehicle.id}
                    id={vehicle.id}
                    coordinate={{ latitude: vehicle.latitude, longitude: vehicle.longitude }}
                    heading={vehicle.heading}
                    name={vehicle.name}
                    vehicleNumber={vehicle.vehicleNumber}
                    isStale={stale}
                    onPress={() => {
                      Alert.alert(
                        `${vehicle.name} (${vehicle.vehicleNumber})`,
                        `Role: Municipal Collector\nWard: ${vehicle.ward}\nSpeed: ${vehicle.speed} km/h\nStatus: ${stale ? 'STALE (>2m without GPS update)' : 'ACTIVE (Live GPS)'}`
                      );
                    }}
                  />
                );
              }

              return (
                <PickerMarker
                  key={vehicle.id}
                  id={vehicle.id}
                  coordinate={{ latitude: vehicle.latitude, longitude: vehicle.longitude }}
                  name={vehicle.name}
                  isLive={!stale}
                  isStale={stale}
                  onPress={() => {
                    Alert.alert(
                      `${vehicle.name}`,
                      `Role: Scrap Picker\nWard: ${vehicle.ward}\nVehicle: ${vehicle.vehicleNumber}\nStatus: ${stale ? 'STALE (>2m)' : 'ACTIVE'}`
                    );
                  }}
                />
              );
            })}

            {/* Citizen Grievance Red Alert Pins */}
            {filteredComplaints.map((c) => {
              const coord = COMPLAINT_COORDINATES[c.id] || { latitude: 12.935, longitude: 77.625 };
              return (
                <ComplaintPin
                  key={c.id}
                  id={c.id}
                  coordinate={coord}
                  referenceNumber={c.referenceNumber.slice(-4)}
                  category={c.category}
                  onPress={() => setSelectedComplaint(c)}
                />
              );
            })}
          </CirculoMap>

          {/* Floating Hotspot Legend */}
          {showHotspots && (
            <View style={styles.hotspotLegendBox}>
              <Text style={styles.legendTitle}>🔥 {t('admin.hotspotLegend', 'Waste Hotspots')}</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D32F2F' }]} />
                <Text style={styles.legendLabel}>High Density (Commercial 80ft)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F57C00' }]} />
                <Text style={styles.legendLabel}>Medium Inflow (5th Cross / 12th Main)</Text>
              </View>
            </View>
          )}

          {/* Grievance Selected Bottom Card */}
          {selectedComplaint && (
            <Card style={[styles.complaintDetailCard, { bottom: TAB_BAR_HEIGHT + insets.bottom + 12 }]}>
              <View style={styles.complaintDetailHeader}>
                <View style={styles.alertRefPill}>
                  <Ionicons name="warning" size={14} color="#C62828" />
                  <Text style={styles.alertRefText}>{selectedComplaint.referenceNumber}</Text>
                </View>
                <Badge
                  label={selectedComplaint.status.toUpperCase()}
                  variant={
                    selectedComplaint.status === 'resolved'
                      ? 'success'
                      : selectedComplaint.status === 'in_progress'
                      ? 'info'
                      : 'warning'
                  }
                  size="sm"
                />
                <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
                  <Ionicons name="close" size={20} color={Colors.gray500} />
                </TouchableOpacity>
              </View>

              <Text style={styles.complaintCategory}>
                {selectedComplaint.category.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.complaintDesc} numberOfLines={2}>
                {selectedComplaint.description}
              </Text>
              <Text style={styles.complaintLocality}>
                📍 {selectedComplaint.locality}
              </Text>

              <TouchableOpacity
                style={styles.assignWardBtn}
                onPress={() => handleAssignComplaint(selectedComplaint)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={16} color={Colors.surface} />
                <Text style={styles.assignWardBtnText}>
                  {t('admin.assignToWard', 'Assign to Ward Crew')}
                </Text>
              </TouchableOpacity>
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
          <DemoDataBanner message="⚠️ REALTIME FLEET TELEMETRY — Live GPS sync with Supabase live_locations table." />

          <Text style={styles.sectionTitle}>
            {t('admin.activeTelemetries', 'Active Telemetry Feed')}
          </Text>

          {filteredFleet.map((vehicle) => {
            const stale = isStale(vehicle.updatedAt);
            return (
              <Card key={vehicle.id} style={styles.telemetryCard}>
                <View style={styles.telemetryTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleDriverName}>
                      {vehicle.role === 'formal_collector' ? '🚛' : '♻️'} {vehicle.name}
                    </Text>
                    <Text style={styles.vehicleSubText}>
                      {vehicle.vehicleNumber} · {vehicle.ward}
                    </Text>
                  </View>

                  <Badge
                    label={stale ? t('admin.staleWarning', 'Stale >2m') : 'Live GPS'}
                    variant={stale ? 'neutral' : 'success'}
                    size="sm"
                  />
                </View>

                <View style={styles.telemetryBottomRow}>
                  <Text style={styles.coordText}>
                    {vehicle.latitude.toFixed(4)}° N, {vehicle.longitude.toFixed(4)}° E
                  </Text>
                  <Text style={styles.speedText}>⚡ {vehicle.speed} km/h</Text>
                  <Text style={styles.updatedTimeText}>
                    {new Date(vehicle.updatedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* ─── MODAL: Drop Civic Emergency Broadcast ─── */}
      <Modal
        visible={broadcastModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBroadcastModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.broadcastModalCard}>
            <View style={styles.broadcastModalHeader}>
              <Ionicons name="megaphone" size={24} color={Colors.adminAccent} />
              <Text style={styles.broadcastModalTitle}>
                {t('admin.broadcastTitle', 'Broadcast Civic Alert')}
              </Text>
              <TouchableOpacity onPress={() => setBroadcastModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <Text style={styles.broadcastModalDesc}>
              {t(
                'admin.broadcastDesc',
                'Send urgent detour or cleanliness advisory to municipal vehicles and collectors.'
              )}
            </Text>

            {/* Title Input */}
            <Text style={styles.inputLabel}>Alert Message</Text>
            <TextInput
              style={styles.textInput}
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
              placeholder="e.g. Road work on 80ft Road — Divert compactor round"
              placeholderTextColor={Colors.gray400}
            />

            {/* Target Ward */}
            <Text style={styles.inputLabel}>Target Ward</Text>
            <View style={styles.wardSelectRow}>
              {['Ward 151', 'Ward 111', 'All Wards'].map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.wardSelectBtn, broadcastWard === w && styles.wardSelectBtnActive]}
                  onPress={() => setBroadcastWard(w)}
                >
                  <Text
                    style={[
                      styles.wardSelectBtnText,
                      broadcastWard === w && styles.wardSelectBtnTextActive,
                    ]}
                  >
                    {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.sendBroadcastBtn}
              onPress={handleSendBroadcast}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={18} color={Colors.surface} />
              <Text style={styles.sendBroadcastBtnText}>
                {t('admin.sendBroadcast', 'Send Broadcast to Fleet')}
              </Text>
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
    backgroundColor: Colors.adminAccent,
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
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C62828',
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.base,
    ...Shadow.sm,
  },
  broadcastBtnText: {
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Mode and Hotspots
  modeAndHotspotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginVertical: Spacing[1],
  },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  segmentBtnActive: { backgroundColor: Colors.surface },
  segmentText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  segmentTextActive: { color: Colors.adminAccent, fontWeight: FontWeight.bold },
  hotspotToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.base,
  },
  hotspotToggleBtnActive: {
    backgroundColor: '#FF6F00',
  },
  hotspotEmoji: { fontSize: 13 },
  hotspotToggleText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  hotspotToggleTextActive: {
    color: Colors.surface,
    fontWeight: FontWeight.bold,
  },

  // Filter Chips
  filterChipScroll: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  chipActive: { backgroundColor: Colors.surface },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.adminAccent,
    fontWeight: FontWeight.bold,
  },

  // Map Container
  mapContainer: { flex: 1, position: 'relative' },
  hotspotLegendBox: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: Spacing[2.5],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: 4,
    ...Shadow.md,
    zIndex: 10,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#C62828',
    textTransform: 'uppercase',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 9, color: Colors.textPrimary, fontWeight: FontWeight.medium },

  // Complaint Detail Card
  complaintDetailCard: {
    position: 'absolute',
    left: Spacing[3],
    right: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    gap: Spacing[2],
    ...Shadow.lg,
  },
  complaintDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertRefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  alertRefText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },
  complaintCategory: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  complaintDesc: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  complaintLocality: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  assignWardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.adminAccent,
    minHeight: 48,
    borderRadius: BorderRadius.md,
    marginTop: Spacing[1],
  },
  assignWardBtnText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // List View
  listContainer: { flex: 1 },
  listContent: { padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  telemetryCard: {
    padding: Spacing[3],
    gap: Spacing[2],
  },
  telemetryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleDriverName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  vehicleSubText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  telemetryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing[2],
  },
  coordText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  speedText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  updatedTimeText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  broadcastModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  broadcastModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  broadcastModalTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  broadcastModalDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    height: 48,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  wardSelectRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  wardSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wardSelectBtnActive: {
    backgroundColor: Colors.adminAccent,
    borderColor: Colors.adminAccent,
  },
  wardSelectBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  wardSelectBtnTextActive: {
    color: Colors.surface,
    fontWeight: FontWeight.bold,
  },
  sendBroadcastBtn: {
    minHeight: 52,
    backgroundColor: '#C62828',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[1],
    ...Shadow.md,
  },
  sendBroadcastBtnText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
