CREATE TABLE `handoff_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`handoffId` int NOT NULL,
	`actorProfileId` int,
	`fromStatus` varchar(40),
	`toStatus` varchar(40) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `handoff_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `handoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offerId` int NOT NULL,
	`organizationProfileId` int NOT NULL,
	`volunteerProfileId` int,
	`collectionMode` enum('volunteer','self') NOT NULL DEFAULT 'volunteer',
	`status` enum('accepted','handoff_arranged','picked_up','on_the_way','delivered','completed','issue_reported') NOT NULL DEFAULT 'accepted',
	`assignedAt` timestamp,
	`pickedUpAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `handoffs_id` PRIMARY KEY(`id`),
	CONSTRAINT `handoffs_offer_unique` UNIQUE(`offerId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientProfileId` int NOT NULL,
	`offerId` int,
	`handoffId` int,
	`type` varchar(60) NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offer_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offerId` int NOT NULL,
	`organizationProfileId` int NOT NULL,
	`status` enum('pending','accepted','declined','withdrawn') NOT NULL DEFAULT 'pending',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offer_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pickup_hubs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`address` text NOT NULL,
	`contactName` varchar(160),
	`contactPhone` varchar(40),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pickup_hubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('donor','organization','volunteer') NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`phone` varchar(40),
	`serviceArea` varchar(160),
	`capacity` int,
	`availability` varchar(160),
	`transportMode` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_user_role_unique` UNIQUE(`userId`,`role`)
);
--> statement-breakpoint
CREATE TABLE `reported_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`handoffId` int NOT NULL,
	`reporterProfileId` int NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `reported_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rescue_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`donorProfileId` int NOT NULL,
	`foodName` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`quantity` int NOT NULL,
	`quantityUnit` varchar(30) NOT NULL,
	`servings` int NOT NULL,
	`condition` enum('fresh','good','soon') NOT NULL,
	`preparedAt` timestamp NOT NULL,
	`readyAt` timestamp NOT NULL,
	`bestBeforeAt` timestamp NOT NULL,
	`storageMethod` varchar(120),
	`allergens` text,
	`servingNotes` text,
	`pickupAddress` text NOT NULL,
	`pickupHubId` int,
	`pickupInstructions` text,
	`imagePath` varchar(500),
	`status` enum('draft','available','requested','accepted','handoff_arranged','picked_up','on_the_way','delivered','completed','expired','cancelled','issue_reported') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rescue_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trust_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`handoffId` int NOT NULL,
	`receiptCode` varchar(40) NOT NULL,
	`outcome` varchar(160) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trust_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `trust_receipts_receiptCode_unique` UNIQUE(`receiptCode`),
	CONSTRAINT `trust_receipts_handoff_unique` UNIQUE(`handoffId`)
);
--> statement-breakpoint
ALTER TABLE `handoff_events` ADD CONSTRAINT `handoff_events_handoffId_handoffs_id_fk` FOREIGN KEY (`handoffId`) REFERENCES `handoffs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `handoff_events` ADD CONSTRAINT `handoff_events_actorProfileId_profiles_id_fk` FOREIGN KEY (`actorProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `handoffs` ADD CONSTRAINT `handoffs_offerId_rescue_offers_id_fk` FOREIGN KEY (`offerId`) REFERENCES `rescue_offers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `handoffs` ADD CONSTRAINT `handoffs_organizationProfileId_profiles_id_fk` FOREIGN KEY (`organizationProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `handoffs` ADD CONSTRAINT `handoffs_volunteerProfileId_profiles_id_fk` FOREIGN KEY (`volunteerProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientProfileId_profiles_id_fk` FOREIGN KEY (`recipientProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_offerId_rescue_offers_id_fk` FOREIGN KEY (`offerId`) REFERENCES `rescue_offers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_handoffId_handoffs_id_fk` FOREIGN KEY (`handoffId`) REFERENCES `handoffs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_requests` ADD CONSTRAINT `offer_requests_offerId_rescue_offers_id_fk` FOREIGN KEY (`offerId`) REFERENCES `rescue_offers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_requests` ADD CONSTRAINT `offer_requests_organizationProfileId_profiles_id_fk` FOREIGN KEY (`organizationProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reported_issues` ADD CONSTRAINT `reported_issues_handoffId_handoffs_id_fk` FOREIGN KEY (`handoffId`) REFERENCES `handoffs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reported_issues` ADD CONSTRAINT `reported_issues_reporterProfileId_profiles_id_fk` FOREIGN KEY (`reporterProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rescue_offers` ADD CONSTRAINT `rescue_offers_donorProfileId_profiles_id_fk` FOREIGN KEY (`donorProfileId`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rescue_offers` ADD CONSTRAINT `rescue_offers_pickupHubId_pickup_hubs_id_fk` FOREIGN KEY (`pickupHubId`) REFERENCES `pickup_hubs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trust_receipts` ADD CONSTRAINT `trust_receipts_handoffId_handoffs_id_fk` FOREIGN KEY (`handoffId`) REFERENCES `handoffs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `handoff_events_handoff_idx` ON `handoff_events` (`handoffId`);--> statement-breakpoint
CREATE INDEX `handoffs_status_idx` ON `handoffs` (`status`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipientProfileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `offer_requests_offer_idx` ON `offer_requests` (`offerId`);--> statement-breakpoint
CREATE INDEX `offer_requests_org_idx` ON `offer_requests` (`organizationProfileId`);--> statement-breakpoint
CREATE INDEX `pickup_hubs_active_idx` ON `pickup_hubs` (`active`);--> statement-breakpoint
CREATE INDEX `profiles_role_idx` ON `profiles` (`role`);--> statement-breakpoint
CREATE INDEX `reported_issues_status_idx` ON `reported_issues` (`status`);--> statement-breakpoint
CREATE INDEX `rescue_offers_status_idx` ON `rescue_offers` (`status`);--> statement-breakpoint
CREATE INDEX `rescue_offers_best_before_idx` ON `rescue_offers` (`bestBeforeAt`);--> statement-breakpoint
CREATE INDEX `rescue_offers_donor_idx` ON `rescue_offers` (`donorProfileId`);