// Informal Picker — My Jobs (Active & Completed Pickups)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import type { RecyclingRequest } from '../../src/types';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { recyclingRequests, updateRequestStatus, completeRequest } = useAppStore();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [completeModalJob, setCompleteModalJob] = useState<RecyclingRequest | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');

  // Jobs that belong to picker or demo assigned jobs
  const myActiveJobs = recyclingRequests.filter(r =>
    ['accepted', 'en_route', 'payment_pending'].includes(r.status)
  );

  const myCompletedJobs = recyclingRequests.filter(r =>
    ['completed', 'collected'].includes(r.status)
  );

  const handleUpdateStatus = (jobId: string, newStatus: 'en_route' | 'payment_pending') => {
    updateRequestStatus(jobId, newStatus);
    Alert.alert('Status Updated', `Job marked as ${newStatus.replace(/_/g, ' ')}.`);
  };

  const handleConfirmCompletion = () => {
    if (!completeModalJob) return;
    const amount = parseFloat(agreedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid agreed payment amount.');
      return;
    }
    completeRequest(completeModalJob.id, amount);
    setCompleteModalJob(null);
    setActualWeight('');
    setAgreedAmount('');
    Alert.alert('Pickup Finished! 🎉', `Payment of ₹${amount.toFixed(2)} recorded. The household's balance & stats have been updated!`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.subtitle}>Track assigned pickups and finalize sales</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({myActiveJobs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Completed ({myCompletedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO JOBS — Demonstrates full cross-role status sync." />

        {activeTab === 'active' ? (
          myActiveJobs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No Active Pickups</Text>
              <Text style={styles.emptyText}>Go to the Marketplace tab to claim new recyclable collection opportunities.</Text>
            </Card>
          ) : (
            myActiveJobs.map((job) => {
              const mat = MATERIAL_CATEGORIES.find(m => m.id === job.materialCategory);
              return (
                <Card key={job.id} style={styles.jobCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.matInfo}>
                      <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                      <View>
                        <Text style={styles.matTitle}>{mat?.label || job.materialCategory}</Text>
                        <Text style={styles.qtyText}>{job.approximateQuantityKg} {job.quantityUnit}</Text>
                      </View>
                    </View>
                    <Badge
                      label={job.status.replace(/_/g, ' ')}
                      variant={job.status === 'en_route' ? 'warning' : 'info'}
                    />
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color={Colors.pickerAccent} />
                      <Text style={styles.detailText} numberOfLines={2}>{job.pickupAddress}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={Colors.pickerAccent} />
                      <Text style={styles.detailText}>Window: {job.preferredPickupWindow}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag" size={16} color={Colors.pickerAccent} />
                      <Text style={styles.detailText}>Est. Price: ₹{job.estimatedPriceMin} - ₹{job.estimatedPriceMax}</Text>
                    </View>
                  </View>

                  {/* Actions for worker */}
                  <View style={styles.actionRow}>
                    {job.status === 'accepted' ? (
                      <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: Colors.info }]}
                        onPress={() => handleUpdateStatus(job.id, 'en_route')}
                      >
                        <Ionicons name="navigate-outline" size={18} color="#fff" />
                        <Text style={styles.bigButtonText}>I'm En Route</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.bigButton, { backgroundColor: Colors.success }]}
                      onPress={() => {
                        setCompleteModalJob(job);
                        setActualWeight(String(job.approximateQuantityKg));
                        setAgreedAmount(String(job.estimatedPriceMin));
                      }}
                    >
                      <Ionicons name="checkmark-done" size={18} color="#fff" />
                      <Text style={styles.bigButtonText}>Record Collection & Pay</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )
        ) : (
          myCompletedJobs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>No Completed Pickups Yet</Text>
            </Card>
          ) : (
            myCompletedJobs.map((job) => {
              const mat = MATERIAL_CATEGORIES.find(m => m.id === job.materialCategory);
              return (
                <Card key={job.id} style={styles.completedCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.matInfo}>
                      <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                      <View>
                        <Text style={styles.matTitle}>{mat?.label || job.materialCategory}</Text>
                        <Text style={styles.dateText}>{new Date(job.updatedAt).toLocaleDateString('en-IN')}</Text>
                      </View>
                    </View>
                    <View style={styles.payout}>
                      <Text style={styles.payoutLabel}>PAID</Text>
                      <Text style={styles.payoutAmount}>₹{job.agreedPrice?.toFixed(2) || '0.00'}</Text>
                    </View>
                  </View>
                  <Text style={styles.addressSnippet} numberOfLines={1}>📍 {job.pickupAddress}</Text>
                </Card>
              );
            })
          )
        )}
      </ScrollView>

      {/* Completion Modal */}
      <Modal visible={!!completeModalJob} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finalize Pickup</Text>
              <TouchableOpacity onPress={() => setCompleteModalJob(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Enter the verified weighed quantity and final negotiated amount handed to the household.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Measured Weight (kg) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={actualWeight}
                  onChangeText={setActualWeight}
                  placeholder="e.g. 5.2"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Agreed Amount Paid (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={agreedAmount}
                  onChangeText={setAgreedAmount}
                  placeholder="e.g. 65"
                />
              </View>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmCompletion}
              >
                <Text style={styles.modalConfirmText}>Confirm & Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.pickerAccent },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.pickerAccent, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  jobCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  matIcon: { fontSize: 32 },
  matTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  qtyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  dateText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  cardDetails: { backgroundColor: Colors.surfaceAlt, padding: Spacing[3], borderRadius: BorderRadius.md, gap: Spacing[1.5] },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  detailText: { fontSize: FontSize.xs, color: Colors.textPrimary, flex: 1 },
  actionRow: { gap: Spacing[2] },
  bigButton: {
    minHeight: 52,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  bigButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  completedCard: { padding: Spacing[4], gap: Spacing[2] },
  payout: { alignItems: 'flex-end' },
  payoutLabel: { fontSize: 9, color: Colors.success, fontWeight: FontWeight.bold },
  payoutAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addressSnippet: { fontSize: FontSize.xs, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing[5] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalBody: { gap: Spacing[4] },
  modalSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  inputGroup: { gap: Spacing[1] },
  inputLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  modalConfirmBtn: {
    minHeight: 54,
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  modalConfirmText: { color: Colors.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
