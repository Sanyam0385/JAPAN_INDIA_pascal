// Recycler — Certified Scale Weigh-In Station & Quality Grading
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { FairValueReceiptModal } from '../../src/components/shared';
import type { QualityGrade, Receipt, PickupJob } from '../../src/types';

export default function RecyclerWeighInScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const { pickupJobs, recyclers, createRecyclerIntake, createReceipt } = useAppStore();

  const facility = recyclers[0];

  // Select job from params or first available
  const availableJobs = pickupJobs.filter(j =>
    ['handed_to_recycler', 'weighed', 'claimed', 'rate_locked', 'listed'].includes(j.status)
  );

  const [selectedJobId, setSelectedJobId] = useState<string>(params.jobId || availableJobs[0]?.id || '');

  useEffect(() => {
    if (params.jobId) {
      setSelectedJobId(params.jobId);
    }
  }, [params.jobId]);

  const activeJob: PickupJob | undefined = pickupJobs.find(j => j.id === selectedJobId) || availableJobs[0];

  // Scale inputs
  const [grossInput, setGrossInput] = useState<string>('12.5');
  const [tareInput, setTareInput] = useState<string>('2.0');
  const [ratePerKgInput, setRatePerKgInput] = useState<string>(String(activeJob?.lockedRatePerKg ?? activeJob?.proposedRatePerKg ?? 16));

  // Grading
  const [grade, setGrade] = useState<QualityGrade>('clean');
  const [contaminationNote, setContaminationNote] = useState<string>('');

  // Deductions
  const [moistureDeduction, setMoistureDeduction] = useState<string>('0');
  const [foreignMatterDeduction, setForeignMatterDeduction] = useState<string>('0');

  // Receipt modal state
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (activeJob) {
      const initialWeight = (activeJob.measuredKg ?? activeJob.estimatedKg) + 2.0;
      setGrossInput(String(initialWeight.toFixed(1)));
      setTareInput('2.0');
      setRatePerKgInput(String(activeJob.lockedRatePerKg ?? activeJob.proposedRatePerKg ?? 16));
    }
  }, [selectedJobId]);

  // Compute live net weight & payout
  const gross = parseFloat(grossInput) || 0;
  const tare = parseFloat(tareInput) || 0;
  const netWeight = Math.max(0, Math.round((gross - tare) * 100) / 100);
  const rate = parseFloat(ratePerKgInput) || 16;
  const baseTotal = netWeight * rate;

  // Grade adjustment
  let gradeDeductionPct = 0;
  if (grade === 'mixed') gradeDeductionPct = 0.05;
  if (grade === 'contaminated') gradeDeductionPct = 0.20;

  const moistureAmt = parseFloat(moistureDeduction) || 0;
  const foreignMatterAmt = parseFloat(foreignMatterDeduction) || 0;
  const qualityPenalty = baseTotal * gradeDeductionPct;
  const totalDeductions = qualityPenalty + moistureAmt + foreignMatterAmt;
  const finalPayout = Math.max(0, Math.round((baseTotal - totalDeductions) * 100) / 100);

  const handleZeroScale = () => {
    setTareInput(grossInput);
    Alert.alert('Scale Calibrated', `Tare set to ${grossInput} kg. Scale zeroed.`);
  };

  const handleConfirmIntake = () => {
    if (!activeJob) {
      Alert.alert('No Lot Selected', 'Please select an incoming lot to process.');
      return;
    }
    if (netWeight <= 0) {
      Alert.alert('Invalid Weight', 'Net weight must be greater than 0 kg.');
      return;
    }

    const isContaminated = grade === 'contaminated';

    // 1. Record Intake in Shared Record Layer
    const intakeId = createRecyclerIntake({
      jobId: activeJob.id,
      recyclerId: facility?.id || 'rec-1',
      recyclerName: facility?.name || 'City Center Recycler',
      declaredKg: activeJob.measuredKg ?? activeJob.estimatedKg,
      confirmedKg: netWeight,
      qualityGrade: grade,
      contaminationNote: isContaminated
        ? (contaminationNote.trim() || 'Foreign matter / food residue detected in recyclable lot.')
        : undefined,
      status: 'settled',
      settledAt: new Date().toISOString(),
    });

    // 2. Generate Fair Value Receipt
    const deductionsList = [];
    if (qualityPenalty > 0) {
      deductionsList.push({
        label: `Quality Grade ${grade.toUpperCase()} Adjustment (${Math.round(gradeDeductionPct * 100)}%)`,
        amount: -qualityPenalty,
        isDeduction: true,
        reason: 'Grading adjustment',
      });
    }
    if (moistureAmt > 0) {
      deductionsList.push({
        label: 'Moisture / Water Weight Deduction',
        amount: -moistureAmt,
        isDeduction: true,
        reason: 'Wet condition',
      });
    }
    if (foreignMatterAmt > 0) {
      deductionsList.push({
        label: 'Non-Recyclable Foreign Matter',
        amount: -foreignMatterAmt,
        isDeduction: true,
        reason: contaminationNote || 'Non-recyclable debris',
      });
    }

    const receipt = createReceipt({
      jobId: activeJob.id,
      material: activeJob.material,
      measuredKg: netWeight,
      ratePerKg: rate,
      lineItems: [
        {
          label: `${netWeight.toFixed(2)} kg ${activeJob.material.toUpperCase()} (Net) @ ₹${rate.toFixed(2)}/kg`,
          amount: Math.round(baseTotal * 100) / 100,
        },
        ...deductionsList,
      ],
      total: finalPayout,
      paymentStatus: 'cleared_upi_simulated',
      destinationId: facility?.id || 'rec-1',
      destinationName: facility?.name || 'City Center Recycler',
      householdId: activeJob.householdId,
      householdName: activeJob.householdName,
      pickerId: activeJob.pickerId,
      pickerName: activeJob.pickerName || 'Accredited Collector',
      recyclerId: facility?.id,
    });

    setGeneratedReceipt(receipt);
    Alert.alert(
      'Intake Verified & Settled 🎉',
      `Net ${netWeight.toFixed(2)} kg verified. Payout of ₹${finalPayout.toFixed(2)} cleared via instant UPI.\n\nReceipt #${receipt.receiptNumber} generated.`,
      [{ text: 'View Fair Value Receipt', onPress: () => setGeneratedReceipt(receipt) }]
    );
  };

  const mat = MATERIAL_CATEGORIES.find(m => m.id === activeJob?.material.toLowerCase());

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('recycler.weighAndGrade')}</Text>
          <Text style={styles.subtitle}>{t('recycler.weighSub')}</Text>
        </View>
        <View style={styles.calibratedBadge}>
          <Ionicons name="hardware-chip" size={14} color="#00796B" />
          <Text style={styles.calibratedText}>{t('recycler.calibrated')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Lot Selector */}
        {availableJobs.length > 1 && (
          <View style={styles.lotSelectorWrap}>
            <Text style={styles.fieldLabel}>{t('recycler.selectIncomingLot')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lotScroll}>
              {availableJobs.map(job => (
                <TouchableOpacity
                  key={job.id}
                  style={[styles.lotChip, job.id === selectedJobId && styles.lotChipActive]}
                  onPress={() => setSelectedJobId(job.id)}
                >
                  <Text style={styles.lotChipText}>
                    {job.estimatedKg}kg {job.material.toUpperCase()} ({job.pickerName?.split(' ')[0] || 'Collector'})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Digital Scale Readout Display */}
        <Card style={styles.scaleCard}>
          <View style={styles.scaleHeader}>
            <View style={styles.scaleMeta}>
              <Ionicons name="speedometer-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.scaleMetaText}>DIGITAL WEIGHT TRANSDUCER (S/N: MRF-4029)</Text>
            </View>
            <TouchableOpacity style={styles.zeroBtn} onPress={handleZeroScale}>
              <Ionicons name="refresh" size={12} color="#FFFFFF" />
              <Text style={styles.zeroBtnText}>{t('recycler.zeroTare')}</Text>
            </TouchableOpacity>
          </View>

          {/* Large Monospace Digital Net Readout */}
          <View style={styles.digitalDisplay}>
            <Text style={styles.digitalPrefix}>{t('recycler.netWeight')}</Text>
            <Text style={styles.digitalValue}>
              {netWeight.toFixed(2)} <Text style={styles.digitalUnit}>kg</Text>
            </Text>
          </View>

          {/* Gross vs Tare inputs */}
          <View style={styles.scaleInputRow}>
            <View style={styles.scaleInputGroup}>
              <Text style={styles.scaleInputLabel}>{t('recycler.grossWeight')}</Text>
              <TextInput
                style={styles.scaleInput}
                keyboardType="numeric"
                value={grossInput}
                onChangeText={setGrossInput}
                placeholder="12.5"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            </View>
            <View style={styles.scaleInputDivider} />
            <View style={styles.scaleInputGroup}>
              <Text style={styles.scaleInputLabel}>{t('recycler.tareWeight')}</Text>
              <TextInput
                style={styles.scaleInput}
                keyboardType="numeric"
                value={tareInput}
                onChangeText={setTareInput}
                placeholder="2.0"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            </View>
          </View>
        </Card>

        {/* Quality Grading System */}
        <Text style={styles.sectionHeading}>{t('recycler.qualityGrading')}</Text>
        <View style={styles.gradeGrid}>
          {[
            { id: 'clean' as QualityGrade, label: 'Grade A', sub: 'Clean & Pure', desc: '100% full payout', color: '#1B5E20' },
            { id: 'mixed' as QualityGrade, label: 'Grade B', sub: 'Mixed / Dust', desc: '5% deduction', color: '#E65100' },
            { id: 'contaminated' as QualityGrade, label: 'Contaminated', sub: 'Residue / Moisture', desc: '20% deduction + flag', color: '#C62828' },
          ].map(g => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.gradeCard,
                grade === g.id && { borderColor: g.color, backgroundColor: g.color + '15', borderWidth: 2 },
              ]}
              onPress={() => setGrade(g.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.gradeLabel, { color: g.color }]}>{g.label}</Text>
              <Text style={styles.gradeSub}>{g.sub}</Text>
              <Text style={styles.gradeDesc}>{g.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contamination feedback loop if contaminated */}
        {grade === 'contaminated' && (
          <Card style={styles.contaminationBox}>
            <View style={styles.contaminationHeader}>
              <Ionicons name="warning" size={18} color="#C62828" />
              <Text style={styles.contaminationTitle}>Contamination Feedback Note</Text>
            </View>
            <Text style={styles.contaminationSub}>
              This note will automatically notify the collector and origin household with actionable segregation tips.
            </Text>
            <TextInput
              style={styles.contaminationInput}
              multiline
              numberOfLines={3}
              placeholder="e.g. Found food residue, bottle caps unremoved, high grease content."
              value={contaminationNote}
              onChangeText={setContaminationNote}
            />
          </Card>
        )}

        {/* Deductions Calculator */}
        <Card style={styles.deductionCard}>
          <Text style={styles.cardTitle}>Itemized Deductions Calculator</Text>

          <View style={styles.deductionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deductionLabel}>Moisture / Water Deduction (₹)</Text>
              <Text style={styles.deductionHint}>For soaked cardboard or unemptied bottles</Text>
            </View>
            <TextInput
              style={styles.deductionInput}
              keyboardType="numeric"
              value={moistureDeduction}
              onChangeText={setMoistureDeduction}
              placeholder="0"
            />
          </View>

          <View style={styles.deductionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deductionLabel}>Foreign Matter / Debris (₹)</Text>
              <Text style={styles.deductionHint}>Stones, dirt, non-recyclable items</Text>
            </View>
            <TextInput
              style={styles.deductionInput}
              keyboardType="numeric"
              value={foreignMatterDeduction}
              onChangeText={setForeignMatterDeduction}
              placeholder="0"
            />
          </View>
        </Card>

        {/* Live Financial Settlement Card */}
        <Card style={styles.settlementCard}>
          <Text style={styles.settlementTitle}>Intake Settlement Summary</Text>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryText}>
              Base Material ({netWeight.toFixed(2)} kg @ ₹{rate.toFixed(2)}/kg)
            </Text>
            <Text style={styles.summaryText}>₹{baseTotal.toFixed(2)}</Text>
          </View>

          {totalDeductions > 0 && (
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryText, { color: '#C62828' }]}>
                Total Deductions (Grading & Contaminants)
              </Text>
              <Text style={[styles.summaryText, { color: '#C62828' }]}>
                -₹{totalDeductions.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.settlementDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>FINAL CLEARED PAYOUT</Text>
              <Text style={styles.totalPaymentMode}>Payment: Instant UPI (Simulated)</Text>
            </View>
            <Text style={styles.totalValue}>₹{finalPayout.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmIntake}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>{t('recycler.confirmIntake')}</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Fair Value Receipt Modal */}
      <FairValueReceiptModal
        visible={!!generatedReceipt}
        receipt={generatedReceipt}
        onClose={() => setGeneratedReceipt(null)}
      />
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
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  calibratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2F1',
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  calibratedText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#00796B' },
  content: { padding: Spacing[4], gap: Spacing[3] },
  lotSelectorWrap: { gap: Spacing[1] },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  lotScroll: { gap: Spacing[2], paddingVertical: 2 },
  lotChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  lotChipActive: { backgroundColor: '#00796B', borderColor: '#00796B' },
  lotChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  scaleCard: {
    backgroundColor: '#004D40',
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    gap: Spacing[3],
  },
  scaleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scaleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scaleMetaText: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  zeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  zeroBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: FontWeight.bold },
  digitalDisplay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  digitalPrefix: { fontSize: 9, color: '#80CBC4', fontWeight: FontWeight.bold, letterSpacing: 1 },
  digitalValue: { fontSize: 40, fontWeight: FontWeight.extrabold, color: '#A7FFEB', fontFamily: 'monospace' },
  digitalUnit: { fontSize: FontSize.lg, fontWeight: FontWeight.regular, color: '#80CBC4' },
  scaleInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  scaleInputGroup: { flex: 1, gap: 2 },
  scaleInputLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },
  scaleInput: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  scaleInputDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionHeading: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing[1] },
  gradeGrid: { flexDirection: 'row', gap: Spacing[2] },
  gradeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    alignItems: 'center',
    gap: 2,
  },
  gradeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  gradeSub: { fontSize: 10, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  gradeDesc: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  contaminationBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    padding: Spacing[3],
    gap: Spacing[2],
  },
  contaminationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contaminationTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#C62828' },
  contaminationSub: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  contaminationInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#EF9A9A',
    borderRadius: BorderRadius.sm,
    padding: Spacing[2.5],
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  deductionCard: { padding: Spacing[4], gap: Spacing[3] },
  cardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  deductionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[2] },
  deductionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  deductionHint: { fontSize: 10, color: Colors.textSecondary },
  deductionInput: {
    width: 70,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1.5],
    textAlign: 'center',
    fontWeight: FontWeight.bold,
  },
  settlementCard: {
    backgroundColor: '#E0F2F1',
    borderColor: '#80CBC4',
    borderWidth: 1,
    padding: Spacing[4],
    gap: Spacing[2.5],
  },
  settlementTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#004D40' },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  settlementDivider: { height: 1, backgroundColor: '#B2DFDB', marginVertical: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: '#004D40', letterSpacing: 0.5 },
  totalPaymentMode: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  totalValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#00796B' },
  confirmBtn: {
    minHeight: 56,
    backgroundColor: '#00796B',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[1],
    ...Shadow.base,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
