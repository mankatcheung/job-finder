import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApplications } from '../../applications/hooks/useApplicationQueries';
import { useDashboardCalendarEvents, useWeeklyApplicationGoal } from '../hooks/useDashboardQueries';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../../applications/components/StatusBadge';
import { getErrorMessage } from '../../../lib/errors';
import type { CalendarEvent, CalendarEventKind } from '../types';

const EVENT_LABEL: Record<CalendarEventKind, string> = {
  interview: 'Interview',
  followUp: 'Follow-up',
  applied: 'Applied',
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function DashboardScreen() {
  const router = useRouter();
  const { data: applications, isLoading, isError, error } = useApplications();
  const { data: calendarEvents } = useDashboardCalendarEvents();
  const { data: goal } = useWeeklyApplicationGoal();

  const apps = applications ?? [];
  const now = new Date();
  const counts = {
    total: apps.length,
    applied: apps.filter((a) => a.status === 'applied').length,
    interviewing: apps.filter((a) => a.status === 'interviewing').length,
    offered: apps.filter((a) => a.status === 'offered').length,
    overdue: apps.filter((a) => a.followUpAt && new Date(a.followUpAt) <= now).length,
  };

  const upcomingEvents: CalendarEvent[] = (calendarEvents ?? [])
    .filter((e) => e.type !== 'applied' && new Date(e.date) >= now)
    .slice(0, 5);

  const recentApps = apps.slice(0, 8);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Pressable
          style={styles.newButton}
          onPress={() => router.push('/applications/new')}
          testID="dashboard-new-application-button"
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatCard label="Total" value={counts.total} loading={isLoading} color="#2563eb" />
        <StatCard label="Applied" value={counts.applied} loading={isLoading} color="#4f46e5" />
        <StatCard
          label="Interviewing"
          value={counts.interviewing}
          loading={isLoading}
          color="#b45309"
        />
        <StatCard label="Offered" value={counts.offered} loading={isLoading} color="#15803d" />
        <StatCard
          label="Follow-up due"
          value={counts.overdue}
          loading={isLoading}
          color="#c2410c"
        />
      </ScrollView>

      {goal && (
        <View style={styles.goalCard} testID="weekly-goal-card">
          <View style={styles.goalHeaderRow}>
            <View style={styles.goalHeaderText}>
              <Text style={styles.goalTitle}>Weekly goal</Text>
              <Text style={styles.goalProgress}>
                {goal.currentWeekCount} of {goal.weeklyApplicationGoal} applications this week
              </Text>
            </View>
            <Text style={styles.goalStreak}>{goal.streakWeeks}-week streak</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    (goal.currentWeekCount / Math.max(1, goal.weeklyApplicationGoal)) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Pressable onPress={() => router.push('/calendar')} testID="dashboard-view-calendar">
              <Text style={styles.link}>View calendar</Text>
            </Pressable>
          </View>
          {upcomingEvents.map((event) => (
            <Pressable
              key={event.id}
              style={styles.eventRow}
              onPress={() => router.push(`/applications/${event.applicationId}`)}
              testID={`upcoming-event-${event.id}`}
            >
              <Text style={styles.eventMeta}>
                {EVENT_LABEL[event.type]} · {formatEventDate(event.date)}
              </Text>
              <Text style={styles.eventCompany}>{event.company}</Text>
              <Text style={styles.eventRole}>{event.role}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent applications</Text>
        {isLoading ? (
          <ActivityIndicator style={styles.loading} size="large" color="#2563eb" />
        ) : isError ? (
          <Text style={styles.error}>{getErrorMessage(error)}</Text>
        ) : recentApps.length === 0 ? (
          <Pressable onPress={() => router.push('/applications/new')}>
            <Text style={styles.emptyText}>No applications yet. Add your first one.</Text>
          </Pressable>
        ) : (
          recentApps.map((app) => {
            const isOverdue = app.followUpAt && new Date(app.followUpAt) <= now;
            return (
              <Pressable
                key={app.id}
                style={styles.appRow}
                onPress={() => router.push(`/applications/${app.id}`)}
                testID={`recent-application-${app.id}`}
              >
                <View style={styles.appRowText}>
                  <Text style={styles.appCompany}>
                    {app.starred ? '★ ' : ''}
                    {isOverdue ? '⚠ ' : ''}
                    {app.company}
                  </Text>
                  <Text style={styles.appRole}>{app.role}</Text>
                </View>
                <StatusBadge status={app.status} />
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  newButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  statsRow: { gap: 10 },
  goalCard: {
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 16,
    gap: 12,
  },
  goalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  goalHeaderText: { flex: 1, gap: 2 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  goalProgress: { fontSize: 13, color: '#374151' },
  goalStreak: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dbeafe',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  section: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  eventRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 2,
  },
  eventMeta: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  eventCompany: { fontSize: 14, fontWeight: '600', color: '#111827' },
  eventRole: { fontSize: 12, color: '#6b7280' },
  loading: { marginTop: 16 },
  error: { color: '#b91c1c', fontSize: 13 },
  emptyText: { color: '#2563eb', fontSize: 13 },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  appRowText: { flex: 1, gap: 2, marginRight: 8 },
  appCompany: { fontSize: 14, fontWeight: '600', color: '#111827' },
  appRole: { fontSize: 12, color: '#6b7280' },
});
