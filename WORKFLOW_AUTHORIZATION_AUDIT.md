# n8n Workflow Authorization Audit

## Workflow: "Google Auth Supabase Powered Onboarding"
**Workflow ID:** `HwRvoNIeRyF8W0NG`

## Summary
All authorization headers have been verified and corrected. The workflow uses manual Authorization headers (not credentials) for all API calls.

---

## Nodes Requiring Authorization

### 1. ✅ "Get Token from Supabase" (Node ID: `6bd96c4d-e31b-4644-bab4-982f62d7e380`)

**Purpose:** Calls the Next.js API to retrieve OAuth tokens from Supabase

**URL:** `https://bippity.boo/api/auth/tokens`

**Method:** `GET`

**Query Parameters:**
- `userId`: `={{ $('Supabase OAuth Webhook').item.json.body.userId }}`
- `provider`: `google`

**Authorization Header:**
```
Authorization: Bearer {{ $vars.N8N_API_KEY }}
```
**Format:** `=Bearer {{ $vars.N8N_API_KEY }}` (with `=` prefix for expression evaluation)

**Credential:** ❌ **REMOVED** - Previously had `httpHeaderAuth` credential named "Nango API" which was removed to avoid conflicts.

**Status:** ✅ **CORRECT** - Uses workflow variable `$vars.N8N_API_KEY` for service-to-service authentication.

---

### 2. ✅ "Search Gmail For Usual Suspects" (Node ID: `c78eac3e-c862-467c-81be-ecfe2e400d51`)

**Purpose:** Searches Gmail for emails matching school/activity keywords

**URL:** `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25`

**Method:** `GET`

**Query Parameters:**
- `q`: `school OR academy daycare OR preschool...` (long search query)

**Authorization Header:**
```
Authorization: Bearer {{ $json.access_token }}
```
**Format:** `=Bearer {{ $json.access_token }}` (with `=` prefix for expression evaluation)

**Token Source:** Gets `access_token` from the previous "Get Token from Supabase" node output.

**Status:** ✅ **CORRECT** - Uses OAuth access token from Supabase.

---

### 3. ✅ "Pull Discovered Emails" (Node ID: `9499c351-31c5-47f0-9561-d90265d509c2`)

**Purpose:** Fetches full email content for discovered message IDs

**URL:** (Not visible in partial view, but likely `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}`)

**Method:** `GET`

**Authorization Header:**
```
Authorization: Bearer {{ $node['Get Token from Supabase'].json.access_token }}
```
**Format:** `=Bearer {{ $node['Get Token from Supabase'].json.access_token }}` (with `=` prefix for expression evaluation)

**Token Source:** References the "Get Token from Supabase" node using `$node['Get Token from Supabase']` because it's after a Split Out node that breaks the direct data flow.

**Status:** ✅ **CORRECT** - Correctly references parent node for access token.

---

## Workflow Variables

### `N8N_API_KEY`
- **Purpose:** Service-to-service authentication key shared between Railway (Next.js app) and n8n Cloud
- **Usage:** Used in "Get Token from Supabase" node to authenticate API requests
- **Location:** Should be set in n8n Cloud workflow variables (or environment variables, though n8n Cloud blocks direct env var access)
- **Note:** This is a shared secret - same key must be set in both Railway and n8n Cloud

---

## Authorization Flow

1. **Webhook Trigger:** Receives `userId` and `email` from Next.js app
2. **Get Token from Supabase:** 
   - Uses `N8N_API_KEY` to authenticate to Next.js API
   - Retrieves `access_token` and `refresh_token` from Supabase
3. **Gmail API Calls:**
   - Use `access_token` from step 2 to authenticate Gmail API requests
   - Token passed via Authorization header: `Bearer {token}`

---

## Key Corrections Made

1. ✅ **Removed conflicting credential** from "Get Token from Supabase" node (`httpHeaderAuth` credential)
2. ✅ **Fixed expression format** - Added `=` prefix to all Authorization header values for proper expression evaluation
3. ✅ **Verified token flow** - All Gmail API nodes correctly reference the access token from the token retrieval node

---

## Notes

- All nodes use **manual headers** (not credentials) for Authorization
- Workflow variable `$vars.N8N_API_KEY` is used for service-to-service auth (n8n → Next.js API)
- Gmail API tokens come from Supabase via the Next.js API endpoint
- No subworkflows are used in this workflow

---

## Testing Checklist

- [ ] Verify `N8N_API_KEY` workflow variable is set in n8n Cloud
- [ ] Test "Get Token from Supabase" node successfully retrieves tokens
- [ ] Test "Search Gmail For Usual Suspects" node successfully authenticates with Gmail API
- [ ] Test "Pull Discovered Emails" node successfully authenticates with Gmail API
- [ ] Verify token refresh mechanism (if tokens expire)








