# OAuth Credentials Diagnostic

## Google Cloud Console Client ID (confirmed)
```
490719612316-cq3nj8ikevoga40splltk6b7c2fq1cju.apps.googleusercontent.com
```

## Status Check

### ✅ What We Know:
1. **Token endpoint working**: `/api/auth/tokens` successfully retrieves and refreshes tokens
2. **Token exists in Supabase**: Last updated at `2026-01-14 21:12:34`
3. **Token includes Tasks scope**: Based on earlier execution logs
4. **Google is rejecting the token**: 401 "Invalid Credentials" when calling Tasks API

### ❌ What's Wrong:
**The token was issued by one OAuth app, but Google Tasks API expects a token from a different OAuth app.**

This happens when:
- Supabase used Client ID `X` to issue the token during sign-in
- But Railway/Next.js uses Client ID `Y` to refresh the token
- Google sees the mismatch and rejects it

## What You Need to Verify

### 1. Check Supabase Dashboard
**URL**: https://supabase.com/dashboard/project/fvjmzvvcyxsvstlhenex/auth/providers

Click on **Google** provider and check:
- **Client ID (for OAuth)**: Does it equal `490719612316-cq3nj8ikevoga40splltk6b7c2fq1cju.apps.googleusercontent.com`?
- **Client Secret (for OAuth)**: Copy this value

### 2. Check Railway Environment Variables
**URL**: https://railway.app/dashboard (your project)

Go to **Variables** tab and check:
- `GOOGLE_CLIENT_ID`: Does it equal `490719612316-cq3nj8ikevoga40splltk6b7c2fq1cju.apps.googleusercontent.com`?
- `GOOGLE_CLIENT_SECRET`: Does it match the secret from Supabase?
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: (optional) Should equal `GOOGLE_CLIENT_ID` if set

## Quick Fix Steps

### If Credentials DON'T Match:

1. **Get Client Secret from Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```
   - Find OAuth client: `490719612316-cq3nj8ikevoga40splltk6b7c2fq1cju...`
   - Copy the **Client Secret** (click "Show" or edit to reveal)

2. **Update Supabase**:
   - Paste Client ID: `490719612316-cq3nj8ikevoga40splltk6b7c2fq1cju.apps.googleusercontent.com`
   - Paste Client Secret from step 1
   - Click Save

3. **Update Railway**:
   - Set `GOOGLE_CLIENT_ID` = `490719612316-cq3nj8ikevoga40splltk6b7c2fq1cju.apps.googleusercontent.com`
   - Set `GOOGLE_CLIENT_SECRET` = (same secret from step 1)
   - Redeploy the app

4. **Clean Up Old Tokens**:
   ```sql
   -- Run this in Supabase SQL Editor
   DELETE FROM oauth_tokens;
   ```

5. **Re-authenticate**:
   - Go to https://bippity.boo
   - Sign in with Google again
   - This will generate new tokens with the correct credentials

### If Credentials DO Match:

Then the issue might be:
1. **Tasks API not enabled**: Go to Google Cloud Console → APIs & Services → Enabled APIs, ensure "Tasks API" is enabled
2. **Wrong Google project**: Verify you're using the correct Google Cloud project
3. **Scopes not requested**: Check OAuth consent screen includes Tasks scope

## Test After Fix

Run the test workflow again:
1. Go to n8n: "Test Token - Google Tasks API"
2. Click "Execute Workflow"
3. Should return your Google Tasks lists without 401 error

## Current Token Info

Last token in database:
- User ID: `8ac8bfee-c53a-4c35-b2d0-f92b0906b146`
- Provider: `google`
- Expires: `2026-01-14 22:12:33`
- Updated: `2026-01-14 21:12:34`
