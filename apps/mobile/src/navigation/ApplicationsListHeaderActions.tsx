import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { useAuth } from '../auth/AuthContext';

interface Props {
  navigation: NativeStackNavigationProp<AppStackParamList, 'ApplicationsList'>;
}

export function ApplicationsListHeaderActions({ navigation }: Props) {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.navigate('Trash')} testID="header-trash-button">
        <Text style={styles.action}>Trash</Text>
      </Pressable>
      <Pressable onPress={() => void logout()} testID="header-signout-button">
        <Text style={styles.action}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 16 },
  action: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
