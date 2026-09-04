import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: number;
  loading: boolean;
  color: string;
}

export function StatCard({ label, value, loading, color }: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: color }]} testID={`stat-card-${label}`}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={[styles.value, { color }]}>{value}</Text>
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 4,
  },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, color: '#6b7280' },
});
