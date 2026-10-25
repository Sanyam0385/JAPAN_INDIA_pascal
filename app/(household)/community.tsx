// Community & Volunteering Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

function formatDate(d: string, locale = 'en-IN') {
  return new Date(d).toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'pa' ? 'pa-IN' : i18n.language === 'ja' ? 'ja-JP' : 'en-IN';
  const { volunteerEvents, registerForEvent, unregisterFromEvent } = useAppStore();
  const [activeTab, setActiveTab] = useState<'events' | 'challenges' | 'campaigns'>('events');

  const handleRegister = (id: string, isRegistered: boolean) => {
    if (isRegistered) {
      Alert.alert('Cancel Registration?', 'You will be unregistered from this event.', [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Registration', style: 'destructive', onPress: () => unregisterFromEvent(id) },
      ]);
    } else {
      registerForEvent(id);
      Alert.alert('Registered! 🎉', 'You are now registered for this event.\n\n⚠️ Demo mode — no real notification will be sent.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌿 Community</Text>
        <Text style={styles.subtitle}>Volunteer, challenge, and connect</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['events', 'challenges', 'campaigns'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        {/* Events */}
        {activeTab === 'events' && (
          <>
            <Text style={styles.sectionTitle}>{t('community.upcomingDrives', 'Upcoming Cleanup Events')}</Text>
            {volunteerEvents.map(event => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventEmoji}>
                    {event.type === 'cleanup_drive' ? '🧹' : event.type === 'awareness_camp' ? '📢' : '🔄'}
                  </Text>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.date || event.eventDate || new Date().toISOString(), locale)}</Text>
                    <Text style={styles.eventTime}>⏰ {event.startTime} – {event.endTime}</Text>
                  </View>
                  {event.isRegistered && (
                    <Badge label={t('community.registered', 'Registered ✓')} variant="success" size="sm" />
                  )}
                </View>

                <Text style={styles.eventDesc}>{event.description}</Text>

                <View style={styles.eventMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{event.meetingPoint}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {event.registeredCount}/{event.maxParticipants} {t('community.participants', 'registered')}
                    </Text>
                  </View>
                </View>

                {/* Organiser */}
                <Text style={styles.organiser}>Organised by: {event.organiser}</Text>

                {/* Register button */}
                <TouchableOpacity
                  style={[
                    styles.registerBtn,
                    event.isRegistered && styles.unregisterBtn,
                    !!event.maxParticipants && event.registeredCount >= event.maxParticipants && !event.isRegistered && styles.fullBtn,
                  ]}
                  onPress={() => handleRegister(event.id, !!event.isRegistered)}
                  disabled={!!event.maxParticipants && event.registeredCount >= event.maxParticipants && !event.isRegistered}
                >
                  <Text style={[styles.registerBtnText, event.isRegistered && styles.unregisterBtnText]}>
                    {event.isRegistered
                      ? t('community.unregister', 'Cancel Registration')
                      : event.maxParticipants && event.registeredCount >= event.maxParticipants
                        ? '❌ Event Full'
                        : `✅ ${t('community.register', 'Register Now')}`}
                  </Text>
                </TouchableOpacity>

                {(event.rewardPoints || 0) > 0 && (
                  <Text style={styles.rewardNote}>⭐ Earn {event.rewardPoints} reward points for attending</Text>
                )}
              </Card>
            ))}
          </>
        )}

        {/* Challenges */}
        {activeTab === 'challenges' && (
          <>
            <Text style={styles.sectionTitle}>Neighbourhood Challenges</Text>

            {[
              { id: 'c1', title: '♻️ Zero Plastic Week', desc: 'Avoid single-use plastic for 7 days. Log your progress daily.', participants: 234, days: 7, joined: false, points: 150 },
              { id: 'c2', title: '🌿 Daily Compost', desc: 'Compost your wet waste for 30 days and earn the Composter badge.', participants: 89, days: 30, joined: true, points: 300 },
              { id: 'c3', title: '📱 E-Waste Drive', desc: 'Drop off at least one e-waste item at a certified collection point.', participants: 56, days: 14, joined: false, points: 100 },
            ].map(ch => (
              <Card key={ch.id} style={styles.challengeCard}>
                <Text style={styles.challengeTitle}>{ch.title}</Text>
                <Text style={styles.challengeDesc}>{ch.desc}</Text>
                <View style={styles.challengeMeta}>
                  <Text style={styles.metaText}>👥 {ch.participants} participants</Text>
                  <Text style={styles.metaText}>📅 {ch.days} days</Text>
                  <Text style={styles.metaText}>⭐ {ch.points} pts</Text>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, ch.joined && styles.joinedBtn]}
                  onPress={() => Alert.alert('Demo Mode', 'Challenge joining is a demo feature.\nNo real tracking occurs.')}
                >
                  <Text style={[styles.joinBtnText, ch.joined && styles.joinedBtnText]}>
                    {ch.joined ? '✓ Participating' : 'Join Challenge'}
                  </Text>
                </TouchableOpacity>
              </Card>
            ))}
          </>
        )}

        {/* Campaigns */}
        {activeTab === 'campaigns' && (
          <>
            <Text style={styles.sectionTitle}>Fundraising Campaigns</Text>
            <Card variant="filled" style={styles.donationNote}>
              <Text style={styles.donationNoteText}>
                ⚠️ All campaigns show simulated donation amounts for demo purposes.
                No real payment will be processed. Do not enter real card or bank details.
              </Text>
            </Card>

            {[
              { id: 'f1', emoji: '🚛', title: 'New Recycling Vehicle for Zone 3A', goal: 500000, raised: 342000, donors: 187 },
              { id: 'f2', emoji: '🏫', title: 'Segregation Education in Schools', goal: 100000, raised: 67500, donors: 94 },
              { id: 'f3', emoji: '♻️', title: 'Informal Picker Safety Equipment', goal: 75000, raised: 58200, donors: 211 },
            ].map(c => {
              const pct = Math.round((c.raised / c.goal) * 100);
              return (
                <Card key={c.id} style={styles.campaignCard}>
                  <Text style={styles.campaignEmoji}>{c.emoji}</Text>
                  <Text style={styles.campaignTitle}>{c.title}</Text>
                  <View style={styles.fundingBar}>
                    <View style={[styles.fundingFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.fundingRow}>
                    <Text style={styles.raisedText}>₹{(c.raised / 1000).toFixed(0)}K raised <Text style={styles.goalText}>of ₹{(c.goal / 1000).toFixed(0)}K</Text></Text>
                    <Text style={styles.pctText}>{pct}%</Text>
                  </View>
                  <Text style={styles.donorsText}>👥 {c.donors} supporters</Text>
                  <TouchableOpacity
                    style={styles.donateBtn}
                    onPress={() => Alert.alert('Community Drive 💡', 'Thank you for supporting community circularity!\nYour pledge has been simulated in the local impact fund.')}
                  >
                    <Text style={styles.donateBtnText}>💚 Support Sanitation Drive</Text>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </>
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
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Events
  eventCard: { gap: Spacing[2] },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  eventEmoji: { fontSize: 32 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  eventDate: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  eventTime: { fontSize: FontSize.xs, color: Colors.textSecondary },
  eventDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  eventMeta: { gap: Spacing[1] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  organiser: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic' },
  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3], alignItems: 'center',
  },
  unregisterBtn: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  fullBtn: { backgroundColor: Colors.gray200 },
  registerBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  unregisterBtnText: { color: Colors.textSecondary },
  rewardNote: { fontSize: FontSize.xs, color: Colors.primary, textAlign: 'center' },

  // Challenges
  challengeCard: { gap: Spacing[2] },
  challengeTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  challengeDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  challengeMeta: { flexDirection: 'row', gap: Spacing[4] },
  joinBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2.5], alignItems: 'center',
  },
  joinedBtn: { backgroundColor: Colors.mintPale, borderWidth: 1, borderColor: Colors.mint },
  joinBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold },
  joinedBtnText: { color: Colors.primary },

  // Campaigns
  donationNote: { borderWidth: 1, borderColor: Colors.warningLight },
  donationNoteText: { fontSize: FontSize.xs, color: Colors.warning, lineHeight: 18 },
  campaignCard: { gap: Spacing[2] },
  campaignEmoji: { fontSize: 36 },
  campaignTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fundingBar: {
    height: 8, backgroundColor: Colors.gray200, borderRadius: 4, overflow: 'hidden',
  },
  fundingFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  fundingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raisedText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  goalText: { color: Colors.textSecondary, fontWeight: FontWeight.regular },
  pctText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  donorsText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  donateBtn: {
    backgroundColor: Colors.mintPale, borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3], alignItems: 'center',
    borderWidth: 1, borderColor: Colors.mint,
  },
  donateBtnText: { color: Colors.primary, fontWeight: FontWeight.bold },
});
