CREATE TABLE `Education` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`institution` text NOT NULL,
	`degree` text,
	`field` text,
	`startDate` integer NOT NULL,
	`endDate` integer,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Education_userId_idx` ON `Education` (`userId`);--> statement-breakpoint
CREATE TABLE `Skill` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`proficiency` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Skill_userId_idx` ON `Skill` (`userId`);--> statement-breakpoint
CREATE TABLE `WorkExperience` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`company` text NOT NULL,
	`title` text NOT NULL,
	`location` text,
	`startDate` integer NOT NULL,
	`endDate` integer,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `WorkExperience_userId_idx` ON `WorkExperience` (`userId`);