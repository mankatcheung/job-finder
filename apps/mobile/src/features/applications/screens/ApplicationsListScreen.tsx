import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../navigation/types';
import { useApplications } from '../hooks/useApplicationQueries';
import { ApplicationListItem } from '../components/ApplicationListItem';
import { statusLabel } from '../components/StatusBadge';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../types';
import { getErrorMessage } from '../../../lib/errors';

type Props = NativeStackScreenProps<AppStackParamList, 'ApplicationsList'>;

type StatusFilter = 'all' | ApplicationStatus;

function matchesSearch(application: Application, search: string): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    application.company.toLowerCase().includes(needle) ||
    application.role.toLowerCase().includes(needle)
  );
}

export function ApplicationsListScreen({ navigation }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useApplications(
    statusFilter === 'all' ? undefined : statusFilter,
  );

  const applications = useMemo(
    () => (data ?? []).filter((application) => matchesSearch(application, search)),
    [data, search],
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search company or role"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        testID="applications-search-input"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        testID="applications-status-filters"
      >
        <FilterChip
          label="All"
          active={statusFilter === 'all'}
          onPress={() => setStatusFilter('all')}
        />
        {APPLICATION_STATUSES.map((status) => (
          <FilterChip
            key={status}
            label={statusLabel(status)}
            active={statusFilter === status}
            onPress={() => setStatusFilter(status)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#2563eb" />
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{getErrorMessage(error)}</Text>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No applications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <ApplicationListItem
              application={item}
              onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('ApplicationForm', undefined)}
        testID="add-application-button"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      testID={`filter-chip-${label.toLowerCase()}`}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  search: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  list: { paddingHorizontal: 16, paddingBottom: 96 },
  separator: { height: 10 },
  loading: { marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: '#6b7280' },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: { color: '#ffffff', fontSize: 28, lineHeight: 30, fontWeight: '400' },
});
