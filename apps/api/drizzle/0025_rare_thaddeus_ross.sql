CREATE TABLE `CompanyBriefing` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`content` text NOT NULL,
	`generatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CompanyBriefing_applicationId_unique` ON `CompanyBriefing` (`applicationId`);