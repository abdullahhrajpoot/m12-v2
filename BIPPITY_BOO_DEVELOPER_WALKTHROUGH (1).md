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
| `connected_services` | Maps user_id ↔ Unipile account_id for each connected service |
| `unified_events` | All incoming communications (emails, future: portal messages, etc.) |
| `family_facts` | Context about each family (kids' names, schools, activities) |
| `onboarding_summaries` | Temporary storage for AI-discovered info during signup (cleared after user confirms) |
| `calendar_events` | Extracted calendar events |
| `tasks` | Extracted tasks and action items |

---

## 3. Key Tools & Services

| Tool | Purpose |
|------|---------|
| **n8n** | Workflow automation engine. Runs all data pipelines, AI agents, and integrations. |
| **Supabase** | PostgreSQL database. Stores all user data, events, and extracted items. |
| **Unipile** | OAuth provider for Gmail and Google Calendar. Uses their verified Google credentials — no app verification required on our end. Handles hosted auth and API access. |
| **OpenAI / Claude** | AI models for email relevance checking and event/task extraction. |
| **Google Tasks API** | (Current) Task storage. Transitioning to native solution. |
| **Native Task System** | (Planned) Homegrown task management built into the Bippity.boo app. |

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
│                                                                     │
│     ⚠️  IF INSUFFICIENT PERMISSIONS:                                │
│     └─→ User sent to /missing-permissions page                      │
│     └─→ Explains what permissions we need and why                   │
│     └─→ "Retry Sign Up" button to try again                         │
├─────────────────────────────────────────────────────────────────────┤
│  3. OAuth completes → Unipile calls our webhook                     │
│     └─→ Webhook receives: account_id (Unipile's identifier)         │
│     └─→ We fetch user's email via Unipile API                       │
├─────────────────────────────────────────────────────────────────────┤
│  4. n8n Onboarding Workflow triggers                                │
│     └─→ Creates user record in `users` table (generates user_id)    │
│     └─→ Creates entry in `connected_services`:                      │
│         - Maps our user_id ↔ Unipile account_id                     │
│         - Stores provider: 'unipile'                                │
│     └─→ Runs initial email scan to identify schools/activities      │
│     └─→ Writes discovered info to `onboarding_summaries` table      │
├─────────────────────────────────────────────────────────────────────┤
│  5. User lands on /whatwefound page                                 │
│     └─→ Page polls Supabase for onboarding summary sentences        │
│     └─→ Displays what we discovered: "Cora goes to Nesbit Elementary"│
│     └─→ User can CONFIRM or CORRECT each item                       │
├─────────────────────────────────────────────────────────────────────┤
│  6. User submits confirmation/corrections                           │
│     └─→ Triggers "Onboarding Finalize" workflow                     │
│     └─→ Saves confirmed sentences as `family_facts`                 │
│     └─→ Applies user corrections                                    │
│     └─→ Clears `onboarding_summaries` for this user                 │
├─────────────────────────────────────────────────────────────────────┤
│  7. User lands on confirmation page                                 │
│     └─→ "Got it! We'll monitor your Gmail for family updates."      │
│     └─→ Explains we'll use their family context to find relevant emails │
│     └─→ System begins processing their emails in the background     │
└─────────────────────────────────────────────────────────────────────┘
```

### ID Relationship

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Supabase       │      │  Unipile        │      │  User's         │
│  user_id        │ ←──► │  account_id     │ ←──► │  Email          │
│  (our internal) │      │  (their system) │      │  (identity)     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

- **Unipile provides:** `account_id` (their identifier) + user's email (fetched via API)
- **Our app provides:** `user_id` (Supabase primary key) that maps to the Unipile `account_id`
- **The `connected_services` table** stores this mapping so we can look up a user's Unipile account for API calls

**Key detail:** Unipile handles all the OAuth complexity. They provide their own Google Client ID, so we don't need to go through Google's app verification or CASA security assessment. Our code simply calls Unipile's API to access Gmail/Calendar on behalf of users — Unipile manages the auth UI, token storage, and refresh.

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
│     └─→ Looks up user_id from connected_services WHERE account_id = X │
│     └─→ Fetches full email content via Unipile API (using account_id) │
│     └─→ Applies basic filtering (skip blacklisted domains)          │
│                                                                     │
│  4. Stores email in `unified_events` table                          │
│     └─→ user_id: (our internal ID)                                  │
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
1. Looks up Unipile account_id from connected_services WHERE user_id = "abc123"
2. Calls Unipile API with that account_id to access user's Google Calendar
3. Creates event on user's calendar
4. Returns success/failure to AI agent
```

This pattern ensures complete user isolation — every API call is scoped to the correct user's data.

---

## 7. Accessing Gmail & Calendar via Unipile

Unipile is our abstraction layer for Google APIs. We don't call Google directly; we call Unipile, which handles:
- OAuth consent flow (using their verified Google credentials — no app verification on our end)
- Token storage and refresh
- API rate limiting
- Unified interface (same calls work for Outlook, too)

### Reading Emails

```
GET https://api.unipile.com/v1/emails/{email_id}
Headers:
  X-API-KEY: {our_unipile_api_key}
  account_id: {user's_unipile_account_id}  ← looked up from connected_services
```

### Creating Calendar Events

```
POST https://api.unipile.com/v1/calendar/events
Headers:
  X-API-KEY: {our_unipile_api_key}
  account_id: {user's_unipile_account_id}  ← looked up from connected_services
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

We call Google Tasks API directly. Since Unipile doesn't support Google Tasks, this requires separate OAuth handling.

**Limitations:**
- Google Tasks API has no native search — our `Tasks_Search` subworkflow lists all tasks and filters client-side
- Separate auth complexity from the Unipile flow
- This is why we're moving to native task management

### Transition: Native Task Management

We're moving away from Google Tasks to a **native task system** built into Bippity.boo:

**Why native?**
- Full control over UX and features
- Tighter integration with the rest of the platform
- Better feedback loop for AI improvement
- No dependency on third-party task APIs
- Can build family-specific features (assign to parent, link to kid/activity)

**How it will work:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  NATIVE TASK MANAGEMENT                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. AI extracts tasks from emails                                   │
│     └─→ Writes to `tasks` table in Supabase                        │
│     └─→ Fields: title, due_date, source_email, status, user_id     │
│                                                                     │
│  2. User views tasks in Bippity.boo dashboard                       │
│     └─→ Native UI built into the app                               │
│     └─→ Filter by kid, activity, due date                          │
│     └─→ Mark as done, snooze, dismiss                              │
│                                                                     │
│  3. User provides feedback                                          │
│     └─→ "This isn't a task" / "Wrong due date" / etc.              │
│     └─→ Stored for AI improvement                                  │
│                                                                     │
│  4. Task lifecycle                                                  │
│     └─→ Pending → Done or Dismissed                                │
│     └─→ Overdue tasks surfaced prominently                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Supabase `tasks` table is source of truth.** No external sync required.

---

## 9. Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Onboarding** | Webhook (Unipile OAuth complete) | Create user, run initial email scan, populate onboarding_summaries |
| **Onboarding Finalize** | Webhook (user confirms/corrects on /whatwefound) | Save confirmed items to family_facts, clear onboarding_summaries |
| **Email Intake** | Webhook (Unipile new email) | Fetch email, store in unified_events |
| **AI Email Processor** | Cron (every 15 min) | Process pending emails, extract events/tasks |
| **Calendar_* subworkflows** | Called by AI agent | CRUD on Google Calendar via Unipile |
| **Task_* subworkflows** | Called by AI agent | CRUD on tasks (transitioning to native) |

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
│  - Hosts OAuth flow (using their verified Google credentials)            │
│  - Assigns account_id to each connected user                             │
│  - Stores tokens                                                         │
│  - Sends webhook on new email (includes account_id)                      │
│  - Provides API for email/calendar access (scoped by account_id)         │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ webhook: "new email" + account_id
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         N8N: EMAIL INTAKE                                │
│  - Receives webhook with account_id                                      │
│  - Looks up user_id from connected_services                              │
│  - Fetches email via Unipile API (using account_id)                      │
│  - Stores in unified_events (using user_id)                              │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     SUPABASE: unified_events                             │
│  - user_id: our internal ID                                              │
│  - source: 'gmail'                                                       │
│  - is_processed: false                                                   │
│  - raw_content, metadata                                                 │
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
│   │  → Each tool receives user_id                                  │     │
│   │  → Tool looks up account_id from connected_services            │     │
│   │  → Tool calls Unipile API with account_id                      │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ GOOGLE CALENDAR │  │ SUPABASE: tasks │  │ SUPABASE:       │
│  (via Unipile)  │  │  (native task   │  │  calendar_events│
│                 │  │   management)   │  │  family_facts   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Questions?

This walkthrough covers the current architecture. As we build out portal scrapers, SMS intake, and cross-channel topic correlation, the unified_events pattern will extend to handle those sources with minimal changes to the AI processing layer.
