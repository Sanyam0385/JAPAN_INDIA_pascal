// Household Profile, Notifications & Settings Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
  Modal, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';
import { useLanguageStore } from '../../src/stores/languageStore';
import { useLocationStore } from '../../src/lib/location/locationStore';
import { LocationStatusBadge } from '../../src/components/location/LocationStatusBadge';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  SUPPORTED_LANGUAGES,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { DEMO_HOUSEHOLDS } from '../../src/lib/demo/demoData';
import { AVAILABLE_CITIES, CITY_CONFIGS, resolveCity } from '../../src/lib/config/cities';
import { useUserLocation } from '../../src/lib/location/useUserLocation';
import { LocationService } from '../../src/lib/location/LocationService';

type ProfileTab = 'profile' | 'notifications' | 'settings';

function formatDate(d: string, lang = 'en') {
  const locale = lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : lang === 'ja' ? 'ja-JP' : 'en-IN';
  return new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user, signOut, isDemoMode, updateUserLocation } = useAuthStore();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const {
    userLocation,
    locality,
    displayLocation,
    municipalName,
    cityConfig,
    hasLocation,
    isDemoUser,
  } = useUserLocation();

  const {
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllRead,
    currentCity,
    setCity,
    resetDemoData,
  } = useAppStore();
  const shareLiveLocation = useLocationStore((s) => s.shareLiveLocation);
  const setShareLiveLocation = useLocationStore((s) => s.setShareLiveLocation);
  const [tab, setTab] = useState<ProfileTab>('profile');

  // Edit Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualLocality, setManualLocality] = useState(locality || '');
  const [manualWard, setManualWard] = useState(userLocation.wardName || '');
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const household = DEMO_HOUSEHOLDS[0];

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocatingError(null);
    try {
      const result = await LocationService.getCurrentPositionAsync();
      const resolved = resolveCity({
        city: result.city,
        locality: result.locality,
        subLocality: result.subLocality,
        district: result.district,
        state: result.state,
        lat: result.coords.latitude,
        lng: result.coords.longitude,
      });
      const locName = result.subLocality || result.locality || result.district || resolved.name.split(' ')[0];
      const ward = result.wardName || (result.subLocality ? `Ward (${result.subLocality})` : (resolved.wardName || 'Ward 1'));

      updateUserLocation({
        locality: locName,
        subLocality: result.subLocality || undefined,
        city: result.city || result.district || resolved.name.split(' ')[0],
        state: result.state || resolved.state,
        wardName: ward,
        cityKey: resolved.cityCode || 'generic',
        lat: result.coords.latitude,
        lng: result.coords.longitude,
        accuracy: result.coords.accuracy || null,
        locationSource: 'gps',
      });
      setCity(resolved.cityCode || 'generic');
      setIsLocating(false);
      setShowLocationModal(false);
      Alert.alert('Location Updated', `Active location set to ${locName}, ${resolved.name}`);
    } catch (err: any) {
      setIsLocating(false);
      setLocatingError(err?.message || 'Failed to detect GPS location. You can enter your locality manually.');
    }
  };

  const handleSaveManualLocation = () => {
    if (!manualLocality.trim()) {
      Alert.alert('Locality Required', 'Please enter your locality or area name.');
      return;
    }
    const resolved = resolveCity(manualLocality.trim());
    const ward = manualWard.trim() || resolved.wardName || 'General Ward';
    updateUserLocation({
      locality: manualLocality.trim(),
      city: resolved.name.split(' ')[0],
      state: resolved.state,
      wardName: ward,
      cityKey: resolved.cityCode || 'generic',
      locationSource: 'manual',
    });
    setCity(resolved.cityCode || 'generic');
    setShowLocationModal(false);
    Alert.alert('Location Saved', `Active location set to ${manualLocality.trim()}, ${resolved.name}`);
  };

  const handlePickCity = (cityCode: string) => {
    const targetConfig = CITY_CONFIGS[cityCode] || CITY_CONFIGS.generic;
    updateUserLocation({
      locality: userLocation.locality || targetConfig.name.split(' ')[0],
      city: targetConfig.name.split(' ')[0],
      state: targetConfig.state,
      wardName: targetConfig.wardName || 'Ward 1',
      cityKey: cityCode,
      locationSource: 'manual',
    });
    setCity(cityCode);
    setShowCityPicker(false);
    setShowLocationModal(false);
  };

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

  const handleResetData = () => {
    Alert.alert(
      'Reset Simulated Data',
      'This will reset all pickup jobs, rate offers, disputes, and receipts to their initial simulated state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: () => {
            resetDemoData();
            Alert.alert('Reset Complete', 'Simulated ledger and states have been reset.');
          },
        },
      ]
    );
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
            <Text style={styles.userRole}>
              Household · {hasLocation ? displayLocation : 'Location not set'}
            </Text>
            {hasLocation && (
              <Text style={styles.userMunicipal}>{municipalName}</Text>
            )}
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          <View style={styles.demoPill}>
            <Text style={styles.demoPillText}>VERIFIED</Text>
          </View>
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

            {/* City Switcher Card */}
            <Card style={styles.cityCard}>
              <View style={styles.cityCardHeader}>
                <Ionicons name="business" size={18} color={Colors.primary} />
                <Text style={styles.cityCardTitle}>Active Municipal Corporation</Text>
              </View>
              <Text style={styles.cityCardSub}>
                Waste segregation rules & collection schedules adapt dynamically to your municipality.
              </Text>

              <View style={styles.cityButtonGroup}>
                {AVAILABLE_CITIES.map(city => {
                  const isActive = (userLocation.cityKey || currentCity) === city.code;
                  return (
                    <TouchableOpacity
                      key={city.code}
                      style={[styles.cityBtn, isActive && styles.cityBtnActive]}
                      onPress={() => handlePickCity(city.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cityBtnText, isActive && styles.cityBtnTextActive]}>
                        {city.name.split(' ')[0]}
                      </Text>
                      <Text style={[styles.cityBtnState, isActive && styles.cityBtnStateActive]}>
                        {city.state}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Active Municipal Rules Breakdown */}
              <View style={styles.cityRulesBox}>
                <Text style={styles.cityRulesTitle}>
                  {cityConfig.name} Mandatory Segregation Streams:
                </Text>
                <View style={styles.cityBinsList}>
                  {(Array.isArray(cityConfig.bins) ? cityConfig.bins : Object.values(cityConfig.bins)).map((bin: any, idx: number) => (
                    <View key={bin.key || idx} style={styles.cityBinRow}>
                      <View style={[styles.binSwatch, { backgroundColor: bin.color || bin.colorHex || '#2E7D32' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.binLabel}>{bin.label} Bin ({bin.colorName || (bin.key === 'wet' ? 'Green' : bin.key === 'dry' ? 'Blue' : 'Red')})</Text>
                        <Text style={styles.binAccepted}>{(bin.acceptedItems || bin.accepts || []).slice(0, 3).join(', ')}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.scheduleRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.scheduleText}>Wet Waste Collection: {cityConfig.schedule.wet}</Text>
                </View>
                <View style={styles.scheduleRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.scheduleText}>Dry Waste Collection: {cityConfig.schedule.dry}</Text>
                </View>

                <Text style={styles.disclaimerFooter}>
                  Operating under {cityConfig.municipalName} Waste Rules, 2026.
                </Text>
              </View>
            </Card>

            <Card>
              <View style={styles.infoCardHeader}>
                <Text style={styles.sectionTitle}>Household Info</Text>
                <TouchableOpacity
                  style={styles.editLocBtn}
                  onPress={() => {
                    setManualLocality(locality || '');
                    setManualWard(userLocation.wardName || '');
                    setLocatingError(null);
                    setShowLocationModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.primary} />
                  <Text style={styles.editLocBtnText}>Edit Location</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Members</Text><Text style={styles.infoValue}>{household.memberCount}</Text></View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Locality / Area</Text>
                <Text style={styles.infoValue}>{hasLocation ? displayLocation : 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Municipal Body</Text>
                <Text style={styles.infoValue}>{municipalName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ward</Text>
                <Text style={styles.infoValue}>{userLocation.wardName || (isDemoUser ? household.ward : 'General Ward')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location Source</Text>
                <Text style={styles.infoValue}>
                  {userLocation.locationSource ? userLocation.locationSource.toUpperCase() : (isDemoUser ? 'DEMO' : 'UNSET')}
                </Text>
              </View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Segregating</Text><Text style={styles.infoValue}>{household.isSegregating ? '✅ Yes' : '❌ No'}</Text></View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Since</Text>
                <Text style={styles.infoValue}>{new Date(userLocation.locationUpdatedAt || household.createdAt || new Date().toISOString()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
              </View>
            </Card>

            {/* Privacy & Live Location Consent */}
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#1B5E20" />
                  <Text style={styles.sectionTitle}>Privacy & Live Location</Text>
                </View>
                <LocationStatusBadge showWhenOff />
              </View>

              <View style={styles.privacyRow}>
                <View style={{ flex: 1, paddingRight: Spacing[3] }}>
                  <Text style={styles.privacyLabel}>Share live location during active pickups</Text>
                  <Text style={styles.privacyDesc}>
                    When enabled, assigned waste pickers receive your live proximity to coordinate doorstep handover. Never tracked silently.
                  </Text>
                </View>
                <Switch
                  value={shareLiveLocation}
                  onValueChange={setShareLiveLocation}
                  trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                  thumbColor={shareLiveLocation ? '#1B5E20' : '#FFFFFF'}
                />
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
              <Text style={styles.estimateNote}>* Verified environmental metrics recorded via Shared Record Layer.</Text>
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

            <TouchableOpacity style={styles.switchRoleBtn} onPress={() => router.push('/(auth)/demo-select')}>
              <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
              <Text style={styles.switchRoleText}>Switch Role (Collector / Recycler / Picker / Admin)</Text>
            </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>{t('profile.language', 'Language')}</Text>
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
              <Text style={styles.langNote}>Full translations active across English, Hindi, Punjabi, and Japanese.</Text>

              {__DEV__ && (
                <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' }}>
                  <Text style={{ fontSize: 11, color: '#166534', fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>
                    [i18n DEBUG] lang: {i18n.language} | keys: {Object.keys(i18n.getResourceBundle(i18n.language, 'translation') || {}).length} | test: &quot;{t('common.appName', 'CIRCULO')}&quot;
                  </Text>
                </View>
              )}
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Collection reminders</Text>
                <Text style={styles.settingValue}>Active</Text>
              </View>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.settingLabel}>Pickup updates</Text>
                <Text style={styles.settingValue}>Active</Text>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Environment & Role</Text>
              <TouchableOpacity style={styles.roleActionRow} onPress={() => router.push('/(auth)/demo-select')}>
                <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                <Text style={styles.roleActionText}>Switch Active Role</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleActionRow, { borderBottomWidth: 0 }]} onPress={handleResetData}>
                <Ionicons name="refresh" size={18} color={Colors.error} />
                <Text style={[styles.roleActionText, { color: Colors.error }]}>Reset Simulated Ledger</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.error} />
              </TouchableOpacity>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>About CIRCULO</Text>
              <View style={styles.settingRow}><Text style={styles.settingLabel}>App version</Text><Text style={styles.settingValue}>1.0.0-verified</Text></View>
              <View style={styles.settingRow}><Text style={styles.settingLabel}>Shared Record Layer</Text><Text style={styles.settingValue}>Supabase + RLS Active</Text></View>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.settingLabel}>Map Routes</Text><Text style={styles.settingValue}>Routes: OSRM / OpenStreetMap data</Text>
              </View>
            </Card>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Update Your Location</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Active municipal rules and collection schedules adapt directly to your city and locality.
            </Text>

            {locatingError && (
              <View style={styles.locErrorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.locErrorText}>{locatingError}</Text>
              </View>
            )}

            {/* GPS Auto-detect Button */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.gpsBtnText}>Detecting GPS location...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#FFFFFF" />
                  <Text style={styles.gpsBtnText}>Use My Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Manual Locality / Ward input */}
            <View style={{ gap: Spacing[1] }}>
              <Text style={styles.inputLabel}>Locality / Sector / Area</Text>
              <TextInput
                style={styles.textInput}
                value={manualLocality}
                onChangeText={setManualLocality}
                placeholder="e.g. Model Town, Patiala or Indiranagar"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={{ gap: Spacing[1] }}>
              <Text style={styles.inputLabel}>Ward (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={manualWard}
                onChangeText={setManualWard}
                placeholder="e.g. Ward 12"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveManualLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save & Resolve Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickCityBtn}
              onPress={() => setShowCityPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={16} color={Colors.primary} />
              <Text style={styles.pickCityBtnText}>Select From Configured Cities</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* City Picker Fallback Modal */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Municipality</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Choose your municipality for dedicated waste segregation streams and collection schedules:
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {AVAILABLE_CITIES.map((c) => {
                const isSelected = (userLocation.cityKey || currentCity) === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.cityOption, isSelected && styles.cityOptionActive]}
                    onPress={() => handlePickCity(c.code)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cityOptionTitle, isSelected && { color: Colors.primary }]}>
                        {c.name}
                      </Text>
                      <Text style={styles.cityOptionSub}>{c.state}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowCityPicker(false)}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
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
  cityCard: { padding: Spacing[4], gap: Spacing[2], backgroundColor: Colors.surface },
  cityCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  cityCardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cityCardSub: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  cityButtonGroup: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1] },
  cityBtn: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cityBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
  },
  cityBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cityBtnTextActive: { color: Colors.primary },
  cityBtnState: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
  cityBtnStateActive: { color: Colors.primaryDark },
  cityRulesBox: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  cityRulesTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cityBinsList: { gap: Spacing[2] },
  cityBinRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  binSwatch: { width: 14, height: 14, borderRadius: 7 },
  binLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  binAccepted: { fontSize: 10, color: Colors.textSecondary },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  scheduleText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  disclaimerFooter: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing[2],
    marginTop: Spacing[1],
  },
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
  roleActionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  roleActionText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginLeft: Spacing[2] },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    backgroundColor: Colors.errorLight, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], borderWidth: 1, borderColor: Colors.error + '40',
  },
  signOutText: { color: Colors.error, fontSize: FontSize.base, fontWeight: FontWeight.bold },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  privacyLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
    marginBottom: 2,
  },
  privacyDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  userMunicipal: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FontWeight.medium,
    marginTop: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  editLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  editLocBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    width: '100%',
    maxWidth: 440,
    gap: Spacing[3],
    ...Shadow.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  locErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFEBEE',
    padding: Spacing[2.5],
    borderRadius: BorderRadius.md,
  },
  locErrorText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.error,
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2.5],
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.gray100,
  },
  saveBtn: {
    backgroundColor: '#14632E',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  pickCityBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  pickCityBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.xs,
  },
  cityOption: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityOptionActive: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.md,
  },
  cityOptionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cityOptionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
