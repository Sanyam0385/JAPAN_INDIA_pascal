// 4-Step Dispute Submission Modal for Shared Record Layer
import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius,
} from '../../constants';
import { Card } from '../ui';
import type { Receipt, DisputeReason, DisputeRaisedBy } from '../../types';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';

interface RaiseDisputeModalProps {
  receipt: Receipt | null;
  visible: boolean;
  onClose: () => void;
  onSuccess?: (disputeId: string) => void;
}

const ISSUE_OPTIONS: { id: DisputeReason; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  {
    id: 'weight_mismatch',
    label: 'Weight Mismatch',
    icon: 'scale-outline',
    desc: 'Doorstep measurement differs from logged or scale weight.',
  },
  {
    id: 'rate_changed',
    label: 'Rate Changed Without Consent',
    icon: 'pricetag-outline',
    desc: 'Locked rate was lowered or silent deductions applied.',
  },
  {
    id: 'contamination_unfair',
    label: 'Contamination Grading Unfair',
    icon: 'warning-outline',
    desc: 'Lot was downgraded or rejected without valid justification.',
  },
  {
    id: 'payment_not_received',
    label: 'Payment Discrepancy',
    icon: 'card-outline',
    desc: 'UPI transfer not received or wrong amount settled.',
  },
];

const MOCK_PHOTO_EVIDENCE = [
  { id: 'scale_calib', label: 'Digital Scale Photo (7.2 kg)', icon: 'camera', filename: 'scale_calib_7_2kg.jpg' },
  { id: 'lot_quality', label: 'Segregated Material Photo', icon: 'image', filename: 'clean_cardboard_lot.jpg' },
  { id: 'upi_sms', label: 'UPI Bank SMS Proof', icon: 'receipt-outline', filename: 'upi_settlement_sms.png' },
];

export function RaiseDisputeModal({
  receipt,
  visible,
  onClose,
  onSuccess,
}: RaiseDisputeModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { createDispute } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedReason, setSelectedReason] = useState<DisputeReason>('weight_mismatch');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [claimedWeight, setClaimedWeight] = useState(receipt ? String(receipt.measuredKg) : '7.0');
  const [claimedRate, setClaimedRate] = useState(receipt ? String(receipt.ratePerKg) : '15');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!receipt) return null;

  const currentRole: DisputeRaisedBy =
    user?.role === 'informal_picker' ? 'picker' :
    user?.role === 'recycler' ? 'recycler' : 'household';

  const partyAccused =
    currentRole === 'household'
      ? (receipt.pickerName ? `${receipt.pickerName} (Picker)` : 'Assigned Collector')
      : (receipt.destinationName ?? 'Apex Polymers MRF');

  const handleNext = () => {
    if (step === 1 && !selectedReason) {
      Alert.alert('Selection Required', 'Please select an issue category.');
      return;
    }
    if (step === 3 && !notes.trim()) {
      Alert.alert('Notes Required', 'Please provide a short explanation describing the issue.');
      return;
    }
    if (step < 4) {
      setStep((step + 1) as any);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as any);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedReason('weight_mismatch');
    setSelectedPhoto(null);
    setNotes('');
    onClose();
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const parsedClaimedWeight = parseFloat(claimedWeight) || receipt.measuredKg;
    const parsedClaimedRate = parseFloat(claimedRate) || receipt.ratePerKg;
    const claimedTotal = parsedClaimedWeight * parsedClaimedRate;
    const variance = Math.abs(claimedTotal - receipt.total);

    const disputeId = createDispute({
      jobId: receipt.jobId,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      raisedBy: currentRole,
      raisedByUserId: user?.id,
      raisedByName: user?.name || (currentRole === 'household' ? 'Household Citizen' : 'Informal Picker'),
      partyAccused,
      material: receipt.material,
      claimedWeight: parsedClaimedWeight,
      measuredWeight: receipt.measuredKg,
      claimedRate: parsedClaimedRate,
      appliedRate: receipt.ratePerKg,
      disputedAmount: variance > 0 ? variance : 20.0,
      reason: selectedReason,
      notes: notes.trim(),
      photoEvidenceUri: selectedPhoto ?? 'evidence_camera_capture.jpg',
      status: 'under_review',
      adminNote: 'Submitted via Shared Record Layer. Auto-routed to Municipal Complaints Desk for arbitration.',
    });

    setIsSubmitting(false);
    Alert.alert(
      'Dispute Submitted for Arbitration ⚖️',
      `Case Reference: ${disputeId.toUpperCase()}\nStatus: Under Human Review.\n\nMunicipal Admin will inspect the photographic evidence and scale audit logs.`,
      [
        {
          text: 'View Receipt',
          onPress: () => {
            handleClose();
            onSuccess?.(disputeId);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + Spacing[3], paddingBottom: insets.bottom + Spacing[3] }]}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name={step === 1 ? 'close' : 'arrow-back'} size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Fair Value Dispute Flow</Text>
              <Text style={styles.headerSub}>Receipt #{receipt.receiptNumber} • Step {step} of 4</Text>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step}/4</Text>
            </View>
          </View>

          {/* Step Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* STEP 1: SELECT ISSUE */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionHeading}>What is the primary discrepancy?</Text>
                <Text style={styles.sectionDesc}>
                  Select the issue that applies to this handoff. All disputes are reviewed by neutral municipal supervisors.
                </Text>

                <View style={styles.optionsList}>
                  {ISSUE_OPTIONS.map(opt => {
                    const isSelected = selectedReason === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        onPress={() => setSelectedReason(opt.id)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                          <Ionicons
                            name={opt.icon}
                            size={22}
                            color={isSelected ? Colors.textInverse : Colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                            {opt.label}
                          </Text>
                          <Text style={styles.optionDesc}>{opt.desc}</Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={isSelected ? Colors.primary : Colors.textTertiary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 2: UPLOAD PHOTO EVIDENCE */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionHeading}>Attach Photographic Proof</Text>
                <Text style={styles.sectionDesc}>
                  Upload clear photos of scale readouts, sorted materials, or transaction messages for administrative audit.
                </Text>

                <View style={styles.evidencePickerGrid}>
                  {MOCK_PHOTO_EVIDENCE.map(item => {
                    const isPicked = selectedPhoto === item.filename;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.evidenceCard, isPicked && styles.evidenceCardPicked]}
                        onPress={() => setSelectedPhoto(item.filename)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={28}
                          color={isPicked ? Colors.primary : Colors.textSecondary}
                        />
                        <Text style={[styles.evidenceLabel, isPicked && styles.evidenceLabelPicked]}>
                          {item.label}
                        </Text>
                        <View style={[styles.checkPill, isPicked && styles.checkPillPicked]}>
                          <Ionicons
                            name={isPicked ? 'checkmark-circle' : 'add'}
                            size={14}
                            color={isPicked ? Colors.textInverse : Colors.textSecondary}
                          />
                          <Text style={[styles.checkPillText, isPicked && styles.checkPillTextPicked]}>
                            {isPicked ? 'Attached' : 'Select'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedPhoto ? (
                  <View style={styles.previewBox}>
                    <Ionicons name="document-attach" size={24} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewTitle}>Evidence Attached: {selectedPhoto}</Text>
                      <Text style={styles.previewMeta}>Timestamp: Just now • Certified SHA-256 Hash</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.tipBox}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
                    <Text style={styles.tipText}>
                      Tip: Tapping an evidence photo simulates attaching a scale snapshot with geolocation metadata.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* STEP 3: CLAIMED VALUES & NOTES */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionHeading}>Specify Details & Variance</Text>
                <Text style={styles.sectionDesc}>
                  State your claimed values versus what was recorded on the receipt.
                </Text>

                <View style={styles.valuesRow}>
                  <View style={styles.valueInputCol}>
                    <Text style={styles.inputLabel}>Recorded Weight</Text>
                    <View style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyText}>{receipt.measuredKg.toFixed(1)} kg</Text>
                    </View>
                  </View>
                  <View style={styles.valueInputCol}>
                    <Text style={styles.inputLabel}>Claimed Weight (kg)</Text>
                    <TextInput
                      style={styles.numericInput}
                      keyboardType="decimal-pad"
                      value={claimedWeight}
                      onChangeText={setClaimedWeight}
                      placeholder="e.g. 7.2"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.valuesRow}>
                  <View style={styles.valueInputCol}>
                    <Text style={styles.inputLabel}>Recorded Rate</Text>
                    <View style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyText}>₹{receipt.ratePerKg.toFixed(1)}/kg</Text>
                    </View>
                  </View>
                  <View style={styles.valueInputCol}>
                    <Text style={styles.inputLabel}>Agreed Rate (₹/kg)</Text>
                    <TextInput
                      style={styles.numericInput}
                      keyboardType="decimal-pad"
                      value={claimedRate}
                      onChangeText={setClaimedRate}
                      placeholder="e.g. 15.0"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.textAreaBox}>
                  <Text style={styles.inputLabel}>Detailed Explanation *</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Describe what occurred during the weighing or payment handoff..."
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionHeading}>Review Dispute Submission</Text>
                <Text style={styles.sectionDesc}>
                  Please confirm the arbitration summary before submitting to the Municipal Administrator.
                </Text>

                <Card style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                    <Text style={styles.summaryHeaderText}>Arbitration Record Summary</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Receipt Reference:</Text>
                    <Text style={styles.summaryVal}>#{receipt.receiptNumber}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Material:</Text>
                    <Text style={styles.summaryVal}>{receipt.material}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Disputant Role:</Text>
                    <Text style={styles.summaryVal}>{currentRole.toUpperCase()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Party Accused:</Text>
                    <Text style={styles.summaryVal}>{partyAccused}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Claimed vs Recorded:</Text>
                    <Text style={[styles.summaryVal, { color: Colors.error }]}>
                      {claimedWeight} kg vs {receipt.measuredKg} kg
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Evidence Attached:</Text>
                    <Text style={styles.summaryVal}>{selectedPhoto ?? 'scale_calib_7_2kg.jpg'}</Text>
                  </View>

                  <View style={styles.summaryNotesBox}>
                    <Text style={styles.summaryNotesLabel}>Statement:</Text>
                    <Text style={styles.summaryNotesBody}>"{notes}"</Text>
                  </View>
                </Card>

                <View style={styles.noticeBox}>
                  <Ionicons name="time-outline" size={18} color="#E65100" />
                  <Text style={styles.noticeText}>
                    Status will change to "under_review". Both parties will be prompted for clarification if needed.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Navigation Button */}
          <View style={styles.footer}>
            {step < 4 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Continue to Step {step + 1}</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#C62828' }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="hammer-outline" size={18} color={Colors.textInverse} />
                <Text style={styles.primaryBtnText}>Submit for Municipal Arbitration</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '92%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: Spacing[3] },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  stepBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing[4],
    borderRadius: 2,
    marginVertical: Spacing[2],
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scrollBody: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[4] },
  stepContent: { paddingTop: Spacing[2], gap: Spacing[3] },
  sectionHeading: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  optionsList: { gap: Spacing[2.5], marginTop: Spacing[1] },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing[3],
  },
  optionCardSelected: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: { backgroundColor: Colors.primary },
  optionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  optionLabelSelected: { color: Colors.primary },
  optionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  evidencePickerGrid: { flexDirection: 'row', gap: Spacing[2.5], marginTop: Spacing[2] },
  evidenceCard: {
    flex: 1,
    padding: Spacing[3],
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing[1.5],
  },
  evidenceCardPicked: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  evidenceLabel: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.textSecondary, textAlign: 'center' },
  evidenceLabelPicked: { color: Colors.primary },
  checkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing[1.5],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  checkPillPicked: { backgroundColor: Colors.primary },
  checkPillText: { fontSize: 10, color: Colors.textSecondary },
  checkPillTextPicked: { color: Colors.textInverse, fontWeight: FontWeight.bold },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing[2.5],
  },
  previewTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  previewMeta: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[2],
  },
  tipText: { flex: 1, fontSize: FontSize.xs, color: '#0277BD' },
  valuesRow: { flexDirection: 'row', gap: Spacing[3] },
  valueInputCol: { flex: 1 },
  inputLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: 4 },
  readOnlyBox: {
    height: 48,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  numericInput: {
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    borderWidth: 1.5,
    borderColor: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  textAreaBox: { marginTop: Spacing[1] },
  textArea: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  summaryCard: { padding: Spacing[3.5], gap: Spacing[2], backgroundColor: Colors.surfaceAlt },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: 4 },
  summaryHeaderText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey: { fontSize: FontSize.xs, color: Colors.textSecondary },
  summaryVal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summaryNotesBox: {
    marginTop: Spacing[2],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryNotesLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textTertiary },
  summaryNotesBody: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[2],
  },
  noticeText: { flex: 1, fontSize: FontSize.xs, color: '#E65100' },
  footer: {
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryBtn: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  primaryBtnText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
