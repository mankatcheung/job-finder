import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCalendarEvents } from '../hooks/useCalendarQueries';
import { buildGrid, dateFromDayKey, dayKey, goToPeriod } from '../lib/calendarGrid';
import { getErrorMessage } from '../../../lib/errors';
import type { CalendarEvent, CalendarEventKind, CalendarViewMode } from '../types';

const EVENT_LABEL: Record<CalendarEventKind, string> = {
  applied: 'Applied',
  followUp: 'Follow-up',
  interview: 'Interview',
};

const EVENT_DOT_COLOR: Record<CalendarEventKind, string> = {
  applied: '#3b82f6',
  followUp: '#f59e0b',
  interview: '#a855f7',
};

const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  // Jan 4, 2026 is a Sunday — used purely as a stable weekday-index anchor.
  new Date(2026, 0, 4 + i).toLocaleDateString(undefined, { weekday: 'short' }),
);

const VIEW_MODES: { mode: CalendarViewMode; label: string }[] = [
  { mode: 'month', label: 'Month' },
  { mode: 'week', label: 'Week' },
  { mode: 'day', label: 'Day' },
];

function periodLabel(viewMode: CalendarViewMode, anchor: Date, grid: Date[]): string {
  if (viewMode === 'month') {
    return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  if (viewMode === 'week') {
    const start = grid[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const end = grid[6].toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} – ${end}`;
  }
  return anchor.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CalendarScreen() {
  const router = useRouter();
  const { data: events, isLoading, isError, error, refetch } = useCalendarEvents();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [anchorDate, setAnchorDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events ?? []) {
      const key = dayKey(new Date(e.date));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => buildGrid(viewMode, anchorDate), [viewMode, anchorDate]);

  const today = dayKey(new Date());
  const anchorDayKey = dayKey(anchorDate);
  const dayInFocus = viewMode === 'day' ? anchorDayKey : selectedDay;
  const focusedEvents = dayInFocus ? (eventsByDay.get(dayInFocus) ?? []) : [];

  const changePeriod = (delta: number) => {
    setAnchorDate((prev) => goToPeriod(viewMode, prev, delta));
    setSelectedDay(null);
  };

  const changeViewMode = (mode: CalendarViewMode) => {
    if (mode === 'day' && selectedDay) setAnchorDate(dateFromDayKey(selectedDay));
    setViewMode(mode);
    setSelectedDay(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.viewModeRow}>
          {VIEW_MODES.map(({ mode, label }) => (
            <Pressable
              key={mode}
              style={[styles.viewModeChip, viewMode === mode && styles.viewModeChipActive]}
              onPress={() => changeViewMode(mode)}
              testID={`calendar-view-${mode}`}
            >
              <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.periodRow}>
          <Pressable onPress={() => changePeriod(-1)} testID="calendar-previous-period" hitSlop={8}>
            <Text style={styles.periodArrow}>‹</Text>
          </Pressable>
          <Text style={styles.periodLabel}>{periodLabel(viewMode, anchorDate, grid)}</Text>
          <Pressable onPress={() => changePeriod(1)} testID="calendar-next-period" hitSlop={8}>
            <Text style={styles.periodArrow}>›</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#2563eb" />
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{getErrorMessage(error)}</Text>
          <Pressable onPress={() => void refetch()}>
            <Text style={styles.link}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {viewMode !== 'day' && (
            <>
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.grid}>
                {grid.map((date) => {
                  const key = dayKey(date);
                  const inMonth = viewMode === 'week' || date.getMonth() === anchorDate.getMonth();
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const eventTypes = [...new Set(dayEvents.map((e) => e.type))];
                  const isToday = key === today;
                  const isSelected = key === selectedDay;
                  return (
                    <Pressable
                      key={key}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                      onPress={() => setSelectedDay(key === selectedDay ? null : key)}
                      testID={`calendar-day-${key}`}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          !inMonth && styles.dayNumberDim,
                          isToday && styles.dayNumberToday,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {eventTypes.length > 0 && (
                        <View style={styles.dotRow}>
                          {eventTypes.map((type) => (
                            <View
                              key={type}
                              style={[styles.dot, { backgroundColor: EVENT_DOT_COLOR[type] }]}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.eventsSection}>
            {!dayInFocus && <Text style={styles.hintText}>Select a day to see its events.</Text>}
            {dayInFocus && focusedEvents.length === 0 && (
              <Text style={styles.hintText}>No events on this day.</Text>
            )}
            {dayInFocus &&
              focusedEvents.map((event) => (
                <Pressable
                  key={event.id}
                  style={styles.eventRow}
                  onPress={() => router.push(`/applications/${event.applicationId}`)}
                  testID={`calendar-event-${event.id}`}
                >
                  <View style={[styles.dot, { backgroundColor: EVENT_DOT_COLOR[event.type] }]} />
                  <View style={styles.eventText}>
                    <Text style={styles.eventTitle}>
                      {EVENT_LABEL[event.type]}
                      {event.type === 'interview' && event.interviewRoundType
                        ? ` (${event.interviewRoundType})`
                        : ''}{' '}
                      — {event.company}
                    </Text>
                    <Text style={styles.eventRole}>{event.role}</Text>
                  </View>
                </Pressable>
              ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  toolbar: {
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  viewModeRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 3,
    alignSelf: 'flex-start',
  },
  viewModeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  viewModeChipActive: { backgroundColor: '#ffffff' },
  viewModeText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  viewModeTextActive: { color: '#111827' },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  periodArrow: { fontSize: 22, color: '#374151', paddingHorizontal: 8 },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 160,
    textAlign: 'center',
  },
  loading: { marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  error: { color: '#b91c1c', fontSize: 14, textAlign: 'center' },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  scrollContent: { padding: 12, paddingBottom: 40 },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    paddingVertical: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 8,
  },
  dayCellSelected: { backgroundColor: '#eff6ff' },
  dayNumber: { fontSize: 13, color: '#374151' },
  dayNumberDim: { color: '#d1d5db' },
  dayNumberToday: { fontWeight: '700', color: '#2563eb' },
  dotRow: { flexDirection: 'row', gap: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  eventsSection: { marginTop: 16, gap: 8 },
  hintText: { textAlign: 'center', color: '#9ca3af', fontSize: 13, paddingVertical: 16 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  eventText: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  eventRole: { fontSize: 12, color: '#6b7280' },
});
