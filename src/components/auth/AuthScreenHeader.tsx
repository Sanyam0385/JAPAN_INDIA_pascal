// Auth Header (Back button + round green Settings Gear modal)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useLanguageStore, SupportedLanguageCode } from '../../stores/languageStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../constants';

interface AuthScreenHeaderProps {
  onBack?: () => void;
  showBack?: boolean;
}

export function AuthScreenHeader({
  onBack,
  showBack = true,
}: AuthScreenHeaderProps) {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const { resetDemoData } = useAppStore();
  const currentLanguage = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const [modalVisible, setModalVisible] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const changeLanguage = async (lang: string) => {
    await setLanguage(lang as SupportedLanguageCode);
    setModalVisible(false);
  };

  const handleReset = () => {
    resetDemoData();
    setModalVisible(false);
    Alert.alert('Simulated Ledger Reset', 'All demo data and handoff records have been restored to their fresh default state.');
  };

  const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ja', label: 'Japanese', native: '日本語' },
  ];

  return (
    <>
      <View style={styles.headerRow}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={26} color="#0A2E12" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.settingsBtn}
          accessibilityRole="button"
          accessibilityLabel="App Settings and Language Selection"
          activeOpacity={0.85}
        >
          <Ionicons name="settings-sharp" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Language & Utilities Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Ionicons name="globe-outline" size={22} color="#1B5E20" />
              <Text style={styles.sheetTitle}>Preferences & Utilities</Text>
            </View>

            <Text style={styles.sectionSubtitle}>{t('profile.language', 'Choose Language')}</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map(item => {
                const isSelected = (currentLanguage || i18n.language) === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.langCard, isSelected && styles.langCardSelected]}
                    onPress={() => changeLanguage(item.code)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.langNative, isSelected && styles.langTextSelected]}>
                      {item.native}
                    </Text>
                    <Text style={[styles.langLabel, isSelected && styles.langTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkPill}>
                        <Ionicons name="checkmark" size={14} color="#1B5E20" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* Reset Simulated Ledger */}
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-circle-outline" size={22} color="#C62828" />
              <View style={{ flex: 1 }}>
                <Text style={styles.resetBtnTitle}>Reset Simulated Ledger</Text>
                <Text style={styles.resetBtnSubtitle}>Restore initial mock jobs, rates and receipts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
    ...Shadow.lg,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0EAE1',
    alignSelf: 'center',
    marginBottom: Spacing[3],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[2.5],
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2.5],
  },
  langCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAF8',
    borderWidth: 1.5,
    borderColor: '#E0EAE1',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3.5],
    position: 'relative',
  },
  langCardSelected: {
    borderColor: '#1B5E20',
    backgroundColor: '#E8F5E9',
  },
  langNative: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  langLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  langTextSelected: {
    color: '#1B5E20',
  },
  checkPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: Spacing[4],
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2.5],
    paddingHorizontal: Spacing[2],
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[4],
  },
  resetBtnTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },
  resetBtnSubtitle: {
    fontSize: FontSize.xs,
    color: '#888',
    marginTop: 1,
  },
  closeBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    paddingVertical: Spacing[3.5],
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
