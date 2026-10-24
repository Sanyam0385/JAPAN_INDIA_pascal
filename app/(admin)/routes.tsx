// Municipal Administrator — Fleet & Route Oversight
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

export default function AdminRoutesScreen() {
  const insets = useSafeAreaInsets();

  const routes = [
    {
      id: 'r-1',
      name: 'Route 3A · Koramangala 1st-3rd Block',
      driver: 'Ramesh Kumar',
      vehicle: 'KA-01-EA-4921 (Compactor)',
      status: 'active',
      completedStops: 48,
      totalStops: 62,
      shift: '06:30 AM – 02:30 PM',
      tonnage: '3.4 Tonnes',
    },
    {
      id: 'r-2',
      name: 'Route 3B · Koramangala 4th-6th Block',
      driver: 'Suresh Babu',
      vehicle: 'KA-01-EA-5102 (Tipper Auto)',
      status: 'active',
      completedStops: 54,
      totalStops: 55,
      shift: '06:30 AM – 02:30 PM',
      tonnage: '2.8 Tonnes',
    },
    {
      id: 'r-3',
      name: 'Route 3C · Commercial 80ft Road & 100ft Road',
      driver: 'Venkatesh N.',
      vehicle: 'KA-01-EA-3388 (Compactor)',
      status: 'delayed',
      completedStops: 22,
      totalStops: 45,
      shift: '07:00 AM – 03:00 PM',
      tonnage: '1.9 Tonnes',
    },
    {
      id: 'r-4',
      name: 'Route 3D · Industrial Layout & Scrap Hub',
      driver: 'Anand M.',
      vehicle: 'KA-01-EA-7714 (Heavy Lorry)',
      status: 'scheduled',
      completedStops: 0,
      totalStops: 38,
      shift: '02:00 PM – 10:00 PM',
      tonnage: '0.0 Tonnes',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Fleet & Route Dispatch</Text>
        <Text style={styles.subtitle}>Daily municipal waste collection routes</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO FLEET TELEMETRY — Simulated GPS status of municipal collection compactors." />

        {/* Fallback Map Notice */}
        <Card variant="filled" style={styles.mapNotice}>
          <View style={styles.noticeRow}>
            <Ionicons name="map" size={24} color={Colors.adminAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Geospatial Live Map</Text>
              <Text style={styles.noticeBody}>
                Native map tiles require native compilation. Running in Expo Go mode displays verified telemetry route cards below.
              </Text>
            </View>
          </View>
        </Card>

        {routes.map((r) => {
          const pct = Math.round((r.completedStops / r.totalStops) * 100);
          return (
            <Card key={r.id} style={styles.routeCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{r.name}</Text>
                  <Text style={styles.vehicleText}>🚛 {r.vehicle}</Text>
                </View>
                <Badge
                  label={r.status}
                  variant={r.status === 'active' ? 'info' : r.status === 'delayed' ? 'warning' : 'neutral'}
                />
              </View>

              {/* Progress */}
              <View style={styles.progressWrap}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Completion: {r.completedStops} / {r.totalStops} Stops</Text>
                  <Text style={styles.progressPct}>{pct}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              </View>

              {/* Meta details */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Assigned Collector</Text>
                  <Text style={styles.metaValue}>👤 {r.driver}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Payload Today</Text>
                  <Text style={styles.metaValue}>⚖️ {r.tonnage}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
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
  content: { padding: Spacing[4], gap: Spacing[3] },
  mapNotice: { backgroundColor: '#EDE7F6', borderColor: '#D1C4E9', padding: Spacing[3.5] },
  noticeRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  noticeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.adminAccent },
  noticeBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  routeCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  routeName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  vehicleText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  progressWrap: { gap: Spacing[1] },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, color: Colors.textSecondary },
  progressPct: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  progressBar: { height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.adminAccent },
  metaGrid: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, padding: Spacing[2.5], borderRadius: BorderRadius.md },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 9, color: Colors.textTertiary, textTransform: 'uppercase' },
  metaValue: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: 1 },
});
