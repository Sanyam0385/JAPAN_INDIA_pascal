// Household Profile, Notifications & Settings Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  SUPPORTED_LANGUAGES,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { DEMO_HOUSEHOLDS } from '../../src/lib/demo/demoData';

type ProfileTab = 'profile' | 'notifications' | 'settings';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, isDemoMode } = useAuthStore();
  const { notifications, unreadNotifications, markNotificationRead, markAllRead, language, setLanguage } = useAppStore();
  const [tab, setTab] = useState<ProfileTab>('profile');

  const household = DEMO_HOUSEHOLDS[0];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        }
      },
    ]);
  };

  const BADGES = [
    { icon: '🌿', name: 'Segregation Star', earned: true, desc: 'Scored 80%+ on the segregation game' },
    { icon: '♻️', name: 'Recycling Champion', earned: true, desc: 'Completed 5 recycling pickups' },
    { icon: '🏆', name: 'Community Hero', earned: false, desc: 'Attend 3 volunteer events' },
    { icon: '💚', name: 'Zero Waste Week', earned: false, desc: 'Complete the Zero Plastic challenge' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Green header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.headerGrad}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? 'H'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? 'Household'}</Text>
            <Text style={styles.userRole}>Household · {household.locality}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          {isDemoMode && (
            <View style={styles.demoPill}>
              <Text style={styles.demoPillText}>DEMO</Text>
            </View>
          )}
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{household.rewardPoints}</Text>
            <Text style={styles.statLbl}>Points</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>12</Text>
            <Text style={styles.statLbl}>Collections</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>3</Text>
            <Text style={styles.statLbl}>Badges</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {[
          { key: 'profile', label: 'Profile', icon: 'person-outline' },
          { key: 'notifications', label: `Inbox${unreadNotifications > 0 ? ` (${unreadNotifications})` : ''}`, icon: 'notifications-outline' },
          { key: 'settings', label: 'Settings', icon: 'settings-outline' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key as ProfileTab)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <>
            <DemoDataBanner />

            <Card>
              <Text style={styles.sectionTitle}>Household Info</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Members</Text><Text style={styles.infoValue}>{household.memberCount}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Locality</Text><Text style={styles.infoValue}>{household.locality}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Ward</Text><Text style={styles.infoValue}>{household.ward}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Segregating</Text><Text style={styles.infoValue}>{household.isSegregating ? '✅ Yes' : '❌ No'}</Text></View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Since</Text>
                <Text style={styles.infoValue}>{new Date(household.createdAt || new Date().toISOString()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Sustainability Summary</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Collections this month</Text><Text style={styles.infoValue}>12</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Recyclables sold</Text><Text style={styles.infoValue}>2 requests</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>CO₂ offset (est.)</Text><Text style={styles.infoValue}>2.3 kg*</Text></View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Game accuracy</Text><Text style={styles.infoValue}>{household.segregationScore}%</Text>
              </View>
              <Text style={styles.estimateNote}>* Estimated figures for demo. Environmental metrics are simulated.</Text>
            </Card>

            <Text style={styles.sectionHeading}>🏅 Badges</Text>
            <View style={styles.badgeGrid}>
              {BADGES.map(b => (
                <View key={b.name} style={[styles.badge, !b.earned && styles.badgeLocked]}>
                  <Text style={[styles.badgeIcon, !b.earned && styles.badgeIconLocked]}>{b.earned ? b.icon : '🔒'}</Text>
                  <Text style={[styles.badgeName, !b.earned && styles.badgeNameLocked]}>{b.name}</Text>
                  <Text style={styles.badgeDesc}>{b.desc}</Text>
                </View>
              ))}
            </View>

            {isDemoMode && (
              <TouchableOpacity style={styles.switchRoleBtn} onPress={() => router.push('/(auth)/demo-select')}>
                <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                <Text style={styles.switchRoleText}>Switch Demo Role</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <>
            <View style={styles.notifHeader}>
              <Text style={styles.sectionHeading}>Notifications</Text>
              {unreadNotifications > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={styles.markAllRead}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifications.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>📭 No notifications</Text>
              </Card>
            ) : (
              notifications.map(n => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => markNotificationRead(n.id)}
                  activeOpacity={0.8}
                >
                  <Card style={[styles.notifCard, !n.isRead && styles.notifUnread]}>
                    <View style={styles.notifRow}>
                      <View style={styles.notifDot}>
                        {!n.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <View style={styles.notifBody}>
                        <Text style={[styles.notifTitle, !n.isRead && { color: Colors.primary }]}>
                          {n.title}
                        </Text>
                        <Text style={styles.notifText}>{n.body}</Text>
                        <Text style={styles.notifTime}>{formatDate(n.createdAt)}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Language</Text>
              {SUPPORTED_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langRow, language === lang.code && styles.langRowActive]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={styles.langLabel}>{lang.nativeLabel}</Text>
                  <Text style={styles.langSub}>{lang.label}</Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <Text style={styles.langNote}>Full translations in progress. Currently English-complete.</Text>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Collection reminders</Text>
                <Text style={styles.settingValue}>On (demo)</Text>
              </View>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.settingLabel}>Pickup updates</Text>
                <Text style={styles.settingValue}>On (demo)</Text>
              </View>
              <Text style={styles.langNote}>Push notifications require a development build.</Text>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.settingRow}><Text style={styles.settingLabel}>App version</Text><Text style={styles.settingValue}>1.0.0-demo</Text></View>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.settingLabel}>Mode</Text><Text style={styles.settingValue}>Hackathon Demo</Text>
              </View>
            </Card>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGrad: { padding: Spacing[5], paddingBottom: Spacing[4] },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textInverse },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textInverse },
  userRole: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  userEmail: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  demoPill: {
    backgroundColor: Colors.warning, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[2], paddingVertical: 2,
  },
  demoPillText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
  statsStrip: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing[4] },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textInverse },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  sectionHeading: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  estimateNote: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing[2] },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  badge: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.mintPale,
    borderRadius: BorderRadius.lg, padding: Spacing[3], alignItems: 'center',
    borderWidth: 1, borderColor: Colors.mint, gap: Spacing[1],
  },
  badgeLocked: { backgroundColor: Colors.gray100, borderColor: Colors.gray300 },
  badgeIcon: { fontSize: 32 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textTertiary },
  badgeDesc: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
  switchRoleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    backgroundColor: Colors.mintPale, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3], borderWidth: 1, borderColor: Colors.mint,
  },
  switchRoleText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },

  // Notifications
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markAllRead: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8] },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  notifCard: { marginBottom: 0 },
  notifUnread: { borderColor: Colors.mint, borderWidth: 1.5 },
  notifRow: { flexDirection: 'row', gap: Spacing[3] },
  notifDot: { width: 12, paddingTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  notifText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },

  // Settings
  langRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  langRowActive: { backgroundColor: Colors.mintPale },
  langLabel: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  langSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginRight: Spacing[2] },
  langNote: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing[2] },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[2.5], borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  settingLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  settingValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    backgroundColor: Colors.errorLight, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], borderWidth: 1, borderColor: Colors.error + '40',
  },
  signOutText: { color: Colors.error, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
