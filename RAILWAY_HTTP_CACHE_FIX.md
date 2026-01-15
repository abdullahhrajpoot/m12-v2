# Railway HTTP Cache Fix

## Problem Identified

**Date**: January 15, 2026  
**Issue**: 401 UNAUTHENTICATED errors in n8n subworkflows despite fresh tokens in database

### Root Cause

Railway was **caching HTTP responses** from `/api/auth/tokens`, causing workflows to receive old, revoked access tokens even after the user logged out and logged back in with fresh credentials.

## Evidence

### Timeline:
- **12:37:58 PM**: User completed fresh OAuth login, NEW token saved to database
  - Token prefix: `ya29.a0AUMWg_IMnBIVWBoooE99...`
  
- **12:38:14 PM**: AI Email Processor workflow started execution
  - Called `/api/auth/tokens` endpoint
  - **Received OLD revoked token**: `ya29.a0AUMWg_I8iudI2g_YPT4ujF_...`
  - This token was from BEFORE the logout/login cycle
  
- **12:38:28 PM**: Subworkflows failed with 401 errors
  - Google rejected the old revoked token
  - Database showed NEW token, but workflow used OLD cached token

### Key Finding

**Only 16 seconds** passed between the new token being saved (12:37:58) and the workflow receiving the old token (12:38:14), confirming HTTP response caching was the issue.

## Solution

Added explicit no-cache HTTP headers to both token endpoints:

### Modified Files:

1. **`/app/api/auth/tokens/route.ts`**
2. **`/app/api/auth/refresh-tokens/route.ts`**

### Changes:

```typescript
// Added helper function to all responses
function jsonResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(init?.headers || {})
    }
  })
}
```

### Headers Explained:

- **`Cache-Control: no-store`**: Don't store response in any cache
- **`no-cache`**: Require revalidation before using cached copy
- **`must-revalidate`**: Cache must revalidate stale responses
- **`proxy-revalidate`**: Same as must-revalidate but for shared caches
- **`max-age=0`**: Response is immediately stale
- **`Pragma: no-cache`**: HTTP/1.0 backward compatibility
- **`Expires: 0`**: HTTP/1.0 expiration (past date)

These headers ensure Railway's CDN, reverse proxies, and any intermediate caches **never cache token responses**.

## Why This Matters

OAuth tokens are:
1. **Time-sensitive** - expire in ~1 hour
2. **User-specific** - tied to individual accounts
3. **Revocable** - invalid after logout/revoke
4. **Security-critical** - must be fresh for each request

Caching them can cause:
- ❌ Old revoked tokens being returned after logout
- ❌ Expired tokens being served after refresh
- ❌ One user potentially getting another user's token (cache key collision)
- ❌ Authentication failures despite valid database state

## Deployment

1. **Deploy updated code to Railway**
2. **Test the flow**:
   - Run the AI Email Processor workflow
   - Check subworkflows no longer get 401 errors
   - Verify new tokens are fetched on each request

## Verification

After deployment, check that:
1. Response headers include all no-cache directives
2. Each workflow execution fetches fresh tokens
3. No more 401 errors in subworkflows after login

```bash
# Test the endpoint returns no-cache headers
curl -I "https://bippity.boo/api/auth/tokens?userId=YOUR_USER_ID&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

Expected headers in response:
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
Pragma: no-cache
Expires: 0
```

## Related Context

- The `/api/auth/tokens` endpoint already had `export const dynamic = 'force-dynamic'` which prevents Next.js from caching, but this doesn't prevent Railway's HTTP layer from caching
- HTTP cache-control headers are required to tell Railway and any CDN/proxy not to cache
- Similar issue could affect any API endpoint returning sensitive, time-sensitive, or user-specific data

## Lessons Learned

1. **Always add explicit cache headers** for authentication endpoints
2. **Railway caches by default** - requires explicit opt-out via headers
3. **`export const dynamic = 'force-dynamic'`** only affects Next.js, not the HTTP layer
4. **Test auth flows with rapid logout/login cycles** to catch caching issues
