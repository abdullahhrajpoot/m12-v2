# Aurinko Migration: Complete Node & Workflow Change List

## Summary

**Total Impact**: 
- **3 Main Workflows** (with multiple nodes each)
- **7 Tool Subworkflows** (called as tools)
- **30+ HTTP Request Nodes** (direct Google API calls)
- **5+ Gmail Nodes** (native n8n Gmail nodes)

---

## 🎯 Main Workflows (Top-Level)

### 1. **Bippity - AI Email Processor (MultiTenant)**
**File**: `workflows/Bippity-Email-Command-Processor-MultiTenant.json`  
**Status**: Core processing workflow

**Nodes to Change:**
- ✅ **Gmail Node** - "Send Reply" (line ~535)
  - Type: `n8n-nodes-base.gmail`
  - Operation: Send email
  - **Change**: Replace with Aurinko Mail.Send API call via HTTP Request

**Workflow References (Tools Called):**
- Calls Calendar Tools (via Execute Workflow nodes)
- Calls Tasks Tools (via Execute Workflow nodes)

---

### 2. **Bippity - Parallelized Onboarding (Supabase)**
**File**: `workflows/parallelized-onboarding-supabase.json`  
**Status**: Onboarding workflow, runs after OAuth

**Nodes to Change:**

#### Gmail API HTTP Requests:
1. **"Pull Discovered Emails"** (line ~153)
   - URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}`
   - Method: GET
   - **Change**: `https://api.aurinko.io/v1/mail/messages/{id}`

2. **"Search Gmail - Recent"** (line ~449)
   - URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages`
   - Method: GET (with query: `?q=...`)
   - **Change**: `https://api.aurinko.io/v1/mail/messages` (different query format)

3. **"Search Gmail - BackToSchool"** (line ~470)
   - Same as above

4. **"Search Gmail - Fall"** (line ~491)
   - Same as above

5. **"Search Gmail - Winter"** (line ~512)
   - Same as above

6. **"Search Gmail - Spring"** (line ~533)
   - Same as above

7. **"Split Messages for Metadata"** → **"Pull Message Details"** (line ~383)
   - URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}`
   - Method: GET
   - **Change**: Aurinko API endpoint

8. **"Send Enrichment Request"** (line ~436)
   - URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages`
   - Method: GET (different query params)
   - **Change**: Aurinko API endpoint

**Total Gmail Nodes in This Workflow**: **8 HTTP Request nodes**

**Auth Changes:**
- All nodes currently use: `Authorization: Bearer {{ access_token }}`
- **Change to**: `Authorization: Bearer {{ aurinko_api_key }}` + `X-Aurinko-Account-Id: {{ account_id }}`

---

### 3. **Bippity - Gmail Command Poller (MultiTenant)**
**File**: `workflows/Bippity-Gmail-Command-Poller-MultiTenant.json`  
**Status**: Polls Gmail for command emails

**Nodes to Change:**

1. **"Search Gmail for Commands"** (line ~36)
   - Type: `n8n-nodes-base.gmail`
   - Operation: Search messages
   - **Change**: Replace with Aurinko HTTP Request

2. **"Mark Email as Processed - Labels"** (line ~256)
   - URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}/modify`
   - Method: POST (add label)
   - **Change**: Aurinko Mail API modify endpoint

3. **"Mark Email as Processed - Archive"** (line ~281)
   - URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}/modify`
   - Method: POST (archive)
   - **Change**: Aurinko Mail API modify endpoint

**Total Nodes in This Workflow**: **3 nodes** (1 Gmail node + 2 HTTP Request nodes)

---

## 🔧 Tool Subworkflows (Called by Main Workflow)

These are the workflows called as "tools" by the AI agent in the main Email Processor workflow. Each needs complete rewrite.

### Calendar Tools

#### 4. **Calendar_Create_Tool** 
**Workflow ID**: `b7d541e6-80af-4d1e-8aae-ea172c9afe0d` (from `calendar_create_tool_with_rrule.json`)  
**Called As**: Tool node in Email Processor

**Current Implementation**:
- HTTP Request to `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`
- Method: POST
- Uses `access_token` from Supabase

**Change Required**:
- URL: `https://api.aurinko.io/v1/calendars/{calendarId}/events`
- Auth: `Authorization: Bearer {{ aurinko_api_key }}` + `X-Aurinko-Account-Id: {{ account_id }}`
- Request body format may differ (check Aurinko docs)

**Estimated Effort**: 2-3 days

---

#### 5. **Calendar_Update_Tool**
**Workflow ID**: `0d2e1735-0b36-47ab-aecc-0054e7992831`  
**Called As**: Tool node in Email Processor

**Current Implementation**:
- HTTP Request to `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}`
- Method: PATCH

**Change Required**: Same as Calendar_Create

**Estimated Effort**: 2 days

---

#### 6. **Calendar_By_Date_Tool**
**Workflow ID**: `Mes8HQVlpiFkm6Dj`  
**Called As**: Tool node (referenced in `N8N_TOOL_CONFIGS_REFERENCE.md` line ~62)

**Current Implementation**:
- HTTP Request to Calendar API with `timeMin`/`timeMax` query params

**Change Required**: Convert to Aurinko date range query format

**Estimated Effort**: 2 days

---

#### 7. **Calendar_Search_Tool**
**Workflow ID**: `kQJv5Vc1xBBqBaXG`  
**Called As**: Tool node (referenced in `N8N_TOOL_CONFIGS_REFERENCE.md` line ~12)

**Current Implementation**:
- HTTP Request to Calendar API with `q` (query) parameter

**Change Required**: Convert to Aurinko search query format

**Estimated Effort**: 2 days

---

### Tasks Tools

#### 8. **Tasks_Create_Tool**
**Workflow ID**: `KYl2xtkD9QvvVlki`  
**Called As**: Tool node (referenced in `N8N_TOOL_CONFIGS_REFERENCE.md` line ~170)

**Current Implementation**:
- HTTP Request to `https://www.googleapis.com/tasks/v1/lists/{taskListId}/tasks`
- Method: POST

**Change Required**:
- URL: `https://api.aurinko.io/v1/tasks/lists/{taskListId}/tasks`
- Auth: Aurinko headers

**Estimated Effort**: 2-3 days

---

#### 9. **Tasks_Update_Tool**
**Workflow ID**: `83741506-35ee-4981-b163-ad53fc30e161` (inferred from schema fix docs)

**Current Implementation**:
- HTTP Request to Tasks API PATCH endpoint

**Change Required**: Convert to Aurinko API

**Estimated Effort**: 2 days

---

#### 10. **Tasks_Search_Tool**
**Workflow ID**: `zG1KVSuaQVTdJ2S2`  
**Called As**: Tool node (referenced in `N8N_TOOL_CONFIGS_REFERENCE.md` line ~121)

**Current Implementation**:
- Custom search logic (Tasks API has no native search)
- Fetches all tasks, filters client-side

**Change Required**: Check if Aurinko provides better search, or replicate client-side filtering

**Estimated Effort**: 3 days (may need more logic if Aurinko doesn't have search)

---

#### 11. **Tasks_Complete_Tool** (Inferred)
**Workflow ID**: Unknown (mentioned in `AI_EMAIL_PROCESSOR_SCHEMA_FIX.md`)

**Current Implementation**:
- HTTP Request to Tasks API to mark task complete

**Change Required**: Convert to Aurinko API

**Estimated Effort**: 2 days

---

#### 12. **Tasks_Delete_Tool** (Inferred from CONTEXT.md)
**Workflow ID**: Unknown

**Current Implementation**:
- HTTP Request to Tasks API DELETE endpoint

**Change Required**: Convert to Aurinko API

**Estimated Effort**: 2 days

---

## 📋 Additional Files/Configurations to Change

### Next.js Frontend (`app/` directory)

#### 13. **`app/auth/callback/route.ts`**
**Lines to Change**:
- Token storage logic (lines ~136-167)
- Scope verification (lines ~179-216)
- Currently stores Google `access_token`/`refresh_token` in `oauth_tokens` table
- **Change**: Must store `aurinko_account_id` + `aurinko_access_token` instead

**Estimated Effort**: 3-5 days

---

#### 14. **`app/api/auth/tokens/route.ts`** (if exists)
**Purpose**: Endpoint for n8n to retrieve OAuth tokens

**Current**: Returns Google `access_token` from `oauth_tokens` table  
**Change**: Must return Aurinko `account_id` + API key for Aurinko calls

**Estimated Effort**: 2 days

---

#### 15. **`app/api/auth/verify-scopes/route.ts`**
**Purpose**: Verify OAuth scopes are present

**Current**: Calls Google `tokeninfo` API  
**Change**: Verify Aurinko account has required scopes (may need different endpoint)

**Estimated Effort**: 2 days

---

### Database Schema Changes

#### 16. **`oauth_tokens` Table**
**Current Schema** (from migration files):
```sql
- user_id
- provider: 'google'
- access_token: Google OAuth token
- refresh_token: Google refresh token
- expires_at
```

**Required Changes**:
```sql
- user_id
- provider: 'google' (or add 'aurinko')
- aurinko_account_id: NEW (Aurinko account identifier)
- access_token: Aurinko API key (or keep Google token if Aurinko handles refresh)
- refresh_token: (may not be needed if Aurinko handles)
- expires_at: (may not be needed)
```

**Migration SQL**: New column + data migration script

**Estimated Effort**: 1-2 days

---

## 📊 Summary Table

| Category | Component | Nodes/Files | Estimated Days |
|----------|-----------|-------------|----------------|
| **Main Workflows** | Email Processor | 1 Gmail node | 1 |
| | Parallelized Onboarding | 8 HTTP Request nodes | 5 |
| | Gmail Command Poller | 3 nodes | 2 |
| **Tool Subworkflows** | Calendar_Create | 1 workflow | 2-3 |
| | Calendar_Update | 1 workflow | 2 |
| | Calendar_By_Date | 1 workflow | 2 |
| | Calendar_Search | 1 workflow | 2 |
| | Tasks_Create | 1 workflow | 2-3 |
| | Tasks_Update | 1 workflow | 2 |
| | Tasks_Search | 1 workflow | 3 |
| | Tasks_Complete | 1 workflow | 2 |
| | Tasks_Delete | 1 workflow | 2 |
| **Frontend Code** | auth/callback/route.ts | 1 file | 3-5 |
| | api/auth/tokens/route.ts | 1 file | 2 |
| | api/auth/verify-scopes/route.ts | 1 file | 2 |
| **Database** | oauth_tokens table | Schema + migration | 1-2 |
| **Testing & Debugging** | End-to-end testing | All workflows | 5-7 |
| **Documentation** | Update docs | Multiple files | 2 |
| **TOTAL** | | **~30+ nodes, 12+ workflows, 4 files** | **40-50 days** |

---

## 🔍 Detailed Change Requirements

### HTTP Request Node Pattern (Current → Aurinko)

#### **Current Pattern** (Gmail):
```json
{
  "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}",
  "method": "GET",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "Authorization": "Bearer {{ $json.access_token }}"
  }
}
```

#### **Aurinko Pattern** (Required):
```json
{
  "url": "https://api.aurinko.io/v1/mail/messages/{id}",
  "method": "GET",
  "sendHeaders": true,
  "headerParameters": {
    "Authorization": "Bearer {{ AURINKO_API_KEY }}",
    "X-Aurinko-Account-Id": "{{ $json.aurinko_account_id }}"
  }
}
```

---

### Gmail Node → HTTP Request Conversion

#### **Current** (n8n Gmail Node):
```json
{
  "type": "n8n-nodes-base.gmail",
  "operation": "search",
  "search": "to:fgm@gmail.com is:unread",
  "credentials": {
    "gmailOAuth2": {
      "name": "FGM Gmail OAuth2"
    }
  }
}
```

#### **Aurinko** (HTTP Request):
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "method": "GET",
  "url": "https://api.aurinko.io/v1/mail/messages",
  "sendQuery": true,
  "queryParameters": {
    "$filter": "to eq 'fgm@gmail.com' and isRead eq false"
  },
  "sendHeaders": true,
  "headerParameters": {
    "Authorization": "Bearer {{ AURINKO_API_KEY }}",
    "X-Aurinko-Account-Id": "{{ $json.aurinko_account_id }}"
  }
}
```

**Note**: Query syntax may differ - check Aurinko documentation for exact format.

---

### Calendar API Pattern (Current → Aurinko)

#### **Current** (Google Calendar):
```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
Headers: Authorization: Bearer {access_token}
Body: { "summary": "...", "start": {...}, "end": {...} }
```

#### **Aurinko** (Required):
```
POST https://api.aurinko.io/v1/calendars/{calendarId}/events
Headers: 
  Authorization: Bearer {aurinko_api_key}
  X-Aurinko-Account-Id: {account_id}
Body: { "summary": "...", "start": {...}, "end": {...} } (may differ)
```

---

### Tasks API Pattern (Current → Aurinko)

#### **Current** (Google Tasks):
```
POST https://www.googleapis.com/tasks/v1/lists/{taskListId}/tasks
Headers: Authorization: Bearer {access_token}
Body: { "title": "...", "notes": "...", "due": "..." }
```

#### **Aurinko** (Required):
```
POST https://api.aurinko.io/v1/tasks/lists/{taskListId}/tasks
Headers: 
  Authorization: Bearer {aurinko_api_key}
  X-Aurinko-Account-Id: {account_id}
Body: { "title": "...", "notes": "...", "due": "..." } (may differ)
```

---

## ⚠️ Critical Considerations

### 1. **Account ID Mapping**
- **Problem**: Aurinko uses "account IDs" to track connected services
- **Solution**: Must map Supabase `user_id` → Aurinko `account_id`
- **Storage**: Add `aurinko_account_id` to `oauth_tokens` table
- **Retrieval**: Update `/api/auth/tokens` endpoint to return `aurinko_account_id`

### 2. **OAuth Flow Changes**
- **Current**: User authenticates via Supabase → Google OAuth → Supabase stores tokens
- **New**: User authenticates via Supabase → Aurinko OAuth → Aurinko creates account → Supabase stores `aurinko_account_id`
- **Impact**: Complete rewrite of `/auth/callback` route

### 3. **Token Refresh Logic**
- **Current**: Refresh Google tokens using `refresh_token` from database
- **New**: Aurinko may handle refresh automatically, or may require different refresh flow
- **Impact**: Update token refresh logic in `app/api/auth/tokens/route.ts`

### 4. **API Response Formats**
- **Current**: Google API responses are well-documented
- **New**: Aurinko responses may differ (check docs)
- **Impact**: Update all Code nodes that parse API responses

### 5. **Error Handling**
- **Current**: Google API error codes (401, 403, 404, etc.)
- **New**: Aurinko may have different error codes/messages
- **Impact**: Update error handling in all workflows

---

## 📝 Migration Checklist

### Phase 1: Setup & Planning (Week 1)
- [ ] Create Aurinko account
- [ ] Get Aurinko API documentation
- [ ] Map all current Google API calls to Aurinko equivalents
- [ ] Confirm Aurinko supports all required scopes (gmail.readonly, calendar, tasks)
- [ ] Test Aurinko OAuth flow manually
- [ ] Confirm pricing structure

### Phase 2: Database & Auth (Week 2)
- [ ] Add `aurinko_account_id` column to `oauth_tokens` table
- [ ] Create migration script for existing users
- [ ] Rewrite `/auth/callback` to use Aurinko OAuth
- [ ] Update `/api/auth/tokens` to return Aurinko credentials
- [ ] Update scope verification logic

### Phase 3: Main Workflows (Week 3-4)
- [ ] Migrate "Parallelized Onboarding" workflow (8 nodes)
- [ ] Migrate "Gmail Command Poller" workflow (3 nodes)
- [ ] Update "Email Processor" Gmail send node (1 node)

### Phase 4: Tool Subworkflows (Week 5-7)
- [ ] Migrate Calendar_Create_Tool
- [ ] Migrate Calendar_Update_Tool
- [ ] Migrate Calendar_By_Date_Tool
- [ ] Migrate Calendar_Search_Tool
- [ ] Migrate Tasks_Create_Tool
- [ ] Migrate Tasks_Update_Tool
- [ ] Migrate Tasks_Search_Tool
- [ ] Migrate Tasks_Complete_Tool
- [ ] Migrate Tasks_Delete_Tool

### Phase 5: Testing (Week 8)
- [ ] End-to-end test OAuth flow
- [ ] Test all calendar operations
- [ ] Test all tasks operations
- [ ] Test Gmail search and send
- [ ] Test error scenarios
- [ ] Performance testing

### Phase 6: Rollout (Week 9)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] User re-authentication communication
- [ ] Monitor for issues

---

## 🚨 Risk Mitigation

### Parallel Running (Recommended)
- Keep both Google OAuth and Aurinko OAuth active during migration
- Feature flag to switch between providers
- Allows gradual rollout and easy rollback

### Rollback Plan
- Keep old workflows as backups
- Document how to revert database changes
- Test rollback procedure before migration

---

*Last updated: 2026-01-16*
*Based on workflow analysis of bippity.boo codebase*
