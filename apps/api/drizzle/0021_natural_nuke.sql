--> Adds the grant id (`familyId`) to the two MCP OAuth tables that lacked it,
--> so one consent is one revocable unit across codes, access tokens, and
--> refresh tokens.
--> 
--> Written by hand rather than generated: drizzle-kit emits
--> `ALTER TABLE ... ADD COLUMN ... NOT NULL`, which SQLite refuses outright
--> when no default is supplied — even against an empty table. A default is
--> not an option either, since an empty grant id would silently group
--> unrelated tokens into one revocable family.
--> 
--> Dropping is safe here and nowhere near as alarming as it looks: both
--> tables were created two migrations ago by this same unshipped feature, so
--> the only rows that can exist are from a PR preview database. Nothing has
--> ever issued an MCP OAuth token outside of CI.
DROP TABLE IF EXISTS `McpOAuthAuthorizationCode`;--> statement-breakpoint
DROP TABLE IF EXISTS `McpOAuthAccessToken`;--> statement-breakpoint
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
CREATE INDEX `McpOAuthAuthorizationCode_expiresAt_idx` ON `McpOAuthAuthorizationCode` (`expiresAt`);
