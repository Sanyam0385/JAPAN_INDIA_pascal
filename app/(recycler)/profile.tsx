// Recycler — Facility Profile & Price List Editor
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge, LanguageSelectorButton } from '../../src/components/ui';

export default function RecyclerProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { recyclers, updateRecyclerPrice, recyclerIntakes } = useAppStore();

  const facility = recyclers[0] || {
    id: 'rec-1',
    name: 'City Center Recycler',
    address: '88, 7th Main, Industrial Suburb, Yeshwanthpur, Bengaluru',
    locality: 'Yeshwanthpur',
    phone: '+91 98450 12345',
    hours: 'Mon–Sat 08:00 – 18:00',
    priceListPerKg: { plastic: 16, paper: 14, cardboard: 11, metal: 38, glass: 3 },
  };

  // Price list editable state
  const [prices, setPrices] = useState<Record<string, string>>({
    plastic: String(facility.priceListPerKg?.plastic ?? 16),
    paper: String(facility.priceListPerKg?.paper ?? 14),
    cardboard: String(facility.priceListPerKg?.cardboard ?? 11),
    metal: String(facility.priceListPerKg?.metal ?? 38),
    glass: String(facility.priceListPerKg?.glass ?? 3),
  });

  const [savingPrices, setSavingPrices] = useState(false);

  // Compute daily intake quota
  const totalProcessedToday = recyclerIntakes.reduce((acc, i) => acc + i.confirmedKg, 0) + 120;
  const capacityKg = 500;
  const quotaPct = Math.min(100, Math.round((totalProcessedToday / capacityKg) * 100));

  const handleSavePrices = () => {
    setSavingPrices(true);
    Object.entries(prices).forEach(([material, val]) => {
      const rateNum = parseFloat(val);
      if (!isNaN(rateNum) && rateNum > 0) {
        updateRecyclerPrice(facility.id, material, rateNum);
      }
    });
    setSavingPrices(false);
    Alert.alert(t('recycler.tariffsUpdated'), t('recycler.tariffsUpdatedBody'));
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: Spacing[2] }}>
          <Text style={styles.title}>{t('recycler.profileTitle')}</Text>
          <Text style={styles.subtitle}>{t('recycler.profileSubtitle')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LanguageSelectorButton variant="icon" />
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/(auth)/demo-select')}>
            <Ionicons name="swap-horizontal" size={16} color="#00796B" />
            <Text style={styles.switchBtnText}>{t('recycler.switchRole')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Facility Identity Card */}
        <Card style={styles.facilityCard}>
          <View style={styles.facilityHeader}>
            <View style={styles.facilityIconBox}>
              <Text style={styles.facilityEmoji}>🏭</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.licensePill}>
                <Ionicons name="shield-checkmark" size={12} color="#00796B" />
                <Text style={styles.licensePillText}>{t('recycler.authorizedMrf')}</Text>
              </View>
              <Text style={styles.facilityName}>{facility.name}</Text>
              <Text style={styles.facilityOperator}>{t('recycler.operator')}: Vikram Joshi</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{facility.address}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{t('recycler.hours')}: {facility.hours}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{t('recycler.phone')}: {facility.phone}</Text>
          </View>
        </Card>

        {/* Daily Capacity Quota Card */}
        <Card style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <Text style={styles.quotaTitle}>{t('recycler.dailyCapacity')}</Text>
            <Text style={styles.quotaFraction}>
              <Text style={styles.quotaCurrent}>{totalProcessedToday.toFixed(0)}</Text> / {capacityKg} kg ({quotaPct}%)
            </Text>
          </View>

          <View style={styles.quotaTrack}>
            <View style={[styles.quotaFill, { width: `${quotaPct}%` }]} />
          </View>

          <Text style={styles.quotaNote}>
            {capacityKg - totalProcessedToday > 0
              ? t('recycler.capacityAvailable', { count: Math.round(capacityKg - totalProcessedToday) })
              : t('recycler.capacityReached')}
          </Text>
        </Card>

        {/* Purchasing Price List Editor */}
        <Card style={styles.priceEditorCard}>
          <View style={styles.editorHeader}>
            <View>
              <Text style={styles.editorTitle}>{t('recycler.purchasingTariffs')}</Text>
              <Text style={styles.editorSubtitle}>{t('recycler.tariffsSub')}</Text>
            </View>
          </View>

          {Object.keys(prices).map((matKey) => {
            const meta = MATERIAL_CATEGORIES.find(m => m.id === matKey);
            return (
              <View key={matKey} style={styles.priceItemRow}>
                <View style={styles.priceMatInfo}>
                  <Text style={styles.priceMatIcon}>{meta?.icon || '♻️'}</Text>
                  <Text style={styles.priceMatName}>{t(`materials.${matKey}`, meta?.label || matKey.toUpperCase())}</Text>
                </View>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    value={prices[matKey]}
                    onChangeText={(txt) => setPrices(prev => ({ ...prev, [matKey]: txt }))}
                  />
                  <Text style={styles.perKgSuffix}>/kg</Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.savePricesBtn}
            onPress={handleSavePrices}
            disabled={savingPrices}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
            <Text style={styles.savePricesBtnText}>
              {savingPrices ? t('recycler.updating') : t('recycler.publishRates')}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Technical Calibration Specs */}
        <Card variant="filled" style={styles.specsCard}>
          <Text style={styles.specsTitle}>{t('recycler.calibrationCompliance')}</Text>
          <Text style={styles.specsText}>
            {t('recycler.calibrationSpecs')}
          </Text>
        </Card>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>{t('recycler.signOut')}</Text>
        </TouchableOpacity>
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
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2F1',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  switchBtnText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#00796B' },
  content: { padding: Spacing[4], gap: Spacing[3] },
  facilityCard: { padding: Spacing[4], gap: Spacing[2] },
  facilityHeader: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center', marginBottom: Spacing[1] },
  facilityIconBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityEmoji: { fontSize: 28 },
  licensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 121, 107, 0.1)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 2,
  },
  licensePillText: { fontSize: 9, fontWeight: FontWeight.bold, color: '#00796B', letterSpacing: 0.5 },
  facilityName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  facilityOperator: { fontSize: FontSize.xs, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
  quotaCard: { padding: Spacing[4], gap: Spacing[2.5] },
  quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotaTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  quotaFraction: { fontSize: FontSize.xs, color: Colors.textSecondary },
  quotaCurrent: { fontWeight: FontWeight.bold, color: '#00796B', fontSize: FontSize.sm },
  quotaTrack: {
    height: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    backgroundColor: '#00796B',
    borderRadius: 6,
  },
  quotaNote: { fontSize: 11, color: Colors.textSecondary },
  priceEditorCard: { padding: Spacing[4], gap: Spacing[3] },
  editorHeader: { marginBottom: Spacing[1] },
  editorTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  editorSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  priceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  priceMatInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  priceMatIcon: { fontSize: 22 },
  priceMatName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currencyPrefix: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  priceInput: {
    width: 60,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    textAlign: 'center',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  perKgSuffix: { fontSize: FontSize.xs, color: Colors.textSecondary },
  savePricesBtn: {
    minHeight: 52,
    backgroundColor: '#00796B',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
    ...Shadow.base,
  },
  savePricesBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  specsCard: { backgroundColor: '#F1F8E9', borderColor: '#C5E1A5' },
  specsTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#1B5E20', marginBottom: 4 },
  specsText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 18 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    marginTop: Spacing[2],
  },
  signOutText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
