// Recycler — Incoming Loads Screen
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';

export default function RecyclerIncomingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { pickupJobs, recyclers } = useAppStore();

  const facility = recyclers[0] || {
    name: 'City Center Recycler',
    locality: 'Yeshwanthpur Industrial Suburb',
  };

  // Incoming loads: jobs that are either handed_to_recycler, weighed, claimed, or completed
  const incomingLoads = pickupJobs.filter(j =>
    ['handed_to_recycler', 'weighed', 'claimed', 'rate_locked'].includes(j.status)
  );

  const totalWaitingKg = incomingLoads.reduce((acc, j) => acc + (j.measuredKg ?? j.estimatedKg), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>{t('recycler.intakeDock')}</Text>
          </View>
          <Text style={styles.title}>{t('recycler.incomingLoads')}</Text>
          <Text style={styles.subtitle}>{facility.name} • {facility.locality}</Text>
        </View>
        <View style={styles.dockStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.dockStatusText}>{t('recycler.scaleOnline')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dock Overview Bar */}
        <View style={styles.dockBar}>
          <View style={styles.dockMetric}>
            <Text style={styles.dockValue}>{incomingLoads.length}</Text>
            <Text style={styles.dockLabel}>{t('recycler.lotsInTransit')}</Text>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockMetric}>
            <Text style={styles.dockValue}>{totalWaitingKg.toFixed(1)} kg</Text>
            <Text style={styles.dockLabel}>{t('recycler.expectedInflow')}</Text>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockMetric}>
            <Text style={styles.dockValue}>500 kg</Text>
            <Text style={styles.dockLabel}>{t('recycler.dailyCap')}</Text>
          </View>
        </View>

        {/* Informational Guidance */}
        <Card variant="filled" style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <Ionicons name="information-circle" size={20} color="#00796B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{t('recycler.handoffVerification')}</Text>
              <Text style={styles.noticeBody}>
                {t('recycler.handoffVerificationBody')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Incoming Lots List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recycler.awaitingIntake')}</Text>
          <Text style={styles.sectionSubtitle}>{t('recycler.selectLotToWeigh')}</Text>
        </View>

        {incomingLoads.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🚛</Text>
            <Text style={styles.emptyTitle}>{t('recycler.intakeDockClear')}</Text>
            <Text style={styles.emptyText}>{t('recycler.noIncomingLoads')}</Text>
          </Card>
        ) : (
          incomingLoads.map((job) => {
            const mat = MATERIAL_CATEGORIES.find(m => m.id === job.material.toLowerCase());
            const rate = job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15;
            const weight = job.measuredKg ?? job.estimatedKg;
            const estPayout = rate * weight;

            return (
              <Card key={job.id} style={styles.lotCard}>
                <View style={styles.lotHeader}>
                  <View style={styles.matInfo}>
                    <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                    <View>
                      <Text style={styles.matName}>{mat?.label || job.material.toUpperCase()}</Text>
                      <Text style={styles.lotWard}>Origin: {job.location.ward}</Text>
                    </View>
                  </View>
                  <Badge
                    label={job.status.replace(/_/g, ' ')}
                    variant={job.status === 'handed_to_recycler' ? 'warning' : 'info'}
                    size="sm"
                  />
                </View>

                {/* Metrics Box */}
                <View style={styles.metricsBox}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>DECLARED WEIGHT</Text>
                    <Text style={styles.metricValue}>{weight.toFixed(1)} kg</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>LOCKED RATE</Text>
                    <Text style={styles.metricValue}>₹{rate.toFixed(2)}/kg</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>EST. PAYOUT</Text>
                    <Text style={[styles.metricValue, { color: '#00796B' }]}>₹{estPayout.toFixed(0)}</Text>
                  </View>
                </View>

                {/* Collector & Handoff Info */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-circle" size={16} color={Colors.pickerAccent} />
                    <Text style={styles.infoText}>
                      Collector: <Text style={styles.infoBold}>{job.pickerName || 'Accredited Collector (Meena Devi)'}</Text>
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>Arrived / Window: {job.window}</Text>
                  </View>
                </View>

                {/* Primary Action Button (Glove-friendly >= 56px) */}
                <TouchableOpacity
                  style={styles.intakeActionBtn}
                  onPress={() => router.push(`/(recycler)/weigh-in?jobId=${job.id}` as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="scale-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.intakeActionBtnText}>Start Intake & Weigh-In</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
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
  facilityPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 121, 107, 0.1)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  facilityPillText: { fontSize: 9, fontWeight: FontWeight.bold, color: '#00796B', letterSpacing: 0.5 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  dockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2F1',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00796B' },
  dockStatusText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#00796B' },
  content: { padding: Spacing[4], gap: Spacing[3] },
  dockBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing[3.5],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dockMetric: { flex: 1, alignItems: 'center' },
  dockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#00796B' },
  dockLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  dockDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  noticeCard: { backgroundColor: '#E0F2F1', borderColor: '#B2DFDB' },
  noticeRow: { flexDirection: 'row', gap: Spacing[2.5], alignItems: 'center' },
  noticeTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#00796B' },
  noticeBody: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  sectionHeader: { marginTop: Spacing[1], marginBottom: 2 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  lotCard: { padding: Spacing[4], gap: Spacing[3] },
  lotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  matIcon: { fontSize: 32 },
  matName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  lotWard: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
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
  infoSection: { gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  infoText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  infoBold: { color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  intakeActionBtn: {
    minHeight: 56,
    backgroundColor: '#00796B',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.base,
  },
  intakeActionBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
