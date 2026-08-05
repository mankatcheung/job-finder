/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type ActivityEventType =
  | 'document_deleted'
  | 'document_uploaded'
  | 'field_updated'
  | 'interview_added'
  | 'note_added'
  | 'note_deleted'
  | 'status_changed';

export type ActivityLog = {
  __typename?: 'ActivityLog';
  actorId?: Maybe<Scalars['String']['output']>;
  applicationId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  eventType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  payload?: Maybe<Scalars['String']['output']>;
};

export type ApiToken = {
  __typename?: 'ApiToken';
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastUsedAt?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
};

export type ApiTokenScope =
  | 'full'
  | 'read';

export type ApplicationConnection = {
  __typename?: 'ApplicationConnection';
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  items?: Maybe<Array<JobApplication>>;
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export type ApplicationHealthScore = {
  __typename?: 'ApplicationHealthScore';
  criteria?: Maybe<Array<HealthScoreCriterion>>;
  label?: Maybe<Scalars['String']['output']>;
  score?: Maybe<Scalars['Int']['output']>;
};

export type ApplicationStatus =
  | 'accepted'
  | 'applied'
  | 'draft'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

export type CalendarEvent = {
  __typename?: 'CalendarEvent';
  applicationId?: Maybe<Scalars['ID']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  interviewRoundType?: Maybe<InterviewRoundType>;
  role?: Maybe<Scalars['String']['output']>;
  type?: Maybe<CalendarEventType>;
};

export type CalendarEventType =
  | 'applied'
  | 'followUp'
  | 'interview';

export type ConfirmDocumentInput = {
  applicationId: Scalars['ID']['input'];
  documentType?: InputMaybe<Scalars['String']['input']>;
  mimeType: Scalars['String']['input'];
  name: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
  storageKey: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};

export type ConfirmTotpSetupResult = {
  __typename?: 'ConfirmTotpSetupResult';
  backupCodes?: Maybe<Array<Scalars['String']['output']>>;
};

export type Contact = {
  __typename?: 'Contact';
  applicationId?: Maybe<Scalars['ID']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  linkedinUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type Conversation = {
  __typename?: 'Conversation';
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  llmModel?: Maybe<Scalars['String']['output']>;
  llmProvider?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type CreateApiTokenPayload = {
  __typename?: 'CreateApiTokenPayload';
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  token?: Maybe<Scalars['String']['output']>;
};

export type CreateApplicationInput = {
  company: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  followUpAt?: InputMaybe<Scalars['String']['input']>;
  jobUrl?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
  salaryRange?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  starred?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateDocumentDraftInput = {
  applicationId: Scalars['ID']['input'];
  contentJson?: InputMaybe<Scalars['String']['input']>;
  plainText?: InputMaybe<Scalars['String']['input']>;
  sourceDocumentId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateEducationInput = {
  degree?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  field?: InputMaybe<Scalars['String']['input']>;
  institution: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type CreateInterviewRoundInput = {
  applicationId: Scalars['ID']['input'];
  completedAt?: InputMaybe<Scalars['String']['input']>;
  interviewerName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  outcome?: InputMaybe<InterviewRoundOutcome>;
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<InterviewRoundType>;
};

export type CreatePipelineStageInput = {
  category: PipelineStageCategory;
  color?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  name: Scalars['String']['input'];
  position: Scalars['Int']['input'];
};

export type CreateSkillInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  proficiency?: InputMaybe<Scalars['String']['input']>;
};

export type CreateWorkExperienceInput = {
  company: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type Document = {
  __typename?: 'Document';
  applicationId?: Maybe<Scalars['ID']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sizeBytes?: Maybe<Scalars['Int']['output']>;
  sourceDraftId?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type DocumentDraft = {
  __typename?: 'DocumentDraft';
  applicationId?: Maybe<Scalars['ID']['output']>;
  contentJson?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  plainText?: Maybe<Scalars['String']['output']>;
  sourceDocumentId?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type Education = {
  __typename?: 'Education';
  createdAt?: Maybe<Scalars['String']['output']>;
  degree?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  field?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  institution?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type ExtractDocumentTextPayload = {
  __typename?: 'ExtractDocumentTextPayload';
  text?: Maybe<Scalars['String']['output']>;
};

export type HealthScoreCriterion = {
  __typename?: 'HealthScoreCriterion';
  earned?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  met?: Maybe<Scalars['Boolean']['output']>;
  points?: Maybe<Scalars['Int']['output']>;
};

export type ImportSummary = {
  __typename?: 'ImportSummary';
  applicationsImported?: Maybe<Scalars['Int']['output']>;
  applicationsSkipped?: Maybe<Scalars['Int']['output']>;
  documentsSkipped?: Maybe<Scalars['Int']['output']>;
  notesImported?: Maybe<Scalars['Int']['output']>;
};

export type InterviewRound = {
  __typename?: 'InterviewRound';
  applicationId?: Maybe<Scalars['ID']['output']>;
  completedAt?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  interviewerName?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  outcome?: Maybe<InterviewRoundOutcome>;
  scheduledAt?: Maybe<Scalars['String']['output']>;
  type?: Maybe<InterviewRoundType>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type InterviewRoundOutcome =
  | 'cancelled'
  | 'failed'
  | 'passed'
  | 'pending';

export type InterviewRoundType =
  | 'hr'
  | 'onsite'
  | 'other'
  | 'phone'
  | 'technical';

export type JobApplication = {
  __typename?: 'JobApplication';
  appliedAt?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  followUpAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  jobUrl?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  salaryRange?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  starred?: Maybe<Scalars['Boolean']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type LinkedOAuthAccount = {
  __typename?: 'LinkedOAuthAccount';
  createdAt?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<OAuthProvider>;
};

export type LlmApiKey = {
  __typename?: 'LlmApiKey';
  baseUrl?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
};

export type LoginEvent = {
  __typename?: 'LoginEvent';
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type LoginResult = {
  __typename?: 'LoginResult';
  accessToken?: Maybe<Scalars['String']['output']>;
  success?: Maybe<Scalars['Boolean']['output']>;
  totpRequired?: Maybe<Scalars['Boolean']['output']>;
};

export type Message = {
  __typename?: 'Message';
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  beginTotpSetup?: Maybe<TotpSetup>;
  bulkAddTagToApplications?: Maybe<Array<JobApplication>>;
  bulkDeleteApplications?: Maybe<Scalars['Boolean']['output']>;
  bulkUpdateApplications?: Maybe<Array<JobApplication>>;
  computeResumeMatchScore?: Maybe<ResumeMatchScore>;
  confirmAvatar?: Maybe<Scalars['String']['output']>;
  confirmDocument?: Maybe<Document>;
  confirmEmailChange?: Maybe<Scalars['Boolean']['output']>;
  confirmTotpSetup?: Maybe<ConfirmTotpSetupResult>;
  createApiToken?: Maybe<CreateApiTokenPayload>;
  createApplication?: Maybe<JobApplication>;
  createContact?: Maybe<Contact>;
  createConversation?: Maybe<Conversation>;
  createDocumentDraft?: Maybe<DocumentDraft>;
  createEducation?: Maybe<Education>;
  createInterviewRound?: Maybe<InterviewRound>;
  createNote?: Maybe<Note>;
  createPipelineStage?: Maybe<PipelineStage>;
  createSkill?: Maybe<Skill>;
  createWorkExperience?: Maybe<WorkExperience>;
  deleteAccount?: Maybe<Scalars['Boolean']['output']>;
  deleteApiToken?: Maybe<Scalars['Boolean']['output']>;
  deleteApplication?: Maybe<Scalars['Boolean']['output']>;
  deleteContact?: Maybe<Scalars['Boolean']['output']>;
  deleteConversation?: Maybe<Scalars['Boolean']['output']>;
  deleteDocument?: Maybe<Scalars['Boolean']['output']>;
  deleteDocumentDraft?: Maybe<Scalars['Boolean']['output']>;
  deleteEducation?: Maybe<Scalars['Boolean']['output']>;
  deleteInterviewRound?: Maybe<Scalars['Boolean']['output']>;
  deleteLlmApiKey?: Maybe<Scalars['Boolean']['output']>;
  deleteNote?: Maybe<Scalars['Boolean']['output']>;
  deletePipelineStage?: Maybe<Scalars['Boolean']['output']>;
  deleteSkill?: Maybe<Scalars['Boolean']['output']>;
  deleteWorkExperience?: Maybe<Scalars['Boolean']['output']>;
  disableTotp?: Maybe<Scalars['Boolean']['output']>;
  exportDocumentDraftToPdf?: Maybe<Document>;
  extractDocumentText?: Maybe<ExtractDocumentTextPayload>;
  generateCoverLetter?: Maybe<Scalars['String']['output']>;
  importUserData?: Maybe<ImportSummary>;
  login?: Maybe<LoginResult>;
  loginWithTotp?: Maybe<Scalars['String']['output']>;
  logout?: Maybe<Scalars['Boolean']['output']>;
  markNotificationsRead?: Maybe<Scalars['Boolean']['output']>;
  parseJobDescription?: Maybe<ParsedJobDescription>;
  reauthenticate?: Maybe<LoginResult>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  register?: Maybe<Scalars['String']['output']>;
  registerPushSubscription?: Maybe<Scalars['Boolean']['output']>;
  removeAvatar?: Maybe<Scalars['Boolean']['output']>;
  requestAvatarUploadUrl?: Maybe<UploadUrlPayload>;
  requestEmailChange?: Maybe<Scalars['Boolean']['output']>;
  requestPasswordReset?: Maybe<Scalars['Boolean']['output']>;
  requestUploadUrl?: Maybe<UploadUrlPayload>;
  resetPassword?: Maybe<Scalars['Boolean']['output']>;
  revokeOtherSessions?: Maybe<Scalars['Boolean']['output']>;
  revokeSession?: Maybe<Scalars['Boolean']['output']>;
  saveLlmApiKey?: Maybe<Scalars['Boolean']['output']>;
  sendChatMessage?: Maybe<Scalars['String']['output']>;
  setDefaultLlmProvider?: Maybe<Scalars['Boolean']['output']>;
  unlinkOAuthAccount?: Maybe<Scalars['Boolean']['output']>;
  unregisterPushSubscription?: Maybe<Scalars['Boolean']['output']>;
  updateApplication?: Maybe<JobApplication>;
  updateContact?: Maybe<Contact>;
  updateDocumentDraftContent?: Maybe<DocumentDraft>;
  updateEducation?: Maybe<Education>;
  updateInterviewRound?: Maybe<InterviewRound>;
  updateNote?: Maybe<Note>;
  updateNotificationPreferences?: Maybe<Scalars['Boolean']['output']>;
  updatePassword?: Maybe<Scalars['Boolean']['output']>;
  updatePipelineStage?: Maybe<PipelineStage>;
  updateProfile?: Maybe<Scalars['Boolean']['output']>;
  updateSkill?: Maybe<Skill>;
  updateWorkExperience?: Maybe<WorkExperience>;
  verifyEmail?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationBeginTotpSetupArgs = {
  password: Scalars['String']['input'];
};


export type MutationBulkAddTagToApplicationsArgs = {
  ids: Array<Scalars['ID']['input']>;
  tag: Scalars['String']['input'];
};


export type MutationBulkDeleteApplicationsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBulkUpdateApplicationsArgs = {
  ids: Array<Scalars['ID']['input']>;
  starred?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type MutationComputeResumeMatchScoreArgs = {
  applicationId: Scalars['ID']['input'];
  resumeText?: InputMaybe<Scalars['String']['input']>;
};


export type MutationConfirmAvatarArgs = {
  mimeType: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
  storageKey: Scalars['String']['input'];
};


export type MutationConfirmDocumentArgs = {
  input: ConfirmDocumentInput;
};


export type MutationConfirmEmailChangeArgs = {
  token: Scalars['String']['input'];
};


export type MutationConfirmTotpSetupArgs = {
  code: Scalars['String']['input'];
};


export type MutationCreateApiTokenArgs = {
  name: Scalars['String']['input'];
  scope?: InputMaybe<ApiTokenScope>;
};


export type MutationCreateApplicationArgs = {
  input: CreateApplicationInput;
};


export type MutationCreateContactArgs = {
  applicationId: Scalars['ID']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  linkedinUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateConversationArgs = {
  model?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateDocumentDraftArgs = {
  input: CreateDocumentDraftInput;
};


export type MutationCreateEducationArgs = {
  input: CreateEducationInput;
};


export type MutationCreateInterviewRoundArgs = {
  input: CreateInterviewRoundInput;
};


export type MutationCreateNoteArgs = {
  applicationId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
};


export type MutationCreatePipelineStageArgs = {
  input: CreatePipelineStageInput;
};


export type MutationCreateSkillArgs = {
  input: CreateSkillInput;
};


export type MutationCreateWorkExperienceArgs = {
  input: CreateWorkExperienceInput;
};


export type MutationDeleteAccountArgs = {
  password: Scalars['String']['input'];
};


export type MutationDeleteApiTokenArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteApplicationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContactArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteConversationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDocumentDraftArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEducationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInterviewRoundArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLlmApiKeyArgs = {
  provider: Scalars['String']['input'];
};


export type MutationDeleteNoteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePipelineStageArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWorkExperienceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDisableTotpArgs = {
  password: Scalars['String']['input'];
};


export type MutationExportDocumentDraftToPdfArgs = {
  draftId: Scalars['ID']['input'];
};


export type MutationExtractDocumentTextArgs = {
  documentId: Scalars['ID']['input'];
};


export type MutationGenerateCoverLetterArgs = {
  applicationId: Scalars['ID']['input'];
  resumeText?: InputMaybe<Scalars['String']['input']>;
};


export type MutationImportUserDataArgs = {
  data: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationLoginWithTotpArgs = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkNotificationsReadArgs = {
  ids: Array<Scalars['ID']['input']>;
  isRead: Scalars['Boolean']['input'];
};


export type MutationParseJobDescriptionArgs = {
  text?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};


export type MutationReauthenticateArgs = {
  code?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRegisterPushSubscriptionArgs = {
  auth: Scalars['String']['input'];
  endpoint: Scalars['String']['input'];
  p256dh: Scalars['String']['input'];
};


export type MutationRequestAvatarUploadUrlArgs = {
  filename: Scalars['String']['input'];
  mimeType: Scalars['String']['input'];
};


export type MutationRequestEmailChangeArgs = {
  currentPassword: Scalars['String']['input'];
  newEmail: Scalars['String']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestUploadUrlArgs = {
  input: RequestUploadUrlInput;
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationRevokeSessionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSaveLlmApiKeyArgs = {
  apiKey: Scalars['String']['input'];
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  provider: Scalars['String']['input'];
};


export type MutationSendChatMessageArgs = {
  conversationId: Scalars['ID']['input'];
  message: Scalars['String']['input'];
};


export type MutationSetDefaultLlmProviderArgs = {
  provider: Scalars['String']['input'];
};


export type MutationUnlinkOAuthAccountArgs = {
  provider: OAuthProvider;
};


export type MutationUnregisterPushSubscriptionArgs = {
  endpoint: Scalars['String']['input'];
};


export type MutationUpdateApplicationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateApplicationInput;
};


export type MutationUpdateContactArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  linkedinUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateDocumentDraftContentArgs = {
  input: UpdateDocumentDraftContentInput;
};


export type MutationUpdateEducationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEducationInput;
};


export type MutationUpdateInterviewRoundArgs = {
  id: Scalars['ID']['input'];
  input: UpdateInterviewRoundInput;
};


export type MutationUpdateNoteArgs = {
  content: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateNotificationPreferencesArgs = {
  followUpRemindersEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  pushNotificationsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  weeklyDigestEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdatePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationUpdatePipelineStageArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePipelineStageInput;
};


export type MutationUpdateProfileArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  targetRole?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateSkillArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSkillInput;
};


export type MutationUpdateWorkExperienceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWorkExperienceInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};

export type Note = {
  __typename?: 'Note';
  applicationId?: Maybe<Scalars['ID']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type Notification = {
  __typename?: 'Notification';
  body?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  read?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  items?: Maybe<Array<Notification>>;
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export type NotificationPreferences = {
  __typename?: 'NotificationPreferences';
  followUpRemindersEnabled?: Maybe<Scalars['Boolean']['output']>;
  pushNotificationsEnabled?: Maybe<Scalars['Boolean']['output']>;
  weeklyDigestEnabled?: Maybe<Scalars['Boolean']['output']>;
};

export type OAuthProvider =
  | 'github'
  | 'google';

export type ParsedJobDescription = {
  __typename?: 'ParsedJobDescription';
  company?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  salary?: Maybe<Scalars['String']['output']>;
};

export type PipelineStage = {
  __typename?: 'PipelineStage';
  category?: Maybe<PipelineStageCategory>;
  color?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type PipelineStageCategory =
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'BACKLOG'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type Query = {
  __typename?: 'Query';
  activityLogs?: Maybe<Array<ActivityLog>>;
  apiTokens?: Maybe<Array<ApiToken>>;
  application?: Maybe<JobApplication>;
  applicationHealthScore?: Maybe<ApplicationHealthScore>;
  applications?: Maybe<Array<JobApplication>>;
  applicationsPage?: Maybe<ApplicationConnection>;
  calendarEvents?: Maybe<Array<CalendarEvent>>;
  chatHistory?: Maybe<Array<Message>>;
  contacts?: Maybe<Array<Contact>>;
  conversations?: Maybe<Array<Conversation>>;
  documentDraft?: Maybe<DocumentDraft>;
  documentDrafts?: Maybe<Array<DocumentDraft>>;
  documents?: Maybe<Array<Document>>;
  educations?: Maybe<Array<Education>>;
  exportUserData?: Maybe<Scalars['String']['output']>;
  interviewRounds?: Maybe<Array<InterviewRound>>;
  linkedOAuthAccounts?: Maybe<Array<LinkedOAuthAccount>>;
  llmApiKeys?: Maybe<Array<LlmApiKey>>;
  loginHistory?: Maybe<Array<LoginEvent>>;
  me?: Maybe<User>;
  notes?: Maybe<Array<Note>>;
  notificationPreferences?: Maybe<NotificationPreferences>;
  notificationsPage?: Maybe<NotificationConnection>;
  pipelineStages?: Maybe<Array<PipelineStage>>;
  sessions?: Maybe<Array<Session>>;
  skills?: Maybe<Array<Skill>>;
  totpEnabled?: Maybe<Scalars['Boolean']['output']>;
  unreadNotificationCount?: Maybe<Scalars['Int']['output']>;
  workExperiences?: Maybe<Array<WorkExperience>>;
};


export type QueryActivityLogsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryApplicationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryApplicationHealthScoreArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryApplicationsArgs = {
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryApplicationsPageArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  starred?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryChatHistoryArgs = {
  conversationId: Scalars['ID']['input'];
};


export type QueryContactsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryDocumentDraftArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDocumentDraftsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryDocumentsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryInterviewRoundsArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryNotesArgs = {
  applicationId: Scalars['ID']['input'];
};


export type QueryNotificationsPageArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type RequestUploadUrlInput = {
  applicationId: Scalars['ID']['input'];
  filename: Scalars['String']['input'];
  mimeType: Scalars['String']['input'];
};

export type ResumeMatchScore = {
  __typename?: 'ResumeMatchScore';
  label?: Maybe<Scalars['String']['output']>;
  matchedKeywords?: Maybe<Array<Scalars['String']['output']>>;
  missingKeywords?: Maybe<Array<Scalars['String']['output']>>;
  score?: Maybe<Scalars['Int']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
};

export type Session = {
  __typename?: 'Session';
  createdAt?: Maybe<Scalars['String']['output']>;
  current?: Maybe<Scalars['Boolean']['output']>;
  deviceLabel?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  lastUsedAt?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type Skill = {
  __typename?: 'Skill';
  category?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  proficiency?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type TotpSetup = {
  __typename?: 'TotpSetup';
  otpauthUrl?: Maybe<Scalars['String']['output']>;
  qrCodeDataUrl?: Maybe<Scalars['String']['output']>;
  secret?: Maybe<Scalars['String']['output']>;
};

export type UpdateApplicationInput = {
  company?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  followUpAt?: InputMaybe<Scalars['String']['input']>;
  jobUrl?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  salaryRange?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  starred?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateDocumentDraftContentInput = {
  contentJson: Scalars['String']['input'];
  draftId: Scalars['ID']['input'];
  plainText: Scalars['String']['input'];
};

export type UpdateEducationInput = {
  degree?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  field?: InputMaybe<Scalars['String']['input']>;
  institution?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInterviewRoundInput = {
  completedAt?: InputMaybe<Scalars['String']['input']>;
  interviewerName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  outcome?: InputMaybe<InterviewRoundOutcome>;
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<InterviewRoundType>;
};

export type UpdatePipelineStageInput = {
  category?: InputMaybe<PipelineStageCategory>;
  color?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSkillInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  proficiency?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWorkExperienceInput = {
  company?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UploadUrlPayload = {
  __typename?: 'UploadUrlPayload';
  storageKey?: Maybe<Scalars['String']['output']>;
  uploadUrl?: Maybe<Scalars['String']['output']>;
};

export type User = {
  __typename?: 'User';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  defaultLlmProvider?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  targetRole?: Maybe<Scalars['String']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
};

export type WorkExperience = {
  __typename?: 'WorkExperience';
  company?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type CreateApplicationMutationVariables = Exact<{
  input: CreateApplicationInput;
}>;


export type CreateApplicationMutation = { __typename?: 'Mutation', createApplication?: { __typename?: 'JobApplication', id?: string | null, company?: string | null, role?: string | null, status?: string | null, jobUrl?: string | null, location?: string | null, salaryRange?: string | null, description?: string | null, appliedAt?: string | null, starred?: boolean | null, source?: string | null, followUpAt?: string | null, tags?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateApplicationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateApplicationInput;
}>;


export type UpdateApplicationMutation = { __typename?: 'Mutation', updateApplication?: { __typename?: 'JobApplication', id?: string | null, company?: string | null, role?: string | null, status?: string | null, jobUrl?: string | null, location?: string | null, salaryRange?: string | null, description?: string | null, appliedAt?: string | null, starred?: boolean | null, source?: string | null, followUpAt?: string | null, tags?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteApplicationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteApplicationMutation = { __typename?: 'Mutation', deleteApplication?: boolean | null };

export type RegisterMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type RegisterMutation = { __typename?: 'Mutation', register?: string | null };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'LoginResult', success?: boolean | null, totpRequired?: boolean | null, accessToken?: string | null } | null };

export type LoginWithTotpMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  code: Scalars['String']['input'];
}>;


export type LoginWithTotpMutation = { __typename?: 'Mutation', loginWithTotp?: string | null };

export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken?: string | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout?: boolean | null };

export type CreateContactMutationVariables = Exact<{
  applicationId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  linkedinUrl?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateContactMutation = { __typename?: 'Mutation', createContact?: { __typename?: 'Contact', id?: string | null, applicationId?: string | null, name?: string | null, role?: string | null, email?: string | null, phone?: string | null, linkedinUrl?: string | null, notes?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  linkedinUrl?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateContactMutation = { __typename?: 'Mutation', updateContact?: { __typename?: 'Contact', id?: string | null, applicationId?: string | null, name?: string | null, role?: string | null, email?: string | null, phone?: string | null, linkedinUrl?: string | null, notes?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteContactMutation = { __typename?: 'Mutation', deleteContact?: boolean | null };

export type RequestUploadUrlMutationVariables = Exact<{
  input: RequestUploadUrlInput;
}>;


export type RequestUploadUrlMutation = { __typename?: 'Mutation', requestUploadUrl?: { __typename?: 'UploadUrlPayload', uploadUrl?: string | null, storageKey?: string | null } | null };

export type ConfirmDocumentMutationVariables = Exact<{
  input: ConfirmDocumentInput;
}>;


export type ConfirmDocumentMutation = { __typename?: 'Mutation', confirmDocument?: { __typename?: 'Document', id?: string | null, applicationId?: string | null, name?: string | null, mimeType?: string | null, sizeBytes?: number | null, url?: string | null, documentType?: string | null, version?: string | null, createdAt?: string | null } | null };

export type DeleteDocumentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDocumentMutation = { __typename?: 'Mutation', deleteDocument?: boolean | null };

export type CreateWorkExperienceMutationVariables = Exact<{
  input: CreateWorkExperienceInput;
}>;


export type CreateWorkExperienceMutation = { __typename?: 'Mutation', createWorkExperience?: { __typename?: 'WorkExperience', id?: string | null, company?: string | null, title?: string | null, location?: string | null, startDate?: string | null, endDate?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateWorkExperienceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateWorkExperienceInput;
}>;


export type UpdateWorkExperienceMutation = { __typename?: 'Mutation', updateWorkExperience?: { __typename?: 'WorkExperience', id?: string | null, company?: string | null, title?: string | null, location?: string | null, startDate?: string | null, endDate?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteWorkExperienceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWorkExperienceMutation = { __typename?: 'Mutation', deleteWorkExperience?: boolean | null };

export type CreateEducationMutationVariables = Exact<{
  input: CreateEducationInput;
}>;


export type CreateEducationMutation = { __typename?: 'Mutation', createEducation?: { __typename?: 'Education', id?: string | null, institution?: string | null, degree?: string | null, field?: string | null, startDate?: string | null, endDate?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateEducationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEducationInput;
}>;


export type UpdateEducationMutation = { __typename?: 'Mutation', updateEducation?: { __typename?: 'Education', id?: string | null, institution?: string | null, degree?: string | null, field?: string | null, startDate?: string | null, endDate?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteEducationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEducationMutation = { __typename?: 'Mutation', deleteEducation?: boolean | null };

export type CreateSkillMutationVariables = Exact<{
  input: CreateSkillInput;
}>;


export type CreateSkillMutation = { __typename?: 'Mutation', createSkill?: { __typename?: 'Skill', id?: string | null, name?: string | null, category?: string | null, proficiency?: string | null, createdAt?: string | null } | null };

export type UpdateSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSkillInput;
}>;


export type UpdateSkillMutation = { __typename?: 'Mutation', updateSkill?: { __typename?: 'Skill', id?: string | null, name?: string | null, category?: string | null, proficiency?: string | null, createdAt?: string | null } | null };

export type DeleteSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSkillMutation = { __typename?: 'Mutation', deleteSkill?: boolean | null };

export type CreateInterviewRoundMutationVariables = Exact<{
  input: CreateInterviewRoundInput;
}>;


export type CreateInterviewRoundMutation = { __typename?: 'Mutation', createInterviewRound?: { __typename?: 'InterviewRound', id?: string | null, applicationId?: string | null, type?: InterviewRoundType | null, scheduledAt?: string | null, completedAt?: string | null, interviewerName?: string | null, notes?: string | null, outcome?: InterviewRoundOutcome | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateInterviewRoundMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateInterviewRoundInput;
}>;


export type UpdateInterviewRoundMutation = { __typename?: 'Mutation', updateInterviewRound?: { __typename?: 'InterviewRound', id?: string | null, applicationId?: string | null, type?: InterviewRoundType | null, scheduledAt?: string | null, completedAt?: string | null, interviewerName?: string | null, notes?: string | null, outcome?: InterviewRoundOutcome | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteInterviewRoundMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteInterviewRoundMutation = { __typename?: 'Mutation', deleteInterviewRound?: boolean | null };

export type ParseJobDescriptionMutationVariables = Exact<{
  text?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
}>;


export type ParseJobDescriptionMutation = { __typename?: 'Mutation', parseJobDescription?: { __typename?: 'ParsedJobDescription', company?: string | null, role?: string | null, location?: string | null, salary?: string | null, description?: string | null } | null };

export type CreateNoteMutationVariables = Exact<{
  applicationId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote?: { __typename?: 'Note', id?: string | null, applicationId?: string | null, content?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateNoteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  content: Scalars['String']['input'];
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote?: { __typename?: 'Note', id?: string | null, applicationId?: string | null, content?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteNoteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote?: boolean | null };

export type ActivityLogsQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type ActivityLogsQuery = { __typename?: 'Query', activityLogs?: Array<{ __typename?: 'ActivityLog', id?: string | null, applicationId?: string | null, actorId?: string | null, eventType?: string | null, payload?: string | null, createdAt?: string | null }> | null };

export type ApplicationsQueryVariables = Exact<{
  status?: InputMaybe<Scalars['String']['input']>;
}>;


export type ApplicationsQuery = { __typename?: 'Query', applications?: Array<{ __typename?: 'JobApplication', id?: string | null, company?: string | null, role?: string | null, status?: string | null, jobUrl?: string | null, location?: string | null, salaryRange?: string | null, appliedAt?: string | null, starred?: boolean | null, source?: string | null, followUpAt?: string | null, tags?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type ApplicationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApplicationQuery = { __typename?: 'Query', application?: { __typename?: 'JobApplication', id?: string | null, company?: string | null, role?: string | null, status?: string | null, jobUrl?: string | null, location?: string | null, salaryRange?: string | null, description?: string | null, appliedAt?: string | null, starred?: boolean | null, source?: string | null, followUpAt?: string | null, tags?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ContactsQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type ContactsQuery = { __typename?: 'Query', contacts?: Array<{ __typename?: 'Contact', id?: string | null, applicationId?: string | null, name?: string | null, role?: string | null, email?: string | null, phone?: string | null, linkedinUrl?: string | null, notes?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type DocumentsQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type DocumentsQuery = { __typename?: 'Query', documents?: Array<{ __typename?: 'Document', id?: string | null, applicationId?: string | null, name?: string | null, mimeType?: string | null, sizeBytes?: number | null, url?: string | null, documentType?: string | null, version?: string | null, createdAt?: string | null }> | null };

export type WorkExperiencesQueryVariables = Exact<{ [key: string]: never; }>;


export type WorkExperiencesQuery = { __typename?: 'Query', workExperiences?: Array<{ __typename?: 'WorkExperience', id?: string | null, company?: string | null, title?: string | null, location?: string | null, startDate?: string | null, endDate?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type EducationsQueryVariables = Exact<{ [key: string]: never; }>;


export type EducationsQuery = { __typename?: 'Query', educations?: Array<{ __typename?: 'Education', id?: string | null, institution?: string | null, degree?: string | null, field?: string | null, startDate?: string | null, endDate?: string | null, description?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type SkillsQueryVariables = Exact<{ [key: string]: never; }>;


export type SkillsQuery = { __typename?: 'Query', skills?: Array<{ __typename?: 'Skill', id?: string | null, name?: string | null, category?: string | null, proficiency?: string | null, createdAt?: string | null }> | null };

export type InterviewRoundsQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type InterviewRoundsQuery = { __typename?: 'Query', interviewRounds?: Array<{ __typename?: 'InterviewRound', id?: string | null, applicationId?: string | null, type?: InterviewRoundType | null, scheduledAt?: string | null, completedAt?: string | null, interviewerName?: string | null, notes?: string | null, outcome?: InterviewRoundOutcome | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type NotesQueryVariables = Exact<{
  applicationId: Scalars['ID']['input'];
}>;


export type NotesQuery = { __typename?: 'Query', notes?: Array<{ __typename?: 'Note', id?: string | null, applicationId?: string | null, content?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };


export const CreateApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateApplicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobUrl"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"salaryRange"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}},{"kind":"Field","name":{"kind":"Name","value":"starred"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"followUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateApplicationMutation, CreateApplicationMutationVariables>;
export const UpdateApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateApplicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobUrl"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"salaryRange"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}},{"kind":"Field","name":{"kind":"Name","value":"starred"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"followUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateApplicationMutation, UpdateApplicationMutationVariables>;
export const DeleteApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteApplicationMutation, DeleteApplicationMutationVariables>;
export const RegisterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"register"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}]}}]} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"totpRequired"}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LoginWithTotpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginWithTotp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginWithTotp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}]}]}}]} as unknown as DocumentNode<LoginWithTotpMutation, LoginWithTotpMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const CreateContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"linkedinUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"linkedinUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"linkedinUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"notes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"linkedinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateContactMutation, CreateContactMutationVariables>;
export const UpdateContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"linkedinUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}},{"kind":"Argument","name":{"kind":"Name","value":"linkedinUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"linkedinUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"notes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"linkedinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateContactMutation, UpdateContactMutationVariables>;
export const DeleteContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteContactMutation, DeleteContactMutationVariables>;
export const RequestUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestUploadUrlInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"storageKey"}}]}}]}}]} as unknown as DocumentNode<RequestUploadUrlMutation, RequestUploadUrlMutationVariables>;
export const ConfirmDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfirmDocumentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"documentType"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ConfirmDocumentMutation, ConfirmDocumentMutationVariables>;
export const DeleteDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteDocumentMutation, DeleteDocumentMutationVariables>;
export const CreateWorkExperienceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkExperience"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkExperienceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkExperience"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateWorkExperienceMutation, CreateWorkExperienceMutationVariables>;
export const UpdateWorkExperienceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkExperience"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWorkExperienceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkExperience"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateWorkExperienceMutation, UpdateWorkExperienceMutationVariables>;
export const DeleteWorkExperienceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkExperience"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWorkExperience"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteWorkExperienceMutation, DeleteWorkExperienceMutationVariables>;
export const CreateEducationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEducation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEducationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEducation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"institution"}},{"kind":"Field","name":{"kind":"Name","value":"degree"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateEducationMutation, CreateEducationMutationVariables>;
export const UpdateEducationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEducation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEducationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEducation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"institution"}},{"kind":"Field","name":{"kind":"Name","value":"degree"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateEducationMutation, UpdateEducationMutationVariables>;
export const DeleteEducationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEducation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEducation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEducationMutation, DeleteEducationMutationVariables>;
export const CreateSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSkillInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"proficiency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateSkillMutation, CreateSkillMutationVariables>;
export const UpdateSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSkillInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"proficiency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UpdateSkillMutation, UpdateSkillMutationVariables>;
export const DeleteSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSkillMutation, DeleteSkillMutationVariables>;
export const CreateInterviewRoundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateInterviewRound"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInterviewRoundInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInterviewRound"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"interviewerName"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateInterviewRoundMutation, CreateInterviewRoundMutationVariables>;
export const UpdateInterviewRoundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateInterviewRound"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateInterviewRoundInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateInterviewRound"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"interviewerName"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateInterviewRoundMutation, UpdateInterviewRoundMutationVariables>;
export const DeleteInterviewRoundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteInterviewRound"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteInterviewRound"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteInterviewRoundMutation, DeleteInterviewRoundMutationVariables>;
export const ParseJobDescriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ParseJobDescription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"text"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parseJobDescription"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"text"},"value":{"kind":"Variable","name":{"kind":"Name","value":"text"}}},{"kind":"Argument","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"salary"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<ParseJobDescriptionMutation, ParseJobDescriptionMutationVariables>;
export const CreateNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateNoteMutation, CreateNoteMutationVariables>;
export const UpdateNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateNoteMutation, UpdateNoteMutationVariables>;
export const DeleteNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteNoteMutation, DeleteNoteMutationVariables>;
export const ActivityLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivityLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"actorId"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ActivityLogsQuery, ActivityLogsQueryVariables>;
export const ApplicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Applications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobUrl"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"salaryRange"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}},{"kind":"Field","name":{"kind":"Name","value":"starred"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"followUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ApplicationsQuery, ApplicationsQueryVariables>;
export const ApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Application"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"application"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobUrl"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"salaryRange"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}},{"kind":"Field","name":{"kind":"Name","value":"starred"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"followUpAt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ApplicationQuery, ApplicationQueryVariables>;
export const ContactsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Contacts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"linkedinUrl"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ContactsQuery, ContactsQueryVariables>;
export const DocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Documents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"documentType"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<DocumentsQuery, DocumentsQueryVariables>;
export const WorkExperiencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkExperiences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workExperiences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WorkExperiencesQuery, WorkExperiencesQueryVariables>;
export const EducationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Educations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"educations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"institution"}},{"kind":"Field","name":{"kind":"Name","value":"degree"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<EducationsQuery, EducationsQueryVariables>;
export const SkillsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"proficiency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SkillsQuery, SkillsQueryVariables>;
export const InterviewRoundsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InterviewRounds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"interviewRounds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"interviewerName"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<InterviewRoundsQuery, InterviewRoundsQueryVariables>;
export const NotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Notes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<NotesQuery, NotesQueryVariables>;