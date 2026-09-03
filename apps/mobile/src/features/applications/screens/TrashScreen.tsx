import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTrashedApplications } from '../hooks/useApplicationQueries';
import {
  usePermanentlyDeleteApplication,
  useRestoreApplication,
} from '../hooks/useApplicationMutations';
import type { Application } from '../types';
import { getErrorMessage } from '../../../lib/errors';

function TrashRow({ application }: { application: Application }) {
  const restore = useRestoreApplication();
  const permanentlyDelete = usePermanentlyDeleteApplication();

  const onPermanentlyDelete = () => {
    Alert.alert(
      'Delete permanently',
      `${application.role} at ${application.company} will be deleted forever. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () =>
            permanentlyDelete.mutate(application.id, {
              onError: (err) => Alert.alert('Could not delete', getErrorMessage(err)),
            }),
        },
      ],
    );
  };

  return (
    <View style={styles.row} testID={`trash-item-${application.id}`}>
      <View style={styles.textColumn}>
        <Text style={styles.role} numberOfLines={1}>
          {application.role}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {application.company}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.restoreButton}
          onPress={() =>
            restore.mutate(application.id, {
              onError: (err) => Alert.alert('Could not restore', getErrorMessage(err)),
            })
          }
          disabled={restore.isPending}
          testID={`restore-button-${application.id}`}
        >
          <Text style={styles.restoreButtonText}>Restore</Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={onPermanentlyDelete}
          disabled={permanentlyDelete.isPending}
          testID={`permanently-delete-button-${application.id}`}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function TrashScreen() {
  const { data, isLoading, isError, error } = useTrashedApplications();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="trash-loading" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{getErrorMessage(error)}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Trash is empty.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <TrashRow application={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: '#f9fafb' },
  separator: { height: 10 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  emptyText: { fontSize: 14, color: '#6b7280' },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  textColumn: { flex: 1, gap: 2 },
  role: { fontSize: 15, fontWeight: '600', color: '#111827' },
  company: { fontSize: 13, color: '#374151' },
  actions: { flexDirection: 'row', gap: 8 },
  restoreButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  restoreButtonText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  deleteButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: { fontSize: 13, fontWeight: '600', color: '#b91c1c' },
});
