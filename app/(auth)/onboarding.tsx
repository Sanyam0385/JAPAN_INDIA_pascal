// Onboarding screen with 3 slides
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '♻️',
    title: 'Waste Becomes\na Resource',
    body: 'Every kilogram of waste you segregate is tracked — from your home to the recycler. Build a verified circularity record for your household.',
    bg: Colors.mintPale,
    accent: Colors.primary,
  },
  {
    emoji: '🤝',
    title: 'Connect the\nEcosystem',
    body: 'Households, formal collectors, waste pickers, and recycling businesses — all on one platform with transparency and dignity for every participant.',
    bg: '#E3F2FD',
    accent: Colors.collectorAccent,
  },
  {
    emoji: '🌿',
    title: 'Earn, Learn\n& Participate',
    body: 'Earn reward points for correct segregation, sell your recyclables directly, join neighbourhood clean-up drives, and learn why waste matters.',
    bg: '#FFF3E0',
    accent: Colors.pickerAccent,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<any>(null);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (current + 1), animated: true });
      setCurrent(current + 1);
    } else {
      router.push('/(auth)/demo-select');
    }
  };

  const skip = () => router.push('/(auth)/demo-select');

  const slide = SLIDES[current];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip */}
      <TouchableOpacity onPress={skip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.slideScroll}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: s.bg }]}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: s.accent }]}>{s.title}</Text>
            <Text style={styles.slideBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicators */}
      <View style={styles.indicators}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current
                ? { backgroundColor: slide.accent, width: 24 }
                : { backgroundColor: Colors.gray300 },
            ]}
          />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {current > 0 ? (
          <TouchableOpacity
            onPress={() => {
              scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (current - 1), animated: true });
              setCurrent(current - 1);
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide.accent }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {current === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  slideScroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  emojiWrap: {
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[8],
  },
  emoji: { fontSize: 64 },
  slideTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
    marginBottom: Spacing[5],
    lineHeight: 40,
  },
  slideBody: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[5],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  backBtn: { flex: 1, paddingVertical: Spacing[3.5], alignItems: 'center' },
  backBtnText: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: FontWeight.medium },
  nextBtn: {
    flex: 2,
    paddingVertical: Spacing[3.5],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  nextBtnText: { color: Colors.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
