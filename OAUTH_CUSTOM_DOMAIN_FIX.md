# OAuth Custom Domain Fix

## 🔍 Issue Found

The error shows Supabase is using a **custom domain** for OAuth:
```
redirect_uri=https://api.bippity.boo/auth/v1/callback
```

But we've been configuring the default Supabase domain. You need to add the **custom domain redirect URI** to Google Cloud Console.

## ✅ Quick Fix

### Step 1: Add Custom Domain Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: **APIs & Services → Credentials**
3. Find your **OAuth 2.0 Client ID** (the one used by Supabase)
4. Click **Edit** (or click the client name)
5. Scroll to **Authorized redirect URIs**
6. Click **+ ADD URI**
7. Add this EXACT URI:
   ```
   https://api.bippity.boo/auth/v1/callback
   ```
8. **Also make sure this one is there** (for fallback):
   ```
   https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
   ```
9. Click **SAVE**

### Step 2: Verify Supabase Custom Domain Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **fvjmzvvcyxsvstlhenex**
3. Navigate to: **Settings → Custom Domains** (or **Authentication → URL Configuration**)
4. Verify:
   - Custom domain is configured: `api.bippity.boo`
   - This is being used for OAuth redirects

### Step 3: Test Again

1. Go to `https://bippity.boo`
2. Click "Sign Up With Google"
3. Should work now! ✅

## 📋 Complete Redirect URI List

Add **ALL** of these to Google Cloud Console (to cover all scenarios):

```
https://api.bippity.boo/auth/v1/callback
https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback
https://bippity.boo/auth/callback
```

## 🔍 Why This Happened

When you set up a custom domain for Supabase Auth, Supabase uses that custom domain for OAuth redirects instead of the default `*.supabase.co` domain. This is actually better for branding, but you need to configure it in Google Cloud Console.

## ✅ Verification Checklist

- [ ] Added `https://api.bippity.boo/auth/v1/callback` to Google Cloud Console
- [ ] Added `https://fvjmzvvcyxsvstlhenex.supabase.co/auth/v1/callback` (for fallback)
- [ ] Saved changes in Google Cloud Console
- [ ] Verified Supabase custom domain is configured
- [ ] Tested OAuth flow - should work now!

## 🚨 Still Not Working?

If you still get errors after adding the redirect URI:

1. **Wait 1-2 minutes** - Google's cache can take time to update
2. **Clear browser cache** - Old redirect URIs might be cached
3. **Check for typos** - Make sure the URI is exactly: `https://api.bippity.boo/auth/v1/callback`
4. **Verify you're editing the correct OAuth client** - The one whose Client ID matches Supabase
