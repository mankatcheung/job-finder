export const REGISTER_EXPO_PUSH_TOKEN_MUTATION = `
  mutation RegisterExpoPushToken($token: String!) {
    registerExpoPushToken(token: $token)
  }
`;

// Reuses the existing web-push unregister mutation: it deletes a
// subscription by endpoint regardless of provider, and an Expo push token
// is stored as the endpoint (see the API's RegisterExpoPushTokenUseCase).
export const UNREGISTER_EXPO_PUSH_TOKEN_MUTATION = `
  mutation UnregisterExpoPushToken($token: String!) {
    unregisterPushSubscription(endpoint: $token)
  }
`;
