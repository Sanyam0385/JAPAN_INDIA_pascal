// Municipal Administrator — Complaints & Grievance Resolution + Fair Value Disputes Arbitration
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { FairValueReceiptModal } from '../../src/components/shared';
import type { Complaint, ComplaintStatus, Dispute, DisputeStatus, Receipt } from '../../src/types';

export default function AdminComplaintsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    complaints, updateComplaintStatus,
    disputes, resolveDispute, updateDisputeStatus,
    receipts,
  } = useAppStore();

  // Top Section: 'complaints' vs 'disputes'
  const [section, setSection] = useState<'disputes' | 'complaints'>('disputes');

  // Filter for complaints
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'submitted' | 'in_progress' | 'resolved'>('all');
  const [resolveModalComplaint, setResolveModalComplaint] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Filter for disputes
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'under_review' | 'open' | 'resolved'>('all');
  const [arbitrateDispute, setArbitrateDispute] = useState<Dispute | null>(null);
  const [arbitrationAction, setArbitrationAction] = useState<'split' | 'uphold' | 'adjust'>('split');
  const [arbitrationNote, setArbitrationNote] = useState('');
  const [customAdjustedTotal, setCustomAdjustedTotal] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Active counts
  const activeComplaintsCount = complaints.filter(c => c.status !== 'resolved').length;
  const activeDisputesCount = disputes.filter(d => d.status !== 'resolved').length;

  const filteredComplaints = complaints.filter(c => {
    if (complaintFilter === 'all') return true;
    return c.status === complaintFilter;
  });

  const filteredDisputes = disputes.filter(d => {
    if (disputeFilter === 'all') return true;
    return d.status === disputeFilter;
  });

  // Complaint handlers
  const handleResolveComplaint = () => {
    if (!resolveModalComplaint) return;
    if (!resolutionText.trim()) {
      Alert.alert('Missing Note', 'Please provide an official resolution action note.');
      return;
    }
    updateComplaintStatus(resolveModalComplaint.id, 'resolved', resolutionText.trim());
    setResolveModalComplaint(null);
    setResolutionText('');
    Alert.alert('Grievance Resolved ✅', 'The citizen has received an in-app resolution notification.');
  };

  const handleQuickAdvanceComplaint = (complaintId: string, nextStatus: ComplaintStatus) => {
    updateComplaintStatus(complaintId, nextStatus);
    Alert.alert('Status Updated', `Grievance status changed to ${nextStatus}.`);
  };

  // Dispute handlers
  const handleOpenArbitration = (d: Dispute) => {
    setArbitrateDispute(d);
    setArbitrationAction('split');
    const claimedTotal = (d.claimedWeight || 0) * (d.claimedRate || 0);
    const measuredTotal = (d.measuredWeight || 0) * (d.appliedRate || 0);
    const splitTotal = Math.round(((claimedTotal + measuredTotal) / 2) * 10) / 10;
    setCustomAdjustedTotal(String(splitTotal || (d.disputedAmount ? d.disputedAmount : 100)));
    setArbitrationNote(`Supervisor reviewed evidence (${d.photoEvidenceUri || 'scale audit'}). Compromise split applied for fair settlement.`);
  };

  const handleExecuteArbitration = () => {
    if (!arbitrateDispute) return;
    if (!arbitrationNote.trim()) {
      Alert.alert('Note Required', 'Please enter a supervisor arbitration note for the immutable audit trail.');
      return;
    }

    let finalAdjustedTotal: number | undefined;
    let resolutionDesc = '';

    const claimed = (arbitrateDispute.claimedWeight || 0) * (arbitrateDispute.claimedRate || 0);
    const measured = (arbitrateDispute.measuredWeight || 0) * (arbitrateDispute.appliedRate || 0);

    if (arbitrationAction === 'uphold') {
      finalAdjustedTotal = measured > 0 ? measured : undefined;
      resolutionDesc = 'Original recorded scale measurement upheld following calibration audit.';
    } else if (arbitrationAction === 'split') {
      finalAdjustedTotal = parseFloat(customAdjustedTotal) || Math.round(((claimed + measured) / 2) * 10) / 10;
      resolutionDesc = `50/50 compromise split enacted. Settlement adjusted to ₹${finalAdjustedTotal.toFixed(2)}.`;
    } else {
      finalAdjustedTotal = parseFloat(customAdjustedTotal) || claimed;
      resolutionDesc = `Custom adjustment enacted by Municipal Admin: adjusted payout set to ₹${finalAdjustedTotal.toFixed(2)}.`;
    }

    resolveDispute(
      arbitrateDispute.id,
      resolutionDesc,
      arbitrationNote.trim(),
      finalAdjustedTotal,
      arbitrationAction,
    );

    setArbitrateDispute(null);
    Alert.alert(
      'Dispute Arbitrated & Reconciled ⚖️',
      `Action: ${arbitrationAction.toUpperCase()}\nResolution: ${resolutionDesc}\n\nThe Fair Value Receipt has been reconciled in the Shared Record Layer and all parties notified.`,
    );
  };

  const handleViewReceipt = (receiptNumber?: string, jobId?: string) => {
    const rcpt = receipts.find(r => r.receiptNumber === receiptNumber || r.jobId === jobId);
    if (rcpt) {
      setSelectedReceipt(rcpt);
    } else {
      Alert.alert('Receipt Record', `Receipt record for ${receiptNumber ?? jobId} is verified on the municipal ledger.`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('admin.complaintsDesk')}</Text>
        <Text style={styles.subtitle}>{t('admin.supervisoryOverview')}</Text>
      </View>

      {/* Main Mode Switcher: Disputes vs Citizen Complaints */}
      <View style={styles.sectionSwitcher}>
        <TouchableOpacity
          style={[styles.sectionBtn, section === 'disputes' && styles.sectionBtnActive]}
          onPress={() => setSection('disputes')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="scale-outline"
            size={18}
            color={section === 'disputes' ? Colors.textInverse : Colors.textSecondary}
          />
          <Text style={[styles.sectionBtnText, section === 'disputes' && styles.sectionBtnTextActive]}>
            {t('admin.activeDisputes')}
          </Text>
          {activeDisputesCount > 0 && (
            <View style={[styles.badgePill, section === 'disputes' && styles.badgePillActive]}>
              <Text style={[styles.badgePillText, section === 'disputes' && styles.badgePillTextActive]}>
                {activeDisputesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionBtn, section === 'complaints' && styles.sectionBtnActive]}
          onPress={() => setSection('complaints')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="megaphone-outline"
            size={18}
            color={section === 'complaints' ? Colors.textInverse : Colors.textSecondary}
          />
          <Text style={[styles.sectionBtnText, section === 'complaints' && styles.sectionBtnTextActive]}>
            {t('complaint.title')}
          </Text>
          {activeComplaintsCount > 0 && (
            <View style={[styles.badgePill, section === 'complaints' && styles.badgePillActive]}>
              <Text style={[styles.badgePillText, section === 'complaints' && styles.badgePillTextActive]}>
                {activeComplaintsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* SECTION 1: FAIR VALUE DISPUTES */}
      {section === 'disputes' && (
        <>
          <View style={styles.tabs}>
            {[
              { key: 'all', label: 'All' },
              { key: 'under_review', label: 'Under Review' },
              { key: 'open', label: 'Open' },
              { key: 'resolved', label: 'Resolved' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, disputeFilter === tab.key && styles.tabActive]}
                onPress={() => setDisputeFilter(tab.key as any)}
              >
                <Text style={[styles.tabText, disputeFilter === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
            showsVerticalScrollIndicator={false}
          >
            {filteredDisputes.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>⚖️</Text>
                <Text style={styles.emptyTitle}>No Disputes in This Queue</Text>
                <Text style={styles.emptyText}>All handoffs and Fair Value Receipts are currently in agreement.</Text>
              </Card>
            ) : (
              filteredDisputes.map(d => {
                const isUnderReview = d.status === 'under_review';
                const isResolved = d.status === 'resolved';

                return (
                  <Card key={d.id} style={styles.disputeCard}>
                    {/* Header: ID, Reference, Role */}
                    <View style={styles.cardHeader}>
                      <View>
                        <View style={styles.disputeIdRow}>
                          <Text style={styles.disputeIdText}>CASE #{d.id.toUpperCase()}</Text>
                          {d.receiptNumber && (
                            <TouchableOpacity onPress={() => handleViewReceipt(d.receiptNumber, d.jobId)}>
                              <Text style={styles.receiptLinkText}>• #{d.receiptNumber}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.materialTitle}>{d.material ?? 'Recyclable Materials'}</Text>
                      </View>
                      <View style={[
                        styles.statusChip,
                        isUnderReview ? styles.statusUnderReview : isResolved ? styles.statusResolved : styles.statusOpen
                      ]}>
                        <Text style={[
                          styles.statusChipText,
                          isUnderReview ? styles.statusUnderReviewText : isResolved ? styles.statusResolvedText : styles.statusOpenText
                        ]}>
                          {d.status.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Disputant & Accused Info */}
                    <View style={styles.partiesGrid}>
                      <View style={styles.partyBox}>
                        <Text style={styles.partyLabel}>DISPUTANT ({d.raisedBy.toUpperCase()})</Text>
                        <Text style={styles.partyName}>{d.raisedByName ?? 'Citizen Disputant'}</Text>
                      </View>
                      <View style={styles.partyBox}>
                        <Text style={styles.partyLabel}>PARTY ACCUSED</Text>
                        <Text style={styles.partyName}>{d.partyAccused ?? 'Assigned Collector'}</Text>
                      </View>
                    </View>

                    {/* Disputed Metrics Comparison */}
                    <View style={styles.metricVarianceBox}>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricColLabel}>Claimed</Text>
                        <Text style={styles.metricColVal}>
                          {d.claimedWeight ? `${d.claimedWeight.toFixed(1)} kg` : '—'}
                          {d.claimedRate ? ` @ ₹${d.claimedRate}/kg` : ''}
                        </Text>
                      </View>
                      <View style={styles.metricArrowCol}>
                        <Ionicons name="arrow-forward" size={16} color={Colors.textTertiary} />
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricColLabel}>Recorded</Text>
                        <Text style={styles.metricColVal}>
                          {d.measuredWeight ? `${d.measuredWeight.toFixed(1)} kg` : '—'}
                          {d.appliedRate ? ` @ ₹${d.appliedRate}/kg` : ''}
                        </Text>
                      </View>
                      <View style={styles.varianceCol}>
                        <Text style={styles.varianceColLabel}>Variance</Text>
                        <Text style={styles.varianceColVal}>₹{d.disputedAmount ? d.disputedAmount.toFixed(1) : '20.0'}</Text>
                      </View>
                    </View>

                    {/* Disputant Statement */}
                    <View style={styles.statementBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.statementText}>"{d.notes}"</Text>
                    </View>

                    {/* Photo Evidence Attached */}
                    {d.photoEvidenceUri && (
                      <View style={styles.evidenceRow}>
                        <Ionicons name="camera" size={14} color={Colors.primary} />
                        <Text style={styles.evidenceText}>Evidence: {d.photoEvidenceUri}</Text>
                        <Badge label="Validated" variant="success" size="sm" />
                      </View>
                    )}

                    {/* Admin Resolution Details if resolved */}
                    {isResolved && d.resolution && (
                      <View style={styles.resolutionAuditBox}>
                        <View style={styles.resolutionAuditHeader}>
                          <Ionicons name="checkmark-circle" size={15} color="#2E7D32" />
                          <Text style={styles.resolutionAuditTitle}>ARBITRATION RESOLUTION</Text>
                        </View>
                        <Text style={styles.resolutionAuditBody}>{d.resolution}</Text>
                        {d.adminNote && (
                          <Text style={styles.resolutionAuditNote}>Supervisor Note: {d.adminNote}</Text>
                        )}
                        {d.adjustedTotal !== undefined && (
                          <Text style={styles.reconciledTotal}>Reconciled Total: ₹{d.adjustedTotal.toFixed(2)}</Text>
                        )}
                      </View>
                    )}

                    {/* Action Bar */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.viewReceiptBtn}
                        onPress={() => handleViewReceipt(d.receiptNumber, d.jobId)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="receipt-outline" size={15} color={Colors.textPrimary} />
                        <Text style={styles.viewReceiptBtnText}>View Receipt</Text>
                      </TouchableOpacity>

                      {!isResolved ? (
                        <TouchableOpacity
                          style={styles.arbitrateBtn}
                          onPress={() => handleOpenArbitration(d)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="hammer-outline" size={16} color={Colors.textInverse} />
                          <Text style={styles.arbitrateBtnText}>Review & Arbitrate</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </Card>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      {/* SECTION 2: CITIZEN GRIEVANCES */}
      {section === 'complaints' && (
        <>
          <View style={styles.tabs}>
            {[
              { key: 'all', label: 'All' },
              { key: 'submitted', label: 'New' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'resolved', label: 'Resolved' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, complaintFilter === tab.key && styles.tabActive]}
                onPress={() => setComplaintFilter(tab.key as any)}
              >
                <Text style={[styles.tabText, complaintFilter === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
            showsVerticalScrollIndicator={false}
          >
            {filteredComplaints.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>No Complaints Under This Filter</Text>
              </Card>
            ) : (
              filteredComplaints.map(c => (
                <Card key={c.id} style={styles.complaintCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.refNumber}>{c.referenceNumber}</Text>
                      <Text style={styles.categoryTitle}>{c.category.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                    <Badge
                      label={c.status}
                      variant={c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'error'}
                    />
                  </View>

                  <Text style={styles.descText}>{c.description}</Text>

                  <View style={styles.metaBox}>
                    <Text style={styles.metaText}>📍 Locality: {c.locality}</Text>
                    <Text style={styles.metaText}>📅 Reported: {new Date(c.createdAt).toLocaleDateString('en-IN')}</Text>
                  </View>

                  {c.resolution ? (
                    <View style={styles.resolutionBox}>
                      <Text style={styles.resolutionLabel}>SUPERVISOR RESOLUTION NOTE:</Text>
                      <Text style={styles.resolutionBody}>{c.resolution}</Text>
                    </View>
                  ) : null}

                  {c.status !== 'resolved' ? (
                    <View style={styles.actionRow}>
                      {c.status === 'submitted' ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: Colors.info }]}
                          onPress={() => handleQuickAdvanceComplaint(c.id, 'in_progress')}
                        >
                          <Text style={styles.actionBtnText}>Assign Inspector</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                        onPress={() => {
                          setResolveModalComplaint(c);
                          setResolutionText(`Inspected on ${new Date().toLocaleDateString('en-IN')}. Area cleaned and collector notified.`);
                        }}
                      >
                        <Text style={styles.actionBtnText}>Mark Resolved</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </Card>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* ARBITRATION MODAL (ADMIN SIDE-BY-SIDE REVIEW) */}
      <Modal visible={!!arbitrateDispute} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Human Review & Arbitration</Text>
                <Text style={styles.modalSubtitle}>Case #{arbitrateDispute?.id.toUpperCase()} • Shared Record Layer</Text>
              </View>
              <TouchableOpacity onPress={() => setArbitrateDispute(null)}>
                <Ionicons name="close-circle" size={26} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[3], paddingBottom: Spacing[4] }}>
              {arbitrateDispute && (
                <>
                  {/* Side-by-Side Comparison Box */}
                  <View style={styles.sideBySideContainer}>
                    {/* Disputant Claimed */}
                    <View style={styles.sideColClaimed}>
                      <View style={styles.sideHeader}>
                        <Text style={styles.sideBadgeClaimed}>CLAIMED</Text>
                        <Text style={styles.sideRole}>{arbitrateDispute.raisedBy.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.sideValueBig}>
                        {arbitrateDispute.claimedWeight ? `${arbitrateDispute.claimedWeight.toFixed(1)} kg` : '—'}
                      </Text>
                      <Text style={styles.sideRate}>
                        @ ₹{arbitrateDispute.claimedRate ?? '15'}/kg
                      </Text>
                      <Text style={styles.sideTotal}>
                        Total: ₹{((arbitrateDispute.claimedWeight || 0) * (arbitrateDispute.claimedRate || 0)).toFixed(2)}
                      </Text>
                    </View>

                    {/* Recorded in Record Layer */}
                    <View style={styles.sideColRecorded}>
                      <View style={styles.sideHeader}>
                        <Text style={styles.sideBadgeRecorded}>RECORDED</Text>
                        <Text style={styles.sideRole}>SCALE LOG</Text>
                      </View>
                      <Text style={styles.sideValueBig}>
                        {arbitrateDispute.measuredWeight ? `${arbitrateDispute.measuredWeight.toFixed(1)} kg` : '—'}
                      </Text>
                      <Text style={styles.sideRate}>
                        @ ₹{arbitrateDispute.appliedRate ?? '15'}/kg
                      </Text>
                      <Text style={styles.sideTotal}>
                        Total: ₹{((arbitrateDispute.measuredWeight || 0) * (arbitrateDispute.appliedRate || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Photo Evidence Audit Viewer */}
                  <View style={styles.evidenceAuditCard}>
                    <View style={styles.evidenceAuditTop}>
                      <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
                      <Text style={styles.evidenceAuditTitle}>Digital Audit Evidence</Text>
                    </View>
                    <Text style={styles.evidenceFileName}>
                      File: {arbitrateDispute.photoEvidenceUri ?? 'scale_calib_7_2kg.jpg'}
                    </Text>
                    <Text style={styles.evidenceAuditMeta}>
                      Geolocation: Ward 82 • Hardware: Luggage digital scale ±0.05kg verified.
                    </Text>
                  </View>

                  {/* Resolution Action Picker */}
                  <View style={styles.arbitrationOptions}>
                    <Text style={styles.inputGroupLabel}>Choose Arbitration Resolution Action:</Text>

                    {[
                      {
                        id: 'split',
                        title: '⚖️ Split the Difference (50/50)',
                        desc: 'Even compromise between claimed weight and recorded scale reading.',
                      },
                      {
                        id: 'uphold',
                        title: '🛡️ Uphold Original Scale Reading',
                        desc: 'Reject the claim and confirm certified hardware scale weight as final.',
                      },
                      {
                        id: 'adjust',
                        title: '✏️ Custom Payout Re-weighting',
                        desc: 'Directly calibrate the final settlement payout to an exact amount.',
                      },
                    ].map(opt => {
                      const isChosen = arbitrationAction === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.arbitrationOptionCard, isChosen && styles.arbitrationOptionCardChosen]}
                          onPress={() => setArbitrationAction(opt.id as any)}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isChosen ? Colors.primary : Colors.textTertiary}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.optTitle, isChosen && styles.optTitleChosen]}>{opt.title}</Text>
                            <Text style={styles.optDesc}>{opt.desc}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Adjusted Total Input if Split or Adjust */}
                  {(arbitrationAction === 'split' || arbitrationAction === 'adjust') && (
                    <View style={styles.reconcileTotalRow}>
                      <Text style={styles.reconcileTotalLabel}>Reconciled Settlement Amount (₹):</Text>
                      <TextInput
                        style={styles.reconcileTotalInput}
                        keyboardType="decimal-pad"
                        value={customAdjustedTotal}
                        onChangeText={setCustomAdjustedTotal}
                      />
                    </View>
                  )}

                  {/* Supervisor Official Note */}
                  <View style={styles.noteBox}>
                    <Text style={styles.inputGroupLabel}>Supervisor Arbitration Ruling Note *</Text>
                    <TextInput
                      style={styles.modalInput}
                      multiline
                      numberOfLines={3}
                      value={arbitrationNote}
                      onChangeText={setArbitrationNote}
                      placeholder="Add supervisor findings and justification for the record..."
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.confirmArbitrationBtn}
                    onPress={handleExecuteArbitration}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                    <Text style={styles.confirmArbitrationText}>
                      Execute Arbitration & Reconcile Ledger
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Citizen Complaint Resolution Modal */}
      <Modal visible={!!resolveModalComplaint} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Grievance</Text>
              <TouchableOpacity onPress={() => setResolveModalComplaint(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Add official field notes explaining the resolution. This will be transmitted to the reporting citizen.
              </Text>

              <TextInput
                style={styles.modalInput}
                multiline
                numberOfLines={4}
                value={resolutionText}
                onChangeText={setResolutionText}
                placeholder="Enter actions taken..."
              />

              <TouchableOpacity style={styles.confirmResolveBtn} onPress={handleResolveComplaint}>
                <Text style={styles.confirmResolveText}>Submit & Close Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fair Value Receipt Inspection Modal */}
      <FairValueReceiptModal
        receipt={selectedReceipt}
        visible={!!selectedReceipt}
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
  sectionSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[2],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    borderRadius: BorderRadius.lg,
    gap: Spacing[2],
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    gap: Spacing[2],
  },
  sectionBtnActive: { backgroundColor: Colors.adminAccent },
  sectionBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  sectionBtnTextActive: { color: Colors.textInverse },
  badgePill: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  badgePillActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgePillText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  badgePillTextActive: { color: Colors.textInverse },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: Spacing[2],
  },
  tab: { flex: 1, paddingVertical: Spacing[2.5], alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.adminAccent },
  tabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.adminAccent, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing[4] },
  disputeCard: { padding: Spacing[4], gap: Spacing[2.5], borderRadius: BorderRadius.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  disputeIdRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  disputeIdText: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  receiptLinkText: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.primary },
  materialTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  statusChip: { paddingHorizontal: Spacing[2], paddingVertical: 3, borderRadius: BorderRadius.full },
  statusChipText: { fontSize: 10, fontWeight: FontWeight.bold },
  statusUnderReview: { backgroundColor: '#FFF3E0' },
  statusUnderReviewText: { color: '#E65100' },
  statusResolved: { backgroundColor: '#E8F5E9' },
  statusResolvedText: { color: '#2E7D32' },
  statusOpen: { backgroundColor: '#EDE7F6' },
  statusOpenText: { color: '#512DA8' },
  partiesGrid: { flexDirection: 'row', gap: Spacing[2], backgroundColor: Colors.surfaceAlt, padding: Spacing[2.5], borderRadius: BorderRadius.md },
  partyBox: { flex: 1 },
  partyLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  partyName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  metricVarianceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: Spacing[2.5],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricCol: { flex: 2 },
  metricColLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: FontWeight.bold },
  metricColVal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  metricArrowCol: { flex: 0.5, alignItems: 'center' },
  varianceCol: { flex: 1.5, alignItems: 'flex-end' },
  varianceColLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: FontWeight.bold },
  varianceColVal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.error, marginTop: 1 },
  statementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[1.5],
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[2.5],
    borderRadius: BorderRadius.md,
  },
  statementText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 16 },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  evidenceText: { flex: 1, fontSize: 11, color: Colors.textSecondary },
  resolutionAuditBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: 3,
  },
  resolutionAuditHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  resolutionAuditTitle: { fontSize: 10, fontWeight: FontWeight.bold, color: '#2E7D32', letterSpacing: 0.5 },
  resolutionAuditBody: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  resolutionAuditNote: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  reconciledTotal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#2E7D32', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1] },
  viewReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    gap: Spacing[1.5],
  },
  viewReceiptBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  arbitrateBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.adminAccent,
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    gap: Spacing[1.5],
  },
  arbitrateBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textInverse },
  complaintCard: { padding: Spacing[4], gap: Spacing[2.5] },
  refNumber: { fontSize: 10, color: Colors.textTertiary, fontFamily: 'monospace' },
  categoryTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  descText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  metaBox: { backgroundColor: Colors.surfaceAlt, padding: Spacing[2.5], borderRadius: BorderRadius.sm, gap: 2 },
  metaText: { fontSize: 10, color: Colors.textSecondary },
  resolutionBox: { backgroundColor: '#E8F5E9', padding: Spacing[3], borderRadius: BorderRadius.md, gap: 2 },
  resolutionLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  resolutionBody: { fontSize: FontSize.xs, color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1] },
  actionBtn: { flex: 1, paddingVertical: Spacing[2.5], borderRadius: BorderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing[5] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[3] },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  sideBySideContainer: { flexDirection: 'row', gap: Spacing[2.5] },
  sideColClaimed: {
    flex: 1,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: 3,
  },
  sideColRecorded: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: 3,
  },
  sideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sideBadgeClaimed: { fontSize: 9, fontWeight: FontWeight.bold, color: '#F57F17' },
  sideBadgeRecorded: { fontSize: 9, fontWeight: FontWeight.bold, color: '#2E7D32' },
  sideRole: { fontSize: 9, color: Colors.textTertiary },
  sideValueBig: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  sideRate: { fontSize: 10, color: Colors.textSecondary },
  sideTotal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  evidenceAuditCard: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: 2,
  },
  evidenceAuditTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  evidenceAuditTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  evidenceFileName: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 2 },
  evidenceAuditMeta: { fontSize: 10, color: Colors.textSecondary },
  arbitrationOptions: { gap: Spacing[2] },
  inputGroupLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  arbitrationOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: Spacing[2.5],
  },
  arbitrationOptionCardChosen: { borderColor: Colors.adminAccent, backgroundColor: '#FFF8E1' },
  optTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  optTitleChosen: { color: Colors.adminAccent },
  optDesc: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  reconcileTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  reconcileTotalLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  reconcileTotalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    minWidth: 90,
    textAlign: 'right',
  },
  noteBox: { gap: Spacing[1.5] },
  modalBody: { gap: Spacing[3] },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  confirmArbitrationBtn: {
    backgroundColor: Colors.adminAccent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  confirmArbitrationText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  confirmResolveBtn: {
    backgroundColor: Colors.adminAccent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3.5],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  confirmResolveText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
