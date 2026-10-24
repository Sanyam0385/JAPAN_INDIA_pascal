import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, DemoDataBanner } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';

const DEMO_BADGES = [
  { id: 'b1', icon: '⏰', label: 'Punctual 5 Days', desc: '5 consecutive on-time starts' },
  { id: 'b2', icon: '🏆', label: 'Top Collector Oct', desc: 'Highest kg collected this month' },
  { id: 'b3', icon: '🤝', label: 'Community Champion', desc: 'Recognised by resident association' },
];

export default function CollectorProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, isDemoMode } = useAuthStore();
  const { notifications, markNotificationRead, markAllRead } = useAppStore();

  const name = user?.name ?? 'Ramesh Kumar';
  const unread = notifications.filter(n => !n.isRead).length;

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header gradient */}
      <LinearGradient
        colors={['#01579B', '#0288D1']}
        style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.headerName}>{name}</Text>
        <Text style={styles.headerSub}>Employee ID: EMP-BBMP-2024-0231 (Demo)</Text>
        <Text style={styles.headerZone}>Zone 3 · Koramangala Division</Text>
      </LinearGradient>

      <View style={styles.body}>
        <DemoDataBanner message="All profile data is demo — not a real employee record." />

        {/* Profile Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          {[
            { icon: 'person', label: 'Name', value: name },
            { icon: 'call', label: 'Phone', value: '+91-98765-XXXXX (masked)' },
            { icon: 'location', label: 'Zone', value: 'Zone 3 — Koramangala, Domlur, Indiranagar' },
            { icon: 'bus', label: 'Vehicle', value: 'KA-01-M-2234 (Demo)' },
            { icon: 'person-circle', label: 'Supervisor', value: 'Mr. Suresh Pillai (Demo)' },
          ].map(item => (
            <View key={item.label} style={styles.detailRow}>
              <Ionicons name={item.icon as any} size={18} color={Colors.collectorAccent} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>This Month Stats</Text>
          <Text style={styles.demoNote}>⚠️ Demo estimates only</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>186</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.2t</Text>
              <Text style={styles.statLabel}>KG Collected*</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>94%</Text>
              <Text style={styles.statLabel}>On-Time*</Text>
            </View>
          </View>
          <Text style={styles.estimatedStar}>* Estimated — Demo only</Text>
        </Card>

        {/* Recognition Badges */}
        <Card style={styles.badgesCard}>
          <Text style={styles.sectionTitle}>Recognition Badges</Text>
          <Text style={styles.demoNote}>Demo badges — not official certifications</Text>
          {DEMO_BADGES.map(badge => (
            <View key={badge.id} style={styles.badgeRow}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeLabel}>{badge.label}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Notifications */}
        <Card style={styles.notificationsCard}>
          <View style={styles.notifHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {unread > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <Text style={styles.markAllRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
          {notifications.length === 0 ? (
            <Text style={styles.noNotif}>No notifications</Text>
          ) : (
            notifications.slice(0, 6).map(n => (
              <TouchableOpacity
                key={n.id}
                style={[styles.notifRow, !n.isRead && styles.notifRowUnread]}
                onPress={() => markNotificationRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.notifDot, !n.isRead && styles.notifDotActive]} />
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody2} numberOfLines={2}>{n.body}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Demo: Role switcher */}
        {isDemoMode && (
          <TouchableOpacity
            style={styles.roleSwitchBtn}
            onPress={() => router.push('/(auth)/demo-select')}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={18} color={Colors.collectorAccent} />
            <Text style={styles.roleSwitchText}>Switch Demo Role</Text>
          </TouchableOpacity>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {},
  header: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[6],
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  headerName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing[1],
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing[1],
  },
  headerZone: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  body: { padding: Spacing[4], gap: Spacing[3] },
  detailsCard: { padding: Spacing[4] },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
  },
  demoNote: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontStyle: 'italic',
    marginBottom: Spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailInfo: { flex: 1 },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  statsCard: { padding: Spacing[4] },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.collectorAccent,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.divider },
  estimatedStar: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: Spacing[2],
  },
  badgesCard: { padding: Spacing[4] },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  badgeIcon: { fontSize: 28 },
  badgeInfo: { flex: 1 },
  badgeLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  badgeDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  notificationsCard: { padding: Spacing[4] },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  markAllRead: {
    fontSize: FontSize.sm,
    color: Colors.collectorAccent,
    fontWeight: FontWeight.medium,
  },
  noNotif: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', padding: Spacing[4] },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  notifRowUnread: { backgroundColor: Colors.infoLight + '40' },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray300,
    marginTop: 5,
    flexShrink: 0,
  },
  notifDotActive: { backgroundColor: Colors.collectorAccent },
  notifBody: { flex: 1 },
  notifTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifBody2: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderWidth: 1.5,
    borderColor: Colors.collectorAccent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[4],
    minHeight: 56,
    backgroundColor: Colors.surface,
  },
  roleSwitchText: {
    color: Colors.collectorAccent,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[4],
    minHeight: 56,
    backgroundColor: Colors.errorLight,
  },
  signOutText: {
    color: Colors.error,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
});
