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
CREATE INDEX `ActivityLog_applicationId_idx` ON `ActivityLog` (`applicationId`);--> statement-breakpoint
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
CREATE INDEX `ApiToken_userId_idx` ON `ApiToken` (`userId`);--> statement-breakpoint
CREATE TABLE `ApplicationTag` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ApplicationTag_applicationId_name_key` ON `ApplicationTag` (`applicationId`,`name`);--> statement-breakpoint
CREATE INDEX `ApplicationTag_applicationId_idx` ON `ApplicationTag` (`applicationId`);--> statement-breakpoint
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
CREATE INDEX `Contact_applicationId_idx` ON `Contact` (`applicationId`);--> statement-breakpoint
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
CREATE INDEX `Document_applicationId_idx` ON `Document` (`applicationId`);--> statement-breakpoint
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
CREATE INDEX `EmailVerificationToken_userId_idx` ON `EmailVerificationToken` (`userId`);--> statement-breakpoint
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
CREATE INDEX `InterviewRound_applicationId_idx` ON `InterviewRound` (`applicationId`);--> statement-breakpoint
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
CREATE INDEX `JobApplication_userId_idx` ON `JobApplication` (`userId`);--> statement-breakpoint
CREATE INDEX `JobApplication_userId_status_idx` ON `JobApplication` (`userId`,`status`);--> statement-breakpoint
CREATE TABLE `LoginEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `LoginEvent_userId_idx` ON `LoginEvent` (`userId`);--> statement-breakpoint
CREATE TABLE `Note` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Note_applicationId_idx` ON `Note` (`applicationId`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `OAuthAccount_provider_providerAccountId_key` ON `OAuthAccount` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE INDEX `OAuthAccount_userId_idx` ON `OAuthAccount` (`userId`);--> statement-breakpoint
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
CREATE INDEX `PasswordResetToken_userId_idx` ON `PasswordResetToken` (`userId`);--> statement-breakpoint
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
CREATE INDEX `Session_userId_idx` ON `Session` (`userId`);--> statement-breakpoint
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
CREATE INDEX `TotpBackupCode_userId_idx` ON `TotpBackupCode` (`userId`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);