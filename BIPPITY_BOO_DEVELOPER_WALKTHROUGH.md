# Bippity.boo Developer Walkthrough

A technical overview of the platform architecture, data flows, and key systems.

---

## 1. What Is Bippity.boo?

Bippity.boo is a multi-source family communication platform that helps parents manage the overwhelming volume of communications from schools, activities, and extracurriculars. Think of it as a "fairy godmother" that catches all the balls parents are juggling.

**The core value proposition:** Parents shouldn't miss permission slip deadlines, picture day, or soccer schedule changes because important info was buried in their inbox.

**Current state:** Email is the primary intake source. The system processes family-relevant emails, extracts actionable items (events, tasks, deadlines), and syncs them to calendars and task lists.

**Future vision:** Expand to school portals (Brightwheel, ParentSquare), messaging apps, SMS/photo intake, and eventually take actions on behalf of parents (RSVPs, coordinating with other families).

---

## 2. Multi-User Architecture

Bippity.boo is built as a **multi-tenant SaaS platform**, not a single-user tool.

**Key principles:**
- Every user has their own data, completely isolated
- All database queries filter by `user_id`
- OAuth tokens are stored per-user via Unipile
- AI processing handles multiple users' emails in batches
- Subworkflow tools receive `user_id` as a parameter to operate on the correct user's data

**Database (Supabase):**

| Table | Purpose |
|-------|---------|
| `users` | User accounts and profiles |
| `connected_services` | Which services each user has connected |
| `unified_events` | All incoming communications (emails, future: portal messages, etc.) |
| `family_facts` | Context about each family (kids' names, schools, activities) |
| `calendar_events` | Extracted calendar events |
| `tasks` | Extracted tasks and action items |

---

## 3. Key Tools & Services

| Tool | Purpose |
|------|---------|
| **n8n** | Workflow automation engine. Runs all data pipelines, AI agents, and integrations. |
| **Supabase** | PostgreSQL database. Stores all user data, events, and extracted items. |
| **Unipile** | OAuth provider for Gmail and Google Calendar. Handles hosted auth flow and API access. |
| **OpenAI / Claude** | AI models for email relevance checking and event/task extraction. |
| **Google Tasks API** | (Current) Task storage. Transitioning to homegrown solution. |
| **Google Sheets** | (Planned) User-facing task interface. Familiar UX, no new app for parents to learn. |

---

## 4. The Signup Flow

Here's what happens when a new user signs up:

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. User clicks "Sign Up" on bippity.boo                            │
│     └─→ Redirects to Unipile Hosted Auth                            │
├─────────────────────────────────────────────────────────────────────┤
│  2. Unipile presents Google OAuth consent screen                    │
│     └─→ User authorizes Gmail + Calendar access                     │
├─────────────────────────────────────────────────────────────────────┤
│  3. OAuth completes → Unipile calls our webhook                     │
│     └─→ Webhook receives: account_id, user email, connection status │
├─────────────────────────────────────────────────────────────────────┤
│  4. n8n Onboarding Workflow triggers                                │
│     └─→ Creates user record in `users` table                        │
│     └─→ Creates entry in `connected_services` (provider: unipile)   │
│     └─→ Runs initial email scan to identify schools/activities      │
│     └─→ Populates `family_facts` with discovered context            │
├─────────────────────────────────────────────────────────────────────┤
│  5. User lands on dashboard                                         │
│     └─→ Sees AI-generated summary of their family's schools/activities │
│     └─→ System begins processing their emails                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Key detail:** Unipile handles the OAuth complexity. We provide our Google Client ID to Unipile, but Unipile manages the auth UI, token storage, and refresh. Our code calls Unipile's API to access Gmail/Calendar on behalf of users.

---

## 5. Email Ingestion: Unipile Webhook → unified_events

When a user receives a new email, Unipile notifies us via webhook:

```
┌─────────────────────────────────────────────────────────────────────┐
│  UNIPILE WEBHOOK NOTIFICATION                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. New email arrives in user's Gmail                               │
│     └─→ Unipile detects it (via their sync mechanism)               │
│                                                                     │
│  2. Unipile sends webhook to our n8n endpoint                       │
│     └─→ Payload includes: account_id, event type, email metadata    │
│                                                                     │
│  3. n8n "Email Intake" workflow receives webhook                    │
│     └─→ Looks up user_id from account_id in connected_services      │
│     └─→ Fetches full email content via Unipile API                  │
│     └─→ Applies basic filtering (skip blacklisted domains)          │
│                                                                     │
│  4. Stores email in `unified_events` table                          │
│     └─→ source: 'gmail'                                             │
│     └─→ is_processed: false                                         │
│     └─→ processing_status: 'pending'                                │
│     └─→ raw_content: full email body                                │
│     └─→ metadata: sender, subject, received_at, etc.                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Why unified_events?**
This is our "single source of truth" for all incoming communications. Today it's just emails, but the same table will hold:
- Forwarded emails (via `[user]@in.bippity.boo`)
- Portal scraper results (Brightwheel, ParentSquare)
- SMS/photo intake
- Chat inputs

All intake channels normalize their data into this table, then the AI processor handles them uniformly.

---

## 6. AI Email Processing

The AI Email Processor is a **cron-scheduled n8n workflow** that processes emails from `unified_events`.

### Trigger: Cron Schedule

```
Every 15 minutes:
  └─→ Query unified_events WHERE is_processed = false
  └─→ Process emails one at a time
```

### Two-Stage AI Agent Architecture

**Why two stages?** Early filtering saves tokens and processing time. Most emails aren't relevant (receipts, spam, marketing). Stage 1 catches these quickly.

```
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 1: RELEVANCE CHECK                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Input: Email subject + body snippet                                │
│                                                                     │
│  AI determines:                                                     │
│  - Is this family-relevant? (school, activity, kids)                │
│  - Or skip: receipts, marketing, account notifications, spam        │
│                                                                     │
│  Output:                                                            │
│  - { "action": "SKIP", "reason": "Amazon order confirmation" }      │
│  - { "action": "PROCESS", "reason": "School event notification" }   │
│                                                                     │
│  If SKIP → Mark is_processed = true, move to next email             │
│  If PROCESS → Continue to Stage 2                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 2: EXTRACTION & ACTION                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Input:                                                             │
│  - Full email content                                               │
│  - Family context (from family_facts)                               │
│  - Access to tools (calendar, tasks)                                │
│                                                                     │
│  AI Agent has tools (via n8n subworkflows):                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  SEARCH TOOLS (read-only, for context):                     │    │
│  │  - Calendar_Search: Find existing events                    │    │
│  │  - Calendar_By_Date: Get events on specific dates           │    │
│  │  - Tasks_Search: Find existing tasks                        │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  ACTION TOOLS (write, for taking action):                   │    │
│  │  - Calendar_Create: Create new calendar event               │    │
│  │  - Calendar_Update: Modify existing event                   │    │
│  │  - Tasks_Create: Create new task                            │    │
│  │  - Tasks_Update: Modify existing task                       │    │
│  │  - Tasks_Complete: Mark task as done                        │    │
│  │  - Tasks_Delete: Remove task                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  AI workflow:                                                       │
│  1. Read email, understand what's being communicated                │
│  2. Search calendar for conflicts or related events                 │
│  3. Search tasks for existing related items                         │
│  4. Decide: create event? create task? update existing?             │
│  5. Execute actions via tools                                       │
│  6. Return summary of what was done                                 │
│                                                                     │
│  Output → stored in unified_events.ai_output                        │
│  Mark is_processed = true                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Tool Calls

Every subworkflow tool receives `user_id` as input. This is critical for multi-tenant operation.

Example: When the AI calls `Calendar_Create`:

```
Subworkflow receives:
{
  "user_id": "abc123",
  "title": "Cora's Dance Recital",
  "start_time": "2024-12-15T14:00:00",
  "end_time": "2024-12-15T16:00:00"
}

Subworkflow:
1. Looks up user's Unipile account_id from connected_services
2. Calls Unipile API with that account_id to get access token
3. Creates event on user's Google Calendar
4. Returns success/failure to AI agent
```

---

## 7. Accessing Gmail & Calendar via Unipile

Unipile is our abstraction layer for Google APIs. We don't call Google directly; we call Unipile, which handles:
- OAuth token refresh
- API rate limiting
- Unified interface (same calls work for Outlook, too)

### Reading Emails

```
GET https://api.unipile.com/v1/emails/{email_id}
Headers:
  X-API-KEY: {unipile_api_key}
  X-Account-Id: {user's_unipile_account_id}
```

### Creating Calendar Events

```
POST https://api.unipile.com/v1/calendar/events
Headers:
  X-API-KEY: {unipile_api_key}
  X-Account-Id: {user's_unipile_account_id}
Body:
  {
    "title": "Field Trip Permission Due",
    "start": "2024-12-10T09:00:00Z",
    "end": "2024-12-10T09:30:00Z",
    "calendar_id": "{user's_calendar_id}"
  }
```

**Note:** Unipile doesn't support Google Tasks. That's handled separately.

---

## 8. Task Management: Current vs. Future

### Current: Google Tasks API (Direct)

We call Google Tasks API directly using the user's OAuth token (obtained during the same auth flow via Unipile, with Tasks scope added).

**Limitation:** Google Tasks API has no native search. Our `Tasks_Search` subworkflow:
1. Lists all tasks from the user's task list
2. Does client-side filtering by keyword
3. Returns matches

### Transition: Homegrown Task Management

We're moving away from Google Tasks to a **Google Sheets-based solution**:

**Why Google Sheets?**
- No new app for parents to learn
- Both parents can view and edit
- Works on mobile
- Built-in UI: checkboxes, dropdowns, familiar UX
- Service account owns the sheet → no additional OAuth burden per user

**How it will work:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  GOOGLE SHEETS TASK MANAGEMENT                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User signs up                                                   │
│     └─→ System creates a Google Sheet for this family              │
│     └─→ Sheet is owned by our service account                      │
│     └─→ Shared with user's email (they get a notification)         │
│                                                                     │
│  2. AI extracts tasks from emails                                   │
│     └─→ Writes new rows to the sheet                               │
│     └─→ Columns: Task, Due Date, Source Email, Status, Feedback    │
│                                                                     │
│  3. User interacts with sheet                                       │
│     └─→ Marks tasks as Done (dropdown)                             │
│     └─→ Marks tasks as Wrong/Not Relevant                          │
│     └─→ Optionally adds feedback text                              │
│                                                                     │
│  4. System polls sheet periodically                                 │
│     └─→ Reads user's status changes                                │
│     └─→ Updates internal database                                  │
│     └─→ Uses feedback to improve AI extraction                     │
│                                                                     │
│  5. Archival                                                        │
│     └─→ Done tasks moved to "Archive" tab after 7 days             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Internal DB is source of truth.** The sheet is a UI layer. If there's a conflict, DB wins.

---

## 9. Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Onboarding** | Webhook (Unipile OAuth complete) | Create user, run initial email scan, populate family_facts |
| **Email Intake** | Webhook (Unipile new email) | Fetch email, store in unified_events |
| **AI Email Processor** | Cron (every 15 min) | Process pending emails, extract events/tasks |
| **Calendar_* subworkflows** | Called by AI agent | CRUD on Google Calendar via Unipile |
| **Task_* subworkflows** | Called by AI agent | CRUD on tasks (currently Google Tasks, moving to Sheets) |

---

## 10. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USER'S GMAIL                                │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         UNIPILE (OAuth + API)                            │
│  - Hosts OAuth flow                                                      │
│  - Stores tokens                                                         │
│  - Sends webhook on new email                                            │
│  - Provides API for email/calendar access                                │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ webhook: "new email"
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         N8N: EMAIL INTAKE                                │
│  - Receives webhook                                                      │
│  - Fetches email via Unipile API                                         │
│  - Stores in unified_events                                              │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     SUPABASE: unified_events                             │
│  - source: 'gmail'                                                       │
│  - is_processed: false                                                   │
│  - raw_content, metadata, user_id                                        │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   │ cron: every 15 min
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      N8N: AI EMAIL PROCESSOR                             │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │ Stage 1: Relevance Check                                       │     │
│   │  → SKIP (receipt, spam) or PROCESS (family-relevant)           │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                              ▼                                           │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │ Stage 2: Extraction + Action                                   │     │
│   │  → Uses tools: Calendar_Search, Calendar_Create, Tasks_Create  │     │
│   │  → Each tool call includes user_id for multi-tenant isolation  │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ GOOGLE CALENDAR │  │  TASKS (Sheets) │  │ SUPABASE: tasks │
│  (via Unipile)  │  │  (via Service   │  │  calendar_events│
│                 │  │   Account)      │  │  family_facts   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Questions?

This walkthrough covers the current architecture. As we build out portal scrapers, SMS intake, and cross-channel topic correlation, the unified_events pattern will extend to handle those sources with minimal changes to the AI processing layer.
