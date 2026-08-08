CREATE TABLE `ShareLink` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`tokenHash` text NOT NULL,
	`lastUsedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ShareLink_tokenHash_unique` ON `ShareLink` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `ShareLink_userId_idx` ON `ShareLink` (`userId`);