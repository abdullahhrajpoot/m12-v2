# Bippity.boo

Family communication assistant that processes emails from schools and extracurricular activities to automatically create calendar events and tasks.

**"Let something else keep track for once."**

---

## Product Vision

### The Problem
Parents are drowning in communications from schools, sports leagues, dance studios, daycares, and other kid activities. These come via email, apps (Brightwheel, ClassDojo, BAND), portals, and texts. Important deadlines and events slip through the cracks because no parent has time to carefully read every message from every platform.

### The Solution
Bippity.boo reads everything so parents don't have to. It extracts what matters—events, deadlines, action items—and puts them where parents already look: their calendar and task list.

### Core Promise
**Nothing falls through the cracks, without requiring parent attention.**

---

## Design Principles

### 1. Err on the Side of More Information
When uncertain whether something is important, **include it**. A parent can dismiss a duplicate or irrelevant item in 2 seconds. Missing a permission slip deadline costs real stress and consequences.

**In practice:**
- If unsure whether an email contains an event → extract it
- If a date might be relevant → create the calendar entry
- If something might need action → surface it

### 2. Be Invisible
The best UX is no UX. Bippity.boo should work silently in the background. Parents shouldn't need to "use" Bippity.boo—they just notice their calendar has the soccer schedule and their tasks remind them about picture day money.

**In practice:**
- No daily digests requiring attention
- No app to check
- No notifications unless something needs human decision
- Success = parent forgets Bippity.boo exists

### 3. Enable Easy Feedback
Every output must be traceable and correctable. When Bippity.boo gets something wrong, the parent needs a frictionless way to tell us (or the AI).

**In practice:**
- Every calendar event includes a feedback link
- Every task includes a feedback link
- Links contain: `source_message_id`, `execution_run_id`, `user_id`
- Feedback goes to both: product team (for improvement) and AI agent (for learning)

### 4. Tasks = Domino + Following Pattern
Don't overwhelm with all tasks at once. Use a two-task pattern:

**Domino Task** - The current decision/action (visible, actionable)
**Following Task** - Holds remaining steps (reference, not urgent)

**Example: Field trip email**
- **Domino Task**: "Decide: Field trip to science museum for Cora (due 1/15)"
- **Following Task**: "Field trip steps for Cora: □ Print permission slip □ Sign slip □ Send $15 check □ Pack lunch on 1/20"

**When parent completes Domino Task:**
1. Domino disappears (marked done)
2. Cron job checks Following Task
3. Creates NEXT Domino from first unchecked item
4. Updates Following Task to check off completed step

### 5. Act on Behalf of Parents (Coming Soon)
Bippity.boo will evolve from read-only to taking actions: logging into portals, submitting forms, sending replies. Always with appropriate confirmation for consequential actions.

---

## Non-Goals (What Bippity.boo is NOT)

- **Not a family calendar app** - We populate Google Calendar, not replace it
- **Not a school communication platform** - We read from platforms, not compete with them
- **Not a notification system** - We reduce notifications, not add more
- **Not for kids** - This is a parent tool, not a family collaboration tool

---

## Tech Stack

| Component | Service | Status |
|-----------|---------|--------|
| Frontend | Next.js on Railway | TO BUILD |
| Workflows | n8n Cloud | Working |
| Database | Supabase (PostgreSQL) | Working |
| Auth | Supabase Auth | Working |
| OAuth | Supabase Auth (Google OAuth) | Working |
| AI | ChatGPT via n8n agent | Working |

---

## Frontend Migration

**Migrating from**: Base44 (broken logic, keeping visual style)
**Migrating to**: Next.js on Railway

Reference files in `/bippityboo-711a96a6` folder show the Base44 design to preserve.

### Pages to build

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Marketing + Login button (Supabase Auth OAuth) |
| Dashboard | `/dashboard` | Display family_facts, calendar, tasks from Supabase |
| Onboarding | `/onboarding` | Post-signup flow to confirm family_facts |

### Key frontend requirements
- Login button triggers Supabase Auth OAuth flow (Google with Gmail/Calendar/Tasks scopes)
- Dashboard pulls `family_facts` from Supabase and displays as strings
- Preserve visual style from Base44 reference files
- Use Supabase client for auth + data

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= (for token storage in oauth_tokens table)
N8N_API_KEY= (for n8n workflows to authenticate to Next.js API)
```

### Deployment
```bash
railway login
railway init
railway up
```

Custom domain: bippity.boo (configure in Railway dashboard)

---

## Data Flow

```
1. User clicks Login → Supabase Auth OAuth (Google with Gmail/Calendar/Tasks scopes)
2. OAuth success → /auth/callback stores tokens in oauth_tokens table → triggers n8n Cloud webhook
3. n8n workflow:
   - Retrieves OAuth tokens from /api/auth/tokens endpoint
   - Fetches emails via Gmail API
   - Stage 1: Relevance check (ChatGPT agent)
   - Stage 2: Extract events/tasks (ChatGPT agent)
4. Extracted data → Supabase (events, tasks, family_facts)
5. Frontend displays data from Supabase
```

---

## Architecture Overview

### Microservices Philosophy
Bippity.boo follows a microservices-style architecture using n8n workflows as discrete services. Each workflow has a single responsibility and communicates via:
- **Database** (Supabase) - shared state and queue
- **Subworkflow calls** - synchronous tool invocation
- **Webhooks** - async triggers between services

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTAKE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Gmail API    │  Forwarding   │  Portal      │  Photo/SMS   │  Chat    │
│  (scheduled)  │  Address      │  Scraper     │  Intake      │  Input   │
│               │               │  (future)    │  (future)    │ (future) │
└───────┬───────┴───────┬───────┴──────┬───────┴──────┬───────┴────┬─────┘
        │               │              │              │            │
        ▼               ▼              ▼              ▼            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED_EVENTS TABLE                              │
│                    (Single source of truth)                              │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROCESSING LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Stage 1: Relevance Check (ChatGPT)                                     │
│  Stage 2: Event/Task Extraction (ChatGPT)                               │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   CALENDAR   │  │    TASKS     │  │    FACTS     │
            │   EVENTS     │  │              │  │              │
            └──────────────┘  └──────────────┘  └──────────────┘
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   Google     │  │   Google     │  │  Dashboard   │
            │   Calendar   │  │   Tasks      │  │  Display     │
            └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Workflows (n8n Cloud)

### Core Processing

| Workflow | Description | Status |
|----------|-------------|--------|
| **Bippity - AI Email Processor_Test** | Main processor - multi-tenant OAuth + subworkflow tools | Testing |
| **Bippity - Scheduled Email Check** | Gmail search by keywords | In progress |
| **Bippity - Extract Keywords from Facts** | Generates search keywords from family_facts | In progress |

### Onboarding

| Workflow | Description | Status |
|----------|-------------|--------|
| **Bippity - Parallelized_Onboarding_Supabase** | "Sign up with Google" flow via Supabase Auth | Active |

### Task Subworkflows (Multi-Tenant)

| Workflow | Description | Status |
|----------|-------------|--------|
| **Task_Create_Test** | Creates tasks | Testing |
| **Task_Update_Test** | Updates tasks | Testing |
| **Task_Delete_MultiTenant-Test** | Deletes tasks | Testing |
| **Tasks_Complete_MultiTenant-TEST** | Marks tasks complete | Testing |
| **Smart_Tasks_Search_MultiTenant-Test** | Searches tasks | Testing |

### Calendar Subworkflows (Multi-Tenant)

| Workflow | Description | Status |
|----------|-------------|--------|
| **Calendar_Create_TEST** | Creates calendar events | Testing |
| **Calendar_Update_TEST** | Updates calendar events | Testing |
| **Calendar_By_Date_MultiTenant-TEST** | Gets events by date | Testing |
| **Calendar_Search_MultiTenant-TEST** | Searches calendar events | Testing |

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `oauth_tokens` | OAuth provider tokens (Google) stored for n8n workflows to access |
| `connected_services` | Which services each user has connected |
| `unified_events` | All incoming communications - single source of truth |
| `family_facts` | Context about each family (kids, schools, activities) — displayed on dashboard |
| `family_keywords` | Keywords generated from family_facts for Gmail search |
| `onboarding_summaries` | AI-generated initial guess about family from email scan |
| `calendar_events` | Extracted calendar events |
| `tasks` | Extracted tasks |
| `blacklisted_domains` | Domains to exclude from email processing |

### Task Model

| Field | Purpose |
|-------|---------|
| `id`, `user_id` | Identity |
| `task_type` | 'domino' or 'following' |
| `linked_task_id` | Domino links to its following task (and vice versa) |
| `title` | Task title |
| `steps` | JSON array of steps (for following tasks) |
| `current_step_index` | Which step is currently the domino |
| `child` | Which child this relates to |
| `source_unified_event_id` | What message created this |
| `due_date` | When it's due |
| `is_completed` | Boolean |
| `google_task_id` | ID in Google Tasks (for sync) |

---

## Privacy & Security Principles

1. **OAuth via Supabase Auth** - OAuth tokens stored in `oauth_tokens` table for n8n workflows to retrieve
2. **Sender whitelist preferred** - Rather than reading all email, prefer whitelist of sender addresses
3. **Minimal data retention** - Process emails, extract structured data, don't hoard raw content
4. **User owns their data** - Easy export, easy delete
5. **Transparent about AI** - Users know AI is reading their emails
6. **Sensitive source handling** - Blacklist domains for financial/medical
7. **Multi-tenant isolation** - Users never see each other's data, ever

---

## Roadmap & Priorities

### Priority 1: Frontend (Current)
- Build Next.js landing page with Supabase Auth OAuth login
- Build dashboard displaying family_facts from Supabase
- Deploy to Railway with bippity.boo domain

### Priority 2: Multi-Tenant Testing
- Get all TEST workflows working with Supabase Auth OAuth (already migrated)
- Validate subworkflow tools work correctly
- Remove hardcoded test values once stable

### Priority 3: Keyword/Search Fixes
- Multi-word phrase support in keyword extraction
- Client-side filtering for Gmail search limitations

### Priority 4: Feedback Links
- Every calendar event includes: `https://bippity.boo/feedback?src={source_id}&run={run_id}&user={user_id}`
- Every task includes feedback link
- Feedback captured for product improvement

### Priority 5: Headless Browser / Portal Scraping
- Log into parent portals (Brightwheel, school portals, etc.)
- Extract data not available via email

### Priority 6: Fact Processing Workflow
- Process new facts as they come in
- Parse and store in `family_facts` table
- Update `family_keywords` accordingly

### Priority 7: Parent Chatbot & Coordination
- Chat interface for parents to query calendar/tasks
- Dynamic schedule adjustment
- Carpool coordination
- Conflict resolution

---

## Known Issues / TODOs

1. **Multi-word phrase search**: Gmail API treats phrases as OR'd single words. Need client-side filtering.
2. **Keyword extraction**: Currently single-word only.
3. **Hardcoded test values**: Remove once multi-tenant testing complete.
4. **Landing page**: Build in Next.js, deploy to Railway.
5. **Google Tasks API**: No native search - Smart_Tasks_Search is a workaround.

---

## Key Integrations

| Service | Purpose | Notes |
|---------|---------|-------|
| **Supabase Auth** | OAuth token management | Google OAuth provider, tokens stored in `oauth_tokens` table |
| **Gmail API** | Email ingestion | Read-only, search-based fetching |
| **Google Tasks API** | Task management | No native search capability |
| **Google Calendar API** | Event management | Full CRUD |
| **ChatGPT** | AI agents via n8n | Email parsing, extraction |

---

## Testing Configuration

- Test account: `chungfamilyparents@gmail.com`
- Test calendar: `MT-Calendar`
- Test task list: `MT-List`
- **TODO**: Remove hardcoding once multi-tenant stable

---

## Development Notes for AI Assistants

### Core Philosophy Reminders
- **Err on more** - When uncertain, extract/create the item. Better to over-inform than miss.
- **Unprocessable = manual review** - If an email can't be processed, DON'T silently skip. Create a task for manual review.
- **First domino only** - Tasks are decisions, not action lists. One task per choice point.
- **Feedback everywhere** - Every created item needs traceability back to source.

### Handling Unprocessable Emails
When AI cannot confidently process an email:
1. **Label in Gmail**: Apply "Bippity/NeedsReview" label
2. **Create manual review task**
3. **Mark in database**: `processing_status = 'needs_review'`

### When Working on Frontend
- Use Next.js App Router
- Supabase client for auth + data (no separate API server needed)
- Preserve visual style from `/bippityboo-711a96a6` folder (Base44 design)
- Login button triggers Supabase Auth OAuth (Google provider)
- Dashboard displays `family_facts` as strings

### When Working on n8n Workflows
- Workflows run on n8n Cloud
- Subworkflows are called via Execute Workflow node
- Use `$json` to access current item data in expressions

### When Working on Calendar Events
- Include feedback link in description: `Feedback: https://bippity.boo/feedback?src={unified_event_id}&run={execution_id}`
- Always include: child's name, source (what org sent this)

### When Working on Tasks
- Frame as decision: "Decide if..." or "Review..." not "Do X"
- Include deadline prominently
- Include feedback link in notes

### When Working on Supabase
- All queries should include `user_id` filter for multi-tenant
- Use parameterized queries to prevent SQL injection
- Check RLS policies when debugging permission issues
