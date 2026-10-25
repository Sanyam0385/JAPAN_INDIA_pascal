import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { useAppStore } from '../../src/stores/appStore';
import { FairValueReceiptModal } from '../../src/components/shared';
import type { Receipt } from '../../src/types';

export default function PickerEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { receipts } = useAppStore();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const weeklyData = [
    { day: 'Mon', amount: 480, height: 48 },
    { day: 'Tue', amount: 620, height: 62 },
    { day: 'Wed', amount: 350, height: 35 },
    { day: 'Thu', amount: 800, height: 80 },
    { day: 'Fri', amount: 720, height: 72 },
    { day: 'Sat', amount: 950, height: 95 },
    { day: 'Sun', amount: 510, height: 51 },
  ];

  const totalReceiptsAmount = receipts.reduce((acc, r) => acc + r.total, 0);
  const totalKg = receipts.reduce((acc, r) => acc + r.measuredKg, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('picker.earningsSales')}</Text>
        <Text style={styles.subtitle}>{t('picker.earningsSub')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>{t('picker.totalSalesMonth')}</Text>
          <Text style={styles.heroAmount}>₹{(14250 + totalReceiptsAmount).toLocaleString('en-IN')}<Text style={styles.heroSub}>.00</Text></Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>{(385 + totalKg).toFixed(1)} kg</Text>
              <Text style={styles.heroMetaLabel}>{t('picker.materialResold')}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>{26 + receipts.length}</Text>
              <Text style={styles.heroMetaLabel}>{t('picker.pickupsMade')}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>₹548</Text>
              <Text style={styles.heroMetaLabel}>{t('picker.avgPerPickup')}</Text>
            </View>
          </View>
        </Card>

        {/* Weekly Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardHeading}>{t('picker.weeklyResaleIncome')}</Text>
            <Text style={styles.chartTotal}>Total: ₹4,430</Text>
          </View>

          <View style={styles.barChartContainer}>
            {weeklyData.map((d) => (
              <View key={d.day} style={styles.barCol}>
                <Text style={styles.barValue}>₹{d.amount}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: d.height }]} />
                </View>
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Receipts & Settlement History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('picker.receiptsSettlements')}</Text>
          <Text style={styles.sectionSubtitle}>{t('picker.receiptsSub')}</Text>
        </View>

        {receipts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('picker.noReceipts')}</Text>
          </Card>
        ) : (
          receipts.map((rcpt) => (
            <Card key={rcpt.id} style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.receiptNum}>{rcpt.receiptNumber}</Text>
                  <Text style={styles.receiptSub}>
                    {rcpt.measuredKg} kg {rcpt.material.toUpperCase()} • ₹{rcpt.ratePerKg}/kg
                  </Text>
                </View>
                <View style={styles.receiptTotalCol}>
                  <Text style={styles.receiptTotal}>₹{rcpt.total.toFixed(2)}</Text>
                  <Badge label="Cleared (UPI, simulated)" variant="success" size="sm" />
                </View>
              </View>

              <View style={styles.receiptMeta}>
                <Text style={styles.receiptMetaText}>
                  🏭 Destination: <Text style={styles.receiptMetaBold}>{rcpt.destinationName || 'Verified Recycler'}</Text>
                </Text>
                <Text style={styles.receiptMetaText}>
                  👤 Origin: <Text style={styles.receiptMetaBold}>{rcpt.householdName || 'Household'}</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewReceiptBtn}
                onPress={() => setSelectedReceipt(rcpt)}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={16} color={Colors.pickerAccent} />
                <Text style={styles.viewReceiptBtnText}>View Fair Value Receipt</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        {/* Income Breakdown by Material */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.cardHeading}>Sales by Material</Text>

          {[
            { material: '🔩 Metal & Aluminium', kg: '110 kg', sales: '₹5,500', pct: '38%' },
            { material: '📦 Cardboard & Paper', kg: '190 kg', sales: '₹4,750', pct: '33%' },
            { material: '🧴 Plastic & PET Bottles', kg: '70 kg', sales: '₹2,800', pct: '20%' },
            { material: '📱 Electronic Parts', kg: '15 kg', sales: '₹1,200', pct: '9%' },
          ].map((item, idx) => (
            <View key={idx} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownTitle}>{item.material}</Text>
                <Text style={styles.breakdownKg}>{item.kg} collected ({item.pct})</Text>
              </View>
              <Text style={styles.breakdownSales}>{item.sales}</Text>
            </View>
          ))}
        </Card>

        {/* Notice on Cash & UPI */}
        <Card variant="filled" style={styles.payoutNotice}>
          <View style={styles.noticeRow}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Payment Verification</Text>
              <Text style={styles.noticeBody}>
                Recycling transactions can be paid via direct UPI or cash. CIRCULO maintains an immutable ledger for municipal circularity audit.
              </Text>
            </View>
          </View>
        </Card>
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
  heroCard: { backgroundColor: '#E65100', padding: Spacing[5], gap: Spacing[2] },
  heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  heroAmount: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.textInverse },
  heroSub: { fontSize: FontSize.xl, fontWeight: FontWeight.regular },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginTop: Spacing[2],
  },
  heroMetaItem: { flex: 1, alignItems: 'center' },
  heroMetaValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textInverse },
  heroMetaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
  chartCard: { padding: Spacing[4], gap: Spacing[3] },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeading: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  chartTotal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.pickerAccent },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: Spacing[4],
  },
  barCol: { alignItems: 'center', gap: Spacing[1], flex: 1 },
  barValue: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  barTrack: { height: 100, width: 16, backgroundColor: Colors.surfaceAlt, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { backgroundColor: Colors.pickerAccent, width: '100%', borderRadius: 8 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  breakdownCard: { padding: Spacing[4], gap: Spacing[2] },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  breakdownLeft: { flex: 1 },
  breakdownTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  breakdownKg: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  breakdownSales: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  payoutNotice: { backgroundColor: Colors.mintPale, borderColor: Colors.mint, padding: Spacing[4] },
  noticeRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  noticeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  noticeBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  sectionHeader: { marginTop: Spacing[2], marginBottom: Spacing[1] },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  receiptCard: { padding: Spacing[4], gap: Spacing[2.5] },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  receiptNum: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, fontFamily: 'monospace' },
  receiptSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  receiptTotalCol: { alignItems: 'flex-end', gap: 4 },
  receiptTotal: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  receiptMeta: { backgroundColor: Colors.surfaceAlt, padding: Spacing[2.5], borderRadius: BorderRadius.sm, gap: 4 },
  receiptMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  receiptMetaBold: { color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2.5],
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.25)',
  },
  viewReceiptBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.pickerAccent,
  },
  emptyCard: { padding: Spacing[4], alignItems: 'center' },
  emptyText: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
