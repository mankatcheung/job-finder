import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Application } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  application: Application;
  onPress: () => void;
}

export function ApplicationListItem({ application, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      testID={`application-item-${application.id}`}
    >
      <View style={styles.textColumn}>
        <Text style={styles.role} numberOfLines={1}>
          {application.role}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {application.company}
        </Text>
        {application.location ? (
          <Text style={styles.location} numberOfLines={1}>
            {application.location}
          </Text>
        ) : null}
      </View>
      <StatusBadge status={application.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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
  pressed: { backgroundColor: '#f3f4f6' },
  textColumn: { flex: 1, gap: 2 },
  role: { fontSize: 15, fontWeight: '600', color: '#111827' },
  company: { fontSize: 13, color: '#374151' },
  location: { fontSize: 12, color: '#6b7280' },
});
