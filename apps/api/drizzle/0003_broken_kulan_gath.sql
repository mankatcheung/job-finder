ALTER TABLE `Session` ADD `currentRefreshTokenId` text;--> statement-breakpoint
ALTER TABLE `Session` ADD `previousRefreshTokenId` text;--> statement-breakpoint
ALTER TABLE `Session` ADD `previousRotatedAt` integer;