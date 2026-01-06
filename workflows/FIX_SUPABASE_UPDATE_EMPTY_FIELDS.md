# Fix: Supabase UPDATE Returns Empty Fields

## Problem

**Supabase UPDATE operation returns the database record structure, not the original input data.**

When "Save Onboarding Summaries" (UPDATE) executes:
- **Input**: `{ userId: "...", sentences: [...] }`
- **Output**: `{ user_id: "...", summary_sentences: [...], itemCount: 1, ...other_db_fields }` 

The UPDATE returns database field names (`user_id`, `summary_sentences`) instead of input field names (`userId`, `sentences`), causing downstream nodes to fail because they expect `userId` and `sentences`.

## Root Cause

Supabase UPDATE operations:
1. Receive input with field names like `userId`, `sentences`
2. Map them to database columns (`user_id`, `summary_sentences`) 
3. Return the **updated database record** with database column names
4. Do NOT preserve the original input field names

## Solution

Add a Code node **after** "Save Onboarding Summaries" to preserve the original input data before UPDATE:

### Step 1: Add "Preserve Data for Insert" Code Node

**Position**: Between "Save Onboarding Summaries" and "Check Update Result"

**Code**:
```javascript
// Preserve original input data (userId, sentences) through UPDATE operation
// UPDATE returns database record with user_id/summary_sentences, not userId/sentences
const items = $input.all();
const result = [];

// Get original data from Parse Sentences Array node (from before UPDATE)
// Try multiple methods to access the node data
let originalData = null;
try {
  // Method 1: Try $() syntax (preferred for Code nodes)
  const parseOutput = $('Parse Sentences Array').first().json;
  if (parseOutput && parseOutput.userId && parseOutput.sentences) {
    originalData = {
      userId: parseOutput.userId,
      sentences: parseOutput.sentences
    };
  }
} catch (e) {
  try {
    // Method 2: Try $node syntax (fallback)
    const parseNode = $node['Parse Sentences Array'];
    if (parseNode && parseNode.json) {
      originalData = {
        userId: parseNode.json.userId,
        sentences: parseNode.json.sentences
      };
    }
  } catch (e2) {
    // Method 3: Try to get from UPDATE result (field name conversion)
    if (items.length > 0 && items[0].json) {
      originalData = {
        userId: items[0].json.user_id || items[0].json.userId,
        sentences: items[0].json.summary_sentences || items[0].json.sentences
      };
    }
  }
}

// Combine UPDATE result (itemCount) with original input data
for (const item of items) {
  result.push({
    json: {
      itemCount: item.json.itemCount || 0,
      userId: originalData?.userId || item.json.user_id || item.json.userId,
      sentences: originalData?.sentences || item.json.summary_sentences || item.json.sentences
    }
  });
}

// Ensure at least one item is returned (always output data)
if (result.length === 0 && originalData) {
  result.push({
    json: {
      itemCount: 0,
      userId: originalData.userId,
      sentences: originalData.sentences
    }
  });
}

return result.length > 0 ? result : items;
```

**Settings**:
- ✅ Enable "Always Output Data"

### Step 2: Update Connections

**Remove**:
- `Save Onboarding Summaries` → `Check Update Result`

**Add**:
- `Save Onboarding Summaries` → `Preserve Data for Insert`
- `Preserve Data for Insert` → `Check Update Result`

### Step 3: Update "Insert Onboarding Summaries" Node

Change field references from:
```javascript
$node['Parse Sentences Array'].json.userId
$node['Parse Sentences Array'].json.sentences
```

To:
```javascript
$json.userId
$json.sentences
```

Since the data now flows through "Preserve Data for Insert", it will have `userId` and `sentences` fields.

### Step 4: Fix "Check Update Result" Connection

Ensure "Check Update Result" FALSE branch (when `itemCount == 0`) connects to "Insert Onboarding Summaries".

Currently it's on the TRUE branch, which is wrong.

## Final Flow

```
Parse Sentences Array 
  → Save Onboarding Summaries (UPDATE)
    → Preserve Data for Insert (Code - preserves userId/sentences)
      → Check Update Result (IF itemCount > 0)
        FALSE branch (itemCount == 0) → Insert Onboarding Summaries (INSERT)
```

## Manual Steps in n8n UI

1. Add Code node named "Preserve Data for Insert" after "Save Onboarding Summaries"
2. Copy the code above into the node
3. Enable "Always Output Data" 
4. Update connections:
   - Remove: Save → Check Update Result
   - Add: Save → Preserve Data → Check Update Result
5. Update "Insert Onboarding Summaries" to use `$json.userId` and `$json.sentences`
6. Ensure "Check Update Result" FALSE branch connects to "Insert Onboarding Summaries"
7. Remove duplicate connection from "Parse Sentences Array" to "Insert Onboarding Summaries"
