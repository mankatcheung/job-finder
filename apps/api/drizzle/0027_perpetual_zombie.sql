CREATE TABLE `LlmUsageEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`model` text,
	`promptTokens` integer NOT NULL,
	`completionTokens` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `LlmUsageEvent_userId_idx` ON `LlmUsageEvent` (`userId`);--> statement-breakpoint
CREATE INDEX `LlmUsageEvent_userId_provider_idx` ON `LlmUsageEvent` (`userId`,`provider`);