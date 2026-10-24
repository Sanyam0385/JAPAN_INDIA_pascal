// Waste Segregation Learning Game
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../src/constants';
import { DEMO_WASTE_ITEMS } from '../../src/lib/demo/demoData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BINS = [
  { id: 'wet', label: 'Wet Waste', emoji: '🟢', color: '#4CAF50', bg: '#E8F5E9', hint: 'Food, organic matter' },
  { id: 'dry', label: 'Dry Waste', emoji: '🔵', color: '#1976D2', bg: '#E3F2FD', hint: 'Paper, plastic, metal, glass' },
  { id: 'hazardous', label: 'Hazardous', emoji: '🔴', color: '#D32F2F', bg: '#FFEBEE', hint: 'Batteries, e-waste, medicines' },
];

type GamePhase = 'welcome' | 'playing' | 'feedback' | 'results';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [items, setItems] = useState<typeof DEMO_WASTE_ITEMS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);

  const startGame = useCallback(() => {
    setItems(shuffle(DEMO_WASTE_ITEMS).slice(0, 10));
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLastCorrect(null);
    setSelectedBin(null);
    setPhase('playing');
  }, []);

  const handleAnswer = (binId: string) => {
    if (phase !== 'playing' || selectedBin !== null) return;
    const item = items[currentIndex];
    const correct = binId === item.correctBin;
    setSelectedBin(binId);
    setLastCorrect(correct);
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    setMaxStreak(ms => Math.max(ms, newStreak));
    if (correct) setScore(s => s + 1);
    setPhase('feedback');
  };

  const handleNext = () => {
    if (currentIndex + 1 >= items.length) {
      setPhase('results');
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedBin(null);
      setLastCorrect(null);
      setPhase('playing');
    }
  };

  const item = items[currentIndex];
  const progress = items.length > 0 ? (currentIndex + 1) / items.length : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>♻️ Segregation Game</Text>
        <Text style={styles.subtitle}>Learn the correct bin for every waste item</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        {phase === 'welcome' && (
          <View style={styles.welcomeWrap}>
            <Text style={styles.welcomeEmoji}>♻️</Text>
            <Text style={styles.welcomeTitle}>Test Your Segregation Skills!</Text>
            <Text style={styles.welcomeBody}>
              You'll see 10 waste items. Tap the correct bin for each one.{'\n\n'}
              Learn why each item goes where it goes, and build your streak!
            </Text>
            <View style={styles.binPreview}>
              {BINS.map(b => (
                <View key={b.id} style={[styles.binPreviewItem, { backgroundColor: b.bg }]}>
                  <Text style={styles.binPreviewEmoji}>{b.emoji}</Text>
                  <Text style={[styles.binPreviewLabel, { color: b.color }]}>{b.label}</Text>
                  <Text style={styles.binPreviewHint}>{b.hint}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>Start Game →</Text>
            </TouchableOpacity>
            <Text style={styles.localNote}>
              ℹ️ Bin colours shown here (green/blue) are for BBMP localities.{'\n'}
              Rules are configurable per local authority.
            </Text>
          </View>
        )}

        {/* Playing & Feedback */}
        {(phase === 'playing' || phase === 'feedback') && item && (
          <View>
            {/* Progress */}
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{currentIndex + 1} / {items.length}</Text>
              <View style={styles.scoreChip}>
                <Text style={styles.scoreText}>⭐ {score}</Text>
              </View>
              {streak > 1 && (
                <View style={styles.streakChip}>
                  <Text style={styles.streakText}>🔥 {streak}</Text>
                </View>
              )}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            {/* Item Card */}
            <View style={styles.itemCard}>
              <Text style={styles.itemEmoji}>{item.icon}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemInstruction}>Which bin does this belong in?</Text>
            </View>

            {/* Feedback Banner */}
            {phase === 'feedback' && (
              <View style={[styles.feedbackBanner, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackTitle}>{lastCorrect ? '✅ Correct!' : '❌ Not quite'}</Text>
                <Text style={styles.feedbackExplanation}>{item.explanation}</Text>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>
                    {currentIndex + 1 >= items.length ? 'See Results →' : 'Next Item →'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bin Buttons */}
            <View style={styles.binsGrid}>
              {BINS.map(bin => {
                const isSelected = selectedBin === bin.id;
                const isCorrect = item.correctBin === bin.id;
                const showResult = phase === 'feedback';
                let bg = bin.bg;
                let borderC = bin.color + '40';
                if (showResult && isCorrect) { bg = '#E8F5E9'; borderC = '#4CAF50'; }
                else if (showResult && isSelected && !isCorrect) { bg = '#FFEBEE'; borderC = '#D32F2F'; }

                return (
                  <TouchableOpacity
                    key={bin.id}
                    style={[styles.binBtn, { backgroundColor: bg, borderColor: borderC }]}
                    onPress={() => handleAnswer(bin.id)}
                    disabled={phase === 'feedback'}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.binEmoji}>{bin.emoji}</Text>
                    <Text style={[styles.binLabel, { color: bin.color }]}>{bin.label}</Text>
                    {showResult && isCorrect && <Text style={styles.checkMark}>✓</Text>}
                    {showResult && isSelected && !isCorrect && <Text style={styles.xMark}>✗</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Results */}
        {phase === 'results' && (
          <View style={styles.results}>
            <Text style={styles.resultsEmoji}>
              {score >= 8 ? '🏆' : score >= 5 ? '🌟' : '💪'}
            </Text>
            <Text style={styles.resultsTitle}>
              {score >= 8 ? 'Excellent!' : score >= 5 ? 'Great job!' : 'Keep practicing!'}
            </Text>
            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{score}/{items.length}</Text>
                <Text style={styles.resultStatLabel}>Score</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{maxStreak}</Text>
                <Text style={styles.resultStatLabel}>Best Streak</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>
                  {Math.round((score / items.length) * 100)}%
                </Text>
                <Text style={styles.resultStatLabel}>Accuracy</Text>
              </View>
            </View>
            {score >= 8 && (
              <View style={styles.badgeEarned}>
                <Text style={styles.badgeText}>🎖️ Segregation Star badge earned!</Text>
              </View>
            )}
            <TouchableOpacity style={styles.restartBtn} onPress={startGame}>
              <Text style={styles.restartBtnText}>🔄 Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: Spacing[5], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: Spacing[4], gap: Spacing[4] },
  welcomeWrap: { alignItems: 'center', gap: Spacing[4] },
  welcomeEmoji: { fontSize: 72, marginTop: Spacing[4] },
  welcomeTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'center' },
  welcomeBody: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  binPreview: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[2] },
  binPreviewItem: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing[3], alignItems: 'center', gap: Spacing[1] },
  binPreviewEmoji: { fontSize: 28 },
  binPreviewLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textAlign: 'center' },
  binPreviewHint: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  startBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[8], marginTop: Spacing[2],
  },
  startBtnText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  localNote: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[2] },
  progressText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  scoreChip: {
    backgroundColor: Colors.mintPale, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1],
  },
  scoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  streakChip: {
    backgroundColor: '#FFF3E0', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1],
  },
  streakText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.warning },
  progressBar: { height: 6, backgroundColor: Colors.gray200, borderRadius: 3, marginBottom: Spacing[4] },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  itemCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing[6], alignItems: 'center', gap: Spacing[2],
    borderWidth: 1, borderColor: Colors.border, ...Shadow.base,
  },
  itemEmoji: { fontSize: 72 },
  itemName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  itemInstruction: { fontSize: FontSize.sm, color: Colors.textSecondary },
  feedbackBanner: {
    borderRadius: BorderRadius.lg, padding: Spacing[4],
    marginTop: Spacing[3], gap: Spacing[2],
  },
  feedbackCorrect: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#4CAF50' },
  feedbackWrong: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#D32F2F' },
  feedbackTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  feedbackExplanation: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3], alignItems: 'center', marginTop: Spacing[2],
  },
  nextBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  binsGrid: { gap: Spacing[3], marginTop: Spacing[3] },
  binBtn: {
    borderRadius: BorderRadius.lg, paddingVertical: Spacing[4],
    alignItems: 'center', borderWidth: 2, flexDirection: 'row',
    paddingHorizontal: Spacing[5], gap: Spacing[3],
  },
  binEmoji: { fontSize: 28 },
  binLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1 },
  checkMark: { fontSize: FontSize.xl, color: '#4CAF50', fontWeight: FontWeight.bold },
  xMark: { fontSize: FontSize.xl, color: '#D32F2F', fontWeight: FontWeight.bold },
  results: { alignItems: 'center', paddingTop: Spacing[6], gap: Spacing[4] },
  resultsEmoji: { fontSize: 80 },
  resultsTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.primary },
  resultStats: { flexDirection: 'row', gap: Spacing[6] },
  resultStat: { alignItems: 'center' },
  resultStatNum: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  resultStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  badgeEarned: {
    backgroundColor: Colors.mintPale, borderRadius: BorderRadius.lg,
    padding: Spacing[4], borderWidth: 1, borderColor: Colors.mint,
  },
  badgeText: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.semibold },
  restartBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[8],
  },
  restartBtnText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
