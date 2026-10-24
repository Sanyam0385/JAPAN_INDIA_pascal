// Sell Recyclables Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT, MATERIAL_CATEGORIES } from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { DEMO_MATERIAL_PRICE_RANGES } from '../../src/lib/demo/demoData';
import type { MaterialCategory } from '../../src/types';

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
  open: 'info',
  accepted: 'success',
  en_route: 'warning',
  collected: 'success',
  payment_pending: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  disputed: 'error',
  draft: 'neutral',
};

const PICKUP_WINDOWS = [
  '7:00 AM – 9:00 AM',
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];

const UNITS = ['kg', 'pieces', 'bags', 'boxes'];

export default function RecycleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recyclingRequests, createRecyclingRequest, cancelRequest } = useAppStore();
  const { user } = useAuthStore();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialCategory | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pickupWindow, setPickupWindow] = useState('');
  const [address, setAddress] = useState('12, MG Road, Koramangala, Bengaluru 560034');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myRequests = recyclingRequests.filter(r => r.status !== 'cancelled').slice(0, 10);

  const priceRange = selectedMaterial
    ? DEMO_MATERIAL_PRICE_RANGES[selectedMaterial as keyof typeof DEMO_MATERIAL_PRICE_RANGES]
    : null;

  const estPrice = priceRange && quantity
    ? {
        min: Math.round(priceRange.min * parseFloat(quantity || '0')),
        max: Math.round(priceRange.max * parseFloat(quantity || '0')),
      }
    : null;

  const handleSubmit = () => {
    if (!selectedMaterial || !quantity || !pickupWindow || !address) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const qty = parseFloat(quantity);
    const range = DEMO_MATERIAL_PRICE_RANGES[selectedMaterial as keyof typeof DEMO_MATERIAL_PRICE_RANGES] ?? { min: 5, max: 15 };
    const id = createRecyclingRequest({
      householdId: 'hh-001',
      materialCategory: selectedMaterial,
      approximateQuantityKg: qty,
      quantityUnit: unit,
      status: 'open',
      pickupAddress: address,
      preferredPickupWindow: pickupWindow,
      estimatedPriceMin: Math.round(range.min * qty),
      estimatedPriceMax: Math.round(range.max * qty),
      notes,
      isDemoData: true,
    });
    setSubmitting(false);
    setShowForm(false);
    setSelectedMaterial(null);
    setQuantity('');
    setPickupWindow('');
    setNotes('');
    Alert.alert('Request Submitted ✅', `Your recycling request has been posted to the marketplace.\nRequest ID: ${id}\n\n⚠️ Demo mode — no real pickup will occur.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>♻️ Sell Recyclables</Text>
          <Text style={styles.subtitle}>Post items for pickup by waste pickers</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={20} color={Colors.textInverse} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        {/* Price disclaimer */}
        <Card variant="filled" style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            💡 Price estimates are based on approximate market rates and are clearly labelled as estimates.
            They are not government-mandated tariffs. Actual payment depends on negotiation with the picker.
          </Text>
        </Card>

        {/* My Requests */}
        <Text style={styles.sectionTitle}>My Requests</Text>

        {myRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>📭 No requests yet</Text>
            <Text style={styles.emptySubText}>Tap "+ New" to post your first recycling request</Text>
          </Card>
        ) : (
          myRequests.map(req => {
            const mat = MATERIAL_CATEGORIES.find(m => m.id === req.materialCategory);
            return (
              <Card key={req.id} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <View style={styles.reqLeft}>
                    <Text style={styles.reqIcon}>{mat?.icon ?? '♻️'}</Text>
                    <View>
                      <Text style={styles.reqMat}>{mat?.label ?? req.materialCategory}</Text>
                      <Text style={styles.reqQty}>{req.approximateQuantityKg} {req.quantityUnit}</Text>
                    </View>
                  </View>
                  <Badge
                    label={req.status.replace(/_/g, ' ')}
                    variant={STATUS_VARIANTS[req.status] ?? 'neutral'}
                    size="sm"
                  />
                </View>

                <View style={styles.reqDetails}>
                  <Text style={styles.reqDetail}>📍 {req.pickupAddress?.split(',')[0]}</Text>
                  <Text style={styles.reqDetail}>⏰ {req.preferredPickupWindow}</Text>
                  <Text style={[styles.reqDetail, styles.priceEst]}>
                    💰 Est. ₹{req.estimatedPriceMin}–₹{req.estimatedPriceMax}
                    <Text style={styles.estLabel}> (estimate)</Text>
                  </Text>
                </View>

                {req.assignedPickerName && (
                  <View style={styles.pickerRow}>
                    <Ionicons name="person-circle" size={16} color={Colors.primary} />
                    <Text style={styles.pickerName}>Assigned: {req.assignedPickerName}</Text>
                  </View>
                )}

                {['open', 'draft'].includes(req.status) && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => Alert.alert('Cancel Request?', 'This will remove your request from the marketplace.', [
                      { text: 'Keep', style: 'cancel' },
                      { text: 'Cancel Request', style: 'destructive', onPress: () => cancelRequest(req.id) },
                    ])}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* New Request Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Recycling Request</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <DemoDataBanner message="⚠️ Demo mode — your request will appear in the picker marketplace but no real pickup will occur." />

            {/* Material */}
            <Text style={styles.fieldLabel}>Material Category *</Text>
            <View style={styles.materialGrid}>
              {MATERIAL_CATEGORIES.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.matChip,
                    selectedMaterial === m.id && { backgroundColor: m.color + '20', borderColor: m.color },
                  ]}
                  onPress={() => setSelectedMaterial(m.id as MaterialCategory)}
                >
                  <Text style={styles.matIcon}>{m.icon}</Text>
                  <Text style={[styles.matLabel, selectedMaterial === m.id && { color: m.color }]}>
                    {m.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price estimate preview */}
            {priceRange && (
              <View style={styles.pricePreview}>
                <Text style={styles.pricePreviewText}>
                  📊 Market rate estimate: ₹{priceRange.min}–₹{priceRange.max} per kg
                </Text>
                <Text style={styles.pricePreviewNote}>(Estimate only — not a guaranteed price)</Text>
              </View>
            )}

            {/* Quantity */}
            <Text style={styles.fieldLabel}>Approximate Quantity *</Text>
            <View style={styles.qtyRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="e.g. 5"
                placeholderTextColor={Colors.textTertiary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitSelector}>
                {UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Total estimate */}
            {estPrice && estPrice.min > 0 && (
              <View style={styles.totalEst}>
                <Text style={styles.totalEstText}>
                  Estimated total: ₹{estPrice.min} – ₹{estPrice.max}
                </Text>
                <Text style={styles.totalEstNote}>Estimate — actual amount decided at pickup</Text>
              </View>
            )}

            {/* Pickup window */}
            <Text style={styles.fieldLabel}>Preferred Pickup Window *</Text>
            <View style={styles.windowList}>
              {PICKUP_WINDOWS.map(w => (
                <TouchableOpacity
                  key={w}
                  style={[styles.windowChip, pickupWindow === w && styles.windowChipActive]}
                  onPress={() => setPickupWindow(w)}
                >
                  <Text style={[styles.windowText, pickupWindow === w && styles.windowTextActive]}>⏰ {w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address */}
            <Text style={styles.fieldLabel}>Pickup Address *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter pickup address"
              placeholderTextColor={Colors.textTertiary}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. Items are bundled and kept near gate"
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Photo note */}
            <View style={styles.photoNote}>
              <Ionicons name="camera-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.photoNoteText}>
                Photo upload requires a development build (not available in Expo Go)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : '✅ Post to Marketplace'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.submitDisclaimer}>
              By submitting, you confirm this is demo/test data and no real financial transaction will occur.
            </Text>
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
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
  },
  newBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  content: { padding: Spacing[4], gap: Spacing[3] },
  disclaimer: {},
  disclaimerText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8] },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, marginBottom: Spacing[1] },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  reqCard: { gap: Spacing[2] },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  reqIcon: { fontSize: 28 },
  reqMat: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  reqQty: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reqDetails: { gap: Spacing[1] },
  reqDetail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  priceEst: { color: Colors.primary },
  estLabel: { color: Colors.textTertiary, fontSize: FontSize.xs },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  pickerName: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  cancelBtn: { alignSelf: 'flex-end', paddingVertical: Spacing[1.5], paddingHorizontal: Spacing[3] },
  cancelBtnText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing[5], borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalContent: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[12] },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  matChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
  },
  matIcon: { fontSize: 18 },
  matLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  pricePreview: {
    backgroundColor: Colors.mintPale, borderRadius: BorderRadius.md,
    padding: Spacing[3], borderWidth: 1, borderColor: Colors.mint,
  },
  pricePreviewText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  pricePreviewNote: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  qtyRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  unitSelector: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1] },
  unitChip: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.base, paddingHorizontal: Spacing[2], paddingVertical: Spacing[1],
  },
  unitChipActive: { borderColor: Colors.primary, backgroundColor: Colors.mintPale },
  unitText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  unitTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  totalEst: {
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  totalEstText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  totalEstNote: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  windowList: { gap: Spacing[2] },
  windowChip: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: Spacing[3], paddingHorizontal: Spacing[4],
    backgroundColor: Colors.surface,
  },
  windowChipActive: { borderColor: Colors.primary, backgroundColor: Colors.mintPale },
  windowText: { fontSize: FontSize.base, color: Colors.textSecondary },
  windowTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  multilineInput: { height: 72, textAlignVertical: 'top' },
  photoNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  photoNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], alignItems: 'center',
    ...Shadow.base,
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  submitDisclaimer: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center' },
});
