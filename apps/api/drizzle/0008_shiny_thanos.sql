CREATE TABLE `Notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text,
	`readAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Notification_userId_idx` ON `Notification` (`userId`);--> statement-breakpoint
CREATE INDEX `Notification_userId_readAt_idx` ON `Notification` (`userId`,`readAt`);