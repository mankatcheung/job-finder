ALTER TABLE `JobApplication` ADD `deletedAt` integer;--> statement-breakpoint
CREATE INDEX `JobApplication_deletedAt_idx` ON `JobApplication` (`deletedAt`);