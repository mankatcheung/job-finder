CREATE TABLE `McpOAuthAuthorizationCode` (
	`id` text PRIMARY KEY NOT NULL,
	`codeHash` text NOT NULL,
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
CREATE INDEX `McpOAuthClient_createdAt_idx` ON `McpOAuthClient` (`createdAt`);