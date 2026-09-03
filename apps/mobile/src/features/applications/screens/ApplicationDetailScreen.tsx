import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApplication } from '../hooks/useApplicationQueries';
import { useDeleteApplication } from '../hooks/useApplicationMutations';
import { StatusBadge } from '../components/StatusBadge';
import { getErrorMessage } from '../../../lib/errors';

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function ApplicationDetailScreen() {
  const router = useRouter();
  const { id: applicationId } = useLocalSearchParams<{ id: string }>();
  const { data: application, isLoading, isError, error } = useApplication(applicationId);
  const deleteApplication = useDeleteApplication();

  const onDelete = () => {
    Alert.alert('Move to Trash', 'This application will be moved to Trash.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteApplication.mutate(applicationId, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert('Could not delete', getErrorMessage(err)),
          });
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="application-detail-loading" />
      </View>
    );
  }

  if (isError || !application) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ? getErrorMessage(error) : 'Application not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.role}>{application.role}</Text>
          <Text style={styles.company}>{application.company}</Text>
        </View>
        <StatusBadge status={application.status} />
      </View>

      <Field label="Location" value={application.location} />
      <Field label="Salary range" value={application.salaryRange} />
      <Field label="Source" value={application.source} />
      <Field label="Description" value={application.description} />

      {application.jobUrl ? (
        <Pressable onPress={() => void Linking.openURL(application.jobUrl!)}>
          <Text style={styles.link}>{application.jobUrl}</Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/applications/${applicationId}/notes`)}
          testID="notes-button"
        >
          <Text style={styles.editButtonText}>Notes</Text>
        </Pressable>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/applications/${applicationId}/documents`)}
          testID="documents-button"
        >
          <Text style={styles.editButtonText}>Documents</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/applications/${applicationId}/edit`)}
          testID="edit-application-button"
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={onDelete}
          disabled={deleteApplication.isPending}
          testID="delete-application-button"
        >
          <Text style={styles.deleteButtonText}>
            {deleteApplication.isPending ? 'Deleting...' : 'Move to Trash'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1, gap: 2 },
  role: { fontSize: 20, fontWeight: '700', color: '#111827' },
  company: { fontSize: 15, color: '#374151' },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  fieldValue: { fontSize: 15, color: '#111827' },
  link: { fontSize: 14, color: '#2563eb' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  editButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  editButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  deleteButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: { fontSize: 15, fontWeight: '600', color: '#b91c1c' },
});
