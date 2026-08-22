CREATE TABLE `CookieConsent` (
	`id` text PRIMARY KEY NOT NULL,
	`analyticsAccepted` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`consentedAt` integer NOT NULL
);
