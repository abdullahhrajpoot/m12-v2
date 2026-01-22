# Unipile Migration Plan: Optimal Hybrid Approach

## Strategy Overview

**Principle**: Migrate simple operations, rebuild complex ones with better architecture.

### Why Unipile?
- **Unified API** for Gmail, Google Calendar, Google Tasks
- **Webhook support** for real-time email/calendar/task updates
- **Historical sync** for onboarding (fetch past X days)
- **Custom domain support** for white-label OAuth
- **Better rate limits** than direct Google API
- **Simplified auth** - one token per account, no refresh logic needed

---

## 🎯 Migration Categories

### ✅ **Migrate Direct** (Simple Operations)
These work well with Unipile's API:

1. **Email Send** (1 node)
   - Current: Gmail native node
   - New: Unipile `/messages/send` endpoint
   - Complexity: Low

2. **Email Search** (6 nodes across workflows)
   - Current: Gmail API search or native node
   - New: `unified_events` table search (Unipile syncs to it)
   - Complexity: Low

3. **Email Fetch** (2 nodes)
   - Current: Gmail API `/messages/{id}`
   - New: Unipile `/messages/{id}` or query `unified_events`
   - Complexity: Low

### 🔄 **Rebuild Simple** (Complex Operations)
These have simpler alternatives:

4. **Calendar Event Create** (1 tool workflow)
   - Current: Complex RRULE parsing, Google Calendar API
   - New: Unipile `/events` with simpler recurrence rules
   - Why: Unipile handles RRULE natively
   - Complexity: Medium

5. **Calendar Event Update** (1 tool workflow)
   - Current: Google Calendar API PATCH
   - New: Unipile `/events/{id}` PUT/PATCH
   - Complexity: Low

6. **Calendar Search** (2 tool workflows)
   - Current: Google Calendar API with complex queries
   - New: Unipile `/events` with filters OR query `unified_events`
   - Why: Unipile supports date ranges, text search
   - Complexity: Low-Medium

7. **Tasks Operations** (4 tool workflows)
   - Current: Google Tasks API (limited features)
   - New: Unipile `/tasks` endpoints
   - Why: Unified interface, better search
   - Complexity: Medium

---

## 📊 Component Changes Breakdown

### 1. Supabase Changes

#### New Tables/Columns

```sql
-- Add Unipile account tracking
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS unipile_account_id TEXT;
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS unipile_access_token TEXT;
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS provider_email TEXT;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_unipile_account 
ON oauth_tokens(unipile_account_id) 
WHERE unipile_account_id IS NOT NULL;

-- Add processing status for onboarding emails
ALTER TABLE unified_events ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE unified_events ADD COLUMN IF NOT EXISTS synced_from TEXT; -- 'unipile_webhook', 'unipile_historical', 'manual'

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_unified_events_status 
ON unified_events(user_id, processing_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unified_events_onboarding 
ON unified_events(user_id, processing_status, created_at DESC)
WHERE processing_status = 'for_onboarding';

CREATE INDEX IF NOT EXISTS idx_unified_events_command 
ON unified_events(source_type, processing_status, created_at DESC)
WHERE source_type = 'email_command';
```

#### New Functions

```sql
-- Function to store Unipile webhook data
CREATE OR REPLACE FUNCTION store_unipile_event(
  p_user_id UUID,
  p_source_type TEXT,
  p_unipile_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO unified_events (
    user_id,
    source_type,
    source_item_id,
    content,
    subject,
    sender_email,
    processing_status,
    synced_from,
    raw_data,
    created_at
  ) VALUES (
    p_user_id,
    p_source_type,
    (p_unipile_data->>'id')::TEXT,
    (p_unipile_data->>'body')::TEXT,
    (p_unipile_data->>'subject')::TEXT,
    (p_unipile_data->'from'->>'email')::TEXT,
    'pending',
    'unipile_webhook',
    p_unipile_data,
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### RLS Policies

```sql
-- Allow n8n service role to insert webhook data
CREATE POLICY "n8n_service_can_insert_events"
ON unified_events FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow n8n to update processing status
CREATE POLICY "n8n_service_can_update_status"
ON unified_events FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Users can read their own events
CREATE POLICY "users_read_own_events"
ON unified_events FOR SELECT
USING (auth.uid() = user_id);
```

---

### 2. Railway Changes

#### Environment Variables to Add

```bash
# Unipile Configuration
UNIPILE_API_KEY=your_api_key_here
UNIPILE_ACCOUNT_ID=your_account_id  # Optional: if using single account
UNIPILE_WEBHOOK_SECRET=your_webhook_secret

# Custom Domain (if using)
UNIPILE_CUSTOM_DOMAIN=auth.yourdomain.com
UNIPILE_REDIRECT_URI=https://yourdomain.com/auth/callback

# Keep existing for transition period
GOOGLE_CLIENT_ID=existing_value  # Keep during migration
GOOGLE_CLIENT_SECRET=existing_value  # Keep during migration
```

#### New Webhook Endpoints

Create new API routes in `app/api/`:

```
/api/webhooks/unipile/email       - Receive new email notifications
/api/webhooks/unipile/calendar    - Receive calendar event changes
/api/webhooks/unipile/tasks       - Receive task changes
```

#### Deployment Steps on Railway

1. **Add environment variables** via Railway dashboard
2. **Deploy updated Next.js app** with new webhook routes
3. **Configure Unipile webhooks** to point to Railway URLs:
   - `https://your-app.railway.app/api/webhooks/unipile/email`
   - `https://your-app.railway.app/api/webhooks/unipile/calendar`
   - `https://your-app.railway.app/api/webhooks/unipile/tasks`
4. **Test webhook delivery** with Unipile dashboard

---

### 3. Next.js Frontend Changes

#### Files to Create/Modify

**New Files:**

```
app/api/webhooks/unipile/
  ├── email/route.ts         - Handle email webhooks
  ├── calendar/route.ts      - Handle calendar webhooks
  └── tasks/route.ts         - Handle task webhooks

app/api/unipile/
  ├── connect/route.ts       - Initiate Unipile OAuth
  ├── callback/route.ts      - Handle OAuth callback
  └── sync-history/route.ts  - Trigger historical sync
```

**Modified Files:**

```
app/auth/callback/route.ts - Update to use Unipile OAuth
lib/unipile.ts             - New: Unipile API client
middleware.ts              - Add webhook signature verification
```

#### New Unipile API Client (`lib/unipile.ts`)

```typescript
export class UnipileClient {
  private apiKey: string;
  private baseUrl = 'https://api.unipile.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createAccount(email: string, provider: 'GMAIL') {
    // POST /accounts - Creates hosted auth link
  }

  async syncHistoricalEmails(accountId: string, since: string) {
    // POST /accounts/{accountId}/messages/sync
  }

  async sendEmail(accountId: string, data: EmailData) {
    // POST /accounts/{accountId}/messages
  }

  async getEvents(accountId: string, filters: EventFilters) {
    // GET /accounts/{accountId}/events
  }

  async createEvent(accountId: string, event: EventData) {
    // POST /accounts/{accountId}/events
  }
}
```

---

### 4. Workflow Changes

#### A. Email Command Processor Workflow

**Current Flow:**
```
Gmail Send Node → Email sent
```

**New Flow:**
```
HTTP Request to Unipile → POST /accounts/{accountId}/messages
Headers:
  - X-API-KEY: {UNIPILE_API_KEY}
Body: {
  to: [{ email: "user@example.com" }],
  subject: "...",
  body: "...",
  bodyType: "html"
}
```

**Changes Required:** 1 node replacement

---

#### B. Gmail Command Poller Workflow

**Current Flow:**
```
Gmail Search Node → Extract → Match User → Create unified_event → Process
```

**New Flow Option 1 (Webhook-driven - Recommended):**
```
Unipile Webhook → Store in unified_events → n8n processes via webhook trigger
```

**New Flow Option 2 (Poll unified_events):**
```
Query unified_events for 'pending' status → Process (no Gmail search needed)
```

**Changes Required:** 
- Replace Gmail search with Supabase query (already creates unified_event)
- OR set up webhook receiver (better for real-time)

---

#### C. Onboarding Workflow

**Current Flow:**
```
User Signs Up → Get OAuth Token → Search Gmail (5 parallel queries) → Fetch Details → Enrich
```

**New Flow:**
```
User Signs Up 
→ Create Unipile Account via hosted OAuth
→ Trigger Historical Sync (last 365 days) [HTTP Request to Unipile]
→ Wait for sync completion (webhook notification)
→ Mark synced emails as 'for_onboarding' in unified_events
→ Query unified_events by date ranges (5 parallel Supabase queries)
→ Enrich with AI
```

**Changes Required:**
1. Add "Create Unipile Account" node (HTTP Request)
2. Add "Trigger Historical Sync" node (HTTP Request)
3. Add "Wait for Sync" node (Webhook or polling)
4. Replace 5 Gmail search nodes with 5 Supabase query nodes
5. Remove OAuth token fetch/refresh logic

**Simplified Node Structure:**
```json
{
  "name": "Trigger Unipile Historical Sync",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.unipile.com/v1/accounts/{{ $json.unipile_account_id }}/messages/sync",
    "method": "POST",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "X-API-KEY", "value": "={{ $env.UNIPILE_API_KEY }}" }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        { "name": "since", "value": "={{ $now().minus({ days: 365 }).toISO() }}" },
        { "name": "until", "value": "={{ $now().toISO() }}" }
      ]
    }
  }
}
```

---

#### D. Calendar Tools (4 workflows)

**Tool: Calendar_Create**

Current complexity: High (RRULE parsing, Google API quirks)

**New Implementation:**
```json
{
  "name": "Create Calendar Event via Unipile",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.unipile.com/v1/accounts/{{ $json.unipile_account_id }}/events",
    "method": "POST",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "X-API-KEY", "value": "={{ $env.UNIPILE_API_KEY }}" }
      ]
    },
    "sendBody": true,
    "contentType": "json",
    "jsonBody": {
      "summary": "={{ $json.summary }}",
      "start": {
        "dateTime": "={{ $json.start_time }}",
        "timeZone": "America/Los_Angeles"
      },
      "end": {
        "dateTime": "={{ $json.end_time }}",
        "timeZone": "America/Los_Angeles"
      },
      "recurrence": "={{ $json.rrule }}"  // Unipile handles RRULE
    }
  }
}
```

**Changes:** Rebuild with simpler structure, ~3 nodes instead of 10+

---

**Tool: Calendar_Search**

Current: Complex Google Calendar query logic

**New Implementation:**
```
Query unified_events table (if events synced via webhook)
OR
HTTP Request to Unipile /events with filters
```

**Changes:** Simplify to 2-3 nodes max

---

**Tool: Calendar_By_Date**

**New Implementation:**
```
HTTP Request to Unipile:
GET /accounts/{accountId}/events?start_min={date}&start_max={date}
```

**Changes:** Single HTTP Request node + formatter

---

#### E. Tasks Tools (4 workflows)

Similar simplification - Unipile provides unified `/tasks` endpoints:

- `POST /accounts/{accountId}/tasks` - Create
- `PATCH /accounts/{accountId}/tasks/{id}` - Update
- `GET /accounts/{accountId}/tasks` - Search/List
- `DELETE /accounts/{accountId}/tasks/{id}` - Delete

**Changes:** Each tool becomes 1-3 nodes instead of complex logic

---

## 🔐 Custom Domain Setup with Unipile

### Why Custom Domain?
- **White-label experience** - Users see your domain, not Unipile
- **Brand trust** - OAuth consent screen shows your domain
- **Compliance** - Some organizations require custom domain for OAuth

### Setup Steps

#### 1. Configure Domain in Unipile Dashboard

```
1. Go to Unipile Dashboard → Settings → Custom Domain
2. Enter your domain: auth.yourdomain.com
3. Copy the CNAME record provided by Unipile
```

#### 2. Add DNS Record

In your DNS provider (e.g., Cloudflare, Route53):

```
Type: CNAME
Name: auth
Value: {provided-by-unipile}.unipile.com
TTL: Auto
Proxy: No (DNS only)
```

#### 3. Update Environment Variables

```bash
UNIPILE_CUSTOM_DOMAIN=auth.yourdomain.com
UNIPILE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

#### 4. Update OAuth Callback in Code

`app/api/unipile/connect/route.ts`:

```typescript
export async function GET(request: Request) {
  const unipileAuthUrl = `https://${process.env.UNIPILE_CUSTOM_DOMAIN}/oauth/authorize?` +
    `client_id=${process.env.UNIPILE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.UNIPILE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=email.read,email.send,calendar,tasks`;
  
  return Response.redirect(unipileAuthUrl);
}
```

#### 5. Verify Custom Domain

```bash
# Test DNS resolution
dig auth.yourdomain.com

# Should return CNAME pointing to Unipile
# Test SSL certificate
curl -I https://auth.yourdomain.com
```

---

## 📅 Migration Timeline

### Phase 1: Foundation (Week 1)
- [ ] Create Unipile account, get API key
- [ ] Set up custom domain DNS
- [ ] Add Unipile env vars to Railway
- [ ] Create Supabase schema changes
- [ ] Deploy new webhook endpoints

### Phase 2: OAuth & Onboarding (Week 2)
- [ ] Build Unipile OAuth flow (`/api/unipile/connect`, `/callback`)
- [ ] Update onboarding workflow:
  - [ ] Add historical sync trigger
  - [ ] Replace Gmail search nodes with Supabase queries
  - [ ] Test with sample user
- [ ] Set up webhook receivers for email/calendar/tasks

### Phase 3: Core Workflows (Week 3)
- [ ] Update Email Command Processor (replace Gmail send)
- [ ] Update Command Poller (use unified_events OR webhook)
- [ ] Test command email flow end-to-end

### Phase 4: Tool Workflows (Week 4-5)
- [ ] Rebuild Calendar_Create tool
- [ ] Rebuild Calendar_Update tool
- [ ] Rebuild Calendar_Search tool
- [ ] Rebuild Calendar_By_Date tool
- [ ] Rebuild Tasks_Create tool
- [ ] Rebuild Tasks_Update tool
- [ ] Rebuild Tasks_Search tool
- [ ] Rebuild Tasks_Delete tool

### Phase 5: Testing & Rollout (Week 6)
- [ ] End-to-end testing with multiple users
- [ ] Performance testing
- [ ] Error handling verification
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor Sentry for issues

### Phase 6: Cleanup (Week 7)
- [ ] Remove Google OAuth code
- [ ] Remove Gmail native nodes
- [ ] Archive old workflow backups
- [ ] Update documentation

---

## 📊 Comparison: Before vs. After

| Metric | Before (Google Direct) | After (Unipile) | Improvement |
|--------|----------------------|----------------|-------------|
| OAuth Complexity | High (token refresh, scopes) | Low (single token) | **-70% code** |
| Email Search Speed | 2-3s per query | 100-200ms (DB) | **10-15x faster** |
| Onboarding Time | 10-15s (5 API calls) | 3-5s (1 sync trigger) | **3x faster** |
| Rate Limits | 250/user/sec (Gmail) | 10,000/min (Unipile) | **Much higher** |
| Auth Errors | Frequent (scope drift) | Rare | **-90% errors** |
| Webhook Support | Manual polling | Native webhooks | Real-time |
| Tool Workflows | 10+ nodes each | 1-3 nodes each | **-70% complexity** |
| Total API Endpoints | 30+ different Google APIs | 1 unified Unipile API | Simpler |

---

## 🚨 Risk Mitigation

### Parallel Running Strategy

**Keep both systems active during migration:**

```typescript
// Feature flag in database
const useUnipile = await getFeatureFlag(userId, 'use_unipile');

if (useUnipile) {
  // Use Unipile flow
  await unipileClient.sendEmail(accountId, emailData);
} else {
  // Use legacy Google flow
  await gmailClient.sendEmail(accessToken, emailData);
}
```

### Rollback Plan

1. **Database**: Keep `oauth_tokens` with both Google and Unipile tokens
2. **Feature flag**: Can switch users back to Google instantly
3. **Workflows**: Keep backup copies of original workflows
4. **Monitoring**: Alert on Unipile API errors, auto-failover to Google

### Data Migration

**For existing users:**

```typescript
// Migration script
async function migrateUserToUnipile(userId: string) {
  // 1. Get user's Google OAuth token
  const googleToken = await getGoogleToken(userId);
  
  // 2. Create Unipile account with Google token
  const unipileAccount = await unipileClient.importAccount({
    provider: 'GMAIL',
    google_token: googleToken
  });
  
  // 3. Store Unipile account ID
  await supabase.from('oauth_tokens').update({
    unipile_account_id: unipileAccount.id,
    unipile_access_token: unipileAccount.access_token
  }).eq('user_id', userId);
  
  // 4. Trigger historical sync
  await unipileClient.syncHistoricalEmails(unipileAccount.id, '365d');
  
  return unipileAccount;
}
```

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] 99.9% uptime for Unipile integration
- [ ] <500ms average webhook processing time
- [ ] <2s onboarding sync trigger time
- [ ] Zero auth-related errors in 7 days
- [ ] All 8 tool workflows rebuilt and tested

### Business Metrics
- [ ] 100% of new users on Unipile
- [ ] 50% of existing users migrated in 2 weeks
- [ ] 90% of existing users migrated in 4 weeks
- [ ] No increase in support tickets
- [ ] 3x faster onboarding completion rate

---

## 📝 Key Decisions

### Decision 1: Webhook vs. Polling for Commands

**Recommended: Webhook**

**Pros:**
- Real-time processing (seconds vs. minutes)
- Lower infrastructure costs (no polling)
- Better UX (instant replies)

**Cons:**
- Need public webhook endpoint
- Must handle webhook signature verification

**Implementation:**
```typescript
// app/api/webhooks/unipile/email/route.ts
export async function POST(request: Request) {
  // 1. Verify webhook signature
  const signature = request.headers.get('x-unipile-signature');
  const isValid = verifyWebhookSignature(await request.text(), signature);
  
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // 2. Parse webhook data
  const data = await request.json();
  
  // 3. Store in unified_events
  const event = await storeUnipileEvent(data);
  
  // 4. Trigger n8n workflow via webhook
  await fetch(`${process.env.N8N_WEBHOOK_URL}/command-processor`, {
    method: 'POST',
    body: JSON.stringify({ unified_event_id: event.id })
  });
  
  return Response.json({ received: true });
}
```

---

### Decision 2: unified_events as Source of Truth

**Recommended: Yes**

**Why:**
- All emails synced from Unipile → unified_events
- All calendar events → unified_events (optional)
- All tasks → unified_events (optional)
- Single query location for all workflows
- Enables advanced features (full-text search, AI enrichment, analytics)

**Schema:**
```sql
CREATE TABLE unified_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_type TEXT NOT NULL, -- 'email', 'calendar', 'task'
  source_provider TEXT DEFAULT 'unipile', -- 'unipile', 'manual'
  source_item_id TEXT NOT NULL, -- Unipile message/event/task ID
  
  -- Email fields
  subject TEXT,
  content TEXT,
  sender_email TEXT,
  recipient_emails TEXT[],
  
  -- Calendar fields (if storing events)
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  
  -- Task fields (if storing tasks)
  task_title TEXT,
  task_status TEXT,
  due_date TIMESTAMPTZ,
  
  -- Processing
  processing_status TEXT DEFAULT 'pending',
  synced_from TEXT, -- 'unipile_webhook', 'unipile_historical'
  
  -- Metadata
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Helper Scripts

### Test Unipile Connection

```bash
#!/bin/bash
# test-unipile.sh

UNIPILE_API_KEY="your_api_key"
UNIPILE_ACCOUNT_ID="your_account_id"

# Test 1: Get account info
echo "Testing account info..."
curl -X GET "https://api.unipile.com/v1/accounts/$UNIPILE_ACCOUNT_ID" \
  -H "X-API-KEY: $UNIPILE_API_KEY"

# Test 2: Get recent messages
echo -e "\n\nTesting message fetch..."
curl -X GET "https://api.unipile.com/v1/accounts/$UNIPILE_ACCOUNT_ID/messages?limit=5" \
  -H "X-API-KEY: $UNIPILE_API_KEY"

# Test 3: Test webhook endpoint
echo -e "\n\nTesting webhook..."
curl -X POST "https://your-app.railway.app/api/webhooks/unipile/email" \
  -H "Content-Type: application/json" \
  -H "x-unipile-signature: test" \
  -d '{"test": true}'
```

### Migrate Single User

```bash
#!/bin/bash
# migrate-user.sh

USER_ID=$1

curl -X POST "https://your-app.railway.app/api/admin/migrate-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d "{\"user_id\": \"$USER_ID\"}"
```

---

*Last updated: 2026-01-20*
*Based on Unipile API v1 documentation*
