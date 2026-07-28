CREATE TABLE `ActivityLog` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`actorId` text NOT NULL,
	`eventType` text NOT NULL,
	`payload` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_activity_log_application_id` ON `ActivityLog` (`applicationId`);--> statement-breakpoint
CREATE TABLE `ApiToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`tokenHash` text NOT NULL,
	`scope` text DEFAULT 'full' NOT NULL,
	`lastUsedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ApiToken_tokenHash_unique` ON `ApiToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `idx_api_token_user_id` ON `ApiToken` (`userId`);--> statement-breakpoint
CREATE TABLE `ApplicationTag` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_application_tag_application_id` ON `ApplicationTag` (`applicationId`);--> statement-breakpoint
CREATE INDEX `idx_application_tag_application_id_name` ON `ApplicationTag` (`applicationId`,`name`);--> statement-breakpoint
CREATE TABLE `Contact` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`email` text,
	`phone` text,
	`linkedinUrl` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_contact_application_id` ON `Contact` (`applicationId`);--> statement-breakpoint
CREATE TABLE `Document` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`name` text NOT NULL,
	`mimeType` text NOT NULL,
	`sizeBytes` integer NOT NULL,
	`storageKey` text NOT NULL,
	`documentType` text DEFAULT 'other' NOT NULL,
	`version` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Document_storageKey_unique` ON `Document` (`storageKey`);--> statement-breakpoint
CREATE INDEX `idx_document_application_id` ON `Document` (`applicationId`);--> statement-breakpoint
CREATE TABLE `EmailVerificationToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tokenHash` text NOT NULL,
	`newEmail` text,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `EmailVerificationToken_tokenHash_unique` ON `EmailVerificationToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `idx_email_verification_token_user_id` ON `EmailVerificationToken` (`userId`);--> statement-breakpoint
CREATE TABLE `InterviewRound` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`scheduledAt` integer,
	`completedAt` integer,
	`interviewerName` text,
	`notes` text,
	`outcome` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_interview_round_application_id` ON `InterviewRound` (`applicationId`);--> statement-breakpoint
CREATE TABLE `JobApplication` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`jobUrl` text,
	`location` text,
	`salaryRange` text,
	`description` text,
	`appliedAt` integer,
	`starred` integer DEFAULT false NOT NULL,
	`source` text,
	`followUpAt` integer,
	`reminderSentAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_job_application_user_id` ON `JobApplication` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_job_application_user_status` ON `JobApplication` (`userId`,`status`);--> statement-breakpoint
CREATE TABLE `LoginEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_login_event_user_id` ON `LoginEvent` (`userId`);--> statement-breakpoint
CREATE TABLE `Note` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_note_application_id` ON `Note` (`applicationId`);--> statement-breakpoint
CREATE TABLE `OAuthAccount` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`email` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_oauth_account_user_id` ON `OAuthAccount` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_oauth_account_provider_providerAccountId` ON `OAuthAccount` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE TABLE `PasswordResetToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tokenHash` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PasswordResetToken_tokenHash_unique` ON `PasswordResetToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_token_user_id` ON `PasswordResetToken` (`userId`);--> statement-breakpoint
CREATE TABLE `Session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`userAgent` text,
	`ipAddress` text,
	`lastUsedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`revokedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `Session` (`userId`);--> statement-breakpoint
CREATE TABLE `TotpBackupCode` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`codeHash` text NOT NULL,
	`usedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TotpBackupCode_codeHash_unique` ON `TotpBackupCode` (`codeHash`);--> statement-breakpoint
CREATE INDEX `idx_totp_backup_code_user_id` ON `TotpBackupCode` (`userId`);--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text,
	`name` text,
	`timezone` text,
	`targetRole` text,
	`emailVerifiedAt` integer,
	`avatarKey` text,
	`weeklyDigestEnabled` integer DEFAULT true NOT NULL,
	`lastDigestSentAt` integer,
	`followUpRemindersEnabled` integer DEFAULT true NOT NULL,
	`totpSecret` text,
	`totpEnabled` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_email` ON `User` (`email`);