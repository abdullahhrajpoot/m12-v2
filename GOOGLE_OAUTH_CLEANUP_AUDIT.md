# Google OAuth Cleanup Audit

## Summary
This document identifies all remaining Google OAuth (Supabase Auth) code that may conflict with or be redundant alongside the new Unipile OAuth flow.

## Active Legacy Routes (Still in Use)

### 1. `/app/auth/callback/route.ts` ⚠️ **ACTIVE**
**Status:** Still being called by `app/page.tsx`
**Purpose:** Handles Supabase Auth Google OAuth callbacks
**What it does:**
- Exchanges OAuth code for Supabase session
- Stores Google OAuth tokens in `oauth_tokens` table
- Triggers legacy n8n workflow: `N8N_ONBOARDING_WEBHOOK_URL` (defaults to `parallelized-supabase-oauth`)
- Verifies OAuth scopes
- Redirects to `/whatwefound`

**Called from:**
- `app/page.tsx` line 236: `router.replace(\`/auth/callback?code=${code}\`)`

**Decision needed:**
- [ ] Keep for legacy users who signed up before Unipile migration?
- [ ] Remove and redirect to Unipile flow?
- [ ] Add deprecation warning?

### 2. `/app/api/auth/tokens/route.ts` ✅ **STILL NEEDED**
**Status:** Used by n8n workflows to get OAuth tokens
**Purpose:** Returns Google OAuth tokens from `oauth_tokens` table for n8n
**What it does:**
- Accepts API key auth (for n8n)
- Returns `access_token`, `refresh_token`, `expires_at` for Google OAuth
- Handles token refresh

**Used by:**
- n8n workflows that still use Google APIs directly (not Unipile)
- Legacy workflows that haven't been migrated yet

**Decision needed:**
- [ ] Keep - still needed for legacy workflows
- [ ] Update to also support Unipile tokens?

### 3. `/app/api/auth/store-tokens/route.ts` ⚠️ **MAY BE OBSOLETE**
**Status:** Manual token storage endpoint
**Purpose:** Allows client-side code to manually store OAuth tokens
**What it does:**
- Stores tokens in `oauth_tokens` table
- Used as fallback if Supabase Auth doesn't expose tokens

**Used by:**
- Possibly legacy client-side code
- Fallback mechanism

**Decision needed:**
- [ ] Check if still being called anywhere
- [ ] Remove if not needed

### 4. `/app/api/auth/refresh-tokens/route.ts` ⚠️ **CHECK USAGE**
**Status:** Unknown
**Purpose:** Refreshes expired OAuth tokens
**Decision needed:**
- [ ] Check if still used
- [ ] Remove if obsolete

### 5. `/app/api/auth/verify-scopes/route.ts` ⚠️ **CHECK USAGE**
**Status:** Called by `/app/auth/callback/route.ts`
**Purpose:** Verifies Google OAuth scopes are correct
**Decision needed:**
- [ ] Keep if legacy flow is kept
- [ ] Remove if legacy flow is removed

## Frontend References

### 1. `app/page.tsx` ⚠️ **ACTIVE**
**Lines 216-238:** Handles OAuth callback redirects
```typescript
if (code) {
  router.replace(`/auth/callback?code=${code}`)
  return
}
```
**Decision needed:**
- [ ] Remove this redirect (only Unipile flow should work)
- [ ] Or keep for legacy users

### 2. `components/ConnectButton.tsx` ✅ **UPDATED**
**Status:** Already updated to use Unipile
**Current:** Redirects to `/api/auth/unipile/connect`
**Text:** Still says "Sign Up With Google" (cosmetic)

## Environment Variables

### Still Referenced:
- `GOOGLE_CLIENT_ID` - Used by legacy Supabase Auth
- `GOOGLE_CLIENT_SECRET` - Used by legacy Supabase Auth
- `N8N_ONBOARDING_WEBHOOK_URL` - Legacy workflow webhook (defaults to `parallelized-supabase-oauth`)

### Decision needed:
- [ ] Keep for legacy users?
- [ ] Document as deprecated?
- [ ] Remove from Railway?

## n8n Workflows

### Legacy Workflows Still Using Google OAuth:
1. **Parallelized_Onboarding_Supabase** - Old onboarding workflow
2. Any workflows calling `/api/auth/tokens?provider=google`

### Decision needed:
- [ ] Keep for legacy users?
- [ ] Migrate all workflows to Unipile?
- [ ] Deprecate old workflows?

## Database

### `oauth_tokens` table:
- Still stores both `provider='google'` and `provider='unipile'` records
- This is fine - supports both systems during migration

## Recommendations

### Option 1: Keep Legacy Support (Recommended for now)
**Pros:**
- Existing users can still use the app
- Gradual migration path
- No breaking changes

**Cons:**
- Two auth systems to maintain
- Potential confusion
- More code to test

**Action items:**
1. ✅ Keep `/app/auth/callback/route.ts` but add deprecation warning
2. ✅ Keep `/app/api/auth/tokens/route.ts` (still needed)
3. ✅ Update `app/page.tsx` to prefer Unipile but fallback to legacy
4. ✅ Document which flow is for new vs existing users

### Option 2: Remove Legacy Code (Aggressive)
**Pros:**
- Cleaner codebase
- Single auth system
- Less maintenance

**Cons:**
- Breaking change for existing users
- Need to migrate all users first
- Risk of losing users

**Action items:**
1. ❌ Delete `/app/auth/callback/route.ts`
2. ❌ Remove Google OAuth redirect from `app/page.tsx`
3. ❌ Remove unused token storage endpoints
4. ❌ Migrate all n8n workflows to Unipile first
5. ❌ Migrate all existing users to Unipile

## Immediate Actions

### High Priority:
1. [ ] **Decide:** Keep legacy support or remove?
2. [ ] **If keeping:** Add deprecation warnings to legacy routes
3. [ ] **If removing:** Create user migration plan first

### Medium Priority:
1. [ ] Check if `/app/api/auth/store-tokens` is still called
2. [ ] Check if `/app/api/auth/refresh-tokens` is still used
3. [ ] Update `ConnectButton.tsx` text to be provider-agnostic

### Low Priority:
1. [ ] Clean up documentation files referencing old OAuth
2. [ ] Update environment variable documentation
3. [ ] Remove debug logging from legacy routes

## Files to Review

### Active Code:
- `app/auth/callback/route.ts` - **REVIEW NEEDED**
- `app/page.tsx` (lines 216-238) - **REVIEW NEEDED**
- `app/api/auth/tokens/route.ts` - **KEEP (still needed)**
- `app/api/auth/store-tokens/route.ts` - **CHECK USAGE**
- `app/api/auth/verify-scopes/route.ts` - **CHECK USAGE**

### Documentation (can be cleaned up later):
- `N8N_TOKEN_MIGRATION.md` - References Google OAuth
- `OAUTH_*.md` files - Many reference old OAuth flow
- Various other markdown files

## Testing Checklist

Before removing any legacy code:
- [ ] Verify no existing users are using Google OAuth flow
- [ ] Check n8n workflow executions for legacy workflow usage
- [ ] Test that new users only use Unipile flow
- [ ] Verify legacy users can still access the app
- [ ] Check database for active `provider='google'` tokens
