// Utility to compute next doorstep municipal waste collection from CityConfig
import type { CityConfig, WasteCategory } from '../../types';

export interface NextCollectionResult {
  status: 'Today' | 'Tomorrow' | 'Scheduled';
  statusVariant: 'success' | 'warning' | 'info';
  date: Date;
  formattedDate: string;
  timeSlot: string;
  category: WasteCategory | 'wet' | 'dry' | 'hazardous' | 'sanitary';
  categoryLabel: string;
  categoryIcon: string;
  scheduleSummary: string;
  activeWeekdays: { day: string; short: string; category: string; isActive: boolean }[];
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  wet: { label: 'Wet Organic Waste', icon: '🌿' },
  dry: { label: 'Dry Recyclables', icon: '📦' },
  hazardous: { label: 'Hazardous & Sanitary', icon: '⚠️' },
  sanitary: { label: 'Sanitary Waste', icon: '🛡️' },
};

/**
 * Parses time string like "07:00 – 09:30 AM" or "07:00" to hour and minute.
 */
function parseEndTime(timeSlotStr: string): { hour: number; minute: number } {
  const parts = timeSlotStr.split(/[–\-]/);
  const endStr = (parts[1] || parts[0]).trim();
  const match = endStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) {
    return { hour: 11, minute: 0 }; // Default late morning
  }
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export function computeNextCollection(
  cityConfig: CityConfig,
  currentDate = new Date(),
  locale = 'en-IN'
): NextCollectionResult {
  const schedules = cityConfig.collectionSchedule || [];

  // Fallback if no specific schedules in city config
  if (schedules.length === 0) {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      status: 'Tomorrow',
      statusVariant: 'info',
      date: tomorrow,
      formattedDate: new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(tomorrow),
      timeSlot: 'Morning window',
      category: 'wet',
      categoryLabel: 'Wet & Dry Waste',
      categoryIcon: '♻️',
      scheduleSummary: cityConfig.schedule?.wet || 'Ask local municipal body for timings',
      activeWeekdays: SHORT_WEEKDAY_NAMES.map((s, i) => ({
        day: WEEKDAY_NAMES[i],
        short: s,
        category: 'all',
        isActive: true,
      })),
    };
  }

  const currentDayIdx = currentDate.getDay();
  const currentMinutesFromMidnight = currentDate.getHours() * 60 + currentDate.getMinutes();

  // 1. Check if today has a pending collection
  const todayName = WEEKDAY_NAMES[currentDayIdx];
  const todayEntry = schedules.find((s) => s.day.toLowerCase() === todayName.toLowerCase());

  let chosenEntry = null;
  let targetDate = new Date(currentDate);
  let status: 'Today' | 'Tomorrow' | 'Scheduled' = 'Scheduled';

  if (todayEntry) {
    const { hour, minute } = parseEndTime(todayEntry.timeSlot);
    const endMinutes = hour * 60 + minute;
    // If current time is before collection end window
    if (currentMinutesFromMidnight < endMinutes) {
      chosenEntry = todayEntry;
      status = 'Today';
    }
  }

  // 2. If not today, find the next earliest upcoming day
  if (!chosenEntry) {
    for (let offset = 1; offset <= 7; offset++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() + offset);
      const checkDayName = WEEKDAY_NAMES[checkDate.getDay()];
      const match = schedules.find((s) => s.day.toLowerCase() === checkDayName.toLowerCase());
      if (match) {
        chosenEntry = match;
        targetDate = checkDate;
        status = offset === 1 ? 'Tomorrow' : 'Scheduled';
        break;
      }
    }
  }

  // Fallback to todayEntry or first schedule
  if (!chosenEntry) {
    chosenEntry = todayEntry || schedules[0];
  }

  const category = (chosenEntry.category || 'wet') as WasteCategory;
  const meta = CATEGORY_META[category] || { label: 'General Waste', icon: '♻️' };

  let formattedDate = '';
  try {
    formattedDate = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(targetDate);
  } catch {
    formattedDate = targetDate.toDateString();
  }

  const activeWeekdays = WEEKDAY_NAMES.map((name, i) => {
    const entry = schedules.find((s) => s.day.toLowerCase() === name.toLowerCase());
    return {
      day: name,
      short: SHORT_WEEKDAY_NAMES[i],
      category: entry?.category || '',
      isActive: Boolean(entry),
    };
  });

  const statusVariant = status === 'Today' ? 'success' : status === 'Tomorrow' ? 'warning' : 'info';

  const scheduleSummary =
    cityConfig.schedule?.[category] ||
    `${chosenEntry.timeSlot} (${chosenEntry.notes || 'Municipal doorstep tipper'})`;

  return {
    status,
    statusVariant,
    date: targetDate,
    formattedDate,
    timeSlot: chosenEntry.timeSlot,
    category,
    categoryLabel: meta.label,
    categoryIcon: meta.icon,
    scheduleSummary,
    activeWeekdays,
  };
}
