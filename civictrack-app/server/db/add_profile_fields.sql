-- Add profile fields to users table
-- Run this migration to extend user profile with picture, address, phone, and document ID

ALTER TABLE `users` 
ADD COLUMN `profile_picture` VARCHAR(512) NULL DEFAULT NULL AFTER `password`,
ADD COLUMN `phone` VARCHAR(20) NULL DEFAULT NULL AFTER `profile_picture`,
ADD COLUMN `address` TEXT NULL DEFAULT NULL AFTER `phone`,
ADD COLUMN `city` VARCHAR(100) NULL DEFAULT NULL AFTER `address`,
ADD COLUMN `state` VARCHAR(100) NULL DEFAULT NULL AFTER `city`,
ADD COLUMN `postal_code` VARCHAR(10) NULL DEFAULT NULL AFTER `state`,
ADD COLUMN `government_id_type` ENUM('pan', 'aadhar', 'driving_licence', 'passport') NULL DEFAULT NULL AFTER `postal_code`,
ADD COLUMN `government_id_number` VARCHAR(50) NULL DEFAULT NULL AFTER `government_id_type`,
ADD COLUMN `government_id_image_url` VARCHAR(512) NULL DEFAULT NULL AFTER `government_id_number`;
