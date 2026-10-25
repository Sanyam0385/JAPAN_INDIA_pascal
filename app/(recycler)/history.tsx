// Recycler — Intake History & Settlement Slips
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { FairValueReceiptModal } from '../../src/components/shared';
import type { Receipt } from '../../src/types';

export default function RecyclerHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { recyclerIntakes, receipts, pickupJobs } = useAppStore();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const totalKg = recyclerIntakes.reduce((acc, i) => acc + i.confirmedKg, 0);
  const gradeACount = recyclerIntakes.filter(i => i.qualityGrade === 'clean').length;
  const gradeAPct = recyclerIntakes.length > 0
    ? Math.round((gradeACount / recyclerIntakes.length) * 100)
    : 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('recycler.intakeHistory')}</Text>
        <Text style={styles.subtitle}>{t('recycler.historySub')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Performance Metrics */}
        <View style={styles.metricBar}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{recyclerIntakes.length}</Text>
            <Text style={styles.metricLabel}>{t('recycler.totalIntakes')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalKg.toFixed(1)} kg</Text>
            <Text style={styles.metricLabel}>{t('recycler.recoveredMaterial')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#00796B' }]}>{gradeAPct}%</Text>
            <Text style={styles.metricLabel}>{t('recycler.gradeARatio')}</Text>
          </View>
        </View>

        {/* Intakes List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recycler.auditTrail')}</Text>
          <Text style={styles.sectionSubtitle}>{t('recycler.auditTrailSub')}</Text>
        </View>

        {recyclerIntakes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📜</Text>
            <Text style={styles.emptyTitle}>{t('recycler.noIntakesRecorded')}</Text>
            <Text style={styles.emptyText}>{t('recycler.noIntakesSub')}</Text>
          </Card>
        ) : (
          recyclerIntakes.map((intake) => {
            const job = pickupJobs.find(j => j.id === intake.jobId);
            const mat = MATERIAL_CATEGORIES.find(m => m.id === job?.material.toLowerCase());
            const matchedReceipt = receipts.find(r => r.jobId === intake.jobId) || receipts[0];

            const isGradeA = intake.qualityGrade === 'clean';
            const isContaminated = intake.qualityGrade === 'contaminated';

            return (
              <Card key={intake.id} style={styles.intakeCard}>
                <View style={styles.intakeHeader}>
                  <View style={styles.matInfo}>
                    <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                    <View>
                      <Text style={styles.matTitle}>
                        {intake.confirmedKg.toFixed(1)} kg {job?.material.toUpperCase() || 'RECYCLABLE'}
                      </Text>
                      <Text style={styles.intakeDate}>
                        {intake.settledAt
                          ? new Date(intake.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : 'Settled'}
                      </Text>
                    </View>
                  </View>

                  {/* Quality Grade Badge */}
                  <View style={[
                    styles.gradeBadge,
                    isGradeA ? styles.gradeClean : isContaminated ? styles.gradeContaminated : styles.gradeMixed,
                  ]}>
                    <Ionicons
                      name={isGradeA ? 'checkmark-circle' : isContaminated ? 'alert-circle' : 'information-circle'}
                      size={12}
                      color={isGradeA ? '#1B5E20' : isContaminated ? '#C62828' : '#E65100'}
                    />
                    <Text style={[
                      styles.gradeBadgeText,
                      isGradeA ? { color: '#1B5E20' } : isContaminated ? { color: '#C62828' } : { color: '#E65100' },
                    ]}>
                      {isGradeA ? 'Grade A' : isContaminated ? 'Contaminated' : 'Grade B'}
                    </Text>
                  </View>
                </View>

                {/* Intake Details */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailText}>
                    👤 Collector: <Text style={styles.detailBold}>{job?.pickerName || 'Accredited Collector'}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    📍 Origin: {job?.location.ward || 'BBMP Ward 150'}
                  </Text>
                  <Text style={styles.detailText}>
                    💰 Cleared Payout: <Text style={[styles.detailBold, { color: '#00796B' }]}>₹{(matchedReceipt?.total ?? 120).toFixed(2)} (UPI)</Text>
                  </Text>
                  {intake.contaminationNote ? (
                    <View style={styles.contaminationNoteBox}>
                      <Ionicons name="warning-outline" size={14} color="#C62828" />
                      <Text style={styles.contaminationNoteText}>{intake.contaminationNote}</Text>
                    </View>
                  ) : null}
                </View>

                {/* View Receipt Button */}
                {matchedReceipt ? (
                  <TouchableOpacity
                    style={styles.viewReceiptBtn}
                    onPress={() => setSelectedReceipt(matchedReceipt)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={16} color="#00796B" />
                    <Text style={styles.viewReceiptBtnText}>View Fair Value Receipt</Text>
                  </TouchableOpacity>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Fair Value Receipt Modal */}
      <FairValueReceiptModal
        visible={!!selectedReceipt}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
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
  metricBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing[3.5],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  metricLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  metricDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  sectionHeader: { marginTop: Spacing[1], marginBottom: 2 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  intakeCard: { padding: Spacing[4], gap: Spacing[3] },
  intakeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  matIcon: { fontSize: 32 },
  matTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  intakeDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  gradeClean: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  gradeMixed: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
  gradeContaminated: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  gradeBadgeText: { fontSize: 11, fontWeight: FontWeight.bold },
  detailsBox: {
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  detailText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  detailBold: { color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  contaminationNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  contaminationNoteText: { fontSize: 11, color: '#C62828', flex: 1 },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2.5],
    backgroundColor: 'rgba(0, 121, 107, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 121, 107, 0.25)',
  },
  viewReceiptBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#00796B',
  },
});
