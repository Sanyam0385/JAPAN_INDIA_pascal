import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, DemoDataBanner } from '../../src/components/ui';

type WasteCategory = 'wet' | 'dry' | 'recyclable' | 'hazardous';

interface RecentCollection {
  id: string;
  address: string;
  category: WasteCategory;
  weight: string;
  time: string;
  notes?: string;
}

const DEMO_ADDRESSES = [
  { id: 's8', label: '#28 · Domlur Layout, Domlur' },
  { id: 's9', label: '#96 · 3rd Main, Whitefield' },
  { id: 's10', label: '#11 · BTM Layout 2nd Stage' },
];

const WASTE_CATEGORIES: { id: WasteCategory; label: string; icon: string; color: string }[] = [
  { id: 'wet', label: 'Wet', icon: '🌿', color: Colors.success },
  { id: 'dry', label: 'Dry', icon: '📦', color: Colors.collectorAccent },
  { id: 'recyclable', label: 'Recyclable', icon: '♻️', color: Colors.warning },
  { id: 'hazardous', label: 'Hazardous', icon: '⚠️', color: Colors.error },
];

const INITIAL_RECENT: RecentCollection[] = [
  { id: 'rc1', address: '#42 · Koramangala 4th Block', category: 'wet', weight: '14.5', time: '07:12', notes: 'Properly segregated' },
  { id: 'rc2', address: '#17 · HSR Layout Sector 2', category: 'dry', weight: '8.2', time: '07:34' },
  { id: 'rc3', address: '#89 · Indiranagar 12th Main', category: 'recyclable', weight: '5.0', time: '07:58' },
  { id: 'rc4', address: '#33 · JP Nagar Phase 2', category: 'wet', weight: '18.3', time: '08:22', notes: 'Extra bag collected' },
  { id: 'rc5', address: '#71 · Marathahalli', category: 'dry', weight: '11.1', time: '08:43' },
];

const CATEGORY_COLORS: Record<WasteCategory, string> = {
  wet: Colors.success,
  dry: Colors.collectorAccent,
  recyclable: Colors.warning,
  hazardous: Colors.error,
};

export default function CollectorTasksScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>(DEMO_ADDRESSES[0].id);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>('wet');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [recentCollections, setRecentCollections] = useState<RecentCollection[]>(INITIAL_RECENT);

  const selectedAddressLabel = DEMO_ADDRESSES.find(a => a.id === selectedAddress)?.label ?? '';

  function handleSubmit() {
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      Alert.alert(t('common.error'), t('errors.generalError'));
      return;
    }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry: RecentCollection = {
      id: `rc${Date.now()}`,
      address: selectedAddressLabel,
      category: selectedCategory,
      weight,
      time,
      notes: notes.trim() || undefined,
    };
    setRecentCollections(prev => [newEntry, ...prev]);
    setWeight('');
    setNotes('');
    Alert.alert(t('collector.recordCollection'), `${weight} kg recorded.`);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}>
        <Text style={styles.headerTitle}>{t('collector.recordCollection')}</Text>
        <Text style={styles.headerSub}>{t('collector.logPickups')}</Text>
      </View>

      <View style={styles.body}>
        <DemoDataBanner message="Submissions are demo only — not sent to any backend." />

        {/* Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('collector.recordCollection')}</Text>

          {/* Address Selector */}
          <Text style={styles.fieldLabel}>{t('collector.selectStop')}</Text>
          <TouchableOpacity
            style={styles.addressSelector}
            onPress={() => setShowAddressPicker(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.addressSelectorText}>{selectedAddressLabel}</Text>
            <Ionicons
              name={showAddressPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
          {showAddressPicker && (
            <View style={styles.dropdown}>
              {DEMO_ADDRESSES.map(addr => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.dropdownItem,
                    selectedAddress === addr.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => { setSelectedAddress(addr.id); setShowAddressPicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedAddress === addr.id && styles.dropdownItemTextSelected,
                  ]}>
                    {addr.label}
                  </Text>
                  {selectedAddress === addr.id && (
                    <Ionicons name="checkmark" size={16} color={Colors.collectorAccent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Category Selector */}
          <Text style={styles.fieldLabel}>{t('collector.wasteCategory')}</Text>
          <View style={styles.categoryRow}>
            {WASTE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && { color: Colors.surface },
                ]}>
                  {t(`materials.${cat.id}_waste`, { defaultValue: cat.label })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weight */}
          <Text style={styles.fieldLabel}>{t('collector.weightKg')}</Text>
          <TextInput
            style={styles.weightInput}
            placeholder={t('collector.enterWeight')}
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />

          {/* Notes */}
          <Text style={styles.fieldLabel}>{t('common.notes')}</Text>
          <TextInput
            style={[styles.weightInput, styles.notesInput]}
            placeholder="Add any collection notes..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Photo Button */}
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={() => Alert.alert('Camera unavailable', 'Camera requires a native build.\nNot available in Expo Go.')}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.photoBtnText}>Attach Photo (Demo — requires native build)</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.surface} />
            <Text style={styles.submitBtnText}>{t('collector.saveCollection')}</Text>
          </TouchableOpacity>
        </Card>

        {/* Recent Collections */}
        <Text style={styles.sectionTitle}>{t('collector.recentCollections')}</Text>
        <Text style={styles.demoNote}>⚠️ Demo data — not real records</Text>
        {recentCollections.map(rc => (
          <View key={rc.id} style={styles.recentCard}>
            <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[rc.category] }]} />
            <View style={styles.recentBody}>
              <Text style={styles.recentAddress}>{rc.address}</Text>
              <View style={styles.recentMeta}>
                <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[rc.category] + '20' }]}>
                  <Text style={[styles.catBadgeText, { color: CATEGORY_COLORS[rc.category] }]}>
                    {t(`materials.${rc.category}_waste`, { defaultValue: rc.category })}
                  </Text>
                </View>
                <Text style={styles.recentWeight}>{rc.weight} kg</Text>
                {rc.notes && (
                  <Text style={styles.recentNotes} numberOfLines={1}>"{rc.notes}"</Text>
                )}
              </View>
            </View>
            <Text style={styles.recentTime}>{rc.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {},
  header: {
    backgroundColor: Colors.collectorAccent,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[5],
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing[1],
  },
  body: { padding: Spacing[4], gap: Spacing[3] },
  formCard: { padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  demoNote: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.semibold,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    minHeight: 48,
  },
  addressSelectorText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dropdownItemSelected: { backgroundColor: Colors.infoLight },
  dropdownItemText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: { color: Colors.collectorAccent, fontWeight: FontWeight.semibold },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: 40,
  },
  categoryIcon: { fontSize: 16 },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 48,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    minHeight: 56,
  },
  photoBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.collectorAccent,
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.md,
    minHeight: 56,
  },
  submitBtnText: {
    color: Colors.surface,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  recentCard: {
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
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  recentBody: { flex: 1 },
  recentAddress: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[1],
  },
  recentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  catBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  catBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  recentWeight: { fontSize: FontSize.xs, color: Colors.textSecondary },
  recentNotes: { fontSize: FontSize.xs, color: Colors.textTertiary, flex: 1 },
  recentTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    flexShrink: 0,
  },
});
