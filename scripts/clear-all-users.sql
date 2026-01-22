-- Clear All Users and Tokens from Supabase
-- WARNING: This will delete ALL users and data. Use with caution!
-- Run this using Supabase SQL Editor or psql

-- Step 1: Delete all OAuth tokens
DELETE FROM oauth_tokens;

-- Step 2: Delete onboarding summaries
DELETE FROM onboarding_summaries;

-- Step 3: Delete unified events
DELETE FROM unified_events;

-- Step 4: Delete calendar events
DELETE FROM calendar_events;

-- Step 5: Delete tasks
DELETE FROM tasks;

-- Step 6: Delete family facts
DELETE FROM family_facts;

-- Step 7: Delete family keywords
DELETE FROM family_keywords;

-- Step 8: Delete connected services
DELETE FROM connected_services;

-- Step 9: Delete all auth users (requires service role)
-- NOTE: This must be done via Admin API, not SQL
-- See clear-all-users.ts script

-- Step 10: Reset sequences (optional, but good for clean state)
-- ALTER SEQUENCE oauth_tokens_id_seq RESTART WITH 1;
-- ALTER SEQUENCE onboarding_summaries_id_seq RESTART WITH 1;
-- ALTER SEQUENCE unified_events_id_seq RESTART WITH 1;

-- Verify deletions
SELECT 
  (SELECT COUNT(*) FROM oauth_tokens) as oauth_tokens_count,
  (SELECT COUNT(*) FROM onboarding_summaries) as onboarding_summaries_count,
  (SELECT COUNT(*) FROM unified_events) as unified_events_count,
  (SELECT COUNT(*) FROM calendar_events) as calendar_events_count,
  (SELECT COUNT(*) FROM tasks) as tasks_count,
  (SELECT COUNT(*) FROM family_facts) as family_facts_count;
