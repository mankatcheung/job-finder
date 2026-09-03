// Hand-written to match apps/web's settings pages' GraphQL operations
// field-for-field — codegen is still deferred for apps/mobile (see
// JEF-261/262). Token-limit fields (monthlyTokenLimit, llmUsageSummary,
// setLlmApiKeyMonthlyLimit) are intentionally omitted: that feature is only
// a design at this point, not yet in the schema.

export const PROFILE_QUERY = `
  query Me {
    me {
      id
      email
      name
      timezone
      targetRole
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($name: String, $timezone: String, $targetRole: String) {
    updateProfile(name: $name, timezone: $timezone, targetRole: $targetRole)
  }
`;

export const SESSIONS_QUERY = `
  query Sessions {
    sessions {
      id
      userAgent
      ipAddress
      deviceLabel
      location
      lastUsedAt
      current
    }
  }
`;

export const REVOKE_SESSION_MUTATION = `
  mutation RevokeSession($id: ID!) {
    revokeSession(id: $id)
  }
`;

export const REVOKE_OTHER_SESSIONS_MUTATION = `
  mutation RevokeOtherSessions {
    revokeOtherSessions
  }
`;

export const UPDATE_PASSWORD_MUTATION = `
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const NOTIFICATION_PREFERENCES_QUERY = `
  query NotificationPreferences {
    notificationPreferences {
      digestFrequency
      followUpRemindersEnabled
      pushNotificationsEnabled
      weeklyApplicationGoal
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES_MUTATION = `
  mutation UpdateNotificationPreferences(
    $digestFrequency: DigestFrequency
    $followUpRemindersEnabled: Boolean
    $pushNotificationsEnabled: Boolean
    $weeklyApplicationGoal: Int
  ) {
    updateNotificationPreferences(
      digestFrequency: $digestFrequency
      followUpRemindersEnabled: $followUpRemindersEnabled
      pushNotificationsEnabled: $pushNotificationsEnabled
      weeklyApplicationGoal: $weeklyApplicationGoal
    )
  }
`;

export const LLM_API_KEYS_QUERY = `
  query LlmApiKeys {
    llmApiKeys {
      provider
      model
      baseUrl
    }
    me {
      defaultLlmProvider
    }
  }
`;

export const SAVE_LLM_API_KEY_MUTATION = `
  mutation SaveLlmApiKey($provider: String!, $apiKey: String!, $model: String, $baseUrl: String) {
    saveLlmApiKey(provider: $provider, apiKey: $apiKey, model: $model, baseUrl: $baseUrl)
  }
`;

export const DELETE_LLM_API_KEY_MUTATION = `
  mutation DeleteLlmApiKey($provider: String!) {
    deleteLlmApiKey(provider: $provider)
  }
`;

export const SET_DEFAULT_LLM_PROVIDER_MUTATION = `
  mutation SetDefaultLlmProvider($provider: String!) {
    setDefaultLlmProvider(provider: $provider)
  }
`;

export const TEST_LLM_API_KEY_MUTATION = `
  mutation TestLlmApiKey($provider: String!, $apiKey: String, $model: String, $baseUrl: String) {
    testLlmApiKey(provider: $provider, apiKey: $apiKey, model: $model, baseUrl: $baseUrl) {
      ok
      error
    }
  }
`;
