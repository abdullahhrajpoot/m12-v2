# OAuth Troubleshooting Guide

## If Redirect URI Already Exists in Google Cloud Console

Since the redirect URI is already configured, the issue is likely elsewhere. Let's diagnose systematically.

## Step 1: Verify Exact Configuration Match

### Check 1: Redirect URI Format
Make sure the redirect URI in Google Cloud Console is **exactly**:
```
https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
```

**Common mistakes:**
- ❌ Trailing slash: `https://.../auth/v1/callback/`
- ❌ Wrong protocol: `http://...` instead of `https://`
- ❌ Wrong path: `/auth/callback` instead of `/auth/v1/callback`
- ❌ Extra spaces or characters

### Check 2: Client ID Match
1. Go to **Supabase Dashboard** → Authentication → Providers → Google
2. Copy the **Client ID (for OAuth)**
3. Go to **Google Cloud Console** → APIs & Services → Credentials
4. Find the OAuth client and verify the Client ID matches **exactly**

### Check 3: Client Secret Match
1. In Supabase, copy the **Client Secret (for OAuth)**
2. In Google Cloud Console, click "Reveal" on the Client Secret
3. Verify they match **exactly** (no extra spaces, same case)

## Step 2: Check What Error You're Actually Getting

### If you see `redirect_uri_mismatch`:
- Even if the URI is there, Google might be sending a slightly different one
- Check browser console (F12) for the exact redirect URI being used
- Compare it character-by-character with what's in Google Cloud Console

### If you see other errors:
- `access_denied` - User didn't grant permissions
- `invalid_client` - Client ID/Secret mismatch
- `invalid_grant` - Token expired or invalid
- `unauthorized_client` - Client not authorized for this flow

## Step 3: Check OAuth Client Type

In Google Cloud Console → OAuth client settings:
1. Check **Application type** - should be **Web application**
2. Check **Authorized JavaScript origins** - should include:
   - `https://fvjmzvvcyxsvstlhenex.supabase.co`
   - `https://bippity.boo`

## Step 4: Verify Supabase Provider Settings

1. Go to **Supabase Dashboard** → Authentication → Providers → Google
2. Verify:
   - ✅ **Enabled** toggle is ON
   - ✅ **Client ID (for OAuth)** matches Google Cloud Console
   - ✅ **Client Secret (for OAuth)** matches Google Cloud Console
   - ✅ **Redirect URLs** includes: `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback`

## Step 5: Check for Multiple OAuth Clients

You might have multiple OAuth clients in Google Cloud Console:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. List all OAuth 2.0 Client IDs
3. For each one, check:
   - Does the Client ID match Supabase?
   - Does it have the redirect URI?
4. **Make sure you're using the correct OAuth client** - the one whose Client ID matches Supabase

## Step 6: Test with Browser DevTools

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click "Sign Up With Google" on your app
4. Look for the OAuth request to Google
5. Check:
   - What `redirect_uri` parameter is being sent?
   - What `client_id` is being used?
   - What error response (if any) is returned?

## Step 7: Check Railway Environment Variables

Verify these are set correctly in Railway:
```
NEXT_PUBLIC_SUPABASE_URL=https://fvjmzvvcyxsvstlhenex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_APP_URL=https://bippity.boo
```

## Step 8: Check Railway Logs

```bash
railway logs
```

Look for:
- Any errors mentioning "redirect_uri"
- Any errors mentioning "OAuth"
- Any errors mentioning "Supabase Auth"
- Check the exact redirect URI being used

## Step 9: Common Issues

### Issue: Using Wrong Google Cloud Project
- **Symptom**: Client ID doesn't match
- **Fix**: Make sure you're in the correct Google Cloud project that matches Supabase's Client ID

### Issue: OAuth Consent Screen Not Configured
- **Symptom**: Users see error about consent screen
- **Fix**: Go to Google Cloud Console → APIs & Services → OAuth consent screen
- Make sure it's configured (even if in Testing mode)

### Issue: Required Scopes Not Approved
- **Symptom**: Users can't grant all required permissions
- **Fix**: Go to OAuth consent screen → Scopes → Make sure all scopes are added:
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.labels`
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/tasks`

### Issue: Testing vs Production Mode
- **Symptom**: Only certain users can sign in
- **Fix**: 
  - Go to OAuth consent screen
  - If in "Testing" mode, add test users
  - Or publish the app (requires verification if using sensitive scopes)

## Step 10: Diagnostic Script

Run this to check your configuration:
```bash
node scripts/find_supabase_redirect_uri.js
./scripts/verify_oauth_config.sh
```

## Still Not Working?

Provide these details:

1. **Exact error message** (screenshot or copy/paste)
2. **Browser console errors** (F12 → Console tab)
3. **Network tab details** (F12 → Network tab → find the OAuth request)
4. **Client ID from Supabase** (first 10-20 characters, don't share full ID)
5. **Whether redirect URI in Google Cloud Console matches exactly** (character by character)

## Quick Test: Try Different Redirect URI

If nothing else works, try adding these additional redirect URIs to Google Cloud Console:

```
https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
https://bippity.boo/auth/callback
http://localhost:3000/auth/callback
```

Sometimes Supabase might be using a different redirect URI in certain scenarios.
