CREATE TABLE `SecurityEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`eventType` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `SecurityEvent_userId_idx` ON `SecurityEvent` (`userId`);