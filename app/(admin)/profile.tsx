// Municipal Administrator — Profile & System Settings
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner, LanguageSelectorButton } from '../../src/components/ui';

export default function AdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, signOut, isDemoMode } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(t('auth.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'K'}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'Kavitha Reddy'}</Text>
              <Badge label="Ward Supervisor" variant="info" size="sm" />
            </View>
            <Text style={styles.userRole}>Executive Officer · SWM Division</Text>
            <Text style={styles.userLocality}>Bruhat Bengaluru Mahanagara Palike (BBMP)</Text>
          </View>
          <LanguageSelectorButton variant="icon" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO ADMINISTRATOR — Evaluation preview of municipal administrative authority." />

        {/* Administrative Jurisdiction Card */}
        <Card style={styles.jurisdictionCard}>
          <Text style={styles.cardHeading}>{t('admin.wardConfiguration')}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Zone:</Text>
            <Text style={styles.val}>South Zone, Bengaluru</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ward:</Text>
            <Text style={styles.val}>Ward 151 (Koramangala)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Population:</Text>
            <Text style={styles.val}>48,200 Citizens</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Solid Waste Rules:</Text>
            <Text style={styles.val}>SWM By-laws 2020 (Mandatory 3-way)</Text>
          </View>
        </Card>

        {/* System Settings & Compliance */}
        <Card style={styles.settingsCard}>
          <Text style={styles.cardHeading}>{t('admin.settings')}</Text>
          <View style={styles.settingItem}>
            <Ionicons name="language" size={20} color={Colors.adminAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>{t('profile.language')}</Text>
              <Text style={styles.settingSub}>{t('profile.fullTranslationsActive')}</Text>
            </View>
            <LanguageSelectorButton variant="pill" />
          </View>
        </Card>

        {/* Switch Role (Judge Mode) */}
        {isDemoMode && (
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => router.push('/(auth)/demo-select')}
          >
            <Ionicons name="swap-horizontal" size={20} color={Colors.adminAccent} />
            <Text style={styles.switchRoleText}>{t('profile.switchRole')}</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.adminAccent,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.adminAccent },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  userRole: { fontSize: FontSize.xs, color: Colors.textSecondary },
  userLocality: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  jurisdictionCard: { padding: Spacing[4], gap: Spacing[2.5] },
  cardHeading: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[1] },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary },
  val: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  settingsCard: { padding: Spacing[4], gap: Spacing[3] },
  settingItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  settingTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  settingSub: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#EDE7F6',
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#D1C4E9',
    marginTop: Spacing[2],
  },
  switchRoleText: { color: Colors.adminAccent, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.errorLight,
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  logoutText: { color: Colors.error, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
});
