import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AnalyticsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  testID?: string;
}

export function AnalyticsCard({ title, description, children, testID }: AnalyticsCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  description: { fontSize: 11, color: '#9ca3af', marginTop: -4 },
});
