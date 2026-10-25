// Household Dashboard Screen
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';
import { useUserLocation } from '../../src/lib/location/useUserLocation';
import { computeNextCollection } from '../../src/lib/location/collectionScheduleCalculator';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { FairValueReceiptModal } from '../../src/components/shared';
import { DEMO_HOUSEHOLDS } from '../../src/lib/demo/demoData';
import type { Receipt } from '../../src/types';

const QUICK_ACTIONS = [
  { icon: '🧭', key: 'trackLive', label: 'Track Live', route: '/(household)/tracking', color: Colors.primary },
  { icon: '♻️', key: 'sellRecyclables', label: 'Sell Recyclables', route: '/(household)/recycle', color: Colors.primary },
  { icon: '📢', key: 'reportIssue', label: 'Report Issue', route: '/(household)/complaints', color: Colors.error },
  { icon: '🎮', key: 'learnSegregation', label: 'Learn Segregation', route: '/(household)/learn', color: Colors.info },
  { icon: '🌿', key: 'joinCleanup', label: 'Join Cleanup', route: '/(household)/community', color: Colors.emerald },
];

function getGreeting(t: any, hour = new Date().getHours()) {
  if (hour < 12) return t('household.greetingMorning', 'Good morning');
  if (hour < 17) return t('household.greetingAfternoon', 'Good afternoon');
  return t('household.greetingEvening', 'Good evening');
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    recyclingRequests,
    unreadNotifications,
    receipts,
    householdMonthlyDivertedKg,
    householdStreakDays,
    quickRequestPickup,
  } = useAppStore();

  const {
    locality,
    displayLocation,
    municipalName,
    cityConfig,
    isConfiguredCity,
    hasLocation,
    isDemoUser,
  } = useUserLocation();

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [quickRequestSuccess, setQuickRequestSuccess] = useState<string | null>(null);

  const household = DEMO_HOUSEHOLDS[0];

  // Dynamically compute the next collection strictly from the city config without contradictions
  const nextCollection = useMemo(() => {
    return computeNextCollection(cityConfig, new Date(), i18n.language || 'en-IN');
  }, [cityConfig, i18n.language]);

  const openRequests = recyclingRequests.filter(r =>
    (r.householdId === household.id || r.householdId === user?.id) &&
    ['open', 'accepted', 'en_route', 'payment_pending'].includes(r.status)
  );
  const completedCount = recyclingRequests.filter(r =>
    (r.householdId === household.id || r.householdId === user?.id) && r.status === 'completed'
  ).length;
  const householdReceipt = receipts.find(r => r.householdId === household.id || r.householdId === user?.id) ?? receipts[0];

  const handleQuickRequest = () => {
    const activeAddress = locality ? `${locality}, ${cityConfig.name}` : `${household.address}, ${cityConfig.name}`;
    const jobId = quickRequestPickup('Cardboard', 5, 14, activeAddress);
    setQuickRequestSuccess(jobId);
    setTimeout(() => setQuickRequestSuccess(null), 4000);
  };

  const targetMonthlyKg = 40;
  const progressPercent = Math.min(100, Math.round((householdMonthlyDivertedKg / targetMonthlyKg) * 100));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Green Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.headerGrad}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>{getGreeting(t)},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Household'}</Text>

            {hasLocation ? (
              <View style={styles.localityContainer}>
                <Text style={styles.localityText} numberOfLines={1}>{displayLocation}</Text>
                <Text style={styles.municipalLabel} numberOfLines={1}>{municipalName}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.setLocationPrompt}
                onPress={() => router.push('/(household)/profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="location-outline" size={13} color="#FFFFFF" />
                <Text style={styles.setLocationText}>Set your location →</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(household)/profile')}
            style={styles.notifBtn}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications" size={24} color={Colors.textInverse} />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Streak & Points strip */}
        <View style={styles.headerMetricsRow}>
          <View style={styles.pointsChip}>
            <Text style={styles.pointsText}>⭐ {household.rewardPoints} points</Text>
          </View>
          <View style={styles.streakChip}>
            <Text style={styles.streakText}>🔥 {householdStreakDays} Day Streak</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        {/* One-time banner for users with stale or unconfigured location */}
        {!isDemoUser && (!hasLocation || user?.locationSource === 'demo') && (
          <Card style={styles.updateLocationBanner}>
            <View style={styles.updateLocIcon}>
              <Ionicons name="navigate" size={20} color="#14632E" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.updateLocTitle}>Update Your Municipal Location</Text>
              <Text style={styles.updateLocSub}>
                Set your city or ward to receive localized collection schedules and accurate doorstep recycling rates.
              </Text>
              <TouchableOpacity
                style={styles.updateLocBtn}
                onPress={() => router.push('/(household)/profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.updateLocBtnText}>Update Location Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Municipal Collection Banner & Next Collection */}
        <Card style={styles.nextCollectionCard}>
          <View style={styles.cityRuleHeader}>
            <Ionicons name="business-outline" size={16} color={Colors.primary} />
            <Text style={styles.cityRuleTitle}>{cityConfig.name} Waste Schedule</Text>
            <View style={[styles.verifiedPill, !isConfiguredCity && styles.genericPill]}>
              <Text style={[styles.verifiedPillText, !isConfiguredCity && styles.genericPillText]}>
                {isConfiguredCity ? 'Active City Rules' : 'General Rules'}
              </Text>
            </View>
          </View>

          {!isConfiguredCity && (
            <View style={styles.genericNoticeBox}>
              <Ionicons name="information-circle-outline" size={15} color="#C62828" />
              <Text style={styles.genericNoticeText}>
                {cityConfig.notice || "Your city isn't configured yet, so general segregation rules are shown."}
              </Text>
            </View>
          )}

          <View style={styles.nextCollRow}>
            <View style={[styles.collIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.collIconText}>{nextCollection.categoryIcon}</Text>
            </View>
            <View style={styles.collInfo}>
              <Text style={styles.collLabel}>{t('household.nextCollection', 'Next Municipal Doorstep Collection')}</Text>
              <Text style={styles.collDate}>{nextCollection.formattedDate}</Text>
              <Text style={styles.collTime}>
                {nextCollection.timeSlot} · {nextCollection.categoryLabel}
              </Text>
            </View>
            <Badge
              label={t('status.' + nextCollection.status.toLowerCase(), nextCollection.status)}
              variant={nextCollection.statusVariant}
              size="sm"
            />
          </View>

          {/* Weekday Chips */}
          <View style={styles.weekdaysRow}>
            {nextCollection.activeWeekdays.map((wd) => (
              <View
                key={wd.day}
                style={[styles.weekdayChip, wd.isActive && styles.weekdayChipActive]}
              >
                <Text style={[styles.weekdayText, wd.isActive && styles.weekdayTextActive]}>
                  {wd.short}
                </Text>
              </View>
            ))}
          </View>

          {/* Bins Row */}
          <View style={styles.binsRow}>
            {(Array.isArray(cityConfig.bins) ? cityConfig.bins : Object.values(cityConfig.bins)).map((binInfo: any, idx: number) => (
              <View key={binInfo.key || idx} style={styles.binItem}>
                <View style={[styles.binColorDot, { backgroundColor: binInfo.color || binInfo.colorHex || '#2E7D32' }]} />
                <Text style={styles.binName}>{binInfo.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.collectionActionRow}>
            <TouchableOpacity
              style={styles.trackCollectionBtn}
              onPress={() => router.push('/(household)/tracking')}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle" size={18} color="#FFFFFF" />
              <Text style={styles.trackCollectionBtnText}>
                {t('household.trackLive', 'Track Live 🧭')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(household)/calendar')}>
              <Text style={styles.viewCalLink}>{t('calendar.viewFullCalendar', 'View full collection calendar →')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* One-Tap Quick Recyclable Request */}
        <Card style={styles.quickRequestCard}>
          <View style={styles.quickRequestHeader}>
            <View style={styles.quickReqBadge}>
              <Ionicons name="flash" size={14} color="#E65100" />
              <Text style={styles.quickReqBadgeText}>{t('household.oneTapPickup', 'ONE-TAP RECYCLABLES')}</Text>
            </View>
            <Text style={styles.quickReqPrice}>Locked Rate: ₹14/kg</Text>
          </View>
          <Text style={styles.quickReqTitle}>{t('household.quickRequestTitle', '5 kg Corrugated Cardboard')}</Text>
          <Text style={styles.quickReqSub}>
            {t('household.quickRequestSub', 'Direct collector handoff. Guaranteed payout via verified UPI.')}
          </Text>

          {quickRequestSuccess ? (
            <View style={styles.quickSuccessBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.quickSuccessText}>
                {t('picker.jobAccepted', 'Pickup Logged! Assigned to nearby collector.')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.quickReqBtn}
              onPress={handleQuickRequest}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.quickReqBtnText}>{t('household.requestDoorstep', 'Request Doorstep Pickup (1-Tap)')}</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Circularity Goal & Streak */}
        <Card style={styles.streakGoalCard}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.goalTitle}>{t('household.targetMonthly', 'Monthly Circularity Target')}</Text>
              <Text style={styles.goalSub}>Diverted from municipal landfills</Text>
            </View>
            <View style={styles.streakBadgeLarge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumText}>{t('household.streakDays', { count: householdStreakDays })}</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.goalStatsRow}>
            <Text style={styles.goalCurrentText}>
              <Text style={styles.boldText}>{householdMonthlyDivertedKg.toFixed(1)} kg</Text> {t('household.diverted', 'diverted')}
            </Text>
            <Text style={styles.goalTargetText}>{progressPercent}% of {targetMonthlyKg} kg target</Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('household.quickActions', 'Quick Actions')}</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickCard, { borderColor: action.color + '30' }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={[styles.quickLabel, { color: action.color }]}>{t('household.' + action.key, action.label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Monthly Summary */}
        <Text style={styles.sectionTitle}>{t('household.monthlyStats', 'Monthly Summary')}</Text>
        <Card>
          <Text style={styles.summaryNote}>{t('household.summaryNote', 'Verified environmental impact metrics')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>{t('household.collectionsThisMonth', 'Collections')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{completedCount}</Text>
              <Text style={styles.statLabel}>{t('household.recyclablesSold', 'Recycled ♻️')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>2.3 kg</Text>
              <Text style={styles.statLabel}>{t('household.co2Saved', 'CO₂ est.')}</Text>
            </View>
          </View>
        </Card>

        {/* Active Recycling Requests */}
        {openRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('household.activeRequests', 'Active Requests')}</Text>
            {openRequests.slice(0, 2).map(r => (
              <Card key={r.id} style={styles.reqCard}>
                <View style={styles.reqRow}>
                  <Text style={styles.reqMat}>{t('materials.' + r.materialCategory, r.materialCategory)}</Text>
                  <Badge
                    label={t('status.' + r.status, r.status)}
                    variant={r.status === 'completed' ? 'success' : r.status === 'open' ? 'info' : 'warning'}
                    size="sm"
                  />
                </View>
                <View style={styles.reqBottomRow}>
                  <Text style={styles.reqQty}>{r.approximateQuantityKg} kg · Est. ₹{r.estimatedPriceMin}–{r.estimatedPriceMax}</Text>
                  <TouchableOpacity
                    style={styles.trackPickerPill}
                    onPress={() => router.push('/(household)/tracking?type=picker')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={13} color={Colors.primary} />
                    <Text style={styles.trackPickerPillText}>Track</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
            <TouchableOpacity onPress={() => router.push('/(household)/recycle')}>
              <Text style={styles.viewAllLink}>{t('household.viewAllRequests', 'View all requests →')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Circularity Passport Hero Card */}
        <Text style={styles.sectionTitle}>Circularity Passport</Text>
        <Card style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View style={styles.passportBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#1B5E20" />
              <Text style={styles.passportBadgeText}>FAIR VALUE PASSPORT</Text>
            </View>
            <Text style={styles.passportNumber}>{householdReceipt?.receiptNumber ?? 'FVR-2026-0041'}</Text>
          </View>
          <Text style={styles.passportTitle}>Verified Recyclable Handoff</Text>
          <Text style={styles.passportBody}>
            {householdReceipt
              ? `${householdReceipt.measuredKg.toFixed(2)} kg ${householdReceipt.material.toUpperCase()} • ₹${householdReceipt.total.toFixed(2)} Cleared (UPI, simulated)`
              : `${completedCount} verified transactions in your record layer.`}
          </Text>
          <TouchableOpacity
            style={styles.passportBtn}
            onPress={() => setSelectedReceipt(householdReceipt ?? receipts[0])}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
            <Text style={styles.passportBtnText}>View Fair Value Receipt</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Fair Value Receipt Modal */}
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
  headerGrad: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[5], paddingTop: Spacing[3] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerInfo: { flex: 1, marginRight: Spacing[3] },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: FontWeight.medium },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textInverse },
  localityContainer: { marginTop: 3 },
  localityText: { fontSize: FontSize.sm, color: '#FFFFFF', fontWeight: FontWeight.semibold },
  municipalLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  setLocationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  setLocationText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  notifBtn: { padding: Spacing[2] },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.error,
    borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  headerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  pointsChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  pointsText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  streakChip: {
    backgroundColor: 'rgba(255, 109, 0, 0.25)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  streakText: { color: '#FFE0B2', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  scroll: { flex: 1 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  // Stale Location Banner
  updateLocationBanner: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    padding: Spacing[4],
  },
  updateLocIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateLocTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
  },
  updateLocSub: {
    fontSize: FontSize.xs,
    color: '#386043',
    lineHeight: 18,
  },
  updateLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#14632E',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing[1],
  },
  updateLocBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  nextCollectionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing[4],
  },
  cityRuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  cityRuleTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  verifiedPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 2,
  },
  verifiedPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  genericPill: {
    backgroundColor: '#FFF3E0',
  },
  genericPillText: {
    color: '#E65100',
  },
  genericNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    backgroundColor: '#FFF8E1',
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
  },
  genericNoticeText: {
    fontSize: FontSize.xs,
    color: '#795548',
    flex: 1,
  },
  nextCollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  collIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collIconText: { fontSize: 22 },
  collInfo: { flex: 1 },
  collLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  collDate: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginVertical: 1 },
  collTime: { fontSize: FontSize.xs, color: Colors.textSecondary },
  weekdaysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing[3],
    paddingTop: Spacing[1],
  },
  weekdayChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F5F5F5',
  },
  weekdayChipActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  weekdayText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: '#9E9E9E',
  },
  weekdayTextActive: {
    color: '#1B5E20',
    fontWeight: FontWeight.bold,
  },
  binsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
    flexWrap: 'wrap',
  },
  binItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  binColorDot: { width: 10, height: 10, borderRadius: 5 },
  binName: { fontSize: FontSize.xs, color: Colors.textSecondary },
  viewCalLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  quickRequestCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
    padding: Spacing[4],
  },
  quickRequestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1.5] },
  quickReqBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFE0B2', paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: 4 },
  quickReqBadgeText: { fontSize: 10, fontWeight: '800', color: '#E65100' },
  quickReqPrice: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  quickReqTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  quickReqSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  quickReqBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    backgroundColor: '#E65100', borderRadius: BorderRadius.md, paddingVertical: Spacing[2.5], marginTop: Spacing[3],
  },
  quickReqBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  quickSuccessBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: '#E8F5E9', padding: Spacing[2.5], borderRadius: BorderRadius.md, marginTop: Spacing[3],
  },
  quickSuccessText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' },
  streakGoalCard: { padding: Spacing[4] },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[3] },
  goalTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  goalSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  streakBadgeLarge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: Spacing[2.5], paddingVertical: 3, borderRadius: BorderRadius.full },
  streakEmoji: { fontSize: 16 },
  streakNumText: { fontSize: FontSize.sm, fontWeight: '800', color: '#E65100' },
  progressBarContainer: { height: 8, backgroundColor: '#EEEEEE', borderRadius: 4, overflow: 'hidden', marginBottom: Spacing[2] },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  goalStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalCurrentText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  boldText: { fontWeight: FontWeight.bold, color: Colors.textPrimary },
  goalTargetText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginVertical: Spacing[1] },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2.5] },
  quickCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: Spacing[3.5],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing[1.5],
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  summaryNote: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing[3] },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  reqCard: { marginBottom: Spacing[2] },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reqMat: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  reqQty: { fontSize: FontSize.xs, color: Colors.textSecondary },
  viewAllLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold, alignSelf: 'flex-end', marginTop: 2 },
  passportCard: { padding: Spacing[4] },
  passportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  passportBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: 4 },
  passportBadgeText: { fontSize: 10, fontWeight: '800', color: '#1B5E20' },
  passportNumber: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  passportTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  passportBody: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  passportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    backgroundColor: '#1B5E20', borderRadius: BorderRadius.md, paddingVertical: Spacing[2.5], marginTop: Spacing[3],
  },
  passportBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  collectionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[2],
  },
  trackCollectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  trackCollectionBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  reqBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  trackPickerPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
