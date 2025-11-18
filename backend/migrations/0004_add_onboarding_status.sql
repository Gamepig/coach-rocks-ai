-- Migration: Add onboarding_completed column to users table
-- Purpose: Track whether users have completed the onboarding wizard

ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have completed onboarding (they are already past this step)
UPDATE users SET onboarding_completed = TRUE WHERE created_at IS NOT NULL;
