# OAuth Flow Debugging Guide

## Understanding Those URLs

The URLs you're seeing are **normal** parts of Google's OAuth flow:

1. `accounts.google.com/_/OAuthUi/browserinfo` - Google checking browser info
2. `play.google.com/log` - Google Play tracking (normal)
3. `accounts.google.com/_/OAuthUi/gen204` - Google analytics/tracking endpoint (normal)

These don't indicate an error - they're just part of Google's OAuth process.

## What to Check Next

### 1. What happens AFTER these requests?

After you see those URLs, what happens?
- ✅ Do you get redirected back to `bippity.boo/auth/callback`?
- ❌ Do you stay on Google's page?
- ❌ Do you see an error message?
- ❌ Do you get redirected to a different page?

### 2. Check the Final Redirect

After completing OAuth on Google, you should be redirected to:
```
https://bippity.boo/auth/callback?code=[some-code]&scope=[scopes]
```

**Check:**
- Do you see this redirect?
- What URL do you end up on?
- Is there an error in the URL (like `?error=...`)?

### 3. Check Browser Console for Errors

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for any red error messages
4. Common errors:
   - `redirect_uri_mismatch`
   - `access_denied`
   - `invalid_client`
   - `invalid_grant`

### 4. Check Network Tab for Failed Requests

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by "Failed" or look for red requests
4. Check the response for any error messages

### 5. Check What Supabase is Sending

The issue might be that Supabase is sending a different redirect URI than what's in Google Cloud Console.

**To check:**
1. In Network tab, find the request to `accounts.google.com/o/oauth2/v2/auth`
2. Look at the query parameters
3. Check the `redirect_uri` parameter
4. Verify it matches exactly what's in Google Cloud Console

### 6. Common Issues

#### Issue: OAuth Completes but Callback Fails
**Symptoms:**
- You complete OAuth on Google
- Get redirected to `bippity.boo/auth/callback`
- But then see an error or get stuck

**Check:**
- Railway logs: `railway logs`
- Look for errors in `/auth/callback` route
- Check if `exchangeCodeForSession` is failing

#### Issue: OAuth Completes but Wrong Redirect
**Symptoms:**
- OAuth completes successfully
- But you're redirected to wrong page or see error

**Check:**
- What URL are you redirected to?
- Check `app/auth/callback/route.ts` for redirect logic
- Verify `NEXT_PUBLIC_APP_URL` is set correctly in Railway

#### Issue: Missing Scopes
**Symptoms:**
- OAuth completes
- But app can't access Gmail/Calendar

**Check:**
- Did you check all the permission boxes on Google's consent screen?
- Check if you're being redirected to `/auth/missing-permissions`

## Quick Diagnostic Steps

### Step 1: Complete OAuth Flow
1. Go to `https://bippity.boo`
2. Click "Sign Up With Google"
3. Complete the OAuth flow on Google
4. **Note exactly what happens:**
   - What page do you end up on?
   - What URL is in the address bar?
   - Any error messages?

### Step 2: Check Railway Logs
```bash
railway logs
```

Look for:
- Errors in `/auth/callback`
- Errors mentioning "exchangeCodeForSession"
- Errors mentioning "OAuth" or "token"

### Step 3: Check Browser Console
After completing OAuth, check:
- Console tab for errors
- Network tab for failed requests
- Application tab → Cookies (check for Supabase session)

## What Information Do I Need?

To help debug, please provide:

1. **What happens after OAuth completes?**
   - What URL do you end up on?
   - What page do you see?

2. **Any error messages?**
   - In the browser?
   - In Railway logs?

3. **Does the OAuth flow complete?**
   - Do you see Google's "Allow" button?
   - Do you click "Allow"?
   - What happens after clicking "Allow"?

4. **Check the Network tab:**
   - Find the request to `accounts.google.com/o/oauth2/v2/auth`
   - What `redirect_uri` parameter is being sent?
   - Copy the full URL (you can redact sensitive parts)

## Expected Flow

1. Click "Sign Up With Google" on `bippity.boo`
2. Redirected to Google OAuth consent screen
3. See permission checkboxes (Gmail, Calendar, Tasks)
4. Click "Allow"
5. Redirected to: `https://bippity.boo/auth/callback?code=...`
6. App processes the callback
7. Redirected to: `https://bippity.boo/whatwefound` or `/auth/missing-permissions`

**Where in this flow is it failing?**
