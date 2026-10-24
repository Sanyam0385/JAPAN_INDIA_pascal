// Household Collection Calendar Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT } from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { DEMO_COLLECTION_SCHEDULES } from '../../src/lib/demo/demoData';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', variant: 'info' as const, icon: '📅' },
  completed: { label: 'Completed', variant: 'success' as const, icon: '✅' },
  missed: { label: 'Missed', variant: 'error' as const, icon: '❌' },
  delayed: { label: 'Delayed', variant: 'warning' as const, icon: '⏰' },
  cancelled: { label: 'Cancelled', variant: 'neutral' as const, icon: '🚫' },
};

const CATEGORY_CONFIG = {
  wet: { label: 'Wet Waste', color: '#4CAF50', bg: '#E8F5E9', icon: '🌿', guide: 'Food scraps, vegetable peels, leftover food — composted or bio-gasified.' },
  dry: { label: 'Dry Waste', color: '#1976D2', bg: '#E3F2FD', icon: '📦', guide: 'Paper, cardboard, plastic bottles, metal cans — segregated and recycled.' },
  recyclable: { label: 'Recyclables', color: '#388E3C', bg: '#F1F8E9', icon: '♻️', guide: 'Clean, dry recyclable materials like newspapers, glass bottles, metal scrap.' },
  hazardous: { label: 'Hazardous', color: '#D32F2F', bg: '#FFEBEE', icon: '⚠️', guide: 'Batteries, medicines, paint, e-waste — take to authorised collection points. Never mix.' },
};

function addDays(d: Date, n: number) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }
function formatDateKey(d: Date) { return d.toISOString().split('T')[0]; }
function formatDisplay(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 3));

  const scheduleByDate = DEMO_COLLECTION_SCHEDULES.reduce<Record<string, typeof DEMO_COLLECTION_SCHEDULES>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const selectedSchedules = selectedDate ? (scheduleByDate[selectedDate] ?? []) : [];
  const allSchedules = [...DEMO_COLLECTION_SCHEDULES].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collection Calendar</Text>
        <Text style={styles.subtitle}>Koramangala Zone 3A · BBMP</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner />

        {/* Locality Note */}
        <Card variant="filled" style={styles.localityCard}>
          <Text style={styles.localityTitle}>📍 Your Locality Rules</Text>
          <Text style={styles.localityBody}>
            Collection times and bin colours are configured per local authority.{'\n'}
            BBMP Zone 3A: Green bin (wet), Blue bin (dry).{'\n'}
            ⚠️ Bin colours vary by municipality — check your BBMP ward office for official guidelines.
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
                  {day.toLocaleDateString('en', { weekday: 'short' })}
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
              {formatDisplay(selectedDate)}
            </Text>
            {selectedSchedules.length === 0 ? (
              <Text style={styles.noCollection}>No collection scheduled this day</Text>
            ) : (
              selectedSchedules.map(s => {
                const cat = CATEGORY_CONFIG[s.category];
                const st = STATUS_CONFIG[s.status];
                return (
                  <Card key={s.id} style={[styles.scheduleCard, { borderLeftColor: cat.color, borderLeftWidth: 4 }]}>
                    <View style={styles.schedRow}>
                      <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                        <Text style={styles.catIconText}>{cat.icon}</Text>
                      </View>
                      <View style={styles.schedInfo}>
                        <Text style={styles.catLabel}>{cat.label}</Text>
                        <Text style={styles.timeSlot}>{s.timeSlot}</Text>
                      </View>
                      <Badge label={st.label} variant={st.variant} size="sm" />
                    </View>
                    <Text style={styles.guideText}>{cat.guide}</Text>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* Upcoming list */}
        <Text style={styles.sectionTitle}>Upcoming Collections</Text>
        {allSchedules.filter(s => s.date >= formatDateKey(today) && s.status === 'scheduled').map(s => {
          const cat = CATEGORY_CONFIG[s.category];
          const st = STATUS_CONFIG[s.status];
          return (
            <Card key={s.id} style={[styles.upcomingCard, { borderLeftColor: cat.color, borderLeftWidth: 3 }]}>
              <View style={styles.upcomingRow}>
                <Text style={styles.upcomingDate}>{formatDisplay(s.date)}</Text>
                <Badge label={cat.label} variant="neutral" size="sm" />
              </View>
              <Text style={styles.upcomingTime}>{cat.icon} {s.timeSlot}</Text>
            </Card>
          );
        })}

        {/* Past */}
        <Text style={styles.sectionTitle}>Recent History</Text>
        {allSchedules.filter(s => s.date < formatDateKey(today)).reverse().slice(0, 4).map(s => {
          const cat = CATEGORY_CONFIG[s.category];
          const st = STATUS_CONFIG[s.status];
          return (
            <Card key={s.id} style={styles.histCard}>
              <View style={styles.histRow}>
                <Text style={styles.histDate}>{formatDisplay(s.date)}</Text>
                <Text style={styles.histCat}>{cat.icon} {cat.label}</Text>
                <Badge label={st.label} variant={st.variant} size="sm" />
              </View>
            </Card>
          );
        })}

        {/* Segregation guide */}
        <Text style={styles.sectionTitle}>Waste Categories Guide</Text>
        {Object.values(CATEGORY_CONFIG).map(c => (
          <Card key={c.label} style={[styles.guideCard, { borderColor: c.color + '40' }]}>
            <View style={styles.guideRow}>
              <View style={[styles.guideDot, { backgroundColor: c.bg }]}>
                <Text>{c.icon}</Text>
              </View>
              <View style={styles.guideContent}>
                <Text style={[styles.guideTitle, { color: c.color }]}>{c.label}</Text>
                <Text style={styles.guideDesc}>{c.guide}</Text>
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
  localityCard: {},
  localityTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing[1] },
  localityBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
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
  histCard: { paddingVertical: Spacing[3] },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  histDate: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  histCat: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  guideCard: { borderWidth: 1 },
  guideRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  guideDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guideContent: { flex: 1 },
  guideTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: Spacing[1] },
  guideDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
});
