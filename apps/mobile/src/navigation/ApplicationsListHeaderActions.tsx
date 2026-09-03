import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';

interface Props {
  navigation: NativeStackNavigationProp<AppStackParamList, 'ApplicationsList'>;
}

export function ApplicationsListHeaderActions({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.navigate('Trash')} testID="header-trash-button">
        <Text style={styles.action}>Trash</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate('Conversations')}
        testID="header-assistant-button"
      >
        <Text style={styles.action}>Assistant</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Settings')} testID="header-settings-button">
        <Text style={styles.action}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 14 },
  action: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
});
