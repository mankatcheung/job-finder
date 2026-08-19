CREATE TABLE `McpOAuthAccessToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`clientId` text NOT NULL,
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
CREATE INDEX `McpOAuthAccessToken_expiresAt_idx` ON `McpOAuthAccessToken` (`expiresAt`);