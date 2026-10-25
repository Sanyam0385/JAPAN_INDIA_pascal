import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { useAppStore } from '../../src/stores/appStore';
import type { IssueType } from '../../src/types';

type StopStatus = 'completed' | 'current' | 'pending';

interface Stop {
  id: string;
  houseNumber: string;
  address: string;
  wasteType: 'wet' | 'dry' | 'recyclable' | 'hazardous';
  timeSlot: string;
  status: StopStatus;
}

const INITIAL_STOPS: Stop[] = [
  { id: 's1', houseNumber: '#42', address: '5th Cross, Koramangala 4th Block', wasteType: 'wet', timeSlot: '07:10', status: 'completed' },
  { id: 's2', houseNumber: '#17', address: '8th Main, HSR Layout Sector 2', wasteType: 'dry', timeSlot: '07:30', status: 'completed' },
  { id: 's3', houseNumber: '#89', address: '1st Cross, Indiranagar 12th Main', wasteType: 'recyclable', timeSlot: '07:55', status: 'completed' },
  { id: 's4', houseNumber: '#33', address: '2nd Block, JP Nagar Phase 2', wasteType: 'wet', timeSlot: '08:20', status: 'completed' },
  { id: 's5', houseNumber: '#71', address: 'Outer Ring Road, Marathahalli', wasteType: 'dry', timeSlot: '08:40', status: 'completed' },
  { id: 's6', houseNumber: '#14', address: 'Church Street, MG Road Area', wasteType: 'wet', timeSlot: '09:00', status: 'completed' },
  { id: 's7', houseNumber: '#55', address: '100 Feet Road, Jayanagar', wasteType: 'dry', timeSlot: '09:20', status: 'completed' },
  { id: 's8', houseNumber: '#28', address: 'Domlur Layout, Domlur', wasteType: 'recyclable', timeSlot: '09:45', status: 'current' },
  { id: 's9', houseNumber: '#96', address: '3rd Main, Whitefield', wasteType: 'wet', timeSlot: '10:10', status: 'pending' },
  { id: 's10', houseNumber: '#11', address: 'BTM Layout 2nd Stage', wasteType: 'dry', timeSlot: '10:30', status: 'pending' },
  { id: 's11', houseNumber: '#63', address: 'Rajajinagar 3rd Block', wasteType: 'hazardous', timeSlot: '10:55', status: 'pending' },
  { id: 's12', houseNumber: '#47', address: 'Electronic City Phase 1', wasteType: 'recyclable', timeSlot: '11:20', status: 'pending' },
];

const WASTE_TYPE_COLORS: Record<string, string> = {
  wet: Colors.success,
  dry: Colors.collectorAccent,
  recyclable: Colors.warning,
  hazardous: Colors.error,
};

function StatusBadge({ status }: { status: StopStatus }) {
  const { t } = useTranslation();
  const configs: Record<StopStatus, { label: string; color: string; bg: string }> = {
    completed: { label: t('collector.done', '✓ Done'), color: Colors.success, bg: Colors.successLight },
    current: { label: t('collector.current', '● Current'), color: Colors.collectorAccent, bg: Colors.infoLight },
    pending: { label: t('collector.pending', '○ Pending'), color: Colors.textSecondary, bg: Colors.gray100 },
  };
  const cfg = configs[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function CollectorTodayScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const { createIssue } = useAppStore();
  const [onShift, setOnShift] = useState(true);
  const [stops, setStops] = useState<Stop[]>(INITIAL_STOPS);

  // Issue reporting modal state
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType>('contamination');
  const [issueStop, setIssueStop] = useState<Stop | null>(null);
  const [issueNote, setIssueNote] = useState('');
  const [issueSuccessMsg, setIssueSuccessMsg] = useState<string | null>(null);

  const completed = stops.filter(s => s.status === 'completed').length;
  const remaining = stops.filter(s => s.status === 'pending').length;
  const currentStop = stops.find(s => s.status === 'current');
  const name = user?.name ?? 'Ramesh';

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('collector.greetingMorning', 'Good morning');
    if (hour < 17) return t('collector.greetingAfternoon', 'Good afternoon');
    return t('collector.greetingEvening', 'Good evening');
  };

  const markStopCompleted = (stopId: string) => {
    setStops(prev => {
      const next = [...prev];
      const idx = next.findIndex(s => s.id === stopId);
      if (idx !== -1) {
        next[idx] = { ...next[idx], status: 'completed' };
        // Advance current stop
        const nextPendingIdx = next.findIndex(s => s.status === 'pending');
        if (nextPendingIdx !== -1) {
          next[nextPendingIdx] = { ...next[nextPendingIdx], status: 'current' };
        }
      }
      return next;
    });
  };

  const handleOpenIssueModal = (stop?: Stop) => {
    setIssueStop(stop || currentStop || stops[0]);
    setIssueNote('');
    setIssueModalVisible(true);
  };

  const handleSubmitIssue = () => {
    if (!issueStop) return;
    const finalNote = issueNote.trim() || `Field exception reported at ${issueStop.houseNumber}, ${issueStop.address}`;
    createIssue({
      raisedByRole: 'collector',
      raisedByName: name,
      locality: issueStop.address.split(',')[1]?.trim() || 'Koramangala',
      ward: 'Ward 151',
      type: selectedIssueType,
      note: finalNote,
    });

    setIssueModalVisible(false);
    setIssueSuccessMsg(t('collector.issueReportedToast', { house: issueStop.houseNumber, defaultValue: `Issue logged for ${issueStop.houseNumber}. Forwarded to Municipal Operations Desk.` }));
    setTimeout(() => setIssueSuccessMsg(null), 4000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#01579B', '#0277BD']}
        style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}
      >
        <Text style={styles.greeting}>{getGreeting()}, {name.split(' ')[0]} 👋</Text>
        <Text style={styles.headerSub}>{t('collector.subTitle')}</Text>
        <View style={styles.vehicleRow}>
          <Ionicons name="bus-outline" size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.vehicleText}>{t('collector.vehicleInfo')}</Text>
        </View>
        <View style={styles.shiftRow}>
          <View style={[styles.shiftIndicator, { backgroundColor: onShift ? Colors.success : Colors.error }]} />
          <Text style={styles.shiftLabel}>{onShift ? t('collector.activeRoute') : t('collector.offShift')}</Text>
          <Switch
            value={onShift}
            onValueChange={setOnShift}
            trackColor={{ false: Colors.gray400, true: '#A5D6A7' }}
            thumbColor={onShift ? Colors.success : Colors.gray300}
            style={styles.shiftSwitch}
          />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <DemoDataBanner />

        {/* Glove-friendly Primary Action: Report Field Issue */}
        <TouchableOpacity
          style={styles.gloveIssueBtn}
          onPress={() => handleOpenIssueModal()}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={24} color="#D32F2F" />
          <View style={styles.gloveIssueInfo}>
            <Text style={styles.gloveIssueTitle}>{t('collector.reportFieldIssue')}</Text>
            <Text style={styles.gloveIssueSub}>{t('collector.reportFieldIssueSub')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
        </TouchableOpacity>

        {issueSuccessMsg && (
          <View style={styles.successToast}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.successToastText}>{issueSuccessMsg}</Text>
          </View>
        )}

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>{t('collector.routeProgress')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stops.length}</Text>
              <Text style={styles.statLabel}>{t('collector.totalStops')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>{completed}</Text>
              <Text style={styles.statLabel}>{t('collector.completedStops')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{remaining}</Text>
              <Text style={styles.statLabel}>{t('collector.remaining')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.collectorAccent }]}>180</Text>
              <Text style={styles.statLabel}>{t('collector.kgCollected')}</Text>
            </View>
          </View>
        </Card>

        {/* Current Stop */}
        {currentStop && (
          <Card style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Ionicons name="navigate" size={18} color={Colors.collectorAccent} />
              <Text style={styles.currentTitle}>{t('collector.nextUp')}</Text>
              <View style={[styles.currentBadge, { backgroundColor: Colors.infoLight }]}>
                <Text style={[styles.currentBadgeText, { color: Colors.collectorAccent }]}>{t('collector.currentStop')}</Text>
              </View>
            </View>
            <Text style={styles.currentAddress}>
              {currentStop.houseNumber} · {currentStop.address}
            </Text>
            <View style={styles.currentMeta}>
              <View style={[styles.wasteBadge, { backgroundColor: WASTE_TYPE_COLORS[currentStop.wasteType] + '20' }]}>
                <Text style={[styles.wasteBadgeText, { color: WASTE_TYPE_COLORS[currentStop.wasteType] }]}>
                  {t(`materials.${currentStop.wasteType}_waste`, { defaultValue: currentStop.wasteType })} {t('collector.waste')}
                </Text>
              </View>
              <Text style={styles.timeSlotText}>🕐 {currentStop.timeSlot}</Text>
            </View>

            <View style={styles.currentActionRow}>
              <TouchableOpacity
                style={styles.completeStopBtn}
                onPress={() => markStopCompleted(currentStop.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                <Text style={styles.completeStopBtnText}>{t('collector.markDone')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.flagStopBtn}
                onPress={() => handleOpenIssueModal(currentStop)}
                activeOpacity={0.8}
              >
                <Ionicons name="flag-outline" size={18} color="#D32F2F" />
                <Text style={styles.flagStopBtnText}>{t('collector.flagIssue')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* All Stops */}
        <Text style={styles.sectionTitle}>{t('collector.fullDailyRoute', { count: stops.length, defaultValue: `Full Daily Route (${stops.length} households)` })}</Text>
        {stops.map((stop, index) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopRow,
              stop.status === 'current' && styles.stopRowCurrent,
            ]}
            onPress={() => stop.status !== 'completed' && markStopCompleted(stop.id)}
            activeOpacity={0.7}
          >
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopAddress}>
                <Text style={styles.stopHouseNum}>{stop.houseNumber}</Text>
                {' · '}{stop.address}
              </Text>
              <View style={styles.stopMeta}>
                <View style={[styles.wasteBadge, { backgroundColor: WASTE_TYPE_COLORS[stop.wasteType] + '20' }]}>
                  <Text style={[styles.wasteBadgeText, { color: WASTE_TYPE_COLORS[stop.wasteType] }]}>
                    {t(`materials.${stop.wasteType}_waste`, { defaultValue: stop.wasteType })}
                  </Text>
                </View>
                <Text style={styles.stopTime}>{stop.timeSlot}</Text>
              </View>
            </View>
            <StatusBadge status={stop.status} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Field Issue Reporting Modal (Glove-Friendly) */}
      <Modal
        visible={issueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="warning" size={22} color="#D32F2F" />
                <Text style={styles.modalTitle}>{t('collector.reportIssueModalTitle')}</Text>
              </View>
              <TouchableOpacity onPress={() => setIssueModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {t('collector.loggingFor')} <Text style={styles.boldText}>{issueStop?.houseNumber} · {issueStop?.address}</Text>
            </Text>

            <Text style={styles.issueSectionLabel}>{t('collector.selectIssueType')}</Text>
            <View style={styles.issueOptionsGrid}>
              {[
                { type: 'contamination', label: t('collector.segregationIssue', 'Contaminated Waste'), icon: 'trash-bin-outline' },
                { type: 'missed_pickup', label: t('complaint.categories.missed_pickup', 'Gate Locked / No Answer'), icon: 'lock-closed-outline' },
                { type: 'other', label: t('common.details', 'Road Blocked / Access'), icon: 'construct-outline' },
                { type: 'hazardous', label: t('materials.hazardous', 'Hazardous Spill'), icon: 'warning-outline' },
              ].map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.gloveOptionBtn,
                    selectedIssueType === opt.type && styles.gloveOptionBtnActive,
                  ]}
                  onPress={() => setSelectedIssueType(opt.type as IssueType)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={selectedIssueType === opt.type ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.gloveOptionText,
                      selectedIssueType === opt.type && styles.gloveOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.issueSectionLabel}>{t('collector.additionalNotes')}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={t('collector.notesPlaceholder')}
              placeholderTextColor={Colors.textTertiary}
              value={issueNote}
              onChangeText={setIssueNote}
              multiline
            />

            <TouchableOpacity
              style={styles.submitIssueBtn}
              onPress={handleSubmitIssue}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitIssueBtnText}>{t('collector.submitIssue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {},
  header: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[6],
  },
  greeting: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing[1],
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing[2],
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[3],
  },
  vehicleText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  shiftIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shiftLabel: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
    flex: 1,
  },
  shiftSwitch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  demoOnly: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  body: { padding: Spacing[4], gap: Spacing[3] },
  gloveIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 56,
    gap: Spacing[3],
    ...Shadow.sm,
  },
  gloveIssueInfo: { flex: 1 },
  gloveIssueTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#D32F2F',
  },
  gloveIssueSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
    borderWidth: 1,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  successToastText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    flex: 1,
  },
  statsCard: { padding: Spacing[4] },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.divider,
  },
  currentCard: {
    padding: Spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: Colors.collectorAccent,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  currentTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  currentAddress: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[2],
  },
  currentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  currentActionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  completeStopBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    minHeight: 56,
    paddingHorizontal: Spacing[3],
  },
  completeStopBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  flagStopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minHeight: 56,
    paddingHorizontal: Spacing[2],
  },
  flagStopBtnText: {
    color: '#D32F2F',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  wasteBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  wasteBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  timeSlotText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: Spacing[3],
    ...Shadow.sm,
    marginBottom: Spacing[2],
    minHeight: 56,
  },
  stopRowCurrent: {
    borderWidth: 2,
    borderColor: Colors.collectorAccent,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  stopInfo: { flex: 1 },
  stopAddress: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  stopHouseNum: { fontWeight: FontWeight.bold },
  stopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  stopTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  statusPill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[5],
    gap: Spacing[3],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalCloseBtn: { padding: Spacing[1] },
  modalSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  boldText: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  issueSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing[1],
  },
  issueOptionsGrid: {
    gap: Spacing[2],
  },
  gloveOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gloveOptionBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
  },
  gloveOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  gloveOptionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  notesInput: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    minHeight: 70,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  submitIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#D32F2F',
    borderRadius: BorderRadius.md,
    minHeight: 56,
    marginTop: Spacing[2],
  },
  submitIssueBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
