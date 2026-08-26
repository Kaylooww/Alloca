CREATE TABLE `budget_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`allowance` real NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`closing_income` real,
	`closing_expenses` real,
	`closing_surplus` real,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_cycles_user_start_unique` ON `budget_cycles` (`user_id`,`start_date`);--> statement-breakpoint
CREATE INDEX `budget_cycles_user_status_idx` ON `budget_cycles` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`color` text DEFAULT 'chart-1' NOT NULL,
	`icon` text DEFAULT 'Wallet' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_user_name_unique` ON `categories` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `categories_user_hidden_idx` ON `categories` (`user_id`,`is_hidden`);--> statement-breakpoint
CREATE TABLE `savings_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `savings_goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `savings_contributions_goal_date_idx` ON `savings_contributions` (`goal_id`,`date`);--> statement-breakpoint
CREATE INDEX `savings_contributions_user_date_idx` ON `savings_contributions` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` integer,
	`note` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `savings_goals_user_status_idx` ON `savings_goals` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cycle_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` text,
	`income_source` text,
	`description` text,
	`date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cycle_id`) REFERENCES `budget_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transactions_user_date_idx` ON `transactions` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_cycle_idx` ON `transactions` (`cycle_id`);--> statement-breakpoint
CREATE INDEX `transactions_user_type_idx` ON `transactions` (`user_id`,`type`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`weekly_allowance` real DEFAULT 1500 NOT NULL,
	`reset_day_of_week` integer DEFAULT 1 NOT NULL,
	`reset_hour` integer DEFAULT 0 NOT NULL,
	`reset_minute` integer DEFAULT 0 NOT NULL,
	`timezone` text DEFAULT 'Asia/Manila' NOT NULL,
	`currency` text DEFAULT 'PHP' NOT NULL,
	`notify_low_balance` integer DEFAULT true NOT NULL,
	`notify_cycle_reset` integer DEFAULT true NOT NULL,
	`notify_goal_progress` integer DEFAULT true NOT NULL,
	`low_balance_threshold` integer DEFAULT 25 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);