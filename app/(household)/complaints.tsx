// Complaints & Issue Reporting Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

const COMPLAINT_CATEGORIES = [
  { id: 'missed_pickup', label: 'Missed Pickup', icon: '🚛' },
  { id: 'incorrect_record', label: 'Wrong Record', icon: '📋' },
  { id: 'collector_misconduct', label: 'Collector Conduct', icon: '👷' },
  { id: 'disputed_fine', label: 'Disputed Fine', icon: '💰' },
  { id: 'overflowing_bin', label: 'Overflowing Bin', icon: '🗑️' },
  { id: 'unclean_street', label: 'Unclean Street', icon: '🛣️' },
  { id: 'illegal_dumping', label: 'Illegal Dumping', icon: '⚠️' },
  { id: 'other', label: 'Other Issue', icon: '📝' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'error' | 'neutral' }> = {
  submitted: { label: 'Submitted', variant: 'info' },
  acknowledged: { label: 'Acknowledged', variant: 'info' },
  assigned: { label: 'Assigned', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  rejected_with_reason: { label: 'Rejected', variant: 'error' },
};

export default function ComplaintsScreen() {
  const insets = useSafeAreaInsets();
  const { complaints, createComplaint } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Koramangala, Bengaluru');
  const [submitting, setSubmitting] = useState(false);

  const myComplaints = complaints.slice(0, 20);

  const handleSubmit = () => {
    if (!category || !description.trim()) {
      Alert.alert('Missing Info', 'Please select a category and enter a description.');
      return;
    }
    setSubmitting(true);
    const ref = createComplaint({
      householdId: 'hh-001',
      userId: 'user-001',
      category,
      description,
      locality: location,
      status: 'submitted',
      isDemoData: true,
    });
    setSubmitting(false);
    setShowForm(false);
    setCategory('');
    setDescription('');
    Alert.alert(
      'Complaint Filed ✅',
      `Reference: ${ref}\n\nYour complaint has been submitted and will be reviewed within 3 working days.\n\n⚠️ Demo mode — no real action will be taken.`,
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📢 Complaints</Text>
          <Text style={styles.subtitle}>Report issues and track resolution</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={20} color={Colors.textInverse} />
          <Text style={styles.newBtnText}>Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        <Text style={styles.sectionTitle}>My Complaints</Text>

        {myComplaints.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No complaints filed yet</Text>
          </Card>
        ) : (
          myComplaints.map(c => {
            const cat = COMPLAINT_CATEGORIES.find(x => x.id === c.category);
            const st = STATUS_CONFIG[c.status] ?? { label: c.status, variant: 'neutral' as const };
            return (
              <Card key={c.id} style={styles.complaintCard}>
                <View style={styles.complaintHeader}>
                  <Text style={styles.refNum}>Ref: {c.referenceNumber}</Text>
                  <Badge label={st.label} variant={st.variant} size="sm" />
                </View>

                <View style={styles.catRow}>
                  <Text style={styles.catIcon}>{cat?.icon ?? '📝'}</Text>
                  <Text style={styles.catLabel}>{cat?.label ?? c.category}</Text>
                </View>

                <Text style={styles.descText} numberOfLines={2}>{c.description}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📍 {c.locality}</Text>
                  <Text style={styles.metaText}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                {c.resolution && (
                  <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionTitle}>Resolution:</Text>
                    <Text style={styles.resolutionText}>{c.resolution}</Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* New Complaint Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>File a Complaint</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <DemoDataBanner message="⚠️ Demo mode — your complaint will be recorded in the app but no real action will be taken." />

            <Text style={styles.fieldLabel}>Category *</Text>
            <View style={styles.catGrid}>
              {COMPLAINT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, category === cat.id && styles.catChipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.catChipIcon}>{cat.icon}</Text>
                  <Text style={[styles.catChipLabel, category === cat.id && styles.catChipLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location / locality"
              placeholderTextColor={Colors.textTertiary}
              value={location}
              onChangeText={setLocation}
            />

            <View style={styles.photoNote}>
              <Ionicons name="camera-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.photoNoteText}>
                Photo evidence upload requires a development build
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : '📢 Submit Complaint'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[5], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    backgroundColor: Colors.error, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
  },
  newBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  content: { padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8] },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
  complaintCard: { gap: Spacing[2] },
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refNum: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: 'monospace', fontWeight: FontWeight.medium },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  catIcon: { fontSize: 20 },
  catLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  descText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  resolutionBox: {
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.base,
    padding: Spacing[3], borderLeftWidth: 3, borderLeftColor: Colors.success,
  },
  resolutionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.success, marginBottom: 2 },
  resolutionText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing[5], borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalContent: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[12] },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5],
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    backgroundColor: Colors.surface, minWidth: '45%',
  },
  catChipActive: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  catChipIcon: { fontSize: 18 },
  catChipLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  catChipLabelActive: { color: Colors.error },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  multilineInput: { height: 100 },
  photoNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  photoNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  submitBtn: {
    backgroundColor: Colors.error, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], alignItems: 'center', ...Shadow.base,
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
