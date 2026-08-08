ALTER TABLE `User` ADD `digestFrequency` text DEFAULT 'weekly' NOT NULL;
UPDATE `User` SET `digestFrequency` = 'off' WHERE `weeklyDigestEnabled` = 0;
