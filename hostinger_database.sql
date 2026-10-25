-- Hostinger MySQL Database Schema for Printex / PrintDeck
-- Copy and paste this into Hostinger hPanel -> Databases -> phpMyAdmin -> SQL tab

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `token` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shops` (
  `id` VARCHAR(64) PRIMARY KEY,
  `owner_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `owner` VARCHAR(100) NOT NULL,
  `whatsapp` VARCHAR(20) NOT NULL,
  `upi_id` VARCHAR(100) DEFAULT '',
  `address` TEXT NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `referral` VARCHAR(50) DEFAULT NULL,
  `price_bw` DECIMAL(6,2) NOT NULL DEFAULT 2.00,
  `price_color` DECIMAL(6,2) NOT NULL DEFAULT 10.00,
  `double_discount` DECIMAL(4,2) NOT NULL DEFAULT 0.25,
  `price_spiral` DECIMAL(6,2) NOT NULL DEFAULT 30.00,
  `price_staple` DECIMAL(6,2) NOT NULL DEFAULT 5.00,
  `price_lamination` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  `accept_uploads` TINYINT(1) NOT NULL DEFAULT 1,
  `show_whatsapp` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) PRIMARY KEY,
  `token_no` VARCHAR(10) NOT NULL,
  `shop_id` VARCHAR(64) NOT NULL,
  `customer` VARCHAR(100) NOT NULL,
  `customer_phone` VARCHAR(20) DEFAULT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `pages` INT NOT NULL DEFAULT 1,
  `copies` INT NOT NULL DEFAULT 1,
  `color` VARCHAR(20) NOT NULL DEFAULT 'bw',
  `sides` VARCHAR(20) NOT NULL DEFAULT 'single',
  `paper_size` VARCHAR(20) NOT NULL DEFAULT 'A4',
  `binding` VARCHAR(30) NOT NULL DEFAULT 'none',
  `page_range` VARCHAR(100) NOT NULL DEFAULT 'all',
  `amount` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `payment_status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`shop_id`),
  INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
