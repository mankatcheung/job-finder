CREATE TABLE `DocumentDraft` (
	`id` text PRIMARY KEY NOT NULL,
	`applicationId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`contentJson` text DEFAULT '{}' NOT NULL,
	`plainText` text DEFAULT '' NOT NULL,
	`sourceDocumentId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `JobApplication`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sourceDocumentId`) REFERENCES `Document`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `DocumentDraft_applicationId_idx` ON `DocumentDraft` (`applicationId`);--> statement-breakpoint
CREATE INDEX `DocumentDraft_sourceDocumentId_idx` ON `DocumentDraft` (`sourceDocumentId`);--> statement-breakpoint
ALTER TABLE `Document` ADD `sourceDraftId` text REFERENCES DocumentDraft(id);