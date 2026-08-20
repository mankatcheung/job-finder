ALTER TABLE `User` ADD `applicationCount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `JobApplication` ADD `documentCount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `User`
SET `applicationCount` = (
  SELECT COUNT(*) FROM `JobApplication`
  WHERE `JobApplication`.`userId` = `User`.`id`
);--> statement-breakpoint
UPDATE `JobApplication`
SET `documentCount` = (
  SELECT COUNT(*) FROM `Document`
  WHERE `Document`.`applicationId` = `JobApplication`.`id`
);
