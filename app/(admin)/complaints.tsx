// Municipal Administrator — Complaints & Grievance Resolution
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import type { Complaint, ComplaintStatus } from '../../src/types';

export default function AdminComplaintsScreen() {
  const insets = useSafeAreaInsets();
  const { complaints, updateComplaintStatus } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'submitted' | 'in_progress' | 'resolved'>('all');
  const [resolveModalComplaint, setResolveModalComplaint] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const filtered = complaints.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const handleResolve = () => {
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

  const handleQuickAdvance = (complaintId: string, nextStatus: ComplaintStatus) => {
    updateComplaintStatus(complaintId, nextStatus);
    Alert.alert('Status Updated', `Grievance status changed to ${nextStatus}.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Civic Grievance Desk</Text>
        <Text style={styles.subtitle}>Review missed collections, illegal dumping, and disputes</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'New' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key as any)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO GRIEVANCE LOG — Real-time supervisor resolution workflow." />

        {filtered.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>No Complaints Under This Filter</Text>
          </Card>
        ) : (
          filtered.map((c) => (
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

              {/* Action Buttons */}
              {c.status !== 'resolved' ? (
                <View style={styles.actionRow}>
                  {c.status === 'submitted' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Colors.info }]}
                      onPress={() => handleQuickAdvance(c.id, 'in_progress')}
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

      {/* Resolution Modal */}
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

              <TouchableOpacity style={styles.confirmResolveBtn} onPress={handleResolve}>
                <Text style={styles.confirmResolveText}>Submit & Close Ticket</Text>
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
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.adminAccent },
  tabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.adminAccent, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  complaintCard: { padding: Spacing[4], gap: Spacing[2.5] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  refNumber: { fontSize: 10, color: Colors.textTertiary, fontFamily: 'monospace' },
  categoryTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  descText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  metaBox: { backgroundColor: Colors.surfaceAlt, padding: Spacing[2.5], borderRadius: BorderRadius.sm, gap: 2 },
  metaText: { fontSize: 10, color: Colors.textSecondary },
  resolutionBox: { backgroundColor: '#E8F5E9', padding: Spacing[3], borderRadius: BorderRadius.md, gap: 2 },
  resolutionLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  resolutionBody: { fontSize: FontSize.xs, color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1] },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing[5] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalBody: { gap: Spacing[3] },
  modalSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmResolveBtn: {
    backgroundColor: Colors.adminAccent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3.5],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  confirmResolveText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
