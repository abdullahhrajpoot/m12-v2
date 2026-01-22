# Custom Domain OAuth Fix - Cookie Sharing

## Problem Identified

You have a **split domain setup**:
- Supabase Auth: `api.bippity.boo`
- Next.js App: `bippity.boo`

**OAuth Flow:**
1. User clicks login on `bippity.boo`
2. Google redirects to `api.bippity.boo/auth/v1/callback` (Supabase Auth)
3. Supabase sets cookies on `api.bippity.boo` domain
4. Supabase redirects to `bippity.boo/auth/callback` (Next.js)
5. **❌ Cookies don't work - different subdomain!**

## Root Cause

Cookies set for `api.bippity.boo` are NOT accessible on `bippity.boo` because they're different subdomains. This causes "Auth session missing" errors.

## The Fix Applied

Updated cookies to use **root domain** `.bippity.boo` (with leading dot) so they work across ALL subdomains:

### Files Modified:

1. **`app/auth/callback/route.ts`**
   - Added `domain: '.bippity.boo'` to cookie options
   - Makes cookies accessible on both `bippity.boo` and `api.bippity.boo`

2. **`middleware.ts`**
   - Added `domain: '.bippity.boo'` to cookie set/remove operations
   - Ensures middleware can read/write cookies across subdomains

## Deploy Instructions

1. **Commit and push changes:**
   ```bash
   git add app/auth/callback/route.ts middleware.ts
   git commit -m "Fix: Share auth cookies across bippity.boo subdomains"
   git push
   ```

2. **Railway will auto-deploy** (or manually redeploy if needed)

3. **After deployment, test login:**
   - Clear browser cookies for bippity.boo
   - Go to https://bippity.boo
   - Click "Sign in with Google"
   - Should work now!

## How It Works Now

**With `.bippity.boo` domain:**
- ✅ Cookies set on `api.bippity.boo` (Supabase) work on `bippity.boo` (Next.js)
- ✅ Cookies set on `bippity.boo` (Next.js) work on `api.bippity.boo` (Supabase)
- ✅ Auth session persists across the OAuth redirect

## Common Custom Domain OAuth Issues

### 1. **Subdomain Cookie Isolation** ✅ FIXED
- Problem: Cookies don't share between `app.domain.com` and `api.domain.com`
- Solution: Use `.domain.com` (with leading dot)

### 2. **Redirect URI Mismatch**
- Problem: Google OAuth redirect URI doesn't match what's configured
- Check: OAuth flow uses `api.bippity.boo/auth/v1/callback` ✓
- Google Console has this URI ✓

### 3. **Site URL Mismatch**
- Check Supabase → Settings → Auth → Site URL
- Should be: `https://bippity.boo` (your app URL, not API URL)

### 4. **Incorrect Redirect URLs**
- Check Supabase → Settings → Auth → Redirect URLs
- Should include: `https://bippity.boo/auth/callback`

## Verification Steps

After deploying:

1. **Check cookies in browser DevTools:**
   - Should see Supabase auth cookies with `Domain: .bippity.boo`
   - NOT `Domain: bippity.boo` or `Domain: api.bippity.boo`

2. **Test OAuth flow:**
   - Clear cookies
   - Login with Google
   - Should redirect properly and maintain session

3. **Check Railway logs:**
   - Should NOT see "Auth session missing" errors
   - Should see successful token storage

## Alternative: Single Domain Setup

If cookie sharing issues persist, consider using **one domain for everything**:

**Option A: Everything on api.bippity.boo**
```bash
# Railway env vars:
NEXT_PUBLIC_APP_URL=https://api.bippity.boo
NEXT_PUBLIC_SUPABASE_URL=https://api.bippity.boo
```

**Option B: Use Supabase without custom domain**
- Remove custom domain from Supabase
- Use `https://fvjmzvvcyxsvstlhenex.supabase.co`
- App stays on `https://bippity.boo`
- Simpler, but exposes Supabase project ID

## Best Practices for Custom Domains + OAuth

1. **Use same domain for everything** (simplest)
   - Example: Everything on `app.company.com`

2. **If using separate domains:**
   - Set cookies for root domain (`.company.com`)
   - Ensure CORS is configured properly
   - Test cookie sharing thoroughly

3. **Keep redirect URIs minimal:**
   - Only add what you actually use
   - Remove old/unused URIs

4. **Document your setup:**
   - Note which domain is for what
   - Keep Google OAuth config matching Supabase

---

**Status:** Cookie domain fix applied. Ready to test after deployment.
