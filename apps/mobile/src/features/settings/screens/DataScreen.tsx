import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useExportUserData, useImportUserData } from '../hooks/useAccountData';
import { getErrorMessage } from '../../../lib/errors';
import type { ImportSummary } from '../types';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

function summaryText(summary: ImportSummary): string {
  const parts = [
    `${summary.applicationsImported} application${summary.applicationsImported === 1 ? '' : 's'} imported`,
    `${summary.notesImported} note${summary.notesImported === 1 ? '' : 's'} imported`,
  ];
  if (summary.applicationsSkipped > 0) {
    parts.push(`${summary.applicationsSkipped} application(s) skipped`);
  }
  if (summary.documentsSkipped > 0) {
    parts.push(`${summary.documentsSkipped} document(s) skipped`);
  }
  return parts.join(', ');
}

export function DataScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const exportUserData = useExportUserData();
  const importUserData = useImportUserData();
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  const onExport = async () => {
    try {
      const json = await exportUserData.mutateAsync();
      await Share.share({ message: json, title: 'Trakwyn data export' });
    } catch {
      // Silent — export errors are non-critical, matching apps/web.
    }
  };

  const onImport = async () => {
    setImportError(null);
    setImportResult(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    try {
      const text = await new File(result.assets[0].uri).text();
      const summary = await importUserData.mutateAsync(text);
      setImportResult(summary);
    } catch (err) {
      setImportError(getErrorMessage(err));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Export your data</Text>
        <Text style={styles.description}>
          Download all your applications, notes, and documents as a JSON file.
        </Text>
        <Pressable
          style={styles.button}
          onPress={onExport}
          disabled={exportUserData.isPending}
          testID="export-data-button"
        >
          {exportUserData.isPending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Download export</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Import data</Text>
        <Text style={styles.description}>
          Restore applications and notes from a previously exported JSON file.
        </Text>
        {importError ? <Text style={styles.error}>{importError}</Text> : null}
        {importResult ? (
          <Text style={styles.success} testID="import-result">
            {summaryText(importResult)}
          </Text>
        ) : null}
        <Pressable
          style={styles.button}
          onPress={onImport}
          disabled={importUserData.isPending}
          testID="import-data-button"
        >
          {importUserData.isPending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Choose file to import</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 10,
    },
    title: { fontSize: 15, fontWeight: '700', color: colors.text },
    description: { fontSize: 13, color: colors.textSubtle },
    button: {
      alignSelf: 'flex-start',
      minHeight: 40,
      borderRadius: 8,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    buttonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
    error: {
      color: colors.danger,
      backgroundColor: colors.dangerSurface,
      borderRadius: 8,
      padding: 10,
      fontSize: 13,
    },
    success: { color: '#047857', fontSize: 13 },
  });
}
