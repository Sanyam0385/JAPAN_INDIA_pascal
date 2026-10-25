// Login Screen matching login.png design reference
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { AuthBackground } from '../../src/components/auth/AuthBackground';
import { AuthScreenHeader } from '../../src/components/auth/AuthScreenHeader';
import { CirculoLogoBadge } from '../../src/components/auth/CirculoLogoBadge';
import { AuthTextField } from '../../src/components/auth/AuthTextField';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../src/constants';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    const res = await signIn(email.trim(), password);
    if (res?.unconfirmedEmail) {
      router.push('/(auth)/verify-otp');
      return;
    }
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      router.replace('/');
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      Alert.alert(
        t('auth.forgotPasswordTitle', 'Reset Password'),
        'Please enter your email address in the field above to receive a password reset code.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await useAuthStore.getState().resetPasswordForEmail(trimmed);
      router.push('/(auth)/verify-otp');
    } catch (e: any) {
      Alert.alert(
        t('auth.forgotPasswordTitle', 'Reset Password'),
        e.message || 'Failed to send password reset code.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('priya@demo.circulo.app');
    setPassword('demo1234');
    setValidationErrors({});
  };

  return (
    <View style={styles.container}>
      {/* Background artwork: off-white canvas with leaves and watercolor waves */}
      <AuthBackground />

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header with Back Arrow and Dark Green Settings Gear */}
        <View style={{ paddingTop: insets.top }}>
          <AuthScreenHeader />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Circular Logo Badge, Wordmark & Tagline */}
          <View style={styles.brandSection}>
            <CirculoLogoBadge
              size={96}
              onLongPress={handleQuickDemoFill}
            />

            <Text style={styles.wordmark}>CIRCULO</Text>

            <Text style={styles.tagline}>
              {t('auth.welcomeSubtitle', 'Turning waste into\na traceable resource')}
            </Text>
          </View>

          {/* Screen Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('auth.logInTitle', 'Log In')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.signInSubtitle', 'Sign in to your CIRCULO account')}
            </Text>
          </View>

          {/* Global Auth Service Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Email Address */}
            <AuthTextField
              label={t('auth.emailAddress', 'Email Address')}
              placeholder={t('auth.emailAddressPlaceholder', 'you@example.com')}
              leadingIcon="mail-outline"
              value={email}
              onChangeText={val => {
                setEmail(val);
                if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
                clearError();
              }}
              error={validationErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            {/* Password */}
            <AuthTextField
              label={t('auth.passwordLabel', 'Password')}
              placeholder={t('auth.passwordPlaceholder', 'Enter password')}
              leadingIcon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={val => {
                setPassword(val);
                if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
                clearError();
              }}
              error={validationErrors.password}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotText}>
                {t('auth.forgotPasswordLink', 'Forgot password?')}
              </Text>
            </TouchableOpacity>

            {/* Primary Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signInBtnText}>
                  {t('auth.signInBtn', 'Sign In')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Or Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.orDivider', 'or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create Account Link Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>
              {t('auth.newToCirculo', 'New to CIRCULO?')}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text style={styles.createAccountLink}>
                {t('auth.createAccountBtn', 'Create account')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFDF9',
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[2],
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  wordmark: {
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    color: '#0A2E12',
    letterSpacing: 4.5,
    marginTop: Spacing[3],
    marginBottom: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: '#4A6B54',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  title: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: '#0A2E12',
    letterSpacing: -0.5,
    marginBottom: Spacing[1],
  },
  subtitle: {
    fontSize: FontSize.base,
    color: '#4A6B54',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorBoxText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },
  form: {
    gap: 18,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -Spacing[2],
    paddingVertical: Spacing[1],
  },
  forgotText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#1B5E20',
    textDecorationLine: 'underline',
  },
  signInBtn: {
    backgroundColor: '#14632E',
    borderRadius: 20,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
    ...Shadow.base,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginVertical: Spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDE7E0',
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: '#718276',
    fontWeight: FontWeight.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrompt: {
    fontSize: FontSize.base,
    color: '#4A6B54',
  },
  createAccountLink: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    textDecorationLine: 'underline',
  },
});
