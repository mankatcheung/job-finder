import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { ApplicationsListScreen } from '../features/applications/screens/ApplicationsListScreen';
import { ApplicationDetailScreen } from '../features/applications/screens/ApplicationDetailScreen';
import { ApplicationFormScreen } from '../features/applications/screens/ApplicationFormScreen';
import { TrashScreen } from '../features/applications/screens/TrashScreen';
import { NotesScreen } from '../features/notes/screens/NotesScreen';
import { DocumentsScreen } from '../features/documents/screens/DocumentsScreen';
import { ApplicationsListHeaderActions } from './ApplicationsListHeaderActions';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ApplicationsList"
        component={ApplicationsListScreen}
        options={({ navigation }) => ({
          title: 'Applications',
          headerRight: () => <ApplicationsListHeaderActions navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ApplicationDetail"
        component={ApplicationDetailScreen}
        options={{ title: 'Application' }}
      />
      <Stack.Screen
        name="ApplicationForm"
        component={ApplicationFormScreen}
        options={({ route }) => ({
          title: route.params?.applicationId ? 'Edit application' : 'New application',
        })}
      />
      <Stack.Screen name="Trash" component={TrashScreen} options={{ title: 'Trash' }} />
      <Stack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notes' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents' }} />
    </Stack.Navigator>
  );
}
