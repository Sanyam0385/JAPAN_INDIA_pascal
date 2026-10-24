// Household Dashboard Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { DEMO_HOUSEHOLDS, DEMO_COLLECTION_SCHEDULES } from '../../src/lib/demo/demoData';

const QUICK_ACTIONS = [
  { icon: '♻️', label: 'Sell Recyclables', route: '/(household)/recycle', color: Colors.primary },
  { icon: '📢', label: 'Report Issue', route: '/(household)/complaints', color: Colors.error },
  { icon: '🎮', label: 'Learn & Play', route: '/(household)/learn', color: Colors.info },
  { icon: '🌿', label: 'Join Cleanup', route: '/(household)/community', color: Colors.emerald },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { recyclingRequests, unreadNotifications } = useAppStore();

  const household = DEMO_HOUSEHOLDS[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const nextSchedule = DEMO_COLLECTION_SCHEDULES.find(s => s.status === 'scheduled' && s.date >= todayStr);

  const openRequests = recyclingRequests.filter(r => r.householdId === household.id && ['open', 'accepted', 'en_route', 'payment_pending'].includes(r.status));
  const completedCount = recyclingRequests.filter(r => r.householdId === household.id && r.status === 'completed').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Green Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.headerGrad}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Household'}</Text>
            <Text style={styles.locality}>{household.locality}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(household)/profile')}
            style={styles.notifBtn}
          >
            <Ionicons name="notifications" size={24} color={Colors.textInverse} />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Points chip */}
        <View style={styles.pointsChip}>
          <Text style={styles.pointsText}>⭐ {household.rewardPoints} reward points</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        {/* Next Collection */}
        {nextSchedule ? (
          <Card style={styles.nextCollection}>
            <View style={styles.nextCollRow}>
              <View style={[styles.collIcon, { backgroundColor: nextSchedule.category === 'wet' ? '#E8F5E9' : '#E3F2FD' }]}>
                <Text style={styles.collIconText}>
                  {nextSchedule.category === 'wet' ? '🌿' : nextSchedule.category === 'dry' ? '📦' : '♻️'}
                </Text>
              </View>
              <View style={styles.collInfo}>
                <Text style={styles.collLabel}>Next Collection</Text>
                <Text style={styles.collDate}>{formatDate(nextSchedule.date)}</Text>
                <Text style={styles.collTime}>{nextSchedule.timeSlot} · {nextSchedule.category.charAt(0).toUpperCase() + nextSchedule.category.slice(1)} Waste</Text>
              </View>
              <Badge label="Scheduled" variant="success" size="sm" />
            </View>
            <TouchableOpacity onPress={() => router.push('/(household)/calendar')}>
              <Text style={styles.viewCalLink}>View full calendar →</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card style={styles.nextCollection}>
            <Text style={styles.noCollText}>📭 No collection scheduled in upcoming days</Text>
          </Card>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickCard, { borderColor: action.color + '30' }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Monthly Summary */}
        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        <Card>
          <Text style={styles.summaryNote}>⚠️ Estimated figures — Demo only</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{completedCount}</Text>
              <Text style={styles.statLabel}>Recycled ♻️</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>2.3 kg</Text>
              <Text style={styles.statLabel}>CO₂ est.</Text>
            </View>
          </View>
        </Card>

        {/* Active Recycling Requests */}
        {openRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Requests</Text>
            {openRequests.slice(0, 2).map(r => (
              <Card key={r.id} style={styles.reqCard}>
                <View style={styles.reqRow}>
                  <Text style={styles.reqMat}>{r.materialCategory.charAt(0).toUpperCase() + r.materialCategory.slice(1)}</Text>
                  <Badge
                    label={r.status.replace(/_/g, ' ')}
                    variant={r.status === 'completed' ? 'success' : r.status === 'open' ? 'info' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text style={styles.reqQty}>{r.approximateQuantityKg} kg · Est. ₹{r.estimatedPriceMin}–{r.estimatedPriceMax}</Text>
              </Card>
            ))}
            <TouchableOpacity onPress={() => router.push('/(household)/recycle')}>
              <Text style={styles.viewAllLink}>View all requests →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Circularity Passport Promo */}
        <Card variant="filled" style={styles.passportCard}>
          <Text style={styles.passportTitle}>🛂 Circularity Passport</Text>
          <Text style={styles.passportBody}>
            {completedCount} verified recycling transaction{completedCount !== 1 ? 's' : ''} in your record.
          </Text>
          <Text style={styles.passportSub}>Tap Profile → Sustainability Summary to view</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[5], paddingTop: Spacing[3] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: FontWeight.medium },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textInverse },
  locality: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  notifBtn: { padding: Spacing[2] },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.error,
    borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  pointsChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    marginTop: Spacing[3],
  },
  pointsText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scroll: { flex: 1 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  nextCollection: {},
  nextCollRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[2] },
  collIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  collIconText: { fontSize: 24 },
  collInfo: { flex: 1 },
  collLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  collDate: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  collTime: { fontSize: FontSize.sm, color: Colors.textSecondary },
  viewCalLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium, marginTop: Spacing[1] },
  noCollText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing[2] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing[2] },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  quickCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    ...Shadow.sm,
  },
  quickIcon: { fontSize: 32, marginBottom: Spacing[2] },
  quickLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },
  summaryNote: { fontSize: FontSize.xs, color: Colors.warning, marginBottom: Spacing[3] },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.divider },
  reqCard: { marginBottom: 0 },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1] },
  reqMat: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  reqQty: { fontSize: FontSize.sm, color: Colors.textSecondary },
  viewAllLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textAlign: 'center', paddingVertical: Spacing[1] },
  passportCard: {},
  passportTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing[1] },
  passportBody: { fontSize: FontSize.base, color: Colors.textPrimary },
  passportSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing[1] },
});
