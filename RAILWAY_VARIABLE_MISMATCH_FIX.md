# Railway Variable Mismatch Fix

## Problem Identified

Railway has **two types of variables**:
1. **Service Variables** (service-specific) - Take precedence
2. **Shared Variables** (project-wide) - Used as fallback

If the same variable exists in both places with **different values**, the service variable wins, which can cause:
- OAuth redirect URI mismatches
- Token authentication failures
- Custom domain configuration issues

## Critical Variables to Check

These variables are critical for OAuth to work correctly:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
**Impact**: Determines which Supabase URL your app uses for OAuth
- **Service Variable**: What your app actually uses
- **Shared Variable**: What might be configured elsewhere

**Your Configuration (Custom Domain):**
- **MUST BE**: `https://api.bippity.boo` in both service and shared variables

**Action**: Both service and shared variables must be `https://api.bippity.boo`

### 2. `NEXT_PUBLIC_APP_URL`
**Impact**: Used for OAuth redirects and callback URLs
- **Service Variable**: What your app uses
- **Shared Variable**: Project default

**Expected value**: `https://bippity.boo`

**Action**: Both should be `https://bippity.boo`

### 3. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
**Impact**: OAuth credentials must match between Railway and Supabase
- **Service Variable**: What your app uses
- **Shared Variable**: Project default

**Action**: Both should match exactly

## How to Fix

### Step 1: Check Service Variables

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **project**
3. Select your **service** (Next.js app)
4. Go to **Variables** tab
5. Note the values for:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `N8N_API_KEY`

### Step 2: Check Shared Variables

1. In the same Railway Dashboard
2. Go to **Project Settings** (or project-level Variables)
3. Check **Shared Variables**
4. Compare values for the same variables

### Step 3: Align the Variables

**Option A: Use Service Variables (Recommended)**
- Keep service-specific variables
- Remove conflicting shared variables (or make them match)

**Option B: Use Shared Variables**
- Remove service-specific variables
- Keep only shared variables (if you want project-wide consistency)

**Option C: Make Both Match**
- Update both to have the same values
- Service variables will still take precedence, but both will be consistent

### Step 4: Critical OAuth Variables

For OAuth to work, these **MUST match**:

```
NEXT_PUBLIC_SUPABASE_URL = [same value in both places]
NEXT_PUBLIC_APP_URL = https://bippity.boo (in both places)
GOOGLE_CLIENT_ID = [same value in both places]
GOOGLE_CLIENT_SECRET = [same value in both places]
```

## Recommended Configuration

**For OAuth to work with custom domain:**

**Service Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://api.bippity.boo  (or https://fvjmzvvcyxsvstlhenex.supabase.co)
NEXT_PUBLIC_APP_URL=https://bippity.boo
GOOGLE_CLIENT_ID=[your-client-id]
GOOGLE_CLIENT_SECRET=[your-client-secret]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
N8N_API_KEY=[your-n8n-api-key]
```

**Shared Variables:**
- Either remove these variables (let service variables handle it)
- OR make them match the service variables exactly

## Verification

After fixing:

1. **Redeploy** your service (Railway will pick up new variables)
2. **Test OAuth flow**:
   - Go to `https://bippity.boo`
   - Click "Sign Up With Google"
   - Complete OAuth
   - Verify it works

3. **Check logs**:
   ```bash
   railway logs
   ```
   Look for any environment variable errors

## Common Issues

### Issue: "Still getting 401 errors"
- **Solution**: Make sure `NEXT_PUBLIC_SUPABASE_URL` is `https://api.bippity.boo` in BOTH Railway service and shared variables
- The redirect URI in Google Cloud Console must include: `https://api.bippity.boo/auth/v1/callback`
- Also verify: `https://bippity.boo/auth/callback` is in Google Cloud Console redirect URIs

### Issue: "OAuth redirects to wrong URL"
- **Solution**: Check `NEXT_PUBLIC_APP_URL` - it should be `https://bippity.boo` (not localhost or Railway subdomain)

### Issue: "Tokens still ending with 0206"
- **Solution**: After fixing variables, you MUST:
  1. Delete old tokens from database
  2. Revoke access at https://myaccount.google.com/permissions
  3. Re-authenticate to get fresh tokens

## Quick Fix Checklist

- [ ] Check service variables in Railway
- [ ] Check shared variables in Railway
- [ ] Identify mismatches
- [ ] Align `NEXT_PUBLIC_SUPABASE_URL` (most critical!)
- [ ] Align `NEXT_PUBLIC_APP_URL`
- [ ] Align `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Redeploy service
- [ ] Test OAuth flow
- [ ] Clean up old tokens if needed
