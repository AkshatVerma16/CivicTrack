-- Add missing status values to complaints table
-- Run this migration to add 'Resolved' and 'Withdrawn' status options

ALTER TABLE `complaints` 
MODIFY COLUMN `status` ENUM('Pending', 'In Progress', 'Complete', 'Resolved', 'Withdrawn') NOT NULL DEFAULT 'Pending';

-- Also add confirmed_at column to track when user confirms resolution
ALTER TABLE `complaints` 
ADD COLUMN `confirmed_at` TIMESTAMP NULL DEFAULT NULL AFTER `updated_at`;
