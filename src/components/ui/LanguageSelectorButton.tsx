import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguageStore, SupportedLanguageCode } from '../../stores/languageStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, SUPPORTED_LANGUAGES } from '../../constants';

interface LanguageSelectorButtonProps {
  variant?: 'pill' | 'icon';
  color?: string;
  style?: any;
}

export function LanguageSelectorButton({
  variant = 'pill',
  color = Colors.primary,
  style,
}: LanguageSelectorButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const { t } = useTranslation();

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSelect = async (code: SupportedLanguageCode) => {
    setModalVisible(false);
    await setLanguage(code);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          variant === 'pill' ? styles.pillButton : styles.iconButton,
          style,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        accessibilityLabel="Select Language"
        accessibilityRole="button"
      >
        <Ionicons name="globe-outline" size={16} color={color} style={variant === 'pill' ? { marginRight: 5 } : undefined} />
        {variant === 'pill' && (
          <Text style={[styles.pillText, { color }]}>
            {currentLangObj.nativeLabel}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.titleRow}>
                    <Ionicons name="language" size={20} color={Colors.primary} />
                    <Text style={styles.modalTitle}>{t('profile.language', 'Select Language')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color={Colors.gray600} />
                  </TouchableOpacity>
                </View>

                <View style={styles.listContainer}>
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        style={[styles.langItem, isSelected && styles.langItemSelected]}
                        onPress={() => handleSelect(lang.code as SupportedLanguageCode)}
                      >
                        <View style={styles.langItemLeft}>
                          <Text style={[styles.nativeText, isSelected && styles.nativeTextSelected]}>
                            {lang.nativeLabel}
                          </Text>
                          <Text style={styles.subText}>{lang.label}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Shadow.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Shadow.sm,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  listContainer: {
    gap: 8,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
  },
  langItemSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  langItemLeft: {
    flexDirection: 'column',
  },
  nativeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  nativeTextSelected: {
    color: Colors.primaryDark,
    fontWeight: FontWeight.bold,
  },
  subText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
