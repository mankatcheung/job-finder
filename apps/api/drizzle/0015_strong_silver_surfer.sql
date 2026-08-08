ALTER TABLE `User` ADD `digestFrequency` text DEFAULT 'weekly' NOT NULL;
--> statement-breakpoint
UPDATE `User` SET `digestFrequency` = 'off' WHERE `weeklyDigestEnabled` = 0;
