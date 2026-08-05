CREATE TABLE `PipelineStage` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'gray' NOT NULL,
	`position` integer NOT NULL,
	`category` text DEFAULT 'active' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `PipelineStage_userId_idx` ON `PipelineStage` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PipelineStage_userId_key_key` ON `PipelineStage` (`userId`,`key`);