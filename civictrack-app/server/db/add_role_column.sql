USE `civictrack`;

-- Add the role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN role ENUM('admin', 'user', 'ministry', 'vendor') NOT NULL DEFAULT 'user' AFTER password;

-- Verify the column was added
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'civictrack' AND COLUMN_NAME = 'role';
