// OTP Verification Screen matching Circulo organic visual identity
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { AuthBackground } from '../../src/components/auth/AuthBackground';
import { AuthScreenHeader } from '../../src/components/auth/AuthScreenHeader';
import { CirculoLogoBadge } from '../../src/components/auth/CirculoLogoBadge';
import { AuthTextField } from '../../src/components/auth/AuthTextField';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../src/constants';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  const prefix = local.slice(0, 2);
  return `${prefix}***@${domain}`;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    pendingVerificationEmail,
    pendingVerificationType,
    verifyOtp,
    resendOtp,
    updatePassword,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const email = pendingVerificationEmail || '';
  const isRecovery = pendingVerificationType === 'recovery';

  // 6 digit states
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<Array<any>>([]);

  // Cooldown countdown
  const [cooldown, setCooldown] = useState<number>(60);
  const [resendStatusMsg, setResendStatusMsg] = useState<string | null>(null);

  // Recovery step: false = entering OTP, true = entering new password
  const [isOtpVerifiedForRecovery, setIsOtpVerifiedForRecovery] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Shake animation for invalid code
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  const handleDigitChange = (text: string, index: number) => {
    clearError();
    setResendStatusMsg(null);

    // Support pasted multi-digit string (e.g. "123456")
    const cleanNumbers = text.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleanNumbers[i] || '';
      }
      setDigits(newDigits);
      const targetFocus = Math.min(cleanNumbers.length, 5);
      inputRefs.current[targetFocus]?.focus();

      if (cleanNumbers.length >= 6) {
        submitCode(newDigits.join(''));
      }
      return;
    }

    const singleChar = cleanNumbers.slice(-1);
    const updated = [...digits];
    updated[index] = singleChar;
    setDigits(updated);

    if (singleChar) {
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last digit entered, auto-submit
        const fullCode = updated.join('');
        if (fullCode.length === 6) {
          submitCode(fullCode);
        }
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const submitCode = async (code: string) => {
    if (code.length !== 6) return;
    try {
      await verifyOtp(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      if (isRecovery) {
        setIsOtpVerifiedForRecovery(true);
      } else {
        // Signup verified: navigate to root which directs to appropriate role dashboard
        router.replace('/');
      }
    } catch {
      triggerShake();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    clearError();
    try {
      const res = await resendOtp();
      setCooldown(res.remainingSeconds || 60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendStatusMsg(t('auth.codeSentSuccess', 'A new 6-digit verification code has been sent.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      triggerShake();
    }
  };

  const handleChangeEmail = () => {
    router.replace('/(auth)/register');
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);
    if (!newPassword || newPassword.length < 8) {
      setPasswordError(t('auth.passwordHint', 'At least 8 characters'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await updatePassword(newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/(auth)/login');
    } catch {
      triggerShake();
    }
  };

  return (
    <View style={styles.container}>
      <AuthBackground />

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingTop: insets.top }}>
          <AuthScreenHeader onBack={() => router.back()} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand & Title */}
          <View style={styles.brandSection}>
            <CirculoLogoBadge size={80} />
            <Text style={styles.title}>
              {isOtpVerifiedForRecovery
                ? t('auth.newPasswordTitle', 'Set New Password')
                : t('auth.verifyEmailTitle', 'Verify your email')}
            </Text>
            <Text style={styles.subtitle}>
              {isOtpVerifiedForRecovery
                ? t('auth.newPasswordSubtitle', 'Enter your new password below.')
                : t('auth.verifyEmailSubtitle', {
                    email: maskEmail(email),
                    defaultValue: `We sent a 6-digit code to ${maskEmail(email)}`,
                  })}
            </Text>
          </View>

          {/* Email Spelling Confirmation Card */}
          {!isOtpVerifiedForRecovery && (
            <View style={styles.emailPillCard}>
              <View style={styles.emailPillLeft}>
                <Ionicons name="mail" size={16} color="#1B5E20" />
                <Text style={styles.emailFullText} numberOfLines={1}>
                  {email || 'your email'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleChangeEmail}
                style={styles.changeEmailBtn}
                accessibilityRole="button"
                accessibilityLabel="Change email address"
              >
                <Text style={styles.changeEmailText}>
                  {t('auth.changeEmail', 'Change')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          ) : null}

          {/* Resend Status Banner */}
          {resendStatusMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              <Text style={styles.successBoxText}>{resendStatusMsg}</Text>
            </View>
          ) : null}

          {!isOtpVerifiedForRecovery ? (
            /* OTP Digits Input Section */
            <Animated.View style={[styles.digitsWrap, { transform: [{ translateX: shakeAnim }] }]}>
              <View style={styles.boxesRow}>
                {digits.map((digit, index) => {
                  const isFocused = focusedIndex === index;
                  return (
                    <TextInput
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      style={[
                        styles.digitBox,
                        isFocused && styles.digitBoxFocused,
                        digit ? styles.digitBoxFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? 6 : 1}
                      selectTextOnFocus
                      textAlign="center"
                      textContentType="oneTimeCode"
                      autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                      accessibilityLabel={`Digit ${index + 1}`}
                      editable={!isLoading}
                    />
                  );
                })}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  (digits.join('').length !== 6 || isLoading) && styles.btnDisabled,
                ]}
                onPress={() => submitCode(digits.join(''))}
                disabled={digits.join('').length !== 6 || isLoading}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Verify code and continue"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.verifyBtnText}>
                      {t('auth.verifyBtn', 'Verify & Continue')}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Code Section */}
              <View style={styles.resendSection}>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={cooldown > 0 || isLoading}
                  activeOpacity={0.7}
                  style={styles.resendBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={cooldown > 0 ? '#8E9E94' : '#14632E'}
                  />
                  <Text
                    style={[
                      styles.resendBtnText,
                      cooldown > 0 ? styles.resendTextDisabled : styles.resendTextActive,
                    ]}
                  >
                    {cooldown > 0
                      ? t('auth.resendIn', {
                          seconds: cooldown,
                          defaultValue: `Resend in ${cooldown}s`,
                        })
                      : t('auth.resendCode', 'Resend code')}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.spamNotice}>
                  {t('auth.checkSpamFolder', "Can't find it? Check your spam folder.")}
                </Text>
              </View>
            </Animated.View>
          ) : (
            /* Set New Password Form (for recovery type) */
            <View style={styles.recoveryForm}>
              {passwordError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={Colors.error} />
                  <Text style={styles.errorBoxText}>{passwordError}</Text>
                </View>
              ) : null}

              <AuthTextField
                label={t('auth.passwordLabel', 'New Password')}
                placeholder={t('auth.newPasswordPlaceholder', 'New password (min 8 characters)')}
                leadingIcon="lock-closed-outline"
                isPassword
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  setPasswordError(null);
                }}
                autoCapitalize="none"
                returnKeyType="next"
              />

              <AuthTextField
                label="Confirm New Password"
                placeholder="Re-enter new password"
                leadingIcon="lock-closed-outline"
                isPassword
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  setPasswordError(null);
                }}
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={handleUpdatePassword}
              />

              <TouchableOpacity
                style={[styles.verifyBtn, isLoading && styles.btnDisabled]}
                onPress={handleUpdatePassword}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyBtnText}>
                    {t('auth.updatePasswordBtn', 'Update Password')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: '#0A2E12',
    letterSpacing: -0.5,
    marginTop: Spacing[3],
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: '#4A6B54',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emailPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF7F0',
    borderWidth: 1,
    borderColor: '#D4EAD7',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3.5],
    paddingVertical: Spacing[2.5],
    marginBottom: Spacing[5],
  },
  emailPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
    marginRight: Spacing[2],
  },
  emailFullText: {
    fontSize: FontSize.xs,
    color: '#0A2E12',
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  changeEmailBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeEmailText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#14632E',
    textDecorationLine: 'underline',
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  successBoxText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: '#2E7D32',
    fontWeight: FontWeight.medium,
  },
  digitsWrap: {
    gap: Spacing[6],
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  digitBox: {
    flex: 1,
    minWidth: 44,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CFDCD2',
    backgroundColor: '#FFFFFF',
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
    ...Shadow.sm,
  },
  digitBoxFocused: {
    borderColor: '#14632E',
    backgroundColor: '#F4F9F4',
    borderWidth: 2,
  },
  digitBoxFilled: {
    borderColor: '#2E7D32',
    backgroundColor: '#F9FDF9',
  },
  verifyBtn: {
    backgroundColor: '#14632E',
    borderRadius: 20,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.base,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  resendSection: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  resendBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  resendTextActive: {
    color: '#14632E',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: '#8E9E94',
  },
  spamNotice: {
    fontSize: FontSize.xs,
    color: '#607968',
    textAlign: 'center',
  },
  recoveryForm: {
    gap: 18,
  },
});
