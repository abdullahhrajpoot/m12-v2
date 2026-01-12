# Supabase UPDATE Node Output: Expected vs Actual

## Expected Output for "Save Onboarding Summaries" (UPDATE)

When the Supabase UPDATE node successfully updates a record, it should return:

### Success Case (Row Updated)

```json
{
  "json": {
    "itemCount": 1,  // Number of rows updated (1 = success, 0 = no rows matched)
    "user_id": "...",  // Database field name (not userId)
    "summary_sentences": [...],  // Database field name (not sentences)
    "status": "pending_review",
    "created_at": "2025-12-25T...",
    "updated_at": "2025-12-25T..."
    // ... other database fields
  }
}
```

### Failure Case (No Rows Updated)

```json
{
  "json": {
    "itemCount": 0,  // No rows matched the WHERE condition
    // Possibly empty json: {} or minimal fields
  }
}
```

## Key Points

### 1. Field Name Conversion

**Input** (from "Parse Sentences Array"):
- `userId` → becomes `user_id` in database
- `sentences` → becomes `summary_sentences` in database

**Output** (from UPDATE):
- Returns **database field names** (`user_id`, `summary_sentences`)
- NOT the original input field names (`userId`, `sentences`)

### 2. itemCount Field

The `itemCount` field indicates:
- **`itemCount: 1`** → UPDATE matched and updated 1 row (success)
- **`itemCount: 0`** → UPDATE matched 0 rows (record doesn't exist yet, need INSERT)

This is what "Check Update Result" uses to determine if INSERT is needed.

### 3. Current Workflow Logic

```
Parse Sentences Array
  → { userId: "...", sentences: [...] }
    ↓
Save Onboarding Summaries (UPDATE)
  → { itemCount: 0 or 1, user_id: "...", summary_sentences: [...] }
    ↓
Check Update Result (IF itemCount > 0)
  ├─ TRUE (itemCount > 0): UPDATE succeeded, workflow ends
  └─ FALSE (itemCount == 0): No record found, need INSERT
      ↓
Insert Onboarding Summaries (INSERT)
```

## Known Issue: Empty Output

**Problem**: In some cases, Supabase UPDATE may return **empty `json: {}`** even on success.

**Why this happens**:
- Supabase UPDATE returns the updated database record
- If the node is not configured to return fields, it may return empty
- Or if there's a field mapping issue

**Current Workaround**:
- The workflow checks `itemCount` to determine success
- If `itemCount` is missing, we need to infer it from the UPDATE operation result

## Verifying Output

To check what "Save Onboarding Summaries" actually returns:

1. **Run the workflow in n8n**
2. **Click on "Save Onboarding Summaries" node** in execution view
3. **Check the output data**:
   - Look for `itemCount` field
   - Check if `user_id` and `summary_sentences` are present
   - Verify field names match database schema (not input schema)

## Ideal Output Structure

For the workflow to work correctly, the output should include:

```json
{
  "json": {
    "itemCount": 1,  // CRITICAL: Must be present for "Check Update Result" to work
    "user_id": "8ac8bfee-c53a-4c35-b2d0-f92b0906b146",
    "summary_sentences": [
      "Sara is in Grade 1 at Lincoln Elementary",
      "Mike plays soccer in the AYSO league",
      ...
    ],
    "status": "pending_review",
    "created_at": "2025-12-25T10:00:00Z",
    "updated_at": "2025-12-25T10:05:00Z"
  }
}
```

## If itemCount is Missing

If Supabase UPDATE doesn't return `itemCount`, we need to:

1. **Add a Code node** after UPDATE to infer `itemCount`:
   ```javascript
   const items = $input.all();
   const result = [];
   
   for (const item of items) {
     // If UPDATE returned data, assume itemCount = 1
     // If UPDATE returned empty, assume itemCount = 0
     const itemCount = (item.json && Object.keys(item.json).length > 0) ? 1 : 0;
     
     result.push({
       json: {
         itemCount: itemCount,
         // Preserve any data from UPDATE
         ...item.json
       }
     });
   }
   
   return result;
   ```

2. **Or check if UPDATE node has a setting** to return row count/affected rows

## Related Documentation

- `FIX_SUPABASE_UPDATE_EMPTY_FIELDS.md` - Solution for handling UPDATE output
- `ALWAYS_OUTPUT_DATA_PRINCIPLE.md` - Ensuring nodes always output data






