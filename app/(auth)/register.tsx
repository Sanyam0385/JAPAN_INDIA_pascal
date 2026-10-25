// Create Account Screen matching register.png design reference with GPS Locality Auto-fetch
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Linking, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { AuthBackground } from '../../src/components/auth/AuthBackground';
import { AuthScreenHeader } from '../../src/components/auth/AuthScreenHeader';
import { RoleCard } from '../../src/components/auth/RoleCard';
import { AuthTextField } from '../../src/components/auth/AuthTextField';
import { LocationService, LocationResult } from '../../src/lib/location/LocationService';
import { useLocationStore } from '../../src/lib/location/locationStore';
import { resolveCity, AVAILABLE_CITIES } from '../../src/lib/config/cities';
import type { UserRole, UserLocationCoords } from '../../src/types';
import { z } from 'zod';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../src/constants';

type SelectableRole = 'household' | 'formal_collector' | 'informal_picker';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  locality: z.string().trim().min(2, 'Locality / Ward is required'),
});

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signUp, isLoading, error, clearError, pendingVerificationEmail } = useAuthStore();

  const [role, setRole] = useState<SelectableRole>('household');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(pendingVerificationEmail || '');
  const [password, setPassword] = useState('');
  const [locality, setLocality] = useState('');
  const [coords, setCoords] = useState<UserLocationCoords | undefined>(undefined);
  const [detectedDetails, setDetectedDetails] = useState<Partial<LocationResult>>({});

  // Locality auto-detection states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const hasUserEditedLocality = useRef(false);

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    locality?: string;
  }>({});

  // Auto-fetch location on screen mount
  useEffect(() => {
    fetchDeviceLocation(false);
  }, []);

  const fetchDeviceLocation = async (isManualTap = false) => {
    setIsDetectingLocation(true);
    setLocationError(null);
    setIsPermissionDenied(false);

    try {
      const res = await LocationService.getCurrentLocation(8000);
      setCoords(res.coords);
      setLocationSuccess(res.locality);
      setDetectedDetails({
        locality: res.locality,
        subLocality: res.subLocality,
        city: res.city,
        state: res.state,
        district: res.district,
        wardName: res.wardName,
        cityKey: res.cityKey,
      });

      // Only auto-fill if user hasn't typed their own custom locality or if they clicked the GPS button
      if (!hasUserEditedLocality.current || isManualTap) {
        setLocality(res.locality);
        hasUserEditedLocality.current = false;
        setValidationErrors(prev => ({ ...prev, locality: undefined }));
      }
    } catch (e) {
      const errMsg = (e as Error).message || 'Unable to detect location';
      const denied = errMsg.toLowerCase().includes('denied') || errMsg.toLowerCase().includes('permission');
      setIsPermissionDenied(denied);
      setLocationError(
        denied
          ? 'Location access was denied. You can select your city or type manually.'
          : 'Could not detect location. You can select your city or retry.'
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleOpenSettings = async () => {
    if (Platform.OS === 'web') {
      alert('Please enable location access in your browser site permissions.');
      return;
    }
    await Linking.openSettings();
  };

  const validate = () => {
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      locality,
    });

    if (!result.success) {
      const errs: typeof validationErrors = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof typeof validationErrors;
        if (!errs[field]) errs[field] = issue.message;
      });
      setValidationErrors(errs);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const handleRegister = async () => {
    clearError();
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      locality,
    });

    if (!result.success) {
      const errs: typeof validationErrors = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof typeof validationErrors;
        if (!errs[field]) errs[field] = issue.message;
      });
      setValidationErrors(errs);
      return;
    }

    // Resolve city cleanly from user input or coordinates
    const resolved = resolveCity({
      locality: result.data.locality,
      city: detectedDetails.city,
      district: detectedDetails.district,
      subLocality: detectedDetails.subLocality,
      state: detectedDetails.state,
      lat: coords?.latitude,
      lng: coords?.longitude,
    });

    try {
      const res = await signUp({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        role: role as UserRole,
        locality: result.data.locality,
        subLocality: detectedDetails.subLocality,
        city: detectedDetails.city || (resolved.isGeneric ? undefined : resolved.cityName),
        state: detectedDetails.state || resolved.state,
        wardName: detectedDetails.wardName || resolved.wardName,
        cityKey: resolved.cityCode,
        lat: coords?.latitude,
        lng: coords?.longitude,
        accuracy: coords?.accuracy,
        locationSource: hasUserEditedLocality.current ? 'manual' : 'gps',
        coordinates: coords,
      });

      if (res?.needsVerification) {
        router.push('/(auth)/verify-otp');
        return;
      }

      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        router.replace('/');
      }
    } catch {
      // Error message is stored in authStore.error and displayed in the UI banner
    }
  };

  return (
    <View style={styles.container}>
      {/* Background artwork: organic leaves and watercolor hills */}
      <AuthBackground />

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing[2],
              paddingBottom: insets.bottom + Spacing[8],
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back and Language Gear button */}
          <AuthScreenHeader onBack={() => router.back()} />

          {/* Heading Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('auth.joinCirculo', 'Join CIRCULO')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.joinCirculoSubtitle', 'Create an account to participate in circular waste management')}
            </Text>
          </View>

          {/* Error Message if registration fails */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          {/* Registration Form */}
          <View style={styles.form}>
            {/* Role Selection: Household, Collector, Waste Picker */}
            <View style={styles.roleSection}>
              <Text style={styles.sectionLabel}>
                {t('auth.selectRole', 'Select Role')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.roleGrid}>
                <RoleCard
                  label={t('roles.household', 'Household')}
                  icon="home"
                  selected={role === 'household'}
                  onPress={() => setRole('household')}
                />
                <RoleCard
                  label={t('roles.formal_collector', 'Collector')}
                  icon="bus"
                  selected={role === 'formal_collector'}
                  onPress={() => setRole('formal_collector')}
                />
                <RoleCard
                  label={t('roles.informal_picker', 'Waste Picker')}
                  icon="repeat"
                  selected={role === 'informal_picker'}
                  onPress={() => setRole('informal_picker')}
                />
              </View>
            </View>

            {/* Full Name */}
            <AuthTextField
              label={t('auth.fullName', 'Full Name')}
              required
              placeholder={t('auth.fullNamePlaceholder', 'e.g. Priya Sharma')}
              leadingIcon="person-outline"
              value={name}
              onChangeText={val => {
                setName(val);
                if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: undefined }));
              }}
              error={validationErrors.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />

            {/* Email Address */}
            <AuthTextField
              label={t('auth.emailAddress', 'Email Address')}
              required
              placeholder={t('auth.emailAddressPlaceholder', 'you@example.com')}
              leadingIcon="mail-outline"
              value={email}
              onChangeText={val => {
                setEmail(val);
                if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
              }}
              error={validationErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            {/* Password */}
            <AuthTextField
              label={t('auth.passwordLabel', 'Password')}
              required
              placeholder={t('auth.passwordCreatePlaceholder', 'Create a password')}
              leadingIcon="lock-closed-outline"
              value={password}
              onChangeText={val => {
                setPassword(val);
                if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }));
              }}
              error={validationErrors.password}
              hint={t('auth.passwordHint', 'At least 8 characters')}
              isPassword
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            {/* Locality / Ward with Auto-fetch, Manual Override & City Picker */}
            <View style={{ gap: Spacing[1.5] }}>
              <AuthTextField
                label={t('auth.localityWard', 'Locality / Ward')}
                required
                placeholder={t('auth.localityPlaceholder', 'e.g. Model Town, Patiala')}
                leadingIcon="location-outline"
                value={locality}
                onChangeText={val => {
                  hasUserEditedLocality.current = true;
                  setLocality(val);
                  if (validationErrors.locality) setValidationErrors(prev => ({ ...prev, locality: undefined }));
                }}
                error={validationErrors.locality}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                rightAction={
                  <TouchableOpacity
                    style={styles.gpsBtn}
                    onPress={() => fetchDeviceLocation(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('auth.useCurrentLocation', 'Use my current location')}
                  >
                    {isDetectingLocation ? (
                      <ActivityIndicator size="small" color="#1B5E20" />
                    ) : (
                      <Ionicons name="navigate-circle-outline" size={24} color="#1B5E20" />
                    )}
                  </TouchableOpacity>
                }
              />

              {/* Inline Location Detection Status Feedback */}
              {isDetectingLocation ? (
                <View style={styles.locationStatusRow}>
                  <ActivityIndicator size="small" color="#1B5E20" />
                  <Text style={styles.locationDetectingText}>
                    {t('auth.detectingLocation', 'Detecting your location...')}
                  </Text>
                </View>
              ) : locationError ? (
                <View style={styles.locationErrorBox}>
                  <Text style={styles.locationErrorText}>{locationError}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginTop: 4 }}>
                    <TouchableOpacity onPress={() => fetchDeviceLocation(true)}>
                      <Text style={styles.locationActionLink}>
                        {t('auth.retryLocation', 'Retry GPS')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCityPicker(true)}>
                      <Text style={styles.locationActionLink}>
                        Select City from List
                      </Text>
                    </TouchableOpacity>
                    {isPermissionDenied && (
                      <TouchableOpacity onPress={handleOpenSettings}>
                        <Text style={styles.locationActionLink}>
                          {t('auth.openSettings', 'Open settings')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : locationSuccess ? (
                <View style={styles.locationSuccessRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text style={styles.locationSuccessText}>
                    {t('auth.locationDetected', 'Location detected')}: {locationSuccess}
                  </Text>
                  <TouchableOpacity onPress={() => setShowCityPicker(true)} style={{ marginLeft: 'auto' }}>
                    <Text style={styles.changeCityLink}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setShowCityPicker(true)} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                  <Text style={styles.locationActionLink}>📍 Pick City from Directory</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {t('auth.createAccountBtn', 'Create Account')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer: Already have an account? Log In */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>
              {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log In"
            >
              <Text style={styles.loginLink}>
                {t('auth.logInTitle', 'Log In')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Picker Fallback Bottom Sheet Modal */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCityPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Your Municipal Area</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Ionicons name="close" size={24} color="#1B5E20" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              Configures localized collection schedules, segregation rules, and doorstep recycling rates.
            </Text>

            <View style={styles.cityList}>
              {AVAILABLE_CITIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={styles.cityCard}
                  onPress={() => {
                    const resolved = resolveCity(c.code);
                    setLocality(c.name);
                    setDetectedDetails({
                      locality: c.name,
                      city: resolved.cityName,
                      state: c.state,
                      wardName: resolved.wardName,
                      cityKey: c.code,
                    });
                    hasUserEditedLocality.current = true;
                    setShowCityPicker(false);
                  }}
                >
                  <View style={styles.cityIconWrap}>
                    <Ionicons name="business" size={20} color="#14632E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cityNameText}>{c.name}</Text>
                    <Text style={styles.cityStateText}>{c.state}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#4A6B54" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: Spacing[1],
  },
  titleSection: {
    marginBottom: Spacing[5],
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
    lineHeight: 22,
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
  roleSection: {
    gap: Spacing[2],
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
  },
  requiredAsterisk: {
    color: '#D32F2F',
    fontWeight: FontWeight.bold,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: Spacing[2.5],
  },
  gpsBtn: {
    padding: Spacing[1.5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    paddingHorizontal: Spacing[1],
  },
  locationDetectingText: {
    fontSize: FontSize.xs,
    color: '#1B5E20',
    fontWeight: FontWeight.medium,
  },
  locationSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[1],
  },
  locationSuccessText: {
    fontSize: FontSize.xs,
    color: '#2E7D32',
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  changeCityLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    textDecorationLine: 'underline',
  },
  locationErrorBox: {
    paddingHorizontal: Spacing[1],
    gap: 4,
  },
  locationErrorText: {
    fontSize: FontSize.xs,
    color: '#D32F2F',
  },
  locationActionLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    textDecorationLine: 'underline',
  },
  submitBtn: {
    backgroundColor: '#14632E',
    borderRadius: 20,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
    ...Shadow.base,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[6],
  },
  footerPrompt: {
    fontSize: FontSize.base,
    color: '#4A6B54',
  },
  loginLink: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    textDecorationLine: 'underline',
  },
  // City picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: Spacing[3],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
  },
  sheetSub: {
    fontSize: FontSize.sm,
    color: '#4A6B54',
    marginBottom: Spacing[4],
  },
  cityList: {
    gap: Spacing[2.5],
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3.5],
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F4F9F4',
    borderWidth: 1,
    borderColor: '#E0EEDF',
  },
  cityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityNameText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: '#0A2E12',
  },
  cityStateText: {
    fontSize: FontSize.xs,
    color: '#4A6B54',
    marginTop: 1,
  },
});
