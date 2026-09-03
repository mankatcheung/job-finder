import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading} testID="root-loading">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
});
