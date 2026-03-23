-- Migration: Add Google OAuth support columns
-- Date: 2025-01-29

-- Add google_id column to store Google user ID
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER email;

-- Add avatar_url column to store user's Google profile picture
ALTER TABLE users
ADD COLUMN avatar_url TEXT NULL AFTER google_id;

-- Add index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Update existing users: password can be NULL for Google-only accounts
-- (Not changing existing schema, just documenting that google_id users may have NULL password)

-- Verify the changes
DESCRIBE users;
