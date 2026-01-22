# OAuth Token Refresh RLS Fix - COMPLETED

## Date: 2026-01-16

## Problem Summary
OAuth token refresh was silently failing, causing n8n workflows to receive expired tokens and get 401 errors from Google Calendar/Tasks APIs.

## Root Cause
The `oauth_tokens` table had Row Level Security (RLS) enabled but **NO UPDATE or INSERT policies**. When the service role tried to update tokens:
- Supabase UPDATE returned "success" (no error)
- But actually updated **0 rows** due to RLS blocking it
- Database showed only 1 successful update ever
- Railway logs showed dozens of "Token refreshed successfully" messages

## Solution Applied

### 1. Created Migration: `migrations/004_add_oauth_tokens_update_policy.sql`

Added two critical policies:

```sql
-- Allow authenticated users (including service role) to UPDATE tokens
CREATE POLICY "Service role can update oauth tokens" 
ON oauth_tokens
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users (including service role) to INSERT tokens
CREATE POLICY "Service role can insert oauth tokens"
ON oauth_tokens
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### 2. Applied Migration Successfully ✅

Migration applied to Supabase at approximately 05:57 UTC on 2026-01-16.

### 3. Verified Policies Active ✅

Confirmed three policies now exist on `oauth_tokens`:
- **INSERT**: "Service role can insert oauth tokens" (authenticated)
- **SELECT**: "Users can view their own tokens" (public, user_id match)
- **UPDATE**: "Service role can update oauth tokens" (authenticated)

### 4. Current Token Status ✅

- Current token last updated: `2026-01-16 05:55:03` (before fix)
- Token expires at: `2026-01-16 06:55:02`
- Token is valid: YES (57 minutes remaining)
- Next cron refresh: Around `2026-01-16 06:45` (every 50 minutes)

## Testing Required

### Manual Test Steps

**1. Activate Workflow in n8n UI:**
   - Go to n8n cloud dashboard
   - Open workflow: "Bippity - AI Email Processor" (ID: `RN3CGbcsMJy3ExwA`)
   - Toggle to **Active**

**2. Monitor Next Execution:**
   
   The workflow runs every 5 minutes. Watch for:
   - ✅ No "Required → at location" schema errors
   - ✅ Calendar/Tasks API calls succeed (no 401 errors)
   - ✅ Tool workflows return actual data (not 401 error objects)

**3. Verify Token Updates After Next Cron:**
   
   After ~06:45 UTC, check that multiple updates are persisting:
   
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE updated_at > created_at) as total_updates,
     MAX(updated_at) as last_update,
     updated_at
   FROM oauth_tokens
   WHERE user_id = 'e261d74f-63b9-43f3-b6d2-62b6ee441f2e'
   ORDER BY updated_at DESC;
   ```
   
   Should show: `total_updates > 1`

## Expected Behavior After Fix

### Before Fix:
- ❌ Token refresh → RLS blocks UPDATE → 0 rows updated
- ❌ Code returns success (silent failure)
- ❌ Next request → expired token → 401 from Google
- ❌ Dozens of "refreshed successfully" logs but only 1 DB update

### After Fix:
- ✅ Token refresh → UPDATE succeeds → token persisted
- ✅ Database shows multiple updates over time
- ✅ Fresh tokens retrieved from `/api/auth/tokens`
- ✅ Google API calls succeed
- ✅ No more 401 errors in n8n executions

## Files Modified

1. ✅ Created: `migrations/004_add_oauth_tokens_update_policy.sql`
2. ✅ Applied migration to Supabase
3. ✅ Created this documentation: `OAUTH_RLS_FIX_COMPLETE.md`

## Key Metrics

- **Before**: 1 total update in oauth_tokens table since creation
- **After**: Will see multiple updates as cron runs (every 50 min)
- **Impact**: All n8n workflows using Google APIs should now work without 401 errors

## Next Steps

1. **Activate the workflow** in n8n UI
2. **Monitor next execution** (within 5 minutes of activation)
3. **Verify no 401 errors** in execution logs
4. **Confirm token updates persist** after next cron cycle (~06:45 UTC)

## Additional Notes

- The existing token is valid until 06:55 UTC
- Service role client at `/app/api/auth/tokens/route.ts` already has cache-control headers
- No code changes needed - only database policy changes
- The fix addresses the silent failure mode where Supabase doesn't throw errors when RLS blocks operations
