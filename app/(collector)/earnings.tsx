import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, DemoDataBanner } from '../../src/components/ui';

interface Payment {
  id: string;
  date: string;
  amount: number;
  type: string;
}

const DEMO_PAYMENTS: Payment[] = [
  { id: 'p1', date: '15 Oct 2026', amount: 9200, type: 'Fortnightly Base Pay' },
  { id: 'p2', date: '30 Sep 2026', amount: 8100, type: 'Fortnightly Base Pay' },
  { id: 'p3', date: '15 Sep 2026', amount: 8100, type: 'Fortnightly Base Pay' },
  { id: 'p4', date: '01 Oct 2026', amount: 1200, type: 'Attendance Bonus' },
  { id: 'p5', date: '01 Oct 2026', amount: 900, type: 'Performance Bonus' },
];

const WEEKLY_BARS: { day: string; kg: number }[] = [
  { day: 'Mon', kg: 210 },
  { day: 'Tue', kg: 185 },
  { day: 'Wed', kg: 240 },
  { day: 'Thu', kg: 195 },
  { day: 'Fri', kg: 225 },
  { day: 'Sat', kg: 160 },
  { day: 'Sun', kg: 0 },
];

const MAX_KG = Math.max(...WEEKLY_BARS.map(b => b.kg), 1);
const BAR_MAX_HEIGHT = 100;

export default function CollectorEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}>
        <Text style={styles.headerTitle}>{t('collector.myEarnings')}</Text>
        <Text style={styles.headerSub}>{t('collector.payrollSub')}</Text>
      </View>

      <View style={styles.body}>
        <DemoDataBanner message={t('collector.payrollBanner')} />

        {/* Monthly summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.demoLabel}>{t('collector.estimatedDisbursements')}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryMonth}>{t('collector.thisMonth')}</Text>
              <Text style={styles.summaryAmount}>₹18,400</Text>
              <Text style={styles.summaryNote}>Oct 2026</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryMonth}>{t('collector.lastMonth')}</Text>
              <Text style={[styles.summaryAmount, { color: Colors.textSecondary }]}>₹16,200</Text>
              <Text style={styles.summaryNote}>Sep 2026</Text>
            </View>
          </View>
        </Card>

        {/* Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t('collector.thisMonthBreakdown')}</Text>
          <Text style={styles.estimatedNote}>{t('collector.estimatedDemoOnly')}</Text>
          {[
            { label: t('collector.basePay'), amount: 14400, color: Colors.collectorAccent },
            { label: t('collector.attendanceBonus'), amount: 2400, color: Colors.success },
            { label: t('collector.performanceBonus'), amount: 1600, color: Colors.warning },
          ].map(item => (
            <View key={item.label} style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <Text style={[styles.breakdownAmount, { color: item.color }]}>
                ₹{item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </Card>

        {/* Weekly KG bar chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>{t('collector.thisWeekKg')}</Text>
          <Text style={styles.estimatedNote}>{t('collector.estimatedDemoOnly')}</Text>
          <View style={styles.barsRow}>
            {WEEKLY_BARS.map(bar => {
              const heightPct = bar.kg / MAX_KG;
              const barHeight = Math.round(heightPct * BAR_MAX_HEIGHT);
              return (
                <View key={bar.day} style={styles.barCol}>
                  <Text style={styles.barValue}>{bar.kg > 0 ? bar.kg : ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: bar.kg > 0 ? Colors.collectorAccent : Colors.gray200,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDay}>{bar.day}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Recent Payments */}
        <Text style={styles.sectionTitle}>{t('profile.history')}</Text>
        <Text style={styles.estimatedNote}>⚠️ {t('collector.estimatedDemoOnly')}</Text>
        {DEMO_PAYMENTS.map(p => (
          <View key={p.id} style={styles.paymentRow}>
            <View style={styles.paymentIcon}>
              <Text style={styles.paymentIconText}>₹</Text>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentType}>{p.type}</Text>
              <Text style={styles.paymentDate}>{p.date}</Text>
            </View>
            <Text style={styles.paymentAmount}>
              ₹{p.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        ))}

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            💡 {t('collector.wageNote')}
          </Text>
        </View>
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
  demoLabel: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  estimatedNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing[2],
  },
  summaryCard: { padding: Spacing[4] },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 60, backgroundColor: Colors.divider },
  summaryMonth: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  summaryAmount: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.collectorAccent,
  },
  summaryNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  breakdownCard: { padding: Spacing[4] },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  breakdownAmount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  chartCard: { padding: Spacing[4] },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: Spacing[4],
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing[1],
  },
  barValue: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  barTrack: {
    width: 22,
    height: BAR_MAX_HEIGHT,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  barDay: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },
  paymentRow: {
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
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconText: {
    fontSize: FontSize.lg,
    color: Colors.collectorAccent,
    fontWeight: FontWeight.bold,
  },
  paymentInfo: { flex: 1 },
  paymentType: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  paymentDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  footerNote: {
    backgroundColor: Colors.infoLight,
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    marginTop: Spacing[2],
  },
  footerNoteText: {
    fontSize: FontSize.sm,
    color: Colors.info,
    lineHeight: 20,
  },
});
