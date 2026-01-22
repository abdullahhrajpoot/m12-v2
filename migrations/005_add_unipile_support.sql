-- Migration: Add Unipile support to oauth_tokens and unified_events tables
-- Purpose: Enable Unipile OAuth and email sync for new onboarding workflow

-- Add Unipile account tracking to oauth_tokens table
ALTER TABLE oauth_tokens 
  ADD COLUMN IF NOT EXISTS unipile_account_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_email TEXT;

-- Index for fast lookups by Unipile account ID
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_unipile_account 
  ON oauth_tokens(unipile_account_id) 
  WHERE unipile_account_id IS NOT NULL;

-- Add fields to track Unipile webhook data in unified_events
ALTER TABLE unified_events 
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS synced_from TEXT; -- 'unipile_webhook', 'unipile_historical', 'manual'

-- Indexes for efficient unified_events queries
CREATE INDEX IF NOT EXISTS idx_unified_events_status 
  ON unified_events(user_id, processing_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_events_onboarding 
  ON unified_events(user_id, processing_status, created_at DESC)
  WHERE processing_status = 'for_onboarding';

-- Comments for documentation
COMMENT ON COLUMN oauth_tokens.unipile_account_id IS 'Unipile account ID for users authenticated via Unipile';
COMMENT ON COLUMN oauth_tokens.provider_email IS 'Email address associated with the OAuth provider';
COMMENT ON COLUMN unified_events.processing_status IS 'Status for email processing: pending, for_onboarding, processed, etc.';
COMMENT ON COLUMN unified_events.synced_from IS 'Source of sync: unipile_webhook, unipile_historical, or manual';
