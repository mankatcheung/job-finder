CREATE TABLE `Offer` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`baseSalary` integer NOT NULL,
	`bonus` integer,
	`equity` text,
	`benefits` text,
	`costOfLivingAdjustment` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`period` text DEFAULT 'yearly' NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Offer_applicationId_idx` ON `Offer` (`applicationId`);