# Complete Unipile OAuth Flow Documentation

## End-to-End Flow

```
User clicks "Sign Up" 
  → /api/auth/unipile/connect
  → Generates session_id, stores in cookie
  → Calls Unipile API for hosted auth link
  → Redirects to Unipile OAuth

User completes OAuth on Unipile
  → Unipile sends webhook to /api/webhooks/unipile/account (stores account_id)
  → Unipile redirects to /api/auth/unipile/callback?session_id=...

Callback route:
  → Looks up account_id from webhook data (with retries)
  → Fetches email from Unipile API (with fallbacks)
  → Creates/updates Supabase user (Admin API, confirmed)
  → Establishes session (Admin API magic link)
  → Stores unipile_account_id in oauth_tokens
  → Triggers n8n workflow
  → Redirects to /whatwefound

Whatwefound page:
  → If session param exists, polls for account creation
  → Once account ready (or no session param), polls for onboarding summary
  → Shows loading state until data arrives
```

## Key Fixes Implemented

### 1. Cookie Domain Consistency
**Problem:** Cookies were set with inconsistent domains, causing session loss.

**Solution:**
- Created `lib/cookie-utils.ts` with shared cookie domain helper
- All cookie operations now use `.bippity.boo` domain consistently
- Matches middleware cookie domain configuration

**Files Modified:**
- `lib/cookie-utils.ts` (new)
- `app/api/auth/unipile/connect/route.ts`
- `app/api/auth/unipile/callback/route.ts`

### 2. Session Creation
**Problem:** Using temp password was hacky and didn't create proper sessions.

**Solution:**
- Use Supabase Admin API `generateLink()` with type 'magiclink'
- Extract `hashed_token` from response
- Use `verifyOtp()` with the hashed token to establish session
- Creates proper session with access/refresh tokens

**Files Modified:**
- `app/api/auth/unipile/callback/route.ts`

### 3. Email Fetching
**Problem:** Single method to fetch email, no fallbacks.

**Solution:**
- Try account details endpoint first
- Fallback to messages endpoint to extract email from first message
- Better error handling if email can't be found

**Files Modified:**
- `app/api/auth/unipile/callback/route.ts`

### 4. Error Handling
**Problem:** Errors redirected to landing page, poor UX.

**Solution:**
- Always redirect to `/whatwefound` with error state
- Whatwefound page handles error display gracefully
- Better logging for debugging

**Files Modified:**
- `app/api/auth/unipile/callback/route.ts`
- `app/whatwefound/page.tsx`
- `app/page.tsx` (handles session param redirect)

### 5. Cookie Domain in Callback
**Problem:** Callback route didn't set cookies with correct domain.

**Solution:**
- Updated `setAll` in createServerClient to use `.bippity.boo` domain
- Ensures session cookies persist across redirects

**Files Modified:**
- `app/api/auth/unipile/callback/route.ts`

### 6. Whatwefound Polling
**Problem:** Two separate polling mechanisms could conflict.

**Solution:**
- Account status polling only runs if session param exists
- Onboarding summary polling waits for account status to complete
- Better error handling for 401 auth errors (session not ready yet)

**Files Modified:**
- `app/whatwefound/page.tsx`

## Flow States

### Success Path
1. User clicks signup → Unipile OAuth
2. Webhook receives account_id → Stores in database
3. Callback receives session_id → Looks up account_id
4. Creates user → Establishes session
5. Redirects to whatwefound → Polls for onboarding data
6. Onboarding data arrives → User sees facts

### Error Paths

**Webhook arrives before callback:**
- Callback retries up to 5 times (5 seconds total)
- If still not found, redirects to whatwefound with session param
- Whatwefound polls for account status
- When found, proceeds normally

**Callback arrives before webhook:**
- Same as above - whatwefound polls until account is ready

**Email fetch fails:**
- Tries account endpoint
- Tries messages endpoint
- If still fails and no existing user email, redirects to whatwefound with error
- User can retry or contact support

**Session creation fails:**
- User is created in database
- No session established
- Whatwefound will show auth error
- User may need to sign in manually (edge case)

## Environment Variables Required

```
UNIPILE_DSN=https://api27.unipile.com:15744
UNIPILE_API_KEY=your_api_key
UNIPILE_WEBHOOK_SECRET=your_webhook_secret
N8N_UNIPILE_ONBOARDING_WEBHOOK_URL=https://chungxchung.app.n8n.cloud/webhook/parallelized-unipile-onboarding
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://fvjmzvvcyxsvstlhenex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://bippity.boo
```

## Testing Checklist

- [ ] New user signup completes successfully
- [ ] Session persists after redirect to whatwefound
- [ ] Onboarding summary API works (no 401 errors)
- [ ] n8n workflow receives webhook and executes
- [ ] Whatwefound shows loading state correctly
- [ ] Error states display properly
- [ ] Webhook race condition handled (webhook before/after callback)
- [ ] Email fetch fallbacks work
- [ ] Cookie domain works across redirects

## Known Limitations

1. **Magic Link Token Extraction**: Currently using `hashed_token` from Admin API. If this doesn't work, we may need to fall back to temp password approach.

2. **Session Persistence**: If magic link verification fails, user will need to sign in manually. This is an edge case.

3. **Email Placeholder**: If email can't be fetched, we redirect to error page. User would need to contact support or retry.

## Future Improvements

1. **Better Session Recovery**: If session creation fails, automatically retry or use alternative method
2. **Email Verification**: Allow users to verify/update email if placeholder was used
3. **Unified Polling**: Combine account status and onboarding summary polling into single mechanism
4. **Better Error Messages**: More specific error messages for different failure scenarios
