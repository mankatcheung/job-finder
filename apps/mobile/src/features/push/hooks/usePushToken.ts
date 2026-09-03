import { useMutation } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  REGISTER_EXPO_PUSH_TOKEN_MUTATION,
  UNREGISTER_EXPO_PUSH_TOKEN_MUTATION,
} from '../graphql/operations';
import { registerForPushNotifications } from '../lib/registerForPushNotifications';

/** Requests permission, obtains an Expo push token, and registers it with the backend — all in one mutation so the screen has a single pending/error state. */
export function useEnablePushNotifications() {
  return useMutation({
    mutationFn: async () => {
      const token = await registerForPushNotifications();
      await gqlRequest<{ registerExpoPushToken: boolean }>(REGISTER_EXPO_PUSH_TOKEN_MUTATION, {
        token,
      });
      return token;
    },
  });
}

export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: (token: string) =>
      gqlRequest<{ unregisterPushSubscription: boolean }>(UNREGISTER_EXPO_PUSH_TOKEN_MUTATION, {
        token,
      }),
  });
}
