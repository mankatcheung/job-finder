export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  ApplicationsList: undefined;
  ApplicationDetail: { applicationId: string };
  ApplicationForm: { applicationId?: string } | undefined;
  Trash: undefined;
  Notes: { applicationId: string };
  Documents: { applicationId: string };
  Conversations: undefined;
  Chat: { conversationId: string | null };
  Settings: undefined;
  Profile: undefined;
  Security: undefined;
  Notifications: undefined;
  AiSettings: undefined;
};
