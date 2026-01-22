# Tool, Prompt, and Google API Requirements Alignment Analysis

## Summary of the Issue

When the AI Agent prompt says a field is optional, but the tool schema says it's required, the LLM follows the prompt (more specific instruction), omits the field, then n8n validation fails with "Required" error.

---

## Google Calendar API - Actual Requirements

### Calendar Create (events.insert)
**Source:** https://developers.google.com/calendar/api/v3/reference/events/insert

| Field | Google Requires? | Type | Notes |
|-------|------------------|------|-------|
| `summary` | ❌ Optional | string | Defaults to empty string if omitted |
| `start` | ✅ **REQUIRED** | datetime or date | Must provide either dateTime+timeZone OR date |
| `end` | ✅ **REQUIRED** | datetime or date | Must provide either dateTime+timeZone OR date |
| `description` | ❌ Optional | string | |
| `location` | ❌ Optional | string | |
| `recurrence` | ❌ Optional | array of strings | RRULE format with "RRULE:" prefix |

**CRITICAL:** For `recurrence`, Google expects an ARRAY like `["RRULE:FREQ=WEEKLY;BYDAY=MO"]`

### Calendar Update (events.patch)
**Source:** https://developers.google.com/calendar/api/v3/reference/events/patch

| Field | Google Requires? | Notes |
|-------|------------------|-------|
| `eventId` | ✅ **REQUIRED** | Path parameter |
| All other fields | ❌ Optional | Only update fields you provide (partial update) |

---

## Google Tasks API - Actual Requirements

### Tasks Create (tasks.insert)
**Source:** https://developers.google.com/tasks/reference/rest/v1/tasks/insert

| Field | Google Requires? | Type | Notes |
|-------|------------------|------|-------|
| `title` | ✅ **REQUIRED** | string | Task title |
| `notes` | ❌ Optional | string | |
| `due` | ❌ Optional | RFC 3339 timestamp | |

### Tasks Update (tasks.update or tasks.patch)
**Source:** https://developers.google.com/tasks/reference/rest/v1/tasks/update

| Field | Google Requires? | Notes |
|-------|------------------|-------|
| `taskId` | ✅ **REQUIRED** | Path parameter |
| All other fields | ❌ Optional | Only update fields you provide |

---

## Current Tool Descriptions (What AI Reads)

### Calendar_Create_Tool Description
```
Description: Create a new calendar event. Requires summary (title), start and end times. 
Optional: description, location, rrule.

Input:
- summary (string) - Use descriptive titles like "Smith Family Dinner" not just "Dinner"
- start (ISO 8601 with timezone, e.g., 2025-12-05T09:00:00-08:00)
- end (ISO 8601 with timezone, e.g., 2025-12-05T10:00:00-08:00)
- description (string, optional) - MUST end with: "Email: [subject] | Link: ..."
- location (string, optional)
- rrule (string, optional) - RFC 5545 recurrence rule WITHOUT the "RRULE:" prefix
```

**Tool Schema (n8n validation):**
- `summary`: `"required": false` ❌ **MISMATCH** (description says required)
- `start`: `"required": false` ❌ **MISMATCH** (description says required)
- `end`: `"required": false` ❌ **MISMATCH** (description says required)
- `location`: `"required": false` ✅ Correct
- `rrule`: `"required": false` ✅ Correct
- `description`: `"required": false` ✅ Correct

### Calendar_Update_Tool Description
```
Description: Update an existing calendar event. Requires event_id from search results. 
Only provided fields are changed.

Input:
- event_id (string from Calendar_Search or Calendar_By_Date results)
- summary (string, optional)
- start (ISO 8601 with timezone, optional)
- end (ISO 8601 with timezone, optional)
- description (string, optional)
- location (string, optional)
- rrule (string, optional) - RFC 5545 recurrence rule WITHOUT the "RRULE:" prefix
```

**Tool Schema (n8n validation):**
- `event_id`: `"required": false` ❌ **MISMATCH** (should be true - can't update without ID)
- All others: `"required": false` ✅ Correct (partial update)

### Tasks_Create_Tool Description
```
Description: Create a new task. Requires title. Optional: notes, due date.

Input:
- title (string) - Prepend with verbs when confident: "Pack Lunch", "Sign Document"
- notes (string, optional) - MUST end with: "Email: [subject] | Link: ..."
- due (RFC 3339 format, e.g., 2025-12-05T00:00:00.000Z, optional)
```

**Tool Schema (n8n validation):**
- `title`: `"required": false` ❌ **MISMATCH** (description says required, Google requires it)
- `notes`: `"required": false` ✅ Correct
- `due`: `"required": false` ✅ Correct

### Tasks_Update_Tool Description
```
Description: Update an existing task. Requires task_id from search results. 
Only provided fields are changed.

Input:
- task_id (string from Tasks_Search results)
- title (string, optional)
- notes (string, optional)
- due (RFC 3339 format, optional)
```

**Tool Schema (n8n validation):**
- `task_id`: `"required": false` ❌ **MISMATCH** (should be true - can't update without ID)
- All others: `"required": false` ✅ Correct (partial update)

---

## Current AI Agent Prompts

### Stage 2 System Prompt - Relevant Sections

**Date/Time Rules:**
```
- No specific time = all-day event. Only use Start Date and End Date. 
  Do not include dateTime. End Date should be the day after the last day of the event.
- No end time = assume 1 hour duration + append "END TIME NOT STATED" before any name
```

⚠️ **POTENTIAL CONFLICT:** Prompt says "No specific time = all-day event", but this might lead the AI to create events without proper start/end, which are REQUIRED by Google.

**Task Rules:**
```
- All tasks need due dates
- Task relates to event with no due date = use event start time as due date
- Do not create tasks with due dates before today. If task is urgent, set due date as today.
```

⚠️ **CONFLICT:** Prompt says "All tasks need due dates" but Google Tasks API says `due` is OPTIONAL. Also, `due` is marked `"required": false` in schema. This creates confusion.

---

## Recommended Fixes

### 1. ✅ Calendar_Create_Tool - Fix Schema to Match Description + Google API

**Tool Description (Keep as-is):** "Requires summary (title), start and end times"

**Schema Changes:**
```json
{
  "id": "summary",
  "required": false  // ❌ WRONG - Change to true
}
{
  "id": "start",
  "required": true   // ✅ CORRECT - Google requires this
}
{
  "id": "end",
  "required": true   // ✅ CORRECT - Google requires this
}
{
  "id": "location",
  "required": false  // ✅ CORRECT
}
{
  "id": "rrule",
  "required": false  // ✅ CORRECT
}
{
  "id": "description",
  "required": false  // ✅ CORRECT
}
```

**Google Reality:** `start` and `end` are REQUIRED. `summary` is optional but highly recommended.

**Recommendation:** Set `start` and `end` to `required: true`. Keep `summary` as `false` but ensure prompt emphasizes it.

---

### 2. ✅ Calendar_Update_Tool - Fix event_id Requirement

**Schema Changes:**
```json
{
  "id": "event_id",
  "required": true   // ✅ Must be true - can't update without ID
}
```

All other fields remain `required: false` (partial update is valid).

---

### 3. ✅ Tasks_Create_Tool - Fix title Requirement

**Tool Description (Keep as-is):** "Requires title"

**Schema Changes:**
```json
{
  "id": "title",
  "required": true   // ✅ Must be true - Google requires it
}
{
  "id": "notes",
  "required": false  // ✅ Correct
}
{
  "id": "due",
  "required": false  // ✅ Correct - but see prompt conflict below
}
```

---

### 4. ✅ Tasks_Update_Tool - Fix task_id Requirement

**Schema Changes:**
```json
{
  "id": "task_id",
  "required": true   // ✅ Must be true - can't update without ID
}
```

All other fields remain `required: false` (partial update is valid).

---

### 5. ⚠️ Stage 2 Prompt - Remove Conflicting Task Due Date Rule

**Current Prompt Says:**
```
- All tasks need due dates
```

**Problem:** This conflicts with:
1. Google Tasks API (due is optional)
2. Schema setting (`"required": false`)
3. Tool description ("due date, optional")

**Recommended Change:**
```
- Set due dates for tasks whenever possible
- If email doesn't specify when task should be done, you may omit due date
- Task relates to event = use event start time as due date
```

This aligns the prompt with Google's API and the schema.

---

## Summary: What Needs to Change

| Tool | Field | Current Schema | Should Be | Why |
|------|-------|----------------|-----------|-----|
| Calendar_Create_Tool | `start` | `false` | `true` | Google requires it, description says required |
| Calendar_Create_Tool | `end` | `false` | `true` | Google requires it, description says required |
| Calendar_Create_Tool | `summary` | `false` | Keep `false` | Google allows empty, but prompt should emphasize |
| Calendar_Update_Tool | `event_id` | `false` | `true` | Can't update without an ID |
| Tasks_Create_Tool | `title` | `false` | `true` | Google requires it, description says required |
| Tasks_Update_Tool | `task_id` | `false` | `true` | Can't update without an ID |
| Stage 2 Prompt | Task due date | "All tasks need due dates" | "Set due dates when possible" | Conflicts with schema + Google API |

---

## How to Fix in n8n UI

For each tool listed above:

1. Open "AI Agent - Stage 2 Actions" node
2. Scroll to "Tools" section
3. Click on the tool (e.g., "Calendar_Create_Tool")
4. Click "Workflow Inputs" → "Schema"
5. Find the field (e.g., `start`)
6. Toggle "Required" to match the table above
7. Save

For the prompt:
1. Open "AI Agent - Stage 2 Actions" node
2. Edit "System Message"
3. Find "All tasks need due dates"
4. Change to "Set due dates for tasks whenever possible"
5. Save
