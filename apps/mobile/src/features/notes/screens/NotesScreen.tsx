import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useNotes } from '../hooks/useNoteQueries';
import { useCreateNote, useDeleteNote, useUpdateNote } from '../hooks/useNoteMutations';
import type { Note } from '../types';
import { getErrorMessage } from '../../../lib/errors';

function NoteRow({
  note,
  onUpdate,
  onDelete,
  isSaving,
}: {
  note: Note;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

  if (isEditing) {
    return (
      <View style={styles.card} testID={`note-${note.id}`}>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={draft}
          onChangeText={setDraft}
          multiline
          autoFocus
          testID={`note-edit-input-${note.id}`}
        />
        <View style={styles.rowActions}>
          <Pressable
            onPress={() => {
              onUpdate(draft);
              setIsEditing(false);
            }}
            testID={`note-save-${note.id}`}
          >
            <Text style={styles.link}>Save</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setDraft(note.content);
              setIsEditing(false);
            }}
          >
            <Text style={styles.linkMuted}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card} testID={`note-${note.id}`}>
      <Text style={styles.content}>{note.content}</Text>
      <View style={styles.rowActions}>
        <Pressable onPress={() => setIsEditing(true)} testID={`note-edit-${note.id}`}>
          <Text style={styles.link}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert('Delete note', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ])
          }
          disabled={isSaving}
          testID={`note-delete-${note.id}`}
        >
          <Text style={styles.linkDanger}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function NotesScreen() {
  const { id: applicationId } = useLocalSearchParams<{ id: string }>();
  const { data: notes, isLoading, isError, error } = useNotes(applicationId);
  const createNote = useCreateNote(applicationId);
  const updateNote = useUpdateNote(applicationId);
  const deleteNote = useDeleteNote(applicationId);

  const [draft, setDraft] = useState('');

  const onAdd = () => {
    const content = draft.trim();
    if (!content) return;
    createNote.mutate(content, {
      onSuccess: () => setDraft(''),
      onError: (err) => Alert.alert('Could not add note', getErrorMessage(err)),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="notes-loading" />
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={notes ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No notes yet.</Text>}
        renderItem={({ item }) => (
          <NoteRow
            note={item}
            isSaving={updateNote.isPending || deleteNote.isPending}
            onUpdate={(content) =>
              updateNote.mutate(
                { id: item.id, content },
                { onError: (err) => Alert.alert('Could not save', getErrorMessage(err)) },
              )
            }
            onDelete={() =>
              deleteNote.mutate(item.id, {
                onError: (err) => Alert.alert('Could not delete', getErrorMessage(err)),
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.addInput]}
          placeholder="Add a note"
          value={draft}
          onChangeText={setDraft}
          multiline
          testID="new-note-input"
        />
        <Pressable
          style={[styles.addButton, createNote.isPending && styles.addButtonDisabled]}
          onPress={onAdd}
          disabled={createNote.isPending}
          testID="add-note-button"
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  list: { padding: 16 },
  separator: { height: 10 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 8,
  },
  content: { fontSize: 14, color: '#111827', lineHeight: 20 },
  rowActions: { flexDirection: 'row', gap: 16 },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  linkMuted: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  linkDanger: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'flex-end',
  },
  addInput: { flex: 1, minHeight: 44, maxHeight: 100 },
  addButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
