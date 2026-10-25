// Household Collection Calendar Screen
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { useUserLocation } from '../../src/lib/location/useUserLocation';
import { DEMO_COLLECTION_SCHEDULES } from '../../src/lib/demo/demoData';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', variant: 'info' as const, icon: '📅' },
  completed: { label: 'Completed', variant: 'success' as const, icon: '✅' },
  missed: { label: 'Missed', variant: 'error' as const, icon: '❌' },
  delayed: { label: 'Delayed', variant: 'warning' as const, icon: '⏰' },
  cancelled: { label: 'Cancelled', variant: 'neutral' as const, icon: '🚫' },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; guide: string }> = {
  wet: { label: 'Wet Organic Waste', color: '#4CAF50', bg: '#E8F5E9', icon: '🌿', guide: 'Food scraps, vegetable peels, leftover food — composted or bio-gasified.' },
  dry: { label: 'Dry Recyclables', color: '#1976D2', bg: '#E3F2FD', icon: '📦', guide: 'Paper, cardboard, plastic bottles, metal cans — segregated and recycled.' },
  recyclable: { label: 'Recyclables', color: '#388E3C', bg: '#F1F8E9', icon: '♻️', guide: 'Clean, dry recyclable materials like newspapers, glass bottles, metal scrap.' },
  hazardous: { label: 'Domestic Hazardous', color: '#D32F2F', bg: '#FFEBEE', icon: '⚠️', guide: 'Batteries, medicines, paint, e-waste — take to authorised collection points. Never mix.' },
  sanitary: { label: 'Sanitary Waste', color: '#D84315', bg: '#FBE9E7', icon: '🛡️', guide: 'Diapers and sanitary napkins wrapped securely in paper with red mark.' },
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function addDays(d: Date, n: number) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }
function formatDateKey(d: Date) { return d.toISOString().split('T')[0]; }
function formatDisplay(d: string, locale = 'en-IN') {
  return new Date(d).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'pa' ? 'pa-IN' : i18n.language === 'ja' ? 'ja-JP' : 'en-IN';
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    locality,
    displayLocation,
    municipalName,
    cityConfig,
    isDemoUser,
  } = useUserLocation();

  const today = new Date();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i - 2)), []);

  // Compute schedules for each day based on the active city configuration
  const scheduleByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    const citySchedules = cityConfig.collectionSchedule || [];

    days.forEach(day => {
      const key = formatDateKey(day);
      const dayName = WEEKDAY_NAMES[day.getDay()];
      const match = citySchedules.find(s => s.day.toLowerCase() === dayName.toLowerCase());

      if (match) {
        map[key] = [{
          id: `city-sched-${key}`,
          date: key,
          category: match.category,
          timeSlot: match.timeSlot,
          notes: match.notes,
          status: day < today && day.toDateString() !== today.toDateString() ? 'completed' : 'scheduled',
        }];
      } else if (isDemoUser && DEMO_COLLECTION_SCHEDULES) {
        // Fallback for seeded Bengaluru demo persona
        const demoMatches = DEMO_COLLECTION_SCHEDULES.filter(s => s.date === key);
        if (demoMatches.length > 0) map[key] = demoMatches;
      }
    });

    return map;
  }, [days, cityConfig, isDemoUser]);

  const selectedSchedules = selectedDate ? (scheduleByDate[selectedDate] ?? []) : [];
  const allSchedules = useMemo(() => {
    const list: any[] = [];
    Object.values(scheduleByDate).forEach(arr => list.push(...arr));
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [scheduleByDate]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collection Calendar</Text>
        <Text style={styles.subtitle}>
          {displayLocation || cityConfig.cityName} · {municipalName}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        {/* Locality Note */}
        <Card variant="filled" style={styles.localityCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing[1] }}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.localityTitle}>Active Jurisdiction Rules</Text>
          </View>
          <Text style={styles.localityBody}>
            Operating under {cityConfig.name} ({municipalName}) solid waste rules.{'\n'}
            Doorstep vehicle rounds and segregation streams reflect verified local bylaws.
          </Text>
        </Card>

        {/* Week strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
          {days.map(day => {
            const key = formatDateKey(day);
            const hasSchedule = !!scheduleByDate[key];
            const isToday = key === formatDateKey(today);
            const isSelected = key === selectedDate;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.dayChip,
                  isToday && styles.todayChip,
                  isSelected && styles.selectedChip,
                  hasSchedule && !isSelected && styles.hasScheduleChip,
                ]}
                onPress={() => setSelectedDate(isSelected ? null : key)}
              >
                <Text style={[styles.dayName, isSelected && styles.selectedText]}>
                  {day.toLocaleDateString(locale, { weekday: 'short' })}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.selectedText, isToday && styles.todayText]}>
                  {day.getDate()}
                </Text>
                {hasSchedule && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected day detail */}
        {selectedDate && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>
              {formatDisplay(selectedDate, locale)}
            </Text>
            {selectedSchedules.length === 0 ? (
              <Text style={styles.noCollection}>{t('calendar.noCollection', 'No municipal collection scheduled for this day')}</Text>
            ) : (
              selectedSchedules.map(s => {
                const cat = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.wet;
                const st = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled;
                return (
                  <Card key={s.id} style={[styles.scheduleCard, { borderLeftColor: cat.color, borderLeftWidth: 4 }]}>
                    <View style={styles.schedRow}>
                      <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                        <Text style={styles.catIconText}>{cat.icon}</Text>
                      </View>
                      <View style={styles.schedInfo}>
                        <Text style={styles.catLabel}>{t('calendar.' + s.category, cat.label)}</Text>
                        <Text style={styles.timeSlot}>{s.timeSlot} {s.notes ? `· ${s.notes}` : ''}</Text>
                      </View>
                      <Badge label={t('status.' + s.status, st.label)} variant={st.variant} size="sm" />
                    </View>
                    <Text style={styles.guideText}>{cat.guide}</Text>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* Upcoming list */}
        <Text style={styles.sectionTitle}>Upcoming Collections ({cityConfig.name.split(' ')[0]})</Text>
        {allSchedules.filter(s => s.date >= formatDateKey(today) && s.status === 'scheduled').slice(0, 5).map(s => {
          const cat = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.wet;
          return (
            <Card key={s.id} style={[styles.upcomingCard, { borderLeftColor: cat.color, borderLeftWidth: 3 }]}>
              <View style={styles.upcomingRow}>
                <Text style={styles.upcomingDate}>{formatDisplay(s.date)}</Text>
                <Badge label={cat.label} variant="neutral" size="sm" />
              </View>
              <Text style={styles.upcomingTime}>{cat.icon} {s.timeSlot} {s.notes ? `· ${s.notes}` : ''}</Text>
            </Card>
          );
        })}

        {/* Segregation guide */}
        <Text style={styles.sectionTitle}>Jurisdiction Streams ({cityConfig.name})</Text>
        {(Array.isArray(cityConfig.bins) ? cityConfig.bins : Object.values(cityConfig.bins)).map((b: any) => (
          <Card key={b.key} style={[styles.guideCard, { borderColor: (b.colorHex || b.color || '#2E7D32') + '40' }]}>
            <View style={styles.guideRow}>
              <View style={[styles.guideDot, { backgroundColor: (b.colorHex || b.color || '#2E7D32') + '20' }]}>
                <Ionicons name="trash-bin" size={22} color={b.colorHex || b.color || '#2E7D32'} />
              </View>
              <View style={styles.guideContent}>
                <Text style={[styles.guideTitle, { color: b.colorHex || b.color || '#2E7D32' }]}>
                  {b.label} ({b.colorName || (b.key === 'wet' ? 'Green' : b.key === 'dry' ? 'Blue' : 'Red')})
                </Text>
                <Text style={styles.guideDesc}>
                  Accepted: {(b.acceptedItems || b.accepts || []).join(', ')}
                </Text>
                {b.rules && b.rules.length > 0 && (
                  <Text style={[styles.guideDesc, { fontStyle: 'italic', marginTop: 2 }]}>
                    Rules: {b.rules.join('; ')}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing[5], paddingBottom: Spacing[3], backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  localityCard: { backgroundColor: '#F1F8E9', borderColor: '#C8E6C9', borderWidth: 1 },
  localityTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  localityBody: { fontSize: FontSize.xs, color: '#386043', lineHeight: 18 },
  weekStrip: { marginHorizontal: -Spacing[1] },
  dayChip: {
    width: 56, paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md, alignItems: 'center',
    backgroundColor: Colors.surface, marginHorizontal: Spacing[1],
    borderWidth: 1, borderColor: Colors.border,
  },
  todayChip: { borderColor: Colors.primary },
  selectedChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  hasScheduleChip: { borderColor: Colors.emerald },
  dayName: { fontSize: FontSize.xs, color: Colors.textSecondary },
  dayNum: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  todayText: { color: Colors.primary },
  selectedText: { color: Colors.textInverse },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.emerald, marginTop: 2 },
  selectedDot: { backgroundColor: Colors.textInverse },
  dayDetail: { gap: Spacing[2] },
  dayDetailTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  noCollection: { color: Colors.textSecondary, fontSize: FontSize.sm },
  scheduleCard: { gap: Spacing[2] },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  catIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  catIconText: { fontSize: 24 },
  schedInfo: { flex: 1 },
  catLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  timeSlot: { fontSize: FontSize.sm, color: Colors.textSecondary },
  guideText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing[2] },
  upcomingCard: {},
  upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1] },
  upcomingDate: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  upcomingTime: { fontSize: FontSize.sm, color: Colors.textSecondary },
  guideCard: { borderWidth: 1 },
  guideRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  guideDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guideContent: { flex: 1 },
  guideTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: Spacing[1] },
  guideDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
});
