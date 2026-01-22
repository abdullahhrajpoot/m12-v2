# n8n AI Agent Tool Configurations Reference

**IMPORTANT**: When updating ANY tool node, ALWAYS use the COMPLETE configuration from this file. Partial updates will clear missing fields.

## All Tools Use This Token Reference
```
access_token: "={{ $('Merge Token').first().json.access_token }}"
```

---

## 1. Calendar_Search_Tool (Shared: Stage 1 + Stage 2)
**Node ID**: `893035fd-c878-4f2a-88d5-8a4ecd56d0bd`  
**Workflow ID**: `kQJv5Vc1xBBqBaXG`

```json
{
  "description": "Description: Search events in Google Calendar using a keyword. Use only 1-2 words per query. Do not include dates in the query - use Calendar_By_Date for date-based searches. The response may include some empty fields.\nInput: query (string, 1-2 words only)\nExample inputs: \"soccer\", \"dinner\", \"meeting\", \"appointment\", \"birthday\"\nResponse notes: Results include event id (use this for updates/deletes), summary, start, end, description, location.",
  "workflowId": {
    "__rl": true,
    "value": "kQJv5Vc1xBBqBaXG",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "query": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('query', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "query",
        "displayName": "query",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 2. Calendar_By_Date_Tool (Shared: Stage 1 + Stage 2)
**Node ID**: `cb7f2ed3-abb6-4025-90e7-3a278f6a1328`  
**Workflow ID**: `Mes8HQVlpiFkm6Dj`

```json
{
  "description": "Description: Get all events on a specific date or date range. Provide After (start) and Before (end) dates in ISO 8601 format with timezone (e.g., 2025-12-05T00:00:00-08:00). To get a single day, set After to start of day and Before to end of day.\nInput:\n\nstart_date (ISO 8601 with timezone, e.g., 2025-12-05T00:00:00-08:00)\nend_date (ISO 8601 with timezone, e.g., 2025-12-06T00:00:00-08:00)\n\nDate rules:\n\nTimezone: America/Los_Angeles (Pacific) unless specified otherwise\nIf year not specified: use current year unless that makes date in the past, then use next year",
  "workflowId": {
    "__rl": true,
    "value": "Mes8HQVlpiFkm6Dj",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "start_date": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('start_date', ``, 'string') }}",
      "end_date": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('end_date', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "start_date",
        "displayName": "start_date",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "end_date",
        "displayName": "end_date",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 3. Tasks_Search_Tool (Shared: Stage 1 + Stage 2)
**Node ID**: `40b18465-b0bc-47c6-9b74-367fb3923211`  
**Workflow ID**: `zG1KVSuaQVTdJ2S2`

```json
{
  "description": "Description: Search tasks by keyword. Input should be a single keyword string (1-2 words). Searches in task title and notes. Returns incomplete tasks only.\nInput: keyword (string, 1-2 words only)\nExample inputs: \"library\", \"sign\", \"pack\", \"homework\"\nResponse notes: Results include task id (use this for updates/deletes/complete), title, notes, due date, status.",
  "workflowId": {
    "__rl": true,
    "value": "zG1KVSuaQVTdJ2S2",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "keyword": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('keyword', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "keyword",
        "displayName": "keyword",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 4. Tasks_Create_Tool (Stage 2 Only)
**Node ID**: `68025a89-f1e9-4f10-817e-df0c4de73668`  
**Workflow ID**: `KYl2xtkD9QvvVlki`

```json
{
  "description": "Description: Create a new task. Requires title and due date. Optional: notes.\nInput:\n\ntitle (string, REQUIRED) - Prepend with verbs when confident: \"Pack Lunch\", \"Sign Document\", \"Return Library Books\"\nnotes (string, optional) - MUST end with: \"Email: [subject] | Link: https://mail.google.com/mail/u/0/#inbox/[email_id] | model D1\"\ndue (RFC 3339 format, e.g., 2025-12-05T00:00:00.000Z, REQUIRED)\n\nDue date rules:\n\nAll tasks MUST have due dates\nTask relates to event with no due date = use event start time as due date\nDo not create tasks with due dates before today. If task is urgent, set due date as today.\nDue dates should end in 00:00:00.000Z (midnight UTC)\nLunch packing tasks: due 10pm night before the event\n\nScheduling deadlines rule:\nWhen you find a task that says something must be scheduled before date X, create TWO tasks:\n\nScheduling Task: \"Schedule [activity]\" - due date = halfway between today and X\nCompletion Task: \"Confirm [activity] completed\" - due date = X",
  "workflowId": {
    "__rl": true,
    "value": "KYl2xtkD9QvvVlki",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "title": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('title', ``, 'string') }}",
      "notes": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('notes', ``, 'string') }}",
      "due": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('due', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "title",
        "displayName": "title",
        "required": true,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "notes",
        "displayName": "notes",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "due",
        "displayName": "due",
        "required": true,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 5. Tasks_Update_Tool (Stage 2 Only)
**Node ID**: `d5305008-082c-4587-9573-3ab940e8993c`  
**Workflow ID**: `ZUfsPr9rfugfAXeu`

```json
{
  "description": "Description: Update an existing task. Requires task_id from search results. Only provided fields are changed.\nInput:\n\ntask_id (string from Tasks_Search results)\ntitle (string, optional)\nnotes (string, optional)\ndue (RFC 3339 format, optional)\n\nImportant: Do not make up task_id. All task_ids come from search results. If you get error \"Bad request - please check your parameters\" the id is not valid. If you get \"The resource you are requesting could not be found\" the task does not exist.",
  "workflowId": {
    "__rl": true,
    "value": "ZUfsPr9rfugfAXeu",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "task_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('task_id', ``, 'string') }}",
      "title": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('title', ``, 'string') }}",
      "notes": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('notes', ``, 'string') }}",
      "due": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('due', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "task_id",
        "displayName": "task_id",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "title",
        "displayName": "title",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "notes",
        "displayName": "notes",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "due",
        "displayName": "due",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 6. Tasks_Delete_Tool (Stage 2 Only)
**Node ID**: `e4827752-f23a-47c9-933a-6982241eb73f`  
**Workflow ID**: `ZidQALal7DjXlbyL`

```json
{
  "description": "Description: Delete a task by its task_id. Requires a real task_id from search results.\nInput: task_id (string from search results)\nImportant: Do not make up task_id. All task_ids come from search results.",
  "workflowId": {
    "__rl": true,
    "value": "ZidQALal7DjXlbyL",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "task_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('task_id', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "task_id",
        "displayName": "task_id",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 7. Tasks_Complete_Tool (Stage 2 Only)
**Node ID**: `2df5f1f9-1257-4abd-a01f-5abec6329176`  
**Workflow ID**: `ndXk87L0DVMB4Y77`

```json
{
  "description": "Description: Mark a task as completed by its task_id. Use this when an email indicates a task has been done.\nInput: task_id (string from search results)\nImportant: Do not make up task_id. All task_ids come from search results.",
  "workflowId": {
    "__rl": true,
    "value": "ndXk87L0DVMB4Y77",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "task_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('task_id', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "task_id",
        "displayName": "task_id",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 8. Calendar_Create_Tool (Stage 2 Only)
**Node ID**: `fc646d0b-e4fa-4343-a9c0-fd68c22888ed`  
**Workflow ID**: `ITcwJzOedm5PCsom`

```json
{
  "description": "Description: Create a new calendar event. Requires summary (title), start and end times. Optional: description, location, rrule.\nInput:\n\nsummary (string) - Use descriptive titles like \"Smith Family Dinner\" not just \"Dinner\"\nstart (ISO 8601 with timezone, e.g., 2025-12-05T09:00:00-08:00)\nend (ISO 8601 with timezone, e.g., 2025-12-05T10:00:00-08:00)\ndescription (string, optional) - MUST end with: \"Email: [subject] | Link: https://mail.google.com/mail/u/0/#inbox/[email_id] | model D1\"\nlocation (string, optional)\nrrule (string, optional) - RFC 5545 recurrence rule WITHOUT the \"RRULE:\" prefix (e.g., \"FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10\")\n\nDate/Time rules:\n\nTimezone: America/Los_Angeles unless specified otherwise\nIf year not specified: use current year unless that makes date in the past, then use next year\nDo not create events with dates before today\nNo specific time mentioned = all-day event (use date only, not dateTime)\nNo end time mentioned = assume 1 hour duration + prepend \"END TIME NOT STATED\" to summary\nUse ISO 8601 extended format (e.g., 2025-08-07T09:00:00-07:00)\n\nDuration guidelines:\n\nDinner: 1.5-2 hours\nMeeting: 30-60 minutes\nBirthday party: 2-3 hours",
  "workflowId": {
    "__rl": true,
    "value": "ITcwJzOedm5PCsom",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "summary": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('summary', ``, 'string') }}",
      "start": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('start', ``, 'string') }}",
      "end": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('end', ``, 'string') }}",
      "description": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('description', ``, 'string') }}",
      "location": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "summary",
        "displayName": "summary",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "start",
        "displayName": "start",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "end",
        "displayName": "end",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "description",
        "displayName": "description",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "location",
        "displayName": "location",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "rrule",
        "displayName": "rrule",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 9. Calendar_Update_Tool (Stage 2 Only)
**Node ID**: `0b6e88f4-9734-43b4-8ca7-07337a9d0390`  
**Workflow ID**: `WBRw3JHDEvofddy6`

```json
{
  "description": "Description: Update an existing calendar event. Requires event_id from search results. Only provided fields are changed.\nInput:\n\nevent_id (string from Calendar_Search or Calendar_By_Date results)\nsummary (string, optional)\nstart (ISO 8601 with timezone, optional)\nend (ISO 8601 with timezone, optional)\ndescription (string, optional)\nlocation (string, optional)\nrrule (string, optional) - RFC 5545 recurrence rule WITHOUT the \"RRULE:\" prefix (e.g., \"FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10\")\n\nImportant: Do not make up event_id. All event_ids come from search results.",
  "workflowId": {
    "__rl": true,
    "value": "WBRw3JHDEvofddy6",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "event_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('event_id', ``, 'string') }}",
      "summary": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('summary', ``, 'string') }}",
      "start": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('start', ``, 'string') }}",
      "end": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('end', ``, 'string') }}",
      "description": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('description', ``, 'string') }}",
      "location": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "event_id",
        "displayName": "event_id",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "summary",
        "displayName": "summary",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "start",
        "displayName": "start",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "end",
        "displayName": "end",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "description",
        "displayName": "description",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "location",
        "displayName": "location",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "rrule",
        "displayName": "rrule",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## 10. Calendar_Delete_Tool (Stage 2 Only)
**Node ID**: `01833742-1472-4840-acf0-9602b0bf8669`  
**Workflow ID**: `4EDuF5s0hKhyFmiE`

```json
{
  "description": "Description: Delete a calendar event by its event_id. When an event is deleted the response will be \"success: true\". If you try to delete an event with an event_id that does not exist, you will get an error message \"The resource you are requesting could not be found\".\nInput: event_id (string from search results)\nImportant: Do not make up event_id. All event_ids come from search results.",
  "workflowId": {
    "__rl": true,
    "value": "4EDuF5s0hKhyFmiE",
    "mode": "list"
  },
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "event_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('event_id', ``, 'string') }}",
      "access_token": "={{ $('Merge Token').first().json.access_token }}"
    },
    "matchingColumns": [],
    "schema": [
      {
        "id": "event_id",
        "displayName": "event_id",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      },
      {
        "id": "access_token",
        "displayName": "access_token",
        "required": false,
        "defaultMatch": false,
        "display": true,
        "canBeUsedToMatch": true,
        "type": "string",
        "removed": false
      }
    ],
    "attemptToConvertTypes": false,
    "convertFieldsToString": false
  }
}
```

---

## How to Prevent Future Mistakes

1. **Always reference this file** when updating tool nodes
2. **Copy the ENTIRE parameters object** from this file
3. **Never use partial updates** - the n8n API clears missing fields
4. **Test immediately** after any tool update to verify the configuration is intact



