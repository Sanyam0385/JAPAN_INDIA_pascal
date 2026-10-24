// Informal Picker Profile & Accreditation Screen
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

export default function PickerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, isDemoMode } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your picker session?', [
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
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'M'}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'Meena Devi'}</Text>
              <Badge label="Verified Recycler" variant="success" size="sm" />
            </View>
            <Text style={styles.userRole}>Informal Waste Recycler Partner</Text>
            <Text style={styles.userLocality}>📍 BBMP Ward 151, Koramangala</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO PROFILE — Evaluator preview for informal recycling worker interface." />

        {/* Worker ID / Accreditation Card */}
        <Card style={styles.idCard}>
          <View style={styles.idHeader}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <Text style={styles.idTitle}>Municipal Waste Picker ID</Text>
          </View>
          <View style={styles.idDetails}>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>ID Number:</Text>
              <Text style={styles.idValue}>WP-BBMP-2026-0849</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Issued By:</Text>
              <Text style={styles.idValue}>BBMP Solid Waste Management Cell</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Health Card:</Text>
              <Text style={styles.idValue}>Active (Annual Checkup Done)</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Primary Zones:</Text>
              <Text style={styles.idValue}>Koramangala 3rd & 4th Block</Text>
            </View>
          </View>
        </Card>

        {/* Safety & Equipment Checklist */}
        <Card style={styles.safetyCard}>
          <Text style={styles.sectionHeading}>🧤 Safety Equipment Provided</Text>
          <View style={styles.safetyList}>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              <Text style={styles.safetyText}>Puncture-resistant Heavy Duty Gloves</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              <Text style={styles.safetyText}>Reflective High-Visibility Vest</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              <Text style={styles.safetyText}>Digital Hanging Weighing Scale (Calibrated)</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              <Text style={styles.safetyText}>N95 Dust & Particulate Masks</Text>
            </View>
          </View>
        </Card>

        {/* Switch Role (Judge Mode) */}
        {isDemoMode && (
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => router.push('/(auth)/demo-select')}
          >
            <Ionicons name="swap-horizontal" size={20} color={Colors.pickerAccent} />
            <Text style={styles.switchRoleText}>Switch Demo Role (Judge Quick Switch)</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out of Picker Account</Text>
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
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.pickerAccent,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.pickerAccent },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  userRole: { fontSize: FontSize.xs, color: Colors.textSecondary },
  userLocality: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  idCard: {
    padding: Spacing[4],
    backgroundColor: '#F1F8E9',
    borderColor: '#C5E1A5',
    gap: Spacing[3],
  },
  idHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  idTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  idDetails: { gap: Spacing[2] },
  idRow: { flexDirection: 'row', justifyContent: 'space-between' },
  idLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  idValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  safetyCard: { padding: Spacing[4], gap: Spacing[2.5] },
  sectionHeading: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  safetyList: { gap: Spacing[2] },
  safetyItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  safetyText: { fontSize: FontSize.xs, color: Colors.textPrimary },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFF3E0',
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginTop: Spacing[2],
  },
  switchRoleText: { color: Colors.pickerAccent, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
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
