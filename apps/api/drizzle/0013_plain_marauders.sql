CREATE TABLE `BackupEmailVerificationToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`tokenHash` text NOT NULL,
	`newBackupEmail` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `BackupEmailVerificationToken_tokenHash_unique` ON `BackupEmailVerificationToken` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `BackupEmailVerificationToken_userId_idx` ON `BackupEmailVerificationToken` (`userId`);--> statement-breakpoint
ALTER TABLE `User` ADD `backupEmail` text;--> statement-breakpoint
ALTER TABLE `User` ADD `backupEmailVerifiedAt` integer;