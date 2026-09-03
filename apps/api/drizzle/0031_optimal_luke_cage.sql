DROP INDEX "User_email_unique";--> statement-breakpoint
DROP INDEX "BackupEmailVerificationToken_tokenHash_unique";--> statement-breakpoint
DROP INDEX "BackupEmailVerificationToken_userId_idx";--> statement-breakpoint
DROP INDEX "EmailVerificationToken_tokenHash_unique";--> statement-breakpoint
DROP INDEX "EmailVerificationToken_userId_idx";--> statement-breakpoint
DROP INDEX "LoginEvent_userId_idx";--> statement-breakpoint
DROP INDEX "OAuthAccount_provider_providerAccountId_key";--> statement-breakpoint
DROP INDEX "OAuthAccount_userId_idx";--> statement-breakpoint
DROP INDEX "PasswordResetToken_tokenHash_unique";--> statement-breakpoint
DROP INDEX "PasswordResetToken_userId_idx";--> statement-breakpoint
DROP INDEX "SecurityEvent_userId_idx";--> statement-breakpoint
DROP INDEX "Session_userId_idx";--> statement-breakpoint
DROP INDEX "TotpBackupCode_codeHash_unique";--> statement-breakpoint
DROP INDEX "TotpBackupCode_userId_idx";--> statement-breakpoint
DROP INDEX "ApiToken_tokenHash_unique";--> statement-breakpoint
DROP INDEX "ApiToken_userId_idx";--> statement-breakpoint
DROP INDEX "LlmApiKey_userId_idx";--> statement-breakpoint
DROP INDEX "LlmApiKey_userId_provider_key";--> statement-breakpoint
DROP INDEX "LlmUsageEvent_userId_idx";--> statement-breakpoint
DROP INDEX "LlmUsageEvent_userId_provider_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAccessToken_tokenHash_unique";--> statement-breakpoint
DROP INDEX "McpOAuthAccessToken_userId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAccessToken_clientId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAccessToken_familyId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAccessToken_expiresAt_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAuthorizationCode_codeHash_unique";--> statement-breakpoint
DROP INDEX "McpOAuthAuthorizationCode_clientId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAuthorizationCode_familyId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAuthorizationCode_userId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthAuthorizationCode_expiresAt_idx";--> statement-breakpoint
DROP INDEX "McpOAuthClient_createdAt_idx";--> statement-breakpoint
DROP INDEX "McpOAuthRefreshToken_tokenHash_unique";--> statement-breakpoint
DROP INDEX "McpOAuthRefreshToken_familyId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthRefreshToken_userId_idx";--> statement-breakpoint
DROP INDEX "McpOAuthRefreshToken_expiresAt_idx";--> statement-breakpoint
DROP INDEX "ShareLink_tokenHash_unique";--> statement-breakpoint
DROP INDEX "ShareLink_userId_idx";--> statement-breakpoint
DROP INDEX "ActivityLog_applicationId_idx";--> statement-breakpoint
DROP INDEX "ApplicationTag_applicationId_name_key";--> statement-breakpoint
DROP INDEX "ApplicationTag_applicationId_idx";--> statement-breakpoint
DROP INDEX "CompanyBriefing_applicationId_unique";--> statement-breakpoint
DROP INDEX "Contact_applicationId_idx";--> statement-breakpoint
DROP INDEX "Document_storageKey_unique";--> statement-breakpoint
DROP INDEX "Document_applicationId_idx";--> statement-breakpoint
DROP INDEX "DocumentDraft_applicationId_idx";--> statement-breakpoint
DROP INDEX "DocumentDraft_sourceDocumentId_idx";--> statement-breakpoint
DROP INDEX "InterviewRound_applicationId_idx";--> statement-breakpoint
DROP INDEX "JobApplication_userId_idx";--> statement-breakpoint
DROP INDEX "JobApplication_userId_status_idx";--> statement-breakpoint
DROP INDEX "JobApplication_deletedAt_idx";--> statement-breakpoint
DROP INDEX "Note_applicationId_idx";--> statement-breakpoint
DROP INDEX "Offer_applicationId_idx";--> statement-breakpoint
DROP INDEX "Conversation_userId_idx";--> statement-breakpoint
DROP INDEX "Message_conversationId_idx";--> statement-breakpoint
DROP INDEX "Notification_userId_idx";--> statement-breakpoint
DROP INDEX "Notification_userId_readAt_idx";--> statement-breakpoint
DROP INDEX "PushSubscription_endpoint_unique";--> statement-breakpoint
DROP INDEX "PushSubscription_userId_idx";--> statement-breakpoint
DROP INDEX "Education_userId_idx";--> statement-breakpoint
DROP INDEX "Skill_userId_idx";--> statement-breakpoint
DROP INDEX "WorkExperience_userId_idx";--> statement-breakpoint
ALTER TABLE `PushSubscription` ALTER COLUMN "p256dh" TO "p256dh" text;--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `BackupEmailVerificationToken_tokenHash_unique` ON `BackupEmailVerificationToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `BackupEmailVerificationToken_userId_idx` ON `BackupEmailVerificationToken` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `EmailVerificationToken_tokenHash_unique` ON `EmailVerificationToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `EmailVerificationToken_userId_idx` ON `EmailVerificationToken` (`userId`);--> statement-breakpoint
CREATE INDEX `LoginEvent_userId_idx` ON `LoginEvent` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `OAuthAccount_provider_providerAccountId_key` ON `OAuthAccount` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE INDEX `OAuthAccount_userId_idx` ON `OAuthAccount` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PasswordResetToken_tokenHash_unique` ON `PasswordResetToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `PasswordResetToken_userId_idx` ON `PasswordResetToken` (`userId`);--> statement-breakpoint
CREATE INDEX `SecurityEvent_userId_idx` ON `SecurityEvent` (`userId`);--> statement-breakpoint
CREATE INDEX `Session_userId_idx` ON `Session` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `TotpBackupCode_codeHash_unique` ON `TotpBackupCode` (`codeHash`);--> statement-breakpoint
CREATE INDEX `TotpBackupCode_userId_idx` ON `TotpBackupCode` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `ApiToken_tokenHash_unique` ON `ApiToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `ApiToken_userId_idx` ON `ApiToken` (`userId`);--> statement-breakpoint
CREATE INDEX `LlmApiKey_userId_idx` ON `LlmApiKey` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `LlmApiKey_userId_provider_key` ON `LlmApiKey` (`userId`,`provider`);--> statement-breakpoint
CREATE INDEX `LlmUsageEvent_userId_idx` ON `LlmUsageEvent` (`userId`);--> statement-breakpoint
CREATE INDEX `LlmUsageEvent_userId_provider_idx` ON `LlmUsageEvent` (`userId`,`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `McpOAuthAccessToken_tokenHash_unique` ON `McpOAuthAccessToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_userId_idx` ON `McpOAuthAccessToken` (`userId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_clientId_idx` ON `McpOAuthAccessToken` (`clientId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_familyId_idx` ON `McpOAuthAccessToken` (`familyId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_expiresAt_idx` ON `McpOAuthAccessToken` (`expiresAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `McpOAuthAuthorizationCode_codeHash_unique` ON `McpOAuthAuthorizationCode` (`codeHash`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_clientId_idx` ON `McpOAuthAuthorizationCode` (`clientId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_familyId_idx` ON `McpOAuthAuthorizationCode` (`familyId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_userId_idx` ON `McpOAuthAuthorizationCode` (`userId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_expiresAt_idx` ON `McpOAuthAuthorizationCode` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `McpOAuthClient_createdAt_idx` ON `McpOAuthClient` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `McpOAuthRefreshToken_tokenHash_unique` ON `McpOAuthRefreshToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `McpOAuthRefreshToken_familyId_idx` ON `McpOAuthRefreshToken` (`familyId`);--> statement-breakpoint
CREATE INDEX `McpOAuthRefreshToken_userId_idx` ON `McpOAuthRefreshToken` (`userId`);--> statement-breakpoint
CREATE INDEX `McpOAuthRefreshToken_expiresAt_idx` ON `McpOAuthRefreshToken` (`expiresAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `ShareLink_tokenHash_unique` ON `ShareLink` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `ShareLink_userId_idx` ON `ShareLink` (`userId`);--> statement-breakpoint
CREATE INDEX `ActivityLog_applicationId_idx` ON `ActivityLog` (`applicationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `ApplicationTag_applicationId_name_key` ON `ApplicationTag` (`applicationId`,`name`);--> statement-breakpoint
CREATE INDEX `ApplicationTag_applicationId_idx` ON `ApplicationTag` (`applicationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `CompanyBriefing_applicationId_unique` ON `CompanyBriefing` (`applicationId`);--> statement-breakpoint
CREATE INDEX `Contact_applicationId_idx` ON `Contact` (`applicationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Document_storageKey_unique` ON `Document` (`storageKey`);--> statement-breakpoint
CREATE INDEX `Document_applicationId_idx` ON `Document` (`applicationId`);--> statement-breakpoint
CREATE INDEX `DocumentDraft_applicationId_idx` ON `DocumentDraft` (`applicationId`);--> statement-breakpoint
CREATE INDEX `DocumentDraft_sourceDocumentId_idx` ON `DocumentDraft` (`sourceDocumentId`);--> statement-breakpoint
CREATE INDEX `InterviewRound_applicationId_idx` ON `InterviewRound` (`applicationId`);--> statement-breakpoint
CREATE INDEX `JobApplication_userId_idx` ON `JobApplication` (`userId`);--> statement-breakpoint
CREATE INDEX `JobApplication_userId_status_idx` ON `JobApplication` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `JobApplication_deletedAt_idx` ON `JobApplication` (`deletedAt`);--> statement-breakpoint
CREATE INDEX `Note_applicationId_idx` ON `Note` (`applicationId`);--> statement-breakpoint
CREATE INDEX `Offer_applicationId_idx` ON `Offer` (`applicationId`);--> statement-breakpoint
CREATE INDEX `Conversation_userId_idx` ON `Conversation` (`userId`);--> statement-breakpoint
CREATE INDEX `Message_conversationId_idx` ON `Message` (`conversationId`);--> statement-breakpoint
CREATE INDEX `Notification_userId_idx` ON `Notification` (`userId`);--> statement-breakpoint
CREATE INDEX `Notification_userId_readAt_idx` ON `Notification` (`userId`,`readAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `PushSubscription_endpoint_unique` ON `PushSubscription` (`endpoint`);--> statement-breakpoint
CREATE INDEX `PushSubscription_userId_idx` ON `PushSubscription` (`userId`);--> statement-breakpoint
CREATE INDEX `Education_userId_idx` ON `Education` (`userId`);--> statement-breakpoint
CREATE INDEX `Skill_userId_idx` ON `Skill` (`userId`);--> statement-breakpoint
CREATE INDEX `WorkExperience_userId_idx` ON `WorkExperience` (`userId`);--> statement-breakpoint
ALTER TABLE `PushSubscription` ALTER COLUMN "auth" TO "auth" text;--> statement-breakpoint
ALTER TABLE `PushSubscription` ADD `provider` text DEFAULT 'web' NOT NULL;