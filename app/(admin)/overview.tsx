// Municipal Administrator — Overview / Command Center
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

export default function AdminOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { complaints, recyclingRequests } = useAppStore();

  const openComplaints = complaints.filter(c => c.status !== 'resolved');
  const activeRecycling = recyclingRequests.filter(r => r.status === 'open' || r.status === 'accepted');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.wardTag}>BBMP WARD 151 · KORAMANGALA</Text>
          <Text style={styles.title}>Municipal Operations</Text>
        </View>
        <View style={styles.statusLive}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Telemetry</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO CONTROL ROOM — Municipal supervisor analytics based on simulated ward activity." />

        {/* 4 Metric KPI Cards */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>COLLECTION EFFICIENCY</Text>
            <Text style={[styles.kpiValue, { color: Colors.primary }]}>92.4%</Text>
            <Text style={styles.kpiSub}>1,842 / 1,994 Households</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>SEGREGATION AT SOURCE</Text>
            <Text style={[styles.kpiValue, { color: Colors.collectorAccent }]}>78.1%</Text>
            <Text style={styles.kpiSub}>+4.2% from last month</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE FLEET VEHICLES</Text>
            <Text style={[styles.kpiValue, { color: '#E65100' }]}>14 / 16</Text>
            <Text style={styles.kpiSub}>2 on scheduled maintenance</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OPEN CIVIC TICKETS</Text>
            <Text style={[styles.kpiValue, { color: Colors.error }]}>{openComplaints.length}</Text>
            <Text style={styles.kpiSub}>Requires supervisor action</Text>
          </Card>
        </View>

        {/* Waste Stream Composition Card */}
        <Card style={styles.compositionCard}>
          <Text style={styles.cardHeading}>Ward Waste Stream Composition (Daily Est.)</Text>
          <Text style={styles.compSub}>Total Collected: 18.4 Metric Tonnes Today</Text>

          {/* Stacked Percentage Bar */}
          <View style={styles.stackedBar}>
            <View style={[styles.stackSeg, { flex: 52, backgroundColor: '#4CAF50' }]} />
            <View style={[styles.stackSeg, { flex: 32, backgroundColor: '#1976D2' }]} />
            <View style={[styles.stackSeg, { flex: 13, backgroundColor: '#FFA000' }]} />
            <View style={[styles.stackSeg, { flex: 3, backgroundColor: '#D32F2F' }]} />
          </View>

          {/* Legend */}
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Wet / Organic: 52% (9.5T)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1976D2' }]} />
              <Text style={styles.legendText}>Dry Waste: 32% (5.9T)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA000' }]} />
              <Text style={styles.legendText}>Recyclables: 13% (2.4T)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D32F2F' }]} />
              <Text style={styles.legendText}>Hazardous / Sanit.: 3% (0.6T)</Text>
            </View>
          </View>
        </Card>

        {/* Circular Economy Marketplace Status */}
        <Card style={styles.circularCard}>
          <View style={styles.circularHeader}>
            <View>
              <Text style={styles.cardHeading}>Informal Picker Marketplace</Text>
              <Text style={styles.compSub}>{activeRecycling.length} active collection listings in ward</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(admin)/requests')}>
              <Text style={styles.viewLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniNum}>42</Text>
              <Text style={styles.miniLbl}>Accredited Pickers</Text>
            </View>
            <View style={styles.miniDiv} />
            <View style={styles.miniStat}>
              <Text style={styles.miniNum}>3.8T</Text>
              <Text style={styles.miniLbl}>Diverted from Landfill</Text>
            </View>
            <View style={styles.miniDiv} />
            <View style={styles.miniStat}>
              <Text style={styles.miniNum}>₹1.2L</Text>
              <Text style={styles.miniLbl}>Direct Worker Income</Text>
            </View>
          </View>
        </Card>

        {/* Priority Issues & Complaints Quick Action */}
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color={Colors.error} />
            <Text style={[styles.cardHeading, { color: Colors.error }]}>Urgent Civic Reports</Text>
          </View>

          {openComplaints.slice(0, 2).map((c) => (
            <View key={c.id} style={styles.ticketItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketRef}>{c.referenceNumber} · {c.category.replace(/_/g, ' ')}</Text>
                <Text style={styles.ticketDesc} numberOfLines={1}>{c.description}</Text>
                <Text style={styles.ticketLoc}>📍 {c.locality}</Text>
              </View>
              <Badge label={c.status} variant="error" size="sm" />
            </View>
          ))}

          <TouchableOpacity
            style={styles.resolveAllBtn}
            onPress={() => router.push('/(admin)/complaints')}
          >
            <Text style={styles.resolveAllText}>Open Complaints Management Center →</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
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
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wardTag: { fontSize: 10, color: Colors.adminAccent, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.adminAccent },
  liveText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.adminAccent },
  content: { padding: Spacing[4], gap: Spacing[3] },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2.5] },
  kpiCard: { flex: 1, minWidth: '47%', padding: Spacing[3.5], gap: 2 },
  kpiLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  kpiValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, marginVertical: 2 },
  kpiSub: { fontSize: 10, color: Colors.textSecondary },
  compositionCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeading: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  compSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  stackedBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.gray200,
  },
  stackSeg: { height: '100%' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], minWidth: '45%' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  circularCard: { padding: Spacing[4], gap: Spacing[3] },
  circularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewLink: { fontSize: FontSize.xs, color: Colors.adminAccent, fontWeight: FontWeight.bold },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniNum: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  miniLbl: { fontSize: 9, color: Colors.textSecondary, marginTop: 1, textAlign: 'center' },
  miniDiv: { width: 1, height: 24, backgroundColor: Colors.border },
  alertCard: { padding: Spacing[4], gap: Spacing[3], borderColor: '#FFCDD2' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[2],
  },
  ticketRef: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  ticketDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  ticketLoc: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  resolveAllBtn: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  resolveAllText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.adminAccent },
});
