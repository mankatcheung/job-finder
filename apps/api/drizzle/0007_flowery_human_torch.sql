CREATE TABLE `PushSubscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PushSubscription_endpoint_unique` ON `PushSubscription` (`endpoint`);--> statement-breakpoint
CREATE INDEX `PushSubscription_userId_idx` ON `PushSubscription` (`userId`);--> statement-breakpoint
ALTER TABLE `InterviewRound` ADD `pushNotificationSentAt` integer;--> statement-breakpoint
ALTER TABLE `User` ADD `pushNotificationsEnabled` integer DEFAULT false NOT NULL;