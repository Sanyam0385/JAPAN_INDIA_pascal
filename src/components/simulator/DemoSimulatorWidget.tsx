// CIRCULO: Evaluator & Judge GPS Movement Simulator Widget
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
  Shadow,
} from '../../constants';
import {
  useSimulatorStore,
  SimulatorScenario,
} from '../../lib/simulator/simulatorStore';

interface DemoSimulatorWidgetProps {
  /** Optional custom position style */
  positionStyle?: object;
}

export function DemoSimulatorWidget({ positionStyle }: DemoSimulatorWidgetProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const scenario = useSimulatorStore((s) => s.scenario);
  const status = useSimulatorStore((s) => s.status);
  const speed = useSimulatorStore((s) => s.speed);
  const currentIndex = useSimulatorStore((s) => s.currentIndex);
  const totalPoints = useSimulatorStore((s) => s.totalPoints);
  const speedKmh = useSimulatorStore((s) => s.speedKmh);
  const infoMessage = useSimulatorStore((s) => s.infoMessage);

  const setScenario = useSimulatorStore((s) => s.setScenario);
  const setSpeed = useSimulatorStore((s) => s.setSpeed);
  const start = useSimulatorStore((s) => s.start);
  const pause = useSimulatorStore((s) => s.pause);
  const reset = useSimulatorStore((s) => s.reset);

  const progressPercent = useMemo(() => {
    if (totalPoints <= 1) return 0;
    return Math.min(100, Math.round((currentIndex / (totalPoints - 1)) * 100));
  }, [currentIndex, totalPoints]);

  const isRunning = status === 'running';

  const handleTogglePlay = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    reset();
  };

  const handleSelectScenario = (sc: SimulatorScenario) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setScenario(sc);
  };

  const handleSelectSpeed = (s: 1 | 5 | 10) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSpeed(s);
  };

  return (
    <>
      {/* Floating Trigger Pill on Map */}
      <View style={[styles.triggerWrapper, positionStyle]} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.triggerButton,
            isRunning && styles.triggerButtonActive,
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setModalVisible(true);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('simulator.triggerBtn', 'GPS Sim 🛰️')}
        >
          <View style={styles.triggerContent}>
            {isRunning && <View style={styles.activeDot} />}
            <Text style={styles.triggerEmoji}>🛰️</Text>
            <Text
              style={[
                styles.triggerText,
                isRunning && styles.triggerTextActive,
              ]}
              numberOfLines={1}
            >
              {isRunning
                ? `${speed}x · ${progressPercent}%`
                : t('simulator.triggerBtn', 'GPS Sim 🛰️')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Simulator Modal Drawer */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.drawerCard}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderTitleBlock}>
                <View style={styles.titleRow}>
                  <Text style={styles.drawerTitleEmoji}>🛰️</Text>
                  <Text style={styles.drawerTitle}>
                    {t('simulator.title', 'GPS Fleet Simulator')}
                  </Text>
                </View>
                <Text style={styles.drawerSubtitle}>
                  {t('simulator.subtitle', 'Evaluator Scenario Playback')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('simulator.close', 'Close')}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Scenario Selector */}
              <Text style={styles.sectionHeading}>
                {t('simulator.scenario', 'Select Scenario')}
              </Text>

              {/* Scenario 1: Collector Ramesh */}
              <TouchableOpacity
                style={[
                  styles.scenarioCard,
                  scenario === 'collector_route' && styles.scenarioCardSelected,
                ]}
                onPress={() => handleSelectScenario('collector_route')}
                activeOpacity={0.85}
              >
                <View style={styles.scenarioCardIcon}>
                  <Text style={styles.scenarioEmoji}>🚛</Text>
                </View>
                <View style={styles.scenarioCardText}>
                  <Text
                    style={[
                      styles.scenarioCardTitle,
                      scenario === 'collector_route' && styles.scenarioCardTitleSelected,
                    ]}
                  >
                    {t('simulator.scenarioCollector', 'Collector Ramesh (Route 3A)')}
                  </Text>
                  <Text style={styles.scenarioCardDesc}>
                    {t(
                      'simulator.scenarioCollectorDesc',
                      'Truck servicing Ward 151 stops to Transfer Station'
                    )}
                  </Text>
                </View>
                {scenario === 'collector_route' && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {/* Scenario 2: Picker Meena */}
              <TouchableOpacity
                style={[
                  styles.scenarioCard,
                  scenario === 'picker_approach' && styles.scenarioCardSelected,
                ]}
                onPress={() => handleSelectScenario('picker_approach')}
                activeOpacity={0.85}
              >
                <View style={styles.scenarioCardIcon}>
                  <Text style={styles.scenarioEmoji}>🚲</Text>
                </View>
                <View style={styles.scenarioCardText}>
                  <Text
                    style={[
                      styles.scenarioCardTitle,
                      scenario === 'picker_approach' && styles.scenarioCardTitleSelected,
                    ]}
                  >
                    {t('simulator.scenarioPicker', 'Picker Meena (Approaching Priya)')}
                  </Text>
                  <Text style={styles.scenarioCardDesc}>
                    {t(
                      'simulator.scenarioPickerDesc',
                      'Recyclable cart navigating to doorstep (<500m alert)'
                    )}
                  </Text>
                </View>
                {scenario === 'picker_approach' && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {/* Scenario 3: Roadblock Broadcast */}
              <TouchableOpacity
                style={[
                  styles.scenarioCard,
                  scenario === 'roadblock_broadcast' && styles.scenarioCardSelected,
                ]}
                onPress={() => handleSelectScenario('roadblock_broadcast')}
                activeOpacity={0.85}
              >
                <View style={[styles.scenarioCardIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={styles.scenarioEmoji}>🚨</Text>
                </View>
                <View style={styles.scenarioCardText}>
                  <Text
                    style={[
                      styles.scenarioCardTitle,
                      scenario === 'roadblock_broadcast' && styles.scenarioCardTitleSelected,
                    ]}
                  >
                    {t('simulator.scenarioRoadblock', 'Emergency Roadblock Broadcast')}
                  </Text>
                  <Text style={styles.scenarioCardDesc}>
                    {t(
                      'simulator.scenarioRoadblockDesc',
                      'Urgent civic broadcast & fleet diversion on 80ft Road'
                    )}
                  </Text>
                </View>
                {scenario === 'roadblock_broadcast' && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {/* Speed Multiplier Segment */}
              <Text style={styles.sectionHeading}>
                {t('simulator.speed', 'Playback Speed')}
              </Text>

              <View style={styles.speedRow}>
                {([1, 5, 10] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.speedBtn,
                      speed === s && styles.speedBtnSelected,
                    ]}
                    onPress={() => handleSelectSpeed(s)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.speedBtnText,
                        speed === s && styles.speedBtnTextSelected,
                      ]}
                    >
                      {s}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Progress & Live Telemetry Bar */}
              <View style={styles.telemetryCard}>
                <View style={styles.telemetryHeaderRow}>
                  <Text style={styles.telemetryTitle}>
                    {isRunning
                      ? t('simulator.statusRunning', 'Simulation in progress...')
                      : status === 'paused'
                      ? t('simulator.statusPaused', 'Simulation paused')
                      : status === 'completed'
                      ? t('simulator.statusCompleted', 'Scenario completed ✓')
                      : t('simulator.statusIdle', 'Ready to simulate')}
                  </Text>
                  <Text style={styles.telemetryPercentText}>{progressPercent}%</Text>
                </View>

                {/* Progress bar line */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                      status === 'completed' && { backgroundColor: Colors.success },
                    ]}
                  />
                </View>

                {/* Live Info Banner */}
                <View style={styles.infoBanner}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.infoBannerText}>{infoMessage}</Text>
                </View>

                <View style={styles.telemetryStatsRow}>
                  <Text style={styles.statPill}>⚡ {speedKmh} km/h</Text>
                  <Text style={styles.statPill}>
                    📍 Step {currentIndex + 1} / {totalPoints}
                  </Text>
                  <Text style={styles.statPill}>🏎️ {speed}x Multiplier</Text>
                </View>
              </View>

              {/* Main Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.mainActionButton,
                    isRunning ? styles.pauseButton : styles.startButton,
                  ]}
                  onPress={handleTogglePlay}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={isRunning ? 'pause' : 'play'}
                    size={22}
                    color={Colors.surface}
                  />
                  <Text style={styles.mainActionText}>
                    {isRunning
                      ? t('simulator.pause', 'Pause')
                      : t('simulator.start', 'Start')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
                  <Text style={styles.resetButtonText}>
                    {t('simulator.reset', 'Reset')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger Button
  triggerWrapper: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
    zIndex: 40,
  },
  triggerButton: {
    minHeight: 46,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  triggerButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  triggerEmoji: {
    fontSize: 16,
  },
  triggerText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  triggerTextActive: {
    color: '#1B5E20',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  drawerCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing[4],
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[4],
    maxHeight: '82%',
    ...Shadow.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerHeaderTitleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitleEmoji: {
    fontSize: 20,
  },
  drawerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  drawerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Content
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  sectionHeading: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing[1],
  },

  // Scenario Cards
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: Spacing[3],
  },
  scenarioCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
  },
  scenarioCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  scenarioEmoji: {
    fontSize: 22,
  },
  scenarioCardText: {
    flex: 1,
  },
  scenarioCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  scenarioCardTitleSelected: {
    color: Colors.primary,
  },
  scenarioCardDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Speed Multipliers
  speedRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  speedBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  speedBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  speedBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  speedBtnTextSelected: {
    color: Colors.surface,
  },

  // Telemetry Card
  telemetryCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  telemetryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  telemetryPercentText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },
  telemetryStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: 2,
  },
  statPill: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  mainActionButton: {
    flex: 2,
    minHeight: 56, // Glove-friendly
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.md,
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  pauseButton: {
    backgroundColor: '#D32F2F',
  },
  mainActionText: {
    color: Colors.surface,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  resetButton: {
    flex: 1,
    minHeight: 56, // Glove-friendly
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  resetButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
