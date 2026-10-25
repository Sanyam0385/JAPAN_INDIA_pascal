import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../src/constants';
import { DEMO_ACCOUNTS } from '../../src/lib/demo/demoData';
import type { UserRole } from '../../src/types';
import { LanguageSelectorButton } from '../../src/components/ui';

const ROLE_CONFIG: Record<UserRole, { icon: string; color: string; bgColor: string; features: string[] }> = {
  household: {
    icon: '🏠',
    color: Colors.householdAccent,
    bgColor: Colors.mintPale,
    features: ['Collection calendar', 'Sell recyclables', 'Segregation game', 'Complaints', 'Community events'],
  },
  formal_collector: {
    icon: '🚛',
    color: Colors.collectorAccent,
    bgColor: '#E3F2FD',
    features: ['Daily route & stops', 'Record collections', 'Shift management', 'Earnings', 'Worker recognition'],
  },
  informal_picker: {
    icon: '♻️',
    color: Colors.pickerAccent,
    bgColor: '#FFF3E0',
    features: ['Open marketplace', 'Accept pickup jobs', 'Buyer directory', 'Earnings tracker', 'Low-literacy mode'],
  },
  municipal_admin: {
    icon: '🏛️',
    color: Colors.adminAccent,
    bgColor: '#F3E5F5',
    features: ['Municipal overview', 'Route management', 'Complaint resolution', 'Statistics & reports', 'Policy configuration'],
  },
  recycler: {
    icon: '🏭',
    color: '#00796B',
    bgColor: '#E0F2F1',
    features: ['Incoming picker lots', 'Confirm & grade weight', 'Quality verification', 'Clear UPI settlement', 'Circularity Passport'],
  },
};

export default function DemoSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signInWithRole, isLoading } = useAuthStore();

  const handleRoleSelect = async (role: UserRole) => {
    await signInWithRole(role);
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <LanguageSelectorButton variant="pill" />
        </View>
        <View style={styles.headerCenter}>
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>⚡ INTERACTIVE SIMULATOR</Text>
          </View>
          <Text style={styles.title}>{t('auth.demoRoleSelect', 'Choose a Stakeholder')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.demoRoleSubtitle', 'Explore CIRCULO across all 5 circular economy roles.\nInstant 1-tap persona switching.')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing[6] }]}
        showsVerticalScrollIndicator={false}
      >
        {DEMO_ACCOUNTS.map((account) => {
          const config = ROLE_CONFIG[account.role];
          return (
            <TouchableOpacity
              key={account.id}
              style={[styles.card, Shadow.base, { borderColor: config.color + '30' }]}
              onPress={() => handleRoleSelect(account.role)}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <View style={[styles.cardHeader, { backgroundColor: config.bgColor }]}>
                <Text style={styles.roleIcon}>{config.icon}</Text>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleName, { color: config.color }]}>
                    {account.name}
                  </Text>
                  <Text style={styles.roleType}>{t('roles.' + account.role, account.role.replace(/_/g, ' ').toUpperCase())}</Text>
                  <Text style={styles.roleLocality}>{account.locality}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color={config.color} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.description}>{t('roles.' + account.role + 'Desc', account.description)}</Text>
                <View style={styles.features}>
                  {config.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Text style={[styles.featureDot, { color: config.color }]}>•</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            ⚠️ All demo accounts use fictional data.{'\n'}
            To use a real account, log in with your credentials.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[4] },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing[1] },
  backBtn: { paddingVertical: Spacing[2] },
  headerCenter: { alignItems: 'center', marginTop: Spacing[1] },
  demoBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  demoBadgeText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  list: { padding: Spacing[4], gap: Spacing[4] },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  roleIcon: { fontSize: 36 },
  roleInfo: { flex: 1 },
  roleName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  roleType: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, letterSpacing: 0.5 },
  roleLocality: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  cardBody: { padding: Spacing[4], paddingTop: 0 },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing[3], lineHeight: 20 },
  features: { gap: Spacing[1] },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  featureDot: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  featureText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  notice: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginTop: Spacing[2],
  },
  noticeText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
});
