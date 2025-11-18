-- Migration: Add provider-related columns to meetings table for auto-analysis tracking

ALTER TABLE meetings ADD COLUMN provider TEXT;
ALTER TABLE meetings ADD COLUMN provider_meeting_id TEXT;
ALTER TABLE meetings ADD COLUMN correlation_id TEXT;

-- Helpful indexes for lookup and tracing
CREATE INDEX IF NOT EXISTS idx_meetings_provider ON meetings(provider);
CREATE INDEX IF NOT EXISTS idx_meetings_provider_meeting_id ON meetings(provider_meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_correlation_id ON meetings(correlation_id);

