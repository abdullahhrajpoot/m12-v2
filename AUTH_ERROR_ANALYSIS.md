# Authorization Error Analysis

## Current Status

### Token Refresh Cron
✅ **Working**: Token refresh cron (`Ek0ft5PCAEv3qB5b`) is running successfully every 10 minutes
- Last successful: 2026-01-16 23:00:35
- All recent executions show `status: success`

### Tokens in Database
⚠️ **Problem**: Tokens ending with `...0206` are still present and being rejected by Google
- User `ecb8cdd3-e8cc-4da3-99b3-f197c7dce7da`: Token ends `...22i6Cw0206`
- Token shows as "Valid" with ~3481 seconds remaining
- But Google API rejects it with 401 UNAUTHENTICATED

### Workflow Execution
❌ **Failing**: `Parallelized_Onboarding_Supabase` workflow fails at Gmail API call
- Error: `401 - Request had invalid authentication credentials`
- Token shows `was_refreshed: true` and `is_expired: false`
- But Google still rejects the access token

## Root Cause

The tokens ending with `...0206` are **invalid refresh tokens** that were created before we fixed the Railway variable mismatch (`NEXT_PUBLIC_SUPABASE_URL`). 

**The Problem:**
1. Old refresh tokens were created with mismatched OAuth redirect URIs
2. Google issued tokens that it now rejects
3. Token refresh "succeeds" (no error), but Google rejects the resulting access token
4. This creates a cycle: refresh succeeds → token saved → Google rejects it → workflow fails

## Solution

### Step 1: Delete All Invalid Tokens

These tokens need to be deleted because they're fundamentally invalid:

```sql
-- Check current tokens
SELECT user_id, 
       LEFT(access_token, 20) || '...' || RIGHT(access_token, 10) as token_preview,
       updated_at
FROM oauth_tokens
WHERE provider = 'google'
ORDER BY updated_at DESC;

-- Delete tokens ending with 0206 (or just delete all and force re-auth)
-- Option A: Delete specific problematic tokens
DELETE FROM oauth_tokens 
WHERE provider = 'google' 
  AND access_token LIKE '%0206';

-- Option B: Delete ALL tokens (forces fresh re-authentication)
-- DELETE FROM oauth_tokens WHERE provider = 'google';
```

### Step 2: Clean Up Mismatched Users

From `SUPABASE_USER_CLEANUP_GUIDE.md`:
1. Delete users from Authentication → Users (if they exist there but not in public.users)
2. Delete from `oauth_tokens` table
3. Delete from `public.users` table if needed

### Step 3: Re-authenticate

After deleting tokens:
1. User must sign up/sign in again
2. This will create **fresh tokens** with correct OAuth redirect URIs
3. New tokens should work correctly

### Step 4: Verify OAuth Configuration

Ensure these are correctly set in Railway (both service and shared variables):
- `NEXT_PUBLIC_SUPABASE_URL=https://api.bippity.boo` ✅ (should be fixed)
- `NEXT_PUBLIC_APP_URL=https://bippity.boo` ✅ (should be fixed)
- `GOOGLE_CLIENT_ID` ✅ (must match Supabase and Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` ✅ (must match Supabase and Google Cloud Console)

Verify in Google Cloud Console that these redirect URIs are configured:
- `https://api.bippity.boo/auth/v1/callback`
- `https://bippity.boo/auth/callback`

## Why This Happens

The token refresh cron is **working correctly**, but:

1. **Invalid Refresh Token**: The `refresh_token` in the database was created with mismatched OAuth config
2. **Google Rejects New Tokens**: Even though refresh "succeeds", Google rejects the resulting access token
3. **Cycle Continues**: Token gets refreshed, saved to DB, but still rejected when used

The refresh endpoint doesn't validate if Google will actually accept the new token - it just checks if the refresh API call succeeded.

## Immediate Fix

**For user `ecb8cdd3-e8cc-4da3-99b3-f197c7dce7da`:**

1. Delete their token:
   ```sql
   DELETE FROM oauth_tokens 
   WHERE user_id = 'ecb8cdd3-e8cc-4da3-99b3-f197c7dce7da'::uuid
     AND provider = 'google';
   ```

2. Have them sign out and sign in again
3. This creates fresh tokens with correct OAuth configuration
4. Workflow should then work

## Prevention

After fixing:
- Monitor token refresh cron logs for any refresh failures
- Check if `was_refreshed: true` tokens are actually accepted by Google
- If tokens keep being rejected after refresh, the refresh_token itself is invalid

## Verification

After re-authentication, verify the new token works:
1. Check token in DB - should NOT end with `...0206`
2. Test the token manually:
   ```bash
   curl -H "Authorization: Bearer <new_access_token>" \
        "https://www.googleapis.com/gmail/v1/users/me/profile"
   ```
3. If this works, the workflow should work too
