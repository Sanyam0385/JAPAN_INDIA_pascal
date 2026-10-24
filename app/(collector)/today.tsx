import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';

type StopStatus = 'completed' | 'current' | 'pending';

interface Stop {
  id: string;
  houseNumber: string;
  address: string;
  wasteType: 'wet' | 'dry' | 'recyclable' | 'hazardous';
  timeSlot: string;
  status: StopStatus;
}

const DEMO_STOPS: Stop[] = [
  { id: 's1', houseNumber: '#42', address: '5th Cross, Koramangala 4th Block', wasteType: 'wet', timeSlot: '07:10', status: 'completed' },
  { id: 's2', houseNumber: '#17', address: '8th Main, HSR Layout Sector 2', wasteType: 'dry', timeSlot: '07:30', status: 'completed' },
  { id: 's3', houseNumber: '#89', address: '1st Cross, Indiranagar 12th Main', wasteType: 'recyclable', timeSlot: '07:55', status: 'completed' },
  { id: 's4', houseNumber: '#33', address: '2nd Block, JP Nagar Phase 2', wasteType: 'wet', timeSlot: '08:20', status: 'completed' },
  { id: 's5', houseNumber: '#71', address: 'Outer Ring Road, Marathahalli', wasteType: 'dry', timeSlot: '08:40', status: 'completed' },
  { id: 's6', houseNumber: '#14', address: 'Church Street, MG Road Area', wasteType: 'wet', timeSlot: '09:00', status: 'completed' },
  { id: 's7', houseNumber: '#55', address: '100 Feet Road, Jayanagar', wasteType: 'dry', timeSlot: '09:20', status: 'completed' },
  { id: 's8', houseNumber: '#28', address: 'Domlur Layout, Domlur', wasteType: 'recyclable', timeSlot: '09:45', status: 'current' },
  { id: 's9', houseNumber: '#96', address: '3rd Main, Whitefield', wasteType: 'wet', timeSlot: '10:10', status: 'pending' },
  { id: 's10', houseNumber: '#11', address: 'BTM Layout 2nd Stage', wasteType: 'dry', timeSlot: '10:30', status: 'pending' },
  { id: 's11', houseNumber: '#63', address: 'Rajajinagar 3rd Block', wasteType: 'hazardous', timeSlot: '10:55', status: 'pending' },
  { id: 's12', houseNumber: '#47', address: 'Electronic City Phase 1', wasteType: 'recyclable', timeSlot: '11:20', status: 'pending' },
];

const WASTE_TYPE_COLORS: Record<string, string> = {
  wet: Colors.success,
  dry: Colors.collectorAccent,
  recyclable: Colors.warning,
  hazardous: Colors.error,
};

const WASTE_TYPE_LABELS: Record<string, string> = {
  wet: 'Wet',
  dry: 'Dry',
  recyclable: 'Recyclable',
  hazardous: 'Hazardous',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatusBadge({ status }: { status: StopStatus }) {
  const configs: Record<StopStatus, { label: string; color: string; bg: string }> = {
    completed: { label: '✓ Done', color: Colors.success, bg: Colors.successLight },
    current: { label: '● Current', color: Colors.collectorAccent, bg: Colors.infoLight },
    pending: { label: '○ Pending', color: Colors.textSecondary, bg: Colors.gray100 },
  };
  const cfg = configs[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function CollectorTodayScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const [onShift, setOnShift] = useState(true);

  const completed = DEMO_STOPS.filter(s => s.status === 'completed').length;
  const remaining = DEMO_STOPS.filter(s => s.status === 'pending').length;
  const currentStop = DEMO_STOPS.find(s => s.status === 'current');
  const name = user?.name ?? 'Ramesh';

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
      <LinearGradient
        colors={['#01579B', '#0277BD']}
        style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}
      >
        <Text style={styles.greeting}>{getGreeting()}, {name.split(' ')[0]} 👋</Text>
        <Text style={styles.headerSub}>Municipal Collector · BBMP Zone 3</Text>
        <View style={styles.vehicleRow}>
          <Ionicons name="bus-outline" size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.vehicleText}>Vehicle: KA-01-M-2234 (Demo)</Text>
        </View>
        <View style={styles.shiftRow}>
          <View style={[styles.shiftIndicator, { backgroundColor: onShift ? Colors.success : Colors.error }]} />
          <Text style={styles.shiftLabel}>{onShift ? 'On Shift' : 'Off Shift'}</Text>
          <Switch
            value={onShift}
            onValueChange={setOnShift}
            trackColor={{ false: Colors.gray400, true: '#A5D6A7' }}
            thumbColor={onShift ? Colors.success : Colors.gray300}
            style={styles.shiftSwitch}
          />
          <Text style={styles.demoOnly}>(Demo only)</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <DemoDataBanner message="All stops, stats, and vehicle info are demo data only." />

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Today's Stats</Text>
          <Text style={styles.demoLabel}>⚠️ DEMO FIGURES</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Total Stops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>{completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{remaining}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.collectorAccent }]}>180</Text>
              <Text style={styles.statLabel}>kg Collected*</Text>
            </View>
          </View>
          <Text style={styles.estimatedNote}>* Estimated — Demo only</Text>
        </Card>

        {/* Current Stop */}
        {currentStop && (
          <Card style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Ionicons name="navigate" size={18} color={Colors.collectorAccent} />
              <Text style={styles.currentTitle}>Next Stop</Text>
              <View style={[styles.currentBadge, { backgroundColor: Colors.infoLight }]}>
                <Text style={[styles.currentBadgeText, { color: Colors.collectorAccent }]}>Current</Text>
              </View>
            </View>
            <Text style={styles.currentAddress}>
              {currentStop.houseNumber} · {currentStop.address}
            </Text>
            <View style={styles.currentMeta}>
              <View style={[styles.wasteBadge, { backgroundColor: WASTE_TYPE_COLORS[currentStop.wasteType] + '20' }]}>
                <Text style={[styles.wasteBadgeText, { color: WASTE_TYPE_COLORS[currentStop.wasteType] }]}>
                  {WASTE_TYPE_LABELS[currentStop.wasteType]} waste
                </Text>
              </View>
              <Text style={styles.timeSlotText}>🕐 {currentStop.timeSlot}</Text>
            </View>
            <TouchableOpacity style={styles.navigateBtn} activeOpacity={0.8}>
              <Ionicons name="map" size={16} color={Colors.surface} />
              <Text style={styles.navigateBtnText}>Open Navigation (Demo)</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* All Stops */}
        <Text style={styles.sectionTitle}>All Stops Today</Text>
        <Text style={styles.demoLabel}>⚠️ Demo addresses — not real routes</Text>
        {DEMO_STOPS.map((stop, index) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopRow,
              stop.status === 'current' && styles.stopRowCurrent,
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopAddress}>
                <Text style={styles.stopHouseNum}>{stop.houseNumber}</Text>
                {' · '}{stop.address}
              </Text>
              <View style={styles.stopMeta}>
                <View style={[styles.wasteBadge, { backgroundColor: WASTE_TYPE_COLORS[stop.wasteType] + '20' }]}>
                  <Text style={[styles.wasteBadgeText, { color: WASTE_TYPE_COLORS[stop.wasteType] }]}>
                    {WASTE_TYPE_LABELS[stop.wasteType]}
                  </Text>
                </View>
                <Text style={styles.stopTime}>{stop.timeSlot}</Text>
              </View>
            </View>
            <StatusBadge status={stop.status} />
          </TouchableOpacity>
        ))}

        <View style={styles.footerNote}>
          <Ionicons name="warning-outline" size={14} color={Colors.warning} />
          <Text style={styles.footerNoteText}>
            Demo data — real routes loaded from municipal backend
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {},
  header: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[6],
  },
  greeting: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing[1],
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing[2],
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[3],
  },
  vehicleText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  shiftIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shiftLabel: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
    flex: 1,
  },
  shiftSwitch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  demoOnly: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  body: { padding: Spacing[4], gap: Spacing[3] },
  statsCard: { padding: Spacing[4] },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  demoLabel: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.divider,
  },
  estimatedNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing[2],
    textAlign: 'right',
  },
  currentCard: {
    padding: Spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: Colors.collectorAccent,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  currentTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  currentAddress: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[2],
  },
  currentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.collectorAccent,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    minHeight: 56,
  },
  navigateBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  wasteBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  wasteBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  timeSlotText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  stopRow: {
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
  stopRowCurrent: {
    borderWidth: 2,
    borderColor: Colors.collectorAccent,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  stopInfo: { flex: 1 },
  stopAddress: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  stopHouseNum: { fontWeight: FontWeight.bold },
  stopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  stopTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  statusPill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.warningLight,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginTop: Spacing[2],
  },
  footerNoteText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    flex: 1,
  },
});
