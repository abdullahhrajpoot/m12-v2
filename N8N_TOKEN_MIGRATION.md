# n8n Token Migration Guide: From Nango to Supabase

This document explains how to update your n8n workflows to use Supabase OAuth tokens instead of Nango.

## Overview

We've migrated from Nango OAuth to Supabase Auth. n8n workflows now need to retrieve Google OAuth tokens from Supabase instead of Nango.

## Token Storage

OAuth tokens are stored in the `oauth_tokens` table in Supabase:
- `user_id`: The Supabase user ID
- `provider`: OAuth provider (e.g., 'google')
- `access_token`: Google OAuth access token
- `refresh_token`: Google OAuth refresh token
- `expires_at`: Token expiration timestamp

**Note:** Currently, Supabase Auth doesn't directly expose provider tokens in the session. We need to extract them using Supabase Admin API or store them manually. See "Token Extraction" section below.

## API Endpoint for n8n

### Get Tokens Endpoint

**Endpoint:** `GET https://bippity.boo/api/auth/tokens`

**Authentication:** API Key in Authorization header

**Query Parameters:**
- `userId` (required): The Supabase user ID
- `provider` (optional): OAuth provider, defaults to 'google'

**Headers:**
```
Authorization: Bearer <N8N_API_KEY>
```

**Example Request:**
```bash
curl -X GET "https://bippity.boo/api/auth/tokens?userId=123e4567-e89b-12d3-a456-426614174000&provider=google" \
  -H "Authorization: Bearer YOUR_N8N_API_KEY"
```

**Example Response:**
```json
{
  "provider": "google",
  "access_token": "ya29.a0AfH6...",
  "refresh_token": "1//0gX...",
  "expires_at": "2024-01-15T12:00:00.000Z",
  "token_type": "Bearer",
  "scope": "https://www.googleapis.com/auth/gmail.readonly ...",
  "is_expired": false
}
```

## Updating n8n Workflows

### Step 1: Set Environment Variable

Add `N8N_API_KEY` to your Railway environment variables. This key should be:
1. Generated securely (e.g., using `openssl rand -hex 32`)
2. Added to Railway environment variables as `N8N_API_KEY`
3. Used in n8n workflows to authenticate API calls

### Step 2: Replace Nango Token Retrieval

**Old Nango approach:**
```javascript
// Old: Fetching tokens from Nango
const nangoResponse = await $http.get({
  url: `https://api.nango.dev/token/${userId}/google`,
  headers: {
    'Authorization': `Bearer ${NANGO_SECRET_KEY}`
  }
})
const accessToken = nangoResponse.access_token
```

**New Supabase approach:**
```javascript
// New: Fetching tokens from Supabase via our API
const tokenResponse = await $http.get({
  url: 'https://bippity.boo/api/auth/tokens',
  qs: {
    userId: userId,
    provider: 'google'
  },
  headers: {
    'Authorization': `Bearer ${N8N_API_KEY}`
  }
})

const accessToken = tokenResponse.access_token
const refreshToken = tokenResponse.refresh_token

// Use token for Gmail API calls
const gmailResponse = await $http.get({
  url: 'https://www.googleapis.com/gmail/v1/users/me/messages',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

### Step 3: Handle Token Refresh

If the token is expired (`is_expired: true`), you'll need to refresh it. However, since Supabase handles token refresh internally, you should:

1. Check if `is_expired` is true
2. If expired, trigger the OAuth flow again or wait for Supabase to refresh
3. For now, tokens should be automatically refreshed by Supabase

### Step 4: Update All Workflows

Update these workflows to use the new endpoint:

1. **Bippity - AI Email Processor_Test**
   - Replace Nango token retrieval with Supabase token API call
   - Update Gmail API calls to use Supabase tokens

2. **Bippity - Scheduled Email Check**
   - Update to use Supabase tokens for Gmail API

3. **Google Auth Nango Powered Onboarding**
   - Rename to "Google Auth Supabase Powered Onboarding"
   - Update webhook to handle Supabase OAuth success instead of Nango

## Token Extraction (Important)

**Current Challenge:** Supabase Auth doesn't directly expose provider tokens (access_token, refresh_token) in the session object. Provider tokens are stored internally but aren't accessible via the standard client API.

**Solutions:**

1. **Use Supabase Admin API** (Recommended):
   - Use service role key to query `auth.identities` table
   - Extract tokens from identity metadata
   - Store in `oauth_tokens` table for n8n access

2. **Use Database Webhooks**:
   - Set up Supabase database webhook on `auth.users` table
   - Trigger when new OAuth identity is created
   - Extract and store tokens via webhook

3. **Manual Token Storage** (Temporary):
   - Use `/api/auth/store-tokens` endpoint
   - Call from client-side after OAuth completion
   - Pass tokens from URL hash/query params

**Current Implementation Status:**
- ✅ API endpoint created (`/api/auth/tokens`)
- ✅ Token storage endpoint created (`/api/auth/store-tokens`)
- ✅ Database table created (`oauth_tokens`)
- ⚠️ Token extraction from Supabase Auth (in progress)

## Testing

1. Complete OAuth flow in the app (sign up with Google)
2. Verify tokens are stored in `oauth_tokens` table:
   ```sql
   SELECT user_id, provider, expires_at FROM oauth_tokens WHERE provider = 'google';
   ```
3. Test API endpoint from n8n or curl:
   ```bash
   curl -X GET "https://bippity.boo/api/auth/tokens?userId=YOUR_USER_ID&provider=google" \
     -H "Authorization: Bearer YOUR_N8N_API_KEY"
   ```
4. Verify token works with Gmail API:
   ```bash
   curl -X GET "https://www.googleapis.com/gmail/v1/users/me/profile" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Security Notes

1. **API Key**: The `N8N_API_KEY` should be kept secure and only used from n8n workflows
2. **Tokens**: OAuth tokens are sensitive - never log them or expose them
3. **RLS**: The `oauth_tokens` table has RLS enabled - only users can see their own tokens via client SDK
4. **Service Role**: The API endpoint uses service role key to bypass RLS for n8n access (authenticated via API key)

## Migration Checklist

- [ ] Generate and set `N8N_API_KEY` in Railway environment variables
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Railway environment variables
- [ ] Implement token extraction from Supabase Auth (Admin API or webhooks)
- [ ] Test token storage after OAuth
- [ ] Update "Bippity - AI Email Processor_Test" workflow
- [ ] Update "Bippity - Scheduled Email Check" workflow
- [ ] Update "Google Auth Nango Powered Onboarding" workflow
- [ ] Test token retrieval from n8n
- [ ] Test Gmail API calls with Supabase tokens
- [ ] Verify token refresh works correctly
- [ ] Remove Nango dependencies from workflows
- [ ] Update workflow documentation

## Next Steps

1. **Complete token extraction**: Implement proper token extraction from Supabase Auth using Admin API
2. **Set up webhook** (optional): Create database webhook to automatically store tokens when OAuth completes
3. **Test end-to-end**: Verify tokens flow from OAuth → storage → n8n retrieval → Gmail API
4. **Update workflows**: Migrate all n8n workflows to use new token endpoint
5. **Clean up**: Remove Nango dependencies and old code
