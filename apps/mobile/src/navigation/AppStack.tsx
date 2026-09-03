import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { ApplicationsListScreen } from '../features/applications/screens/ApplicationsListScreen';
import { ApplicationDetailScreen } from '../features/applications/screens/ApplicationDetailScreen';
import { ApplicationFormScreen } from '../features/applications/screens/ApplicationFormScreen';
import { TrashScreen } from '../features/applications/screens/TrashScreen';
import { NotesScreen } from '../features/notes/screens/NotesScreen';
import { DocumentsScreen } from '../features/documents/screens/DocumentsScreen';
import { ConversationsScreen } from '../features/chat/screens/ConversationsScreen';
import { ChatScreen } from '../features/chat/screens/ChatScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { ProfileScreen } from '../features/settings/screens/ProfileScreen';
import { SecurityScreen } from '../features/settings/screens/SecurityScreen';
import { NotificationsScreen } from '../features/settings/screens/NotificationsScreen';
import { AiSettingsScreen } from '../features/settings/screens/AiSettingsScreen';
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
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ title: 'Assistant' }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Assistant' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ title: 'Security' }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="AiSettings" component={AiSettingsScreen} options={{ title: 'AI' }} />
    </Stack.Navigator>
  );
}
