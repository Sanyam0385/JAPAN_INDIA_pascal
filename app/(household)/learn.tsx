// Waste Segregation Learning Game + Contamination Challenge + Watch & Learn Center
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { DEMO_WASTE_ITEMS } from '../../src/lib/demo/demoData';
import { useAppStore } from '../../src/stores/appStore';
import { useUserLocation } from '../../src/lib/location/useUserLocation';
import type { WasteItem, WatchLearnVideo } from '../../src/types';

// Tricky contamination challenge items
const CONTAMINATION_ITEMS: WasteItem[] = [
  {
    id: 'contam-1',
    name: 'Greasy Pizza Delivery Box',
    icon: '🍕',
    emoji: '🍕',
    category: 'contamination',
    correctBin: 'wet',
    explanation: 'Food oils and cheese grease saturate paper fibers, making chemical pulping impossible. Rip off the clean lid for Dry Waste, put the greasy bottom in Wet/Organic waste.',
  },
  {
    id: 'contam-2',
    name: 'Broken Mirror Shards',
    icon: '🪞',
    emoji: '🪞',
    category: 'contamination',
    correctBin: 'hazardous',
    explanation: 'Mirrors have a chemical metallic backing (silver/aluminum coating) with different melting temperatures than container bottles. They must go to Hazardous/Sanitary reject.',
  },
  {
    id: 'contam-3',
    name: 'Aseptic Juice Tetra Pak',
    icon: '🧃',
    emoji: '🧃',
    category: 'contamination',
    correctBin: 'dry',
    explanation: 'Tetra paks contain 75% paperboard, 20% polyethylene, and 5% aluminum foil. In certified cities they are dry recyclables sent to specialized hydropulper facilities.',
  },
  {
    id: 'contam-4',
    name: 'PLA Compostable Bio-Plastic Fork',
    icon: '🍴',
    emoji: '🍴',
    category: 'contamination',
    correctBin: 'wet',
    explanation: 'Corn-starch PLA plastics cannot be mechanically recycled with fossil PET or HDPE. They melt at lower temperatures and ruin plastic batches. Route to industrial Wet/Compost.',
  },
  {
    id: 'contam-5',
    name: 'Poly-Coated Paper Coffee Cup',
    icon: '☕',
    emoji: '☕',
    category: 'contamination',
    correctBin: 'hazardous',
    explanation: 'Takeaway coffee cups have a thin bonded polyethylene plastic liner to prevent leaking. Standard paper mills cannot recycle them unless specialized delamination is available.',
  },
  {
    id: 'contam-6',
    name: 'Fluorescent CFL Light Bulb',
    icon: '💡',
    emoji: '💡',
    category: 'contamination',
    correctBin: 'hazardous',
    explanation: 'CFLs contain hazardous mercury vapor. They must never be broken or mixed with bottle glass—handle with care and deposit in Hazardous/E-Waste.',
  },
];

const WATCH_LEARN_VIDEOS: WatchLearnVideo[] = [
  {
    id: 'vid-1',
    title: "Inside Bengaluru's Informal Waste Value Chain",
    duration: '3:45',
    category: 'Circular Economy',
    views: '12.4K views',
    thumbnailEmoji: '🚛',
    color: '#1B5E20',
    youtubeId: 'l1-DVF8xo5E',
    takeaways: [
      'Informal pickers collect over 1,000 tons of recyclables daily across Bengaluru.',
      'Fair value receipts and direct UPI transfers remove 40% exploitative middleman cuts.',
      'Segregating clean cardboard directly triples picker hourly earnings.',
    ],
  },
  {
    id: 'vid-2',
    title: 'The 3-Stream Segregation Protocol (BBMP)',
    duration: '2:15',
    category: 'City Rules',
    views: '24.1K views',
    thumbnailEmoji: '🟢',
    color: '#0277BD',
    youtubeId: 'o_6SsgRvIYA',
    takeaways: [
      'Green Bin: Compostable wet kitchen food waste only.',
      'Blue Bin: Clean, dry, rinsed recyclables (paper, plastic, metal).',
      'Red Bin: Sanitary and domestic hazardous (batteries, diapers, medicines).',
    ],
  },
  {
    id: 'vid-3',
    title: 'From PET Bottle to Recycled T-Shirt',
    duration: '4:10',
    category: 'Recycling Science',
    views: '8.9K views',
    thumbnailEmoji: '👕',
    color: '#7B1FA2',
    youtubeId: 'WOnBGo5QfYQ',
    takeaways: [
      'Mechanical recyclers flake, hot-wash, and spin PET into recycled polyester yarn.',
      'A single bottle contaminated with PVC or oil can ruin a 500 kg chemical batch.',
      'Washing your milk and oil pouches protects workers and increases circularity.',
    ],
  },
];

const FAQS = [
  {
    q: 'Can shredded paper be recycled?',
    a: 'Small paper shreds get lost in optical sorting belts at MRFs. Place shredded paper in a sealed brown paper envelope before putting it in your dry waste bin.',
  },
  {
    q: 'How does CIRCULO ensure informal pickers receive fair value?',
    a: 'Every handoff locks the municipal market tariff before collection. The digital scale log automatically prints a Fair Value Receipt with transparent line items and zero hidden cuts.',
  },
  {
    q: 'What triggers a contamination penalty?',
    a: 'When an accredited MRF facility inspects delivered lot and finds $>15\%$ food sludge or hazardous items, the lot is graded Contaminated, itemized deductions are applied, and corrective guidance is sent.',
  },
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
  const { t } = useTranslation();
  const { recordContaminationChallengeScore } = useAppStore();
  const { cityConfig, municipalName } = useUserLocation();

  const [topTab, setTopTab] = useState<'game' | 'watch'>('game');
  const [gameMode, setGameMode] = useState<'standard' | 'contamination'>('standard');

  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  const handleVideoPress = (vid: WatchLearnVideo) => {
    if (vid.youtubeId) {
      Linking.openURL(`https://youtu.be/${vid.youtubeId}`).catch(() => {});
    } else {
      setSelectedVideo(vid);
    }
  };

  // Dynamic videos based on active city rules
  const watchVideos: WatchLearnVideo[] = useMemo(() => [
    {
      id: 'vid-1',
      title: `Inside ${cityConfig.name.split(' ')[0]}'s Informal Waste Value Chain`,
      duration: '3:45',
      category: 'Circular Economy',
      views: '12.4K views',
      thumbnailEmoji: '🚛',
      color: '#1B5E20',
      youtubeId: 'l1-DVF8xo5E',
      takeaways: [
        `Informal pickers collect over 1,000 tons of recyclables daily across ${cityConfig.name.split(' ')[0]}.`,
        'Fair value receipts and direct UPI transfers remove 40% exploitative middleman cuts.',
        'Segregating clean cardboard directly triples picker hourly earnings.',
      ],
    },
    {
      id: 'vid-2',
      title: `The 3-Stream Segregation Protocol (${cityConfig.municipalName})`,
      duration: '2:15',
      category: 'City Rules',
      views: '24.1K views',
      thumbnailEmoji: '🟢',
      color: '#0277BD',
      youtubeId: 'o_6SsgRvIYA',
      takeaways: [
        'Green Bin: Compostable wet kitchen food waste only.',
        'Blue Bin: Clean, dry, rinsed recyclables (paper, plastic, metal).',
        'Red Bin: Sanitary and domestic hazardous (batteries, diapers, medicines).',
      ],
    },
    {
      id: 'vid-3',
      title: 'From PET Bottle to Recycled T-Shirt',
      duration: '4:10',
      category: 'Recycling Science',
      views: '8.9K views',
      thumbnailEmoji: '👕',
      color: '#7B1FA2',
      youtubeId: 'WOnBGo5QfYQ',
      takeaways: [
        'Mechanical recyclers flake, hot-wash, and spin PET into recycled polyester yarn.',
        'A single bottle contaminated with PVC or oil can ruin a 500 kg chemical batch.',
        'Washing your milk and oil pouches protects workers and increases circularity.',
      ],
    },
  ], [cityConfig]);

  // Dynamic bins based on city rules
  const activeBins = [
    { id: 'wet', label: 'Wet / Organic', emoji: '🟢', color: cityConfig.bins.wet?.color || cityConfig.bins.wet?.colorHex || '#2E7D32', hint: 'Kitchen food waste' },
    { id: 'dry', label: 'Dry Recyclables', emoji: '🔵', color: cityConfig.bins.dry?.color || cityConfig.bins.dry?.colorHex || '#1565C0', hint: 'Paper, clean plastic, metal' },
    { id: 'hazardous', label: cityConfig.bins.sanitary?.label ?? 'Hazardous / Reject', emoji: '🔴', color: cityConfig.bins.sanitary?.color ?? cityConfig.bins.sanitary?.colorHex ?? '#D32F2F', hint: 'Sanitary, broken glass, batteries' },
  ];

  const startGame = useCallback((mode: 'standard' | 'contamination' = gameMode) => {
    setGameMode(mode);
    const pool = mode === 'contamination' ? CONTAMINATION_ITEMS : DEMO_WASTE_ITEMS;
    setItems(shuffle(pool));
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLastCorrect(null);
    setSelectedBin(null);
    setPhase('playing');
  }, [gameMode]);

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
      if (gameMode === 'contamination') {
        recordContaminationChallengeScore(score + (lastCorrect ? 1 : 0));
      }
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
        <Text style={styles.wardTag}>OPERATING UNDER {municipalName.toUpperCase()} RULES</Text>
        <Text style={styles.title}>Circularity Academy</Text>
      </View>

      {/* Top Tab Switcher: Game vs Watch & Learn */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, topTab === 'game' && styles.tabBtnActive]}
          onPress={() => setTopTab('game')}
        >
          <Ionicons name="game-controller-outline" size={17} color={topTab === 'game' ? Colors.textInverse : Colors.textSecondary} />
          <Text style={[styles.tabBtnText, topTab === 'game' && styles.tabBtnTextActive]}>Segregation Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, topTab === 'watch' && styles.tabBtnActive]}
          onPress={() => setTopTab('watch')}
        >
          <Ionicons name="play-circle-outline" size={17} color={topTab === 'watch' ? Colors.textInverse : Colors.textSecondary} />
          <Text style={[styles.tabBtnText, topTab === 'watch' && styles.tabBtnTextActive]}>Watch & Learn</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================== TAB 1: GAME ===================== */}
        {topTab === 'game' && (
          <>
            {/* Game Mode Selector */}
            {phase === 'welcome' && (
              <View style={styles.modeCardsRow}>
                <TouchableOpacity
                  style={[styles.modeCard, gameMode === 'standard' && styles.modeCardActive]}
                  onPress={() => setGameMode('standard')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modeCardEmoji}>♻️</Text>
                  <Text style={[styles.modeCardTitle, gameMode === 'standard' && styles.modeCardTitleActive]}>
                    Standard City Sort
                  </Text>
                  <Text style={styles.modeCardDesc}>Daily items based on {cityConfig.name} municipal bins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeCard, gameMode === 'contamination' && styles.modeCardActive, { borderColor: '#FFA000' }]}
                  onPress={() => setGameMode('contamination')}
                  activeOpacity={0.85}
                >
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusBadgeText}>CHALLENGE</Text>
                  </View>
                  <Text style={styles.modeCardEmoji}>⚠️</Text>
                  <Text style={[styles.modeCardTitle, gameMode === 'contamination' && { color: '#E65100' }]}>
                    Contamination Boss
                  </Text>
                  <Text style={styles.modeCardDesc}>Tricky edge cases: pizza grease, mirrors, PLA bio-plastics</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* WELCOME SCREEN */}
            {phase === 'welcome' && (
              <Card style={styles.welcomeWrap}>
                <Text style={styles.welcomeEmoji}>{gameMode === 'contamination' ? '⚠️' : '🏆'}</Text>
                <Text style={styles.welcomeTitle}>
                  {gameMode === 'contamination' ? 'Master the Contamination Challenge' : 'Test Your Segregation Mastery'}
                </Text>
                <Text style={styles.welcomeBody}>
                  {gameMode === 'contamination'
                    ? 'Facility MRF inspections penalize contaminated lots. Can you spot grease, toxic linings, and multi-layer composites that look recyclable but ruin batches?'
                    : `Learn which waste items belong in ${cityConfig.name}'s official bins. Maintain zero silent deductions for collectors!`}
                </Text>

                <TouchableOpacity
                  style={[styles.startBtn, gameMode === 'contamination' && { backgroundColor: '#E65100' }]}
                  onPress={() => startGame(gameMode)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.startBtnText}>
                    {gameMode === 'contamination' ? 'Start Contamination Challenge →' : `${t('game.restart', 'Start Segregation Game')} →`}
                  </Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* PLAYING / FEEDBACK PHASE */}
            {(phase === 'playing' || phase === 'feedback') && item && (
              <View style={{ gap: Spacing[3] }}>
                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>Item {currentIndex + 1} of {items.length}</Text>
                  <View style={styles.scoreChip}>
                    <Text style={styles.scoreText}>{t('game.score', 'Score')}: {score}</Text>
                  </View>
                  <View style={styles.streakChip}>
                    <Text style={styles.streakText}>🔥 {t('game.streak', 'Streak')}: {streak}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>

                {/* Waste Item Card */}
                <Card style={styles.itemCard}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemInstruction}>{t('game.instruction', 'Tap the correct municipal bin below:')}</Text>
                </Card>

                {/* Feedback Banner */}
                {phase === 'feedback' && (
                  <View style={[styles.feedbackBanner, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                      <Ionicons
                        name={lastCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={22}
                        color={lastCorrect ? '#2E7D32' : '#C62828'}
                      />
                      <Text style={[styles.feedbackTitle, lastCorrect ? { color: '#2E7D32' } : { color: '#C62828' }]}>
                        {lastCorrect ? `${t('game.correct', 'Correct Placement!')} 🎉` : `${t('game.incorrect', 'Incorrect Stream')} ❌`}
                      </Text>
                    </View>
                    <Text style={styles.feedbackExplanation}>{item.explanation}</Text>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                      <Text style={styles.nextBtnText}>{t('game.nextItem', 'Continue to Next Item →')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Bins List */}
                <View style={styles.binsGrid}>
                  {activeBins.map(bin => {
                    const isSelected = selectedBin === bin.id;
                    const isCorrect = item.correctBin === bin.id;

                    let btnStyle = {};
                    if (phase === 'feedback') {
                      if (isCorrect) btnStyle = { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' };
                      else if (isSelected && !isCorrect) btnStyle = { backgroundColor: '#FFEBEE', borderColor: '#C62828' };
                    }

                    return (
                      <TouchableOpacity
                        key={bin.id}
                        style={[styles.binBtn, { borderColor: bin.color }, btnStyle]}
                        onPress={() => handleAnswer(bin.id)}
                        disabled={phase === 'feedback'}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.binEmoji}>{bin.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.binLabel, { color: bin.color }]}>{t('game.bins.' + bin.id, bin.label)}</Text>
                          <Text style={styles.binHint}>{bin.hint}</Text>
                        </View>
                        {phase === 'feedback' && isCorrect && (
                          <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                        )}
                        {phase === 'feedback' && isSelected && !isCorrect && (
                          <Ionicons name="close-circle" size={24} color="#C62828" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* RESULTS PHASE */}
            {phase === 'results' && (
              <Card style={styles.results}>
                <Text style={styles.resultsEmoji}>{score >= 5 ? '🏆' : '📚'}</Text>
                <Text style={styles.resultsTitle}>
                  {score >= 5 ? t('game.levelComplete', 'Outstanding Performance!') : 'Good Effort! Keep Learning'}
                </Text>
                <Text style={styles.resultsSub}>
                  {gameMode === 'contamination'
                    ? 'Your score helps prevent silent deductions at the MRF certified scales.'
                    : `Verified under ${cityConfig.name} Waste Rules.`}
                </Text>

                <View style={styles.resultStats}>
                  <View style={styles.resultStat}>
                    <Text style={styles.resultStatNum}>{score}/{items.length}</Text>
                    <Text style={styles.resultStatLabel}>{t('game.score', 'Score')}</Text>
                  </View>
                  <View style={styles.resultStat}>
                    <Text style={styles.resultStatNum}>{maxStreak}</Text>
                    <Text style={styles.resultStatLabel}>{t('game.streak', 'Best Streak')}</Text>
                  </View>
                  <View style={styles.resultStat}>
                    <Text style={styles.resultStatNum}>
                      {Math.round((score / items.length) * 100)}%
                    </Text>
                    <Text style={styles.resultStatLabel}>Accuracy</Text>
                  </View>
                </View>

                {score >= 5 && (
                  <View style={styles.badgeEarned}>
                    <Ionicons name="ribbon-outline" size={20} color={Colors.primary} />
                    <Text style={styles.badgeText}>
                      {gameMode === 'contamination'
                        ? 'Zero-Contamination Guardian 🎖️ Badge Earned!'
                        : 'Segregation Star 🌟 Badge Earned!'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.restartBtn} onPress={() => setPhase('welcome')}>
                  <Text style={styles.restartBtnText}>{t('game.playAgain', 'Play Again')} 🔄</Text>
                </TouchableOpacity>
              </Card>
            )}
          </>
        )}

        {/* ===================== TAB 2: WATCH & LEARN (PHASE 7) ===================== */}
        {topTab === 'watch' && (
          <View style={{ gap: Spacing[4] }}>
            {/* Daily Circularity Tip */}
            <Card style={styles.dailyTipCard}>
              <View style={styles.dailyTipTop}>
                <Ionicons name="sparkles" size={18} color="#F57F17" />
                <Text style={styles.dailyTipBadge}>DAILY CIRCULARITY TIP</Text>
              </View>
              <Text style={styles.dailyTipTitle}>Clean In = Fair Value Out</Text>
              <Text style={styles.dailyTipBody}>
                Rinse beverage and milk pouches with half a cup of water before putting them in your dry waste bin. Residual milk ferments into bacterial sludge, which degrades paper pulping and triggers automatic deduction line items on receipts.
              </Text>
            </Card>

            {/* Video Modules */}
            <Text style={styles.sectionHeader}>Watch & Learn Masterclasses</Text>
            <View style={styles.videoGrid}>
              {watchVideos.map(vid => (
                <Card key={vid.id} style={styles.videoCard}>
                  <TouchableOpacity
                    style={[styles.thumbnailWrap, { backgroundColor: vid.color }]}
                    onPress={() => handleVideoPress(vid)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={vid.title}
                  >
                    <Text style={styles.thumbnailEmoji}>{vid.thumbnailEmoji}</Text>
                    {vid.youtubeId && !thumbnailErrors[vid.id] && (
                      <Image
                        source={{ uri: `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg` }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        onError={() => setThumbnailErrors(prev => ({ ...prev, [vid.id]: true }))}
                      />
                    )}
                    <View style={styles.playOverlay}>
                      <Ionicons name="play" size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{vid.duration}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.videoMeta}>
                    <View style={styles.videoPillRow}>
                      <Text style={styles.categoryPill}>{vid.category}</Text>
                      <Text style={styles.viewsText}>{vid.views}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleVideoPress(vid)} activeOpacity={0.85}>
                      <Text style={styles.videoTitle}>{vid.title}</Text>
                    </TouchableOpacity>

                    <Text style={styles.takeawayHeading}>KEY TAKEAWAYS:</Text>
                    {vid.takeaways.map((point, idx) => (
                      <View key={idx} style={styles.takeawayRow}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
                        <Text style={styles.takeawayText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ))}
            </View>

            {/* Frequently Asked Questions */}
            <Text style={styles.sectionHeader}>Segregation & Payout FAQs</Text>
            <View style={styles.faqList}>
              {FAQS.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <Card key={index} style={styles.faqCard}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => setExpandedFaq(isOpen ? null : index)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.faqQ}>{faq.q}</Text>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    {isOpen && (
                      <Text style={styles.faqA}>{faq.a}</Text>
                    )}
                  </Card>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wardTag: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[1.5],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[2.5],
    borderRadius: BorderRadius.lg,
    gap: Spacing[2],
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    gap: Spacing[1.5],
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.textInverse },
  content: { padding: Spacing[4], gap: Spacing[4] },
  modeCardsRow: { flexDirection: 'row', gap: Spacing[2.5] },
  modeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  modeCardActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  modeCardEmoji: { fontSize: 26 },
  modeCardTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  modeCardTitleActive: { color: Colors.primary },
  modeCardDesc: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', lineHeight: 13 },
  bonusBadge: {
    position: 'absolute',
    top: -6,
    right: 8,
    backgroundColor: '#E65100',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  bonusBadgeText: { fontSize: 8, fontWeight: FontWeight.bold, color: '#fff' },
  welcomeWrap: { alignItems: 'center', gap: Spacing[3], padding: Spacing[5] },
  welcomeEmoji: { fontSize: 60 },
  welcomeTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  welcomeBody: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3.5],
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[1],
  },
  startBtnText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
  scoreChip: { backgroundColor: Colors.mintPale, borderRadius: BorderRadius.full, paddingHorizontal: Spacing[2.5], paddingVertical: 2 },
  scoreText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  streakChip: { backgroundColor: '#FFF3E0', borderRadius: BorderRadius.full, paddingHorizontal: Spacing[2.5], paddingVertical: 2 },
  streakText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#E65100' },
  progressBar: { height: 5, backgroundColor: Colors.border, borderRadius: 2.5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2.5 },
  itemCard: { padding: Spacing[5], alignItems: 'center', gap: Spacing[2] },
  itemEmoji: { fontSize: 64 },
  itemName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  itemInstruction: { fontSize: FontSize.xs, color: Colors.textSecondary },
  feedbackBanner: { padding: Spacing[3.5], borderRadius: BorderRadius.lg, gap: Spacing[2] },
  feedbackCorrect: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#2E7D32' },
  feedbackWrong: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#C62828' },
  feedbackTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  feedbackExplanation: { fontSize: FontSize.xs, color: Colors.textPrimary, lineHeight: 18 },
  nextBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing[2.5], alignItems: 'center', marginTop: Spacing[1] },
  nextBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  binsGrid: { gap: Spacing[2] },
  binBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  binEmoji: { fontSize: 24 },
  binLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  binHint: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  results: { alignItems: 'center', padding: Spacing[5], gap: Spacing[3] },
  resultsEmoji: { fontSize: 60 },
  resultsTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  resultsSub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  resultStats: { flexDirection: 'row', gap: Spacing[5], marginVertical: Spacing[2] },
  resultStat: { alignItems: 'center' },
  resultStatNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  resultStatLabel: { fontSize: 10, color: Colors.textSecondary },
  badgeEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#E8F5E9',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  restartBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing[3], paddingHorizontal: Spacing[6], marginTop: Spacing[1] },
  restartBtnText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  dailyTipCard: { padding: Spacing[4], gap: Spacing[2], backgroundColor: '#FFFDF6', borderWidth: 1, borderColor: '#FFE082' },
  dailyTipTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  dailyTipBadge: { fontSize: 10, fontWeight: FontWeight.bold, color: '#F57F17', letterSpacing: 0.5 },
  dailyTipTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  dailyTipBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  sectionHeader: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing[2] },
  videoGrid: { gap: Spacing[3] },
  videoCard: { padding: Spacing[3.5], gap: Spacing[3] },
  thumbnailWrap: {
    height: 140,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailEmoji: { fontSize: 50 },
  playOverlay: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
  videoMeta: { gap: Spacing[1.5] },
  videoPillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryPill: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary },
  viewsText: { fontSize: 10, color: Colors.textTertiary },
  videoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  takeawayHeading: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5, marginTop: 4 },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[1.5] },
  takeawayText: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  faqList: { gap: Spacing[2.5] },
  faqCard: { padding: Spacing[3.5] },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { flex: 1, fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  faqA: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: Spacing[2], paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.border },
});
