CREATE TABLE `McpOAuthAccessToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`clientId` text NOT NULL,
	`familyId` text NOT NULL,
	`tokenHash` text NOT NULL,
	`scope` text NOT NULL,
	`audience` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`revokedAt` integer,
	`lastUsedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `McpOAuthAccessToken_tokenHash_unique` ON `McpOAuthAccessToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_userId_idx` ON `McpOAuthAccessToken` (`userId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_clientId_idx` ON `McpOAuthAccessToken` (`clientId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_familyId_idx` ON `McpOAuthAccessToken` (`familyId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAccessToken_expiresAt_idx` ON `McpOAuthAccessToken` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `McpOAuthAuthorizationCode` (
	`id` text PRIMARY KEY NOT NULL,
	`codeHash` text NOT NULL,
	`familyId` text NOT NULL,
	`clientId` text NOT NULL,
	`userId` text NOT NULL,
	`redirectUri` text NOT NULL,
	`scope` text NOT NULL,
	`codeChallenge` text NOT NULL,
	`codeChallengeMethod` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`consumedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`clientId`) REFERENCES `McpOAuthClient`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `McpOAuthAuthorizationCode_codeHash_unique` ON `McpOAuthAuthorizationCode` (`codeHash`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_clientId_idx` ON `McpOAuthAuthorizationCode` (`clientId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_familyId_idx` ON `McpOAuthAuthorizationCode` (`familyId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_userId_idx` ON `McpOAuthAuthorizationCode` (`userId`);--> statement-breakpoint
CREATE INDEX `McpOAuthAuthorizationCode_expiresAt_idx` ON `McpOAuthAuthorizationCode` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `McpOAuthClient` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`redirectUris` text NOT NULL,
	`revokedAt` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `McpOAuthClient_createdAt_idx` ON `McpOAuthClient` (`createdAt`);--> statement-breakpoint
CREATE TABLE `McpOAuthRefreshToken` (
	`id` text PRIMARY KEY NOT NULL,
	`tokenHash` text NOT NULL,
	`familyId` text NOT NULL,
	`clientId` text NOT NULL,
	`userId` text NOT NULL,
	`scope` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`revokedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `McpOAuthRefreshToken_tokenHash_unique` ON `McpOAuthRefreshToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `McpOAuthRefreshToken_familyId_idx` ON `McpOAuthRefreshToken` (`familyId`);--> statement-breakpoint
CREATE INDEX `McpOAuthRefreshToken_userId_idx` ON `McpOAuthRefreshToken` (`userId`);--> statement-breakpoint
CREATE INDEX `McpOAuthRefreshToken_expiresAt_idx` ON `McpOAuthRefreshToken` (`expiresAt`);