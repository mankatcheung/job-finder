ALTER TABLE `User` ADD `defaultLlmProvider` text;--> statement-breakpoint
CREATE TABLE `LlmApiKey` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`apiKey` text NOT NULL,
	`model` text,
	`baseUrl` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `LlmApiKey_userId_idx` ON `LlmApiKey` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `LlmApiKey_userId_provider_key` ON `LlmApiKey` (`userId`,`provider`);--> statement-breakpoint
INSERT INTO `LlmApiKey` (`id`, `userId`, `provider`, `apiKey`, `model`, `baseUrl`, `createdAt`, `updatedAt`)
SELECT `id`, `id`, `llmProvider`, `llmApiKey`, `llmModel`, `llmBaseUrl`, `createdAt`, `updatedAt`
FROM `User`
WHERE `llmProvider` IS NOT NULL AND `llmApiKey` IS NOT NULL;--> statement-breakpoint
UPDATE `User` SET `defaultLlmProvider` = `llmProvider`
WHERE `llmProvider` IS NOT NULL AND `llmApiKey` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `llmProvider`;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `llmApiKey`;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `llmModel`;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `llmBaseUrl`;--> statement-breakpoint
ALTER TABLE `Conversation` ADD `llmProvider` text;--> statement-breakpoint
ALTER TABLE `Conversation` ADD `llmModel` text;
