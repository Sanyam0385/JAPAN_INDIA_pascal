// Registration Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, ROLES } from '../../src/constants';
import type { UserRole } from '../../src/types';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithRole, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('household');
  const [locality, setLocality] = useState('Koramangala, Bengaluru');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your name, email, and password.');
      return;
    }
    // In demo mode, simulate user creation and log in with selected role
    await signInWithRole(role);
    Alert.alert(
      'Account Created! 🎉',
      `Welcome to CIRCULO as a ${role.replace(/_/g, ' ')}.\n\n⚠️ Demo mode: Session saved locally.`,
      [{ text: 'Continue', onPress: () => router.replace('/') }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.brand}>
          <Text style={styles.title}>Join CIRCULO</Text>
          <Text style={styles.subtitle}>Create an account to participate in circular waste management</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Select Role *</Text>
            <View style={styles.roleGrid}>
              {[
                { id: 'household', label: 'Household', icon: '🏠' },
                { id: 'formal_collector', label: 'Collector', icon: '🚛' },
                { id: 'informal_picker', label: 'Waste Picker', icon: '♻️' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleCard, role === r.id && styles.roleCardActive]}
                  onPress={() => setRole(r.id as UserRole)}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Locality / Ward *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Koramangala Zone 3A"
              placeholderTextColor={Colors.textTertiary}
              value={locality}
              onChangeText={setLocality}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.disabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.linkText}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5] },
  backBtn: { alignSelf: 'flex-start', marginBottom: Spacing[3] },
  brand: { marginBottom: Spacing[6] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing[1] },
  form: { gap: Spacing[4] },
  field: { gap: Spacing[1.5] },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  roleGrid: { flexDirection: 'row', gap: Spacing[2] },
  roleCard: {
    flex: 1,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    gap: Spacing[1],
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.mintPale },
  roleIcon: { fontSize: 24 },
  roleLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  roleLabelActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    ...Shadow.sm,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[2],
    ...Shadow.base,
  },
  disabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[6], alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  linkText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
