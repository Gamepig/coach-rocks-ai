-- Add rate limiting column to users table
-- This tracks the timestamp of the last analysis submission per user
-- Used to enforce 30-second minimum interval between consecutive analyses

ALTER TABLE users ADD COLUMN last_analysis_timestamp TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups during rate limit checks
CREATE INDEX idx_users_last_analysis_timestamp ON users(last_analysis_timestamp);

-- Update migration history
-- Migration: 0006_add_analysis_rate_limiting.sql
-- Purpose: Add rate limiting support for analysis submissions
-- Date: 2025-11-16
