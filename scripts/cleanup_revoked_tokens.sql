-- Cleanup revoked OAuth tokens from Supabase
-- Run this in Supabase SQL Editor if tokens were revoked in Google

-- First, check which tokens exist
SELECT 
  user_id,
  provider,
  email,
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token,
  created_at,
  updated_at
FROM oauth_tokens
ORDER BY updated_at DESC;

-- Delete tokens for users who revoked access
-- Option 1: Delete all tokens (if you want to force re-auth for everyone)
-- DELETE FROM oauth_tokens;

-- Option 2: Delete tokens for specific users (if you know the email)
-- DELETE FROM oauth_tokens WHERE email = 'user@example.com';

-- Option 3: Delete tokens older than a certain date
-- DELETE FROM oauth_tokens WHERE updated_at < NOW() - INTERVAL '30 days';

-- Check users table for users that need re-auth
SELECT 
  id,
  email,
  raw_app_meta_data->>'provider' as provider,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'google'
ORDER BY last_sign_in_at DESC;
