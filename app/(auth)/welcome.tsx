// Welcome / Splash Screen
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryLight, Colors.emerald]}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Logo & Branding */}
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>♻</Text>
        </View>
        <Text style={styles.appName}>CIRCULO</Text>
        <Text style={styles.tagline}>
          Turning waste into{'\n'}a traceable resource
        </Text>
      </View>

      {/* Demo Mode Banner */}
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>🎯 HACKATHON DEMO — All data is fictional</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/demo-select')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>⚡ Try Demo (No Login Required)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/onboarding')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>See How It Works</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.ghostBtnText}>Log In with Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.85}
        >
          <Text style={styles.registerLinkText}>Create New Account →</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0-demo · Civic Tech for Urban Sustainability</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing[12],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[5],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoText: { fontSize: 52 },
  appName: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
    letterSpacing: 6,
    marginBottom: Spacing[3],
  },
  tagline: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: FontWeight.medium,
  },
  demoBanner: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  demoBannerText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  actions: {
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  primaryBtn: {
    backgroundColor: Colors.textInverse,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3.5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  secondaryBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginVertical: Spacing[1],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  dividerText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm },
  ghostBtn: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  ghostBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    textDecorationLine: 'underline',
  },
  registerLink: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  registerLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  footer: {
    paddingBottom: Spacing[4],
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
});
