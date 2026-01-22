# Unipile Gmail Search Replacement

## Problem
Unipile does not offer Gmail search functionality. Our workflows currently use:
1. Gmail native search node in Command Poller
2. Gmail API HTTP requests with complex queries in Onboarding workflow

## Solution
Replace Gmail searches with `unified_events` table searches combined with Unipile historical sync.

**Key Principle**: Search operations should NOT mutate data - they only query.

---

## Changes Required

### 1. Command Poller Workflow (`Bippity-Gmail-Command-Poller-MultiTenant.json`)

#### Current Implementation:
- **Node**: "Search Gmail for Commands" (Gmail node)
- **Query**: `to:fgm@gmail.com -label:bippity-processed is:unread`
- **Purpose**: Find unread command emails that haven't been processed yet

#### New Implementation:
- **Node**: Supabase query node
- **Table**: `unified_events`
- **Filters**:
  - `source_type = 'email_command'`
  - `processing_status = 'pending'`
  - Order by `created_at DESC`
  - Limit: 50
- **Important**: This node only READS - it does NOT change status
- **Benefits**:
  - No need to track Gmail labels
  - Processing status is already in database
  - Single database query instead of Gmail API call
  - Assumes emails are already synced to unified_events by Unipile webhook/poller

---

### 2. Onboarding Workflow (`parallelized-onboarding-supabase.json`)

#### Current Implementation:
5 parallel Gmail API searches with complex keyword queries:

1. **Search Gmail - Recent** (newer_than:30d)
2. **Search Gmail - BackToSchool** (after:2025/08/01 before:2025/09/30)
3. **Search Gmail - Fall** (after:2025/10/01 before:2025/11/30)
4. **Search Gmail - Winter** (after:2024/12/01 before:2025/01/31)
5. **Search Gmail - Spring** (after:2025/02/01 before:2025/07/31)

Each uses a massive keyword list to find school/activity emails.

#### New Implementation Strategy:

**Step 1: Trigger Unipile Historical Sync**
- Call Unipile API to fetch last X days of emails (e.g., 365 days for comprehensive onboarding)
- Unipile endpoint: `/accounts/{accountId}/messages/sync` with date range parameters
- This populates the user's email history into Unipile's system

**Step 2: Sync to unified_events with Special Status**
- When syncing from Unipile to `unified_events`, mark these with:
  - `source_type = 'email'`
  - `processing_status = 'for_onboarding'` (special status for onboarding discovery)
  - `synced_at` timestamp
- These emails are flagged as needing onboarding enrichment

**Step 3: Query unified_events by Date Ranges**
Replace the 5 Gmail search nodes with 5 Supabase query nodes:

```json
{
  "operation": "getAll",
  "tableId": "unified_events",
  "filters": {
    "conditions": [
      {
        "keyName": "user_id",
        "condition": "eq",
        "keyValue": "={{ $json.user_id }}"
      },
      {
        "keyName": "processing_status",
        "condition": "eq",
        "keyValue": "for_onboarding"
      },
      {
        "keyName": "created_at",
        "condition": "gte",
        "keyValue": "2025-08-01"
      },
      {
        "keyName": "created_at",
        "condition": "lte",
        "keyValue": "2025-09-30"
      }
    ]
  },
  "limit": 50
}
```

**Step 4: Optional Domain Filtering**
Add optional filtering by sender domain for school/activity emails:
- `sender_email LIKE '%.edu'`
- `sender_email LIKE '%parentsquare.com'`
- `sender_email LIKE '%konstella.com'`
- etc.

This can be done either in the Supabase query or in a Code node after fetching.

**Benefits**:
1. **One-time historical sync** via Unipile instead of 5 Gmail API searches
2. **Faster queries** - database queries vs. API calls
3. **Better tracking** - know which emails are "for_onboarding" vs. regular processing
4. **Separation of concerns** - sync is separate from search
5. **No OAuth complexity** - Unipile handles the connection

---

## Database Considerations

### Ensure `unified_events` has proper indexes:
```sql
-- Index for command poller queries
CREATE INDEX IF NOT EXISTS idx_unified_events_command_status 
ON unified_events(source_type, processing_status, created_at DESC)
WHERE source_type = 'email_command';

-- Index for onboarding date range queries  
CREATE INDEX IF NOT EXISTS idx_unified_events_user_date 
ON unified_events(user_id, created_at DESC, source_type);

-- Optional: Full-text search index on content
CREATE INDEX IF NOT EXISTS idx_unified_events_content_search 
ON unified_events USING gin(to_tsvector('english', content));
```

---

## Migration Steps

### Step 1: Add Unipile Historical Sync to Onboarding
1. **At start of onboarding workflow**, add HTTP Request node to trigger Unipile sync:
   ```
   POST https://api.unipile.com/v1/accounts/{accountId}/messages/sync
   Headers: X-API-KEY: {unipile_api_key}
   Body: {
     "since": "2024-01-01T00:00:00Z",  // Or calculate 365 days back
     "until": "now"
   }
   ```
2. Wait for sync to complete (may need polling or webhook)
3. Mark synced messages in unified_events with `processing_status = 'for_onboarding'`

### Step 2: Update Onboarding Search Nodes
1. Replace 5 Gmail search nodes with 5 Supabase query nodes
2. Each query filters by:
   - `user_id`
   - `processing_status = 'for_onboarding'`
   - `created_at` within specific date range
3. Optionally add sender domain filtering
4. Remove OAuth token refresh logic (no longer needed)
5. Update "Aggregate Gmail Results" node to work with unified_events format

### Step 3: Update Command Poller (Optional)
1. If emails are being synced to unified_events via Unipile webhook/poller
2. Replace "Search Gmail for Commands" with Supabase query
3. Search for `source_type = 'email_command'` AND `processing_status = 'pending'`
4. Keep the rest of the workflow the same
5. **Important**: Command processor workflow updates status, not the poller search

### Step 4: Test
1. Test Unipile historical sync for new user onboarding
2. Verify onboarding discovers relevant emails from unified_events
3. Verify command poller finds pending events correctly (if updated)
4. Check performance improvements

---

## Expected Performance Improvements

| Workflow | Old (Gmail API) | New (Supabase) | Improvement |
|----------|----------------|----------------|-------------|
| Command Poller | ~2-3s per search | ~100-200ms | **10-15x faster** |
| Onboarding (5 searches) | ~10-15s total | ~500ms-1s | **10-20x faster** |

---

## Data Flow Update

### Before (with Gmail):
```
Gmail API Search → Parse Response → Extract Data → Process → Store Results
```

### After (with Unipile + unified_events):

**For Onboarding:**
```
User Signs Up → Trigger Unipile Historical Sync (last X days) 
→ Unipile fetches from Gmail → Stores in Unipile DB 
→ Webhook/sync to unified_events with status='for_onboarding'
→ Query unified_events by date ranges (READ-ONLY)
→ Enrich with AI → Update status to 'enriched'
```

**For Command Poller (ongoing):**
```
Unipile Webhook receives new email → Stores in unified_events with status='pending'
→ Poller queries unified_events (READ-ONLY)
→ Command Processor updates status to 'processing' → 'completed'/'error'
```

**Key Principle**: Search operations are READ-ONLY. Status mutations happen in separate processing nodes.

---

## Additional Benefits

1. **No OAuth complications** - No token refresh, no scope issues
2. **Consistent data format** - unified_events has standardized schema
3. **Better error handling** - Database errors are easier to debug than Gmail API errors
4. **Offline testing** - Can test with seeded database data
5. **Rate limit immunity** - No Gmail API rate limits to worry about
6. **Multi-provider ready** - Works with any email provider that syncs to unified_events

---

## Workflow Changes Summary

### Command Poller Changes (Optional - depends on Unipile sync implementation):
- If emails are already syncing to unified_events via Unipile:
  - Replace Gmail search node with Supabase query (READ-ONLY)
  - Query: `source_type = 'email_command'` AND `processing_status = 'pending'`
  - Keep everything else the same
  - **Do NOT mutate status in search node** - only read
- If keeping Gmail for now:
  - No changes needed until Unipile webhook/sync is live

### Onboarding Workflow Changes:
1. **Add Unipile Historical Sync Step** (NEW - at start of workflow):
   - HTTP Request to Unipile to fetch last 365 days of emails
   - Wait for sync completion
   - Webhook or polling to know when done
   
2. **Add Status Marking Step** (NEW - after Unipile sync):
   - Query newly synced emails from unified_events
   - Update their `processing_status` to `'for_onboarding'`
   - This happens ONCE per user during onboarding
   
3. **Replace Gmail Search Nodes**:
   - Remove 5 Gmail HTTP request nodes
   - Add 5 Supabase query nodes (READ-ONLY)
   - Each searches `processing_status = 'for_onboarding'` + date range
   - Remove complex keyword queries (let AI enrichment handle categorization)
   
4. **Cleanup**:
   - Remove OAuth token retrieval and refresh logic
   - Remove auth error handling
   - Update "Aggregate Results" to work with unified_events format
   - After onboarding complete, mark emails as `processing_status = 'enriched'` or similar

---

*Last updated: 2026-01-20*
