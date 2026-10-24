import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, DemoDataBanner } from '../../src/components/ui';

type StopStatus = 'completed' | 'current' | 'pending';

interface RouteStop {
  id: string;
  index: number;
  houseNumber: string;
  address: string;
  locality: string;
  wasteType: 'wet' | 'dry' | 'recyclable' | 'hazardous';
  timeSlot: string;
  status: StopStatus;
}

const DEMO_ROUTE_STOPS: RouteStop[] = [
  { id: 's1', index: 1, houseNumber: '#42', address: '5th Cross, Koramangala 4th Block', locality: 'Koramangala', wasteType: 'wet', timeSlot: '07:10', status: 'completed' },
  { id: 's2', index: 2, houseNumber: '#17', address: '8th Main, HSR Layout Sector 2', locality: 'HSR Layout', wasteType: 'dry', timeSlot: '07:30', status: 'completed' },
  { id: 's3', index: 3, houseNumber: '#89', address: '1st Cross, Indiranagar 12th Main', locality: 'Indiranagar', wasteType: 'recyclable', timeSlot: '07:55', status: 'completed' },
  { id: 's4', index: 4, houseNumber: '#33', address: '2nd Block, JP Nagar Phase 2', locality: 'JP Nagar', wasteType: 'wet', timeSlot: '08:20', status: 'completed' },
  { id: 's5', index: 5, houseNumber: '#71', address: 'Outer Ring Road, Marathahalli', locality: 'Marathahalli', wasteType: 'dry', timeSlot: '08:40', status: 'completed' },
  { id: 's6', index: 6, houseNumber: '#14', address: 'Church Street, MG Road Area', locality: 'MG Road', wasteType: 'wet', timeSlot: '09:00', status: 'completed' },
  { id: 's7', index: 7, houseNumber: '#55', address: '100 Feet Road, Jayanagar', locality: 'Jayanagar', wasteType: 'dry', timeSlot: '09:20', status: 'completed' },
  { id: 's8', index: 8, houseNumber: '#28', address: 'Domlur Layout, Domlur', locality: 'Domlur', wasteType: 'recyclable', timeSlot: '09:45', status: 'current' },
  { id: 's9', index: 9, houseNumber: '#96', address: '3rd Main, Whitefield', locality: 'Whitefield', wasteType: 'wet', timeSlot: '10:10', status: 'pending' },
  { id: 's10', index: 10, houseNumber: '#11', address: 'BTM Layout 2nd Stage', locality: 'BTM Layout', wasteType: 'dry', timeSlot: '10:30', status: 'pending' },
  { id: 's11', index: 11, houseNumber: '#63', address: 'Rajajinagar 3rd Block', locality: 'Rajajinagar', wasteType: 'hazardous', timeSlot: '10:55', status: 'pending' },
  { id: 's12', index: 12, houseNumber: '#47', address: 'Electronic City Phase 1', locality: 'Electronic City', wasteType: 'recyclable', timeSlot: '11:20', status: 'pending' },
];

const WASTE_COLORS: Record<string, string> = {
  wet: Colors.success,
  dry: Colors.collectorAccent,
  recyclable: Colors.warning,
  hazardous: Colors.error,
};

const WASTE_LABELS: Record<string, string> = {
  wet: 'Wet', dry: 'Dry', recyclable: 'Recyclable', hazardous: 'Hazardous',
};

export default function CollectorRouteScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}>
        <Text style={styles.headerTitle}>Today's Route</Text>
        <Text style={styles.headerSub}>Zone 3A · Koramangala (Demo)</Text>
      </View>

      <View style={styles.body}>
        <DemoDataBanner message="Route stops and addresses are demo data only." />

        {/* Map / List toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? Colors.surface : Colors.textSecondary} />
            <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>
              List View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={16} color={viewMode === 'map' ? Colors.surface : Colors.textSecondary} />
            <Text style={[styles.toggleBtnText, viewMode === 'map' && styles.toggleBtnTextActive]}>
              Map View
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map Placeholder */}
        {viewMode === 'map' && (
          <Card style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapPlaceholderTitle}>Map integration requires native build</Text>
            <Text style={styles.mapPlaceholderSub}>
              Open in Expo Go: List view shown below.{'\n'}
              Use a development build for full map support.
            </Text>
            <TouchableOpacity
              style={styles.switchToListBtn}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <Text style={styles.switchToListText}>Switch to List View</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Route Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={[styles.progressValue, { color: Colors.success }]}>7</Text>
              <Text style={styles.progressLabel}>Done</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressValue, { color: Colors.collectorAccent }]}>1</Text>
              <Text style={styles.progressLabel}>Current</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressValue, { color: Colors.textSecondary }]}>4</Text>
              <Text style={styles.progressLabel}>Pending</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '58%' }]} />
          </View>
          <Text style={styles.progressNote}>58% complete · Demo estimate</Text>
        </Card>

        {/* Stop list */}
        <Text style={styles.sectionTitle}>All Stops</Text>
        {DEMO_ROUTE_STOPS.map(stop => (
          <View
            key={stop.id}
            style={[
              styles.stopCard,
              stop.status === 'completed' && styles.stopCardCompleted,
              stop.status === 'current' && styles.stopCardCurrent,
            ]}
          >
            {/* Index bubble */}
            <View style={[
              styles.indexBubble,
              {
                backgroundColor:
                  stop.status === 'completed' ? Colors.success
                    : stop.status === 'current' ? Colors.collectorAccent
                    : Colors.gray300,
              },
            ]}>
              {stop.status === 'completed'
                ? <Ionicons name="checkmark" size={14} color={Colors.surface} />
                : <Text style={styles.indexText}>{stop.index}</Text>}
            </View>

            <View style={styles.stopBody}>
              <Text style={styles.stopAddress}>
                <Text style={styles.stopNum}>{stop.houseNumber}</Text>
                {' '}{stop.address}
              </Text>
              <Text style={styles.stopLocality}>{stop.locality}</Text>
              <View style={styles.stopMeta}>
                <View style={[styles.wasteBadge, { backgroundColor: WASTE_COLORS[stop.wasteType] + '20' }]}>
                  <Text style={[styles.wasteBadgeText, { color: WASTE_COLORS[stop.wasteType] }]}>
                    {WASTE_LABELS[stop.wasteType]}
                  </Text>
                </View>
                <Text style={styles.timeText}>🕐 {stop.timeSlot}</Text>
              </View>
            </View>

            <View style={styles.stopStatusCol}>
              {stop.status === 'completed' && (
                <Text style={styles.doneText}>✓ Done</Text>
              )}
              {stop.status === 'current' && (
                <View style={styles.currentPill}>
                  <Text style={styles.currentPillText}>Now</Text>
                </View>
              )}
              {stop.status === 'pending' && (
                <Text style={styles.pendingText}>Pending</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {},
  header: {
    backgroundColor: Colors.collectorAccent,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[5],
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing[1],
  },
  body: { padding: Spacing[4], gap: Spacing[3] },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.base,
  },
  toggleBtnActive: { backgroundColor: Colors.collectorAccent },
  toggleBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  toggleBtnTextActive: { color: Colors.surface, fontWeight: FontWeight.semibold },
  mapPlaceholder: {
    alignItems: 'center',
    padding: Spacing[8],
    backgroundColor: Colors.gray100,
    gap: Spacing[3],
  },
  mapIcon: { fontSize: 48 },
  mapPlaceholderTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  mapPlaceholderSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  switchToListBtn: {
    backgroundColor: Colors.collectorAccent,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchToListText: {
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  progressCard: { padding: Spacing[4] },
  progressRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing[3] },
  progressItem: { alignItems: 'center' },
  progressValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  progressLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing[1],
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  progressNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: Spacing[3],
    ...Shadow.sm,
    marginBottom: Spacing[2],
    minHeight: 56,
  },
  stopCardCompleted: { opacity: 0.7 },
  stopCardCurrent: {
    borderWidth: 2,
    borderColor: Colors.collectorAccent,
  },
  indexBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexText: { color: Colors.surface, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  stopBody: { flex: 1 },
  stopAddress: { fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  stopNum: { fontWeight: FontWeight.bold },
  stopLocality: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing[1] },
  stopMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  wasteBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  wasteBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  timeText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  stopStatusCol: { alignItems: 'flex-end' },
  doneText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold },
  currentPill: {
    backgroundColor: Colors.collectorAccent,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  currentPillText: { fontSize: FontSize.xs, color: Colors.surface, fontWeight: FontWeight.semibold },
  pendingText: { fontSize: FontSize.xs, color: Colors.textTertiary },
});
