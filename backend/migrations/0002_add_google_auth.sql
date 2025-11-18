-- Migration: Add Google OAuth support to users table
-- Date: 2025-11-08
-- Task: T37 - Backend Google OAuth Login

-- Add Google OAuth related columns to users table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email' CHECK(auth_provider IN ('email', 'google'));
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Enforce uniqueness for Google IDs to prevent duplicated links
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Update existing users to have auth_provider = 'email'
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;
