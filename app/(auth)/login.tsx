// Login Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../src/constants';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    clearError();
    if (!email.trim() || !password.trim()) return;
    await signIn(email.trim(), password);
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) router.replace('/');
  };

  const fillDemo = (role: string) => {
    const demos: Record<string, { email: string; pass: string }> = {
      household: { email: 'priya@demo.circulo.app', pass: 'demo1234' },
      collector: { email: 'ramesh@demo.circulo.app', pass: 'demo1234' },
      picker: { email: 'meena@demo.circulo.app', pass: 'demo1234' },
      admin: { email: 'admin@demo.circulo.app', pass: 'demo1234' },
    };
    if (demos[role]) {
      setEmail(demos[role].email);
      setPassword(demos[role].pass);
    }
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
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Branding */}
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>♻</Text>
          </View>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Sign in to your CIRCULO account</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
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
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.disabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Demo fill helpers */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>⚡ Demo Auto-fill</Text>
          <View style={styles.demoButtons}>
            {['household', 'collector', 'picker', 'admin'].map(r => (
              <TouchableOpacity key={r} style={styles.demoBtn} onPress={() => fillDemo(r)}>
                <Text style={styles.demoBtnText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/demo-select')}>
            <Text style={styles.linkText}>Try demo without login →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={{ marginTop: Spacing[3] }}>
            <Text style={styles.linkText}>Create new account →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5] },
  backBtn: { alignSelf: 'flex-start', marginBottom: Spacing[4] },
  brand: { alignItems: 'center', marginBottom: Spacing[8] },
  logo: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: Colors.mintPale,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[4],
    borderWidth: 2, borderColor: Colors.border,
  },
  logoText: { fontSize: 36 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: Spacing[1] },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    borderLeftWidth: 4, borderLeftColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  form: { gap: Spacing[4] },
  field: { gap: Spacing[1.5] },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
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
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: Spacing[12] },
  eyeBtn: {
    position: 'absolute', right: Spacing[4],
    top: 0, bottom: 0, justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[2],
    ...Shadow.base,
  },
  disabled: { opacity: 0.6 },
  loginBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  demoSection: {
    marginTop: Spacing[8],
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border,
  },
  demoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing[3] },
  demoButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  demoBtn: {
    backgroundColor: Colors.mintLight,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
  },
  demoBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  footer: { marginTop: Spacing[6], alignItems: 'center' },
  linkText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
