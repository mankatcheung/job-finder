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