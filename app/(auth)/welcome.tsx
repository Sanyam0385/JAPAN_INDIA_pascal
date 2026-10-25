// Welcome / Home Screen matching welcome.png design reference
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AccessibilityInfo, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WelcomeBackground } from '../../src/components/auth/WelcomeBackground';
import { CirculoLogoBadge } from '../../src/components/auth/CirculoLogoBadge';
import { LanguageSelectorButton } from '../../src/components/ui';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../src/constants';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [reduceMotion, setReduceMotion] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReduceMotion(enabled);
      if (enabled) {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [fadeAnim, slideAnim]);

  const handleOpenDemo = () => {
    router.push('/(auth)/demo-select');
  };

  return (
    <View style={styles.container}>
      {/* Background artwork: gradient, SVG foliage, wind turbines, skyline & hills */}
      <WelcomeBackground />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + Spacing[4], Spacing[8]),
            paddingBottom: Math.max(insets.bottom + Spacing[3], Spacing[6]),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Top bar with Language Selector */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <LanguageSelectorButton variant="pill" />
        </View>

        {/* Centered Brand Emblem, Wordmark & Tagline */}
        <View style={styles.brandContainer}>
          <CirculoLogoBadge
            size={120}
            onLongPress={handleOpenDemo}
            onPress={handleOpenDemo}
          />

          <Text style={styles.wordmark}>CIRCULO</Text>

          <Text style={styles.tagline}>
            {t('auth.welcomeSubtitle', 'Turning waste into\na traceable resource')}
          </Text>
        </View>

        {/* Stack of Three Signature Rounded Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* 1. Log In (Solid White Card) */}
          <TouchableOpacity
            style={styles.whiteBtn}
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel={`${t('auth.logInTitle', 'Log In')}, ${t('auth.logInSubtitle', 'Access your account')}`}
          >
            <View style={styles.btnTextCol}>
              <Text style={styles.whiteBtnTitle}>{t('auth.logInTitle', 'Log In')}</Text>
              <Text style={styles.whiteBtnSubtitle}>{t('auth.logInSubtitle', 'Access your account')}</Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={24} color="#1B5E20" />
            </View>
          </TouchableOpacity>

          {/* 2. Create New Account (Solid Dark Green with Subtle Light Border) */}
          <TouchableOpacity
            style={styles.greenBtn}
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/register')}
            accessibilityRole="button"
            accessibilityLabel={`${t('auth.createAccountTitle', 'Create New Account')}, ${t('auth.createAccountSubtitle', 'Join Circulo today')}`}
          >
            <View style={styles.btnTextCol}>
              <Text style={styles.greenBtnTitle}>{t('auth.createAccountTitle', 'Create New Account')}</Text>
              <Text style={styles.greenBtnSubtitle}>{t('auth.createAccountSubtitle', 'Join Circulo today')}</Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* 3. See How It Works (Translucent Glass Style) */}
          <TouchableOpacity
            style={styles.glassBtn}
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/onboarding')}
            accessibilityRole="button"
            accessibilityLabel={`${t('auth.seeHowItWorksTitle', 'See How It Works')}, ${t('auth.seeHowItWorksSubtitle', 'Learn about the process')}`}
          >
            <View style={styles.btnTextCol}>
              <Text style={styles.glassBtnTitle}>{t('auth.seeHowItWorksTitle', 'See How It Works')}</Text>
              <Text style={styles.glassBtnSubtitle}>{t('auth.seeHowItWorksSubtitle', 'Learn about the process')}</Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Subtle Discreet Demo Access at the very bottom */}
        <TouchableOpacity
          onPress={handleOpenDemo}
          activeOpacity={0.7}
          style={styles.demoLinkWrap}
          accessibilityRole="button"
          accessibilityLabel="Try demo without login"
        >
          <Text style={styles.demoLinkText}>
            {t('auth.tryDemoNoLogin', 'Try Demo (no login)')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    paddingTop: Spacing[2],
    width: '100%',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing[2],
  },
  wordmark: {
    fontSize: 34,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: 6,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
    textAlign: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tagline: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing[3.5],
    paddingBottom: Spacing[2],
  },
  whiteBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 74,
    ...Shadow.lg,
  },
  whiteBtnTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    marginBottom: 2,
  },
  whiteBtnSubtitle: {
    fontSize: 13,
    color: '#557A60',
    fontWeight: FontWeight.medium,
  },
  greenBtn: {
    backgroundColor: '#14632E',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 74,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    ...Shadow.base,
  },
  greenBtnTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  greenBtnSubtitle: {
    fontSize: 13,
    color: '#C8E6C9',
    fontWeight: FontWeight.medium,
  },
  glassBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 74,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  glassBtnTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  glassBtnSubtitle: {
    fontSize: 13,
    color: '#E8F5E9',
    fontWeight: FontWeight.medium,
  },
  btnTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  chevronWrap: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  demoLinkWrap: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[1],
  },
  demoLinkText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3,
    textDecorationLine: 'underline',
  },
});
