# TLDRpal

An intelligent family communication assistant that aggregates, organizes, and acts on family logistics.

## Vision

TLDRpal is not just a notification aggregator. It's an agentic family coordinator that:

1. **Aggregates** information from multiple sources (schools, extracurriculars, childcare, messaging)
2. **Organizes** into calendar events, tasks, and summaries
3. **Identifies conflicts** (scheduling overlaps, double-bookings, impossible logistics)
4. **Suggests resolutions** (reschedule options, carpool coordination, priority recommendations)
5. **Acts on behalf of parents** (sends RSVPs, coordinates with other parents, requests schedule changes)

The goal is to offload the mental load of family logistics — not just surfacing information, but actively managing it.

---

## Input Sources

| Source | Status | Method |
|--------|--------|--------|
| **Email (Gmail)** | Active | Gmail API via Nango OAuth |
| **School portals** | Planned | Headless browser (Brightwheel, ParentSquare) |
| **Activity platforms** | Planned | Headless browser (AYSO, gymnastics portals) |
| **Messaging** | Potential | SMS, WhatsApp group ingestion |
| **Documents** | Potential | PDF flyers, permission slips |

## Output Types

- Google Calendar events (with deduplication)
- Google Tasks (domino task model - see below)
- Weekly family digest summaries
- Alerts for time-sensitive items (permission slip deadlines, picture day)
- **Future**: Automated messages, RSVPs, coordination with other parents

---

## Tech Stack

- **n8n**: Workflow automation (cloud instance)
- **Supabase**: PostgreSQL database
- **Nango**: OAuth token management (multi-tenant)
- **Google APIs**: Gmail, Calendar, Tasks
- **AI**: Claude API for parsing and extraction

---

## Current State

- Transitioning from single-tenant to multi-tenant architecture
- OAuth handled by Nango for secure token management
- Testing against hardcoded account before full multi-tenant rollout

### Testing Configuration
- Test account: `chungfamilyparents@gmail.com`
- Test calendar: `MT-Calendar`
- Test task list: `MT-List`
- Many TEST workflows are hardcoded to these values
- **TODO**: Remove hardcoding once bugs are resolved

---

## Workflows

### Core Processing

| Workflow | Description | Status |
|----------|-------------|--------|
| **TLDRpal - AI Email Processor_Test** | Main processor - tests multi-tenant OAuth and subworkflow tools | Testing |
| **TLDRpal - Scheduled Email Check** | Searches Gmail by keywords to reduce volume and avoid sensitive sources | Active |

### Task Subworkflows (Multi-Tenant)

| Workflow | Description | Status |
|----------|-------------|--------|
| **Task_Create_Test** | Creates tasks in multi-tenant context | Testing |
| **Task_Update_Test** | Updates tasks in multi-tenant context | Testing |
| **Task_Delete_MultiTenant-Test** | Deletes tasks in multi-tenant context | Testing |
| **Tasks_Complete_MultiTenant-TEST** | Marks tasks as complete | Testing |
| **Smart_Tasks_Search_MultiTenant-Test** | Searches tasks (workaround: Google Tasks has no native search) | Testing |

### Calendar Subworkflows (Multi-Tenant)

| Workflow | Description | Status |
|----------|-------------|--------|
| **Calendar_Create_TEST** | Creates calendar events | Testing |
| **Calendar_Update_TEST** | Updates calendar events | Testing |
| **Calendar_Search_MultiTenant-TEST** | Searches calendar events | Testing |
| **Calendar_By_Date_MultiTenant-TEST** | Gets events by date range | Testing |

### Onboarding & User Management

| Workflow | Description | Status |
|----------|-------------|--------|
| **Onboarding/OAuth flow** | Handles new user signup, Nango OAuth, initial Gmail scan | Partial |
| **Welcome email flow** | Post-signup redirect | Draft |

---

## Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `unified_events` | All incoming communications (single source of truth) |
| `calendar_events` | Extracted calendar events |
| `tasks` | Extracted tasks (with domino/following structure) |
| `family_facts` | Context about each family (kids, schools, activities) |
| `family_keywords` | Keywords generated from family_facts for email search |
| `onboarding_summaries` | AI-generated initial guess about family from email scan; sparks chat to confirm/refine family_facts |
| `connected_services` | Which services each user has connected |
| `blacklisted_domains` | Domains to exclude from email processing (sensitive sources) |

---

## Task Model: Domino Tasks

Tasks follow a "domino" model rather than a flat list:

- **Domino task**: The current actionable item (a decision point, not an action list)
- **Following task**: Holds the remaining steps; invisible to user until domino is complete
- When user marks domino complete → cron creates next domino from following task
- Principle: **"First domino only"** — each task is one decision, not a checklist

---

## Agent Capabilities

| Level | Actions | Confirmation |
|-------|---------|--------------|
| **Auto-approve** | Add calendar event, create task | None |
| **Confirm first** | Send RSVP, decline invitation | User approval |
| **Always ask** | Cancel commitments, message other parents | Explicit request |

---

## Future Vision: Daily Coordination

While TLDRpal starts as invisible infrastructure, it evolves into a daily-use coordination tool:

### Dynamic Schedule Management
- Parent asks: "I need to leave work early today, can we adjust pickup?"
- System identifies conflict with existing carpool arrangement
- Suggests: "You could swap with [Other Parent] who picks up Wednesdays, or move Cora's gymnastics to Thursday"
- With permission, sends coordination message to other parent

### Conflict Detection
- Overlapping events across children
- Impossible logistics (pickup time conflicts with work meeting)
- Missing RSVPs approaching deadline
- Permission slips not yet signed

---

## Known Issues & TODOs

1. **Multi-word phrase search**: Gmail API treats phrases as OR'd single words. Need client-side filtering.
2. **Keyword extraction**: Currently single-word only. Need to support multi-word phrases.
3. **Hardcoded test values**: Remove once multi-tenant testing complete.
4. **Landing page**: Need professional page before onboarding flow is complete.

---

## Roadmap & Priorities

| # | Priority | Description |
|---|----------|-------------|
| 1 | Multi-Tenant Testing | Get all TEST workflows working with Nango OAuth, including subworkflows |
| 2 | Headless Browser / Portal Scraping | Log into parent portals (Brightwheel, etc.), extract data |
| 3 | Sender Whitelist Management | UI for managing trusted senders |
| 4 | Feedback Links | Every created item needs traceability back to source |
| 5 | Fact Processing Workflow | Process new facts, update family_facts and keywords |
| 6 | Photo Processing | Process images (flyers, permission slips, schedules) |
| 7 | Parent Chatbot & Keyword Fixes | Chat interface + multi-word phrase search support |

---

## Key Integrations

- **Nango**: Manages OAuth tokens for Google services (Gmail, Calendar, Tasks)
- **Gmail API**: Read-only access for email ingestion
- **Google Tasks API**: Create/update/complete tasks (no native search)
- **Google Calendar API**: Create/update events
- **Claude API**: AI agents for parsing emails, extracting events/tasks

---

## Architecture Principles

1. **Single source of truth**: All inputs normalize to `unified_events`
2. **Idempotent processing**: Same input → same output, safe to retry
3. **Stateless workflows**: No workflow-level state, all state in database
4. **Async by default, sync for tools**: Main processing async; subworkflow tools sync
5. **Database as queue**: Workflows poll database, not each other
6. **Source-agnostic logic**: Don't build email-specific logic where generic logic works
7. **Err on more**: When uncertain, extract/create the item. Better to over-inform than miss.
8. **First domino only**: Tasks are decisions, not action lists. One task per choice point.
9. **Feedback everywhere**: Every created item needs traceability back to source.

---

## Family Context (Test Data)

For testing, the system processes communications for:
- **Cora** - Grade 1 at Nesbit Elementary, AYSO Schoolyard soccer, Peninsula Gymnastics, advanced ballet
- **Ellora** - Pre-K at Footsteps, AYSO Playground soccer, MyGym San Carlos

---

## Development Notes for AI Assistants

When I ask you to:
- **"Debug a workflow"** → Check for null handling, API error responses, data type mismatches, and Nango token fetching
- **"Add a new source"** → Design ingestion flow, normalization to unified_events, source-specific parsing
- **"Optimize tokens"** → Look for redundant context, suggest field extraction over full-text processing
- **"Add a feature"** → Consider multi-tenant implications, idempotency, and audit trail
