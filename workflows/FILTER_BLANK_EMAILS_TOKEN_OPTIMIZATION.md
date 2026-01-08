# Most Token-Efficient Solution for "Filter Out Blank Emails"

## Current Flow
```
Filter Out Blank Emails → Extraction System (AI Agent) → Aggregate Extractions → Consolidator System
```

## Token Usage Analysis

### Option 1: Return Empty Array (0 tokens for AI, but workflow stops)
```javascript
return []; // Empty array
```
- **Tokens**: 0 (AI agent doesn't execute with 0 items)
- **Workflow**: Stops, Aggregate Extractions doesn't run
- **Problem**: Workflow doesn't continue to save results

### Option 2: Return Minimal Item with Empty Text (~20-30 tokens)
```javascript
if (results.length === 0) {
  return [{
    json: {
      text: ''  // Empty string - minimal prompt
    }
  }];
}
```
- **Tokens**: ~20-30 (base prompt only: "Extract entity facts from the following emails: ")
- **AI Output**: Will return `{"entities": []}` (minimal, structured)
- **Workflow**: Continues normally
- **Pros**: Simplest, minimal tokens
- **Cons**: Still calls AI (but with minimal input)

### Option 3: Return Flag and Bypass AI (0 tokens, but requires workflow changes)
Would require adding IF node before AI agent to check flag and bypass.
- **Tokens**: 0 (AI never called)
- **Workflow**: More complex, requires restructuring

## Recommended Solution: Option 2 (Minimal Text)

**Most token-efficient solution that maintains workflow simplicity:**

```javascript
// Filter out blank or nearly-empty emails
const items = $input.all();
const results = [];

for (const item of items) {
  // Skip null/undefined items
  if (!item || !item.json) {
    continue;
  }
  
  const email = item.json.text;
  
  // Skip if no email content
  if (!email || typeof email !== 'string') {
    continue;
  }
  
  // Skip if email is too short (less than 50 chars after trimming)
  const trimmed = email.trim();
  if (trimmed.length < 50) {
    continue;
  }
  
  // Add valid item to results (only include id if it exists)
  const resultItem = {
    json: {
      text: item.json.text
    }
  };
  
  // Include id only if it exists and is valid
  if (item.json.id !== undefined && item.json.id !== null) {
    resultItem.json.id = item.json.id;
  }
  
  results.push(resultItem);
}

// If all emails filtered out, return minimal item to keep workflow going
// This uses ~20-30 tokens (base prompt only) vs 0 tokens if we returned []
// but allows workflow to continue and produce expected output format
if (results.length === 0) {
  return [{
    json: {
      text: ''  // Empty string - AI will return {"entities": []} with minimal tokens
    }
  }];
}

return results;
```

## Why This Is Most Token-Efficient for Continuation

1. **Minimal tokens**: Empty string triggers base prompt (~20-30 tokens) + minimal response (~10 tokens) = ~30-40 tokens total
2. **Expected output format**: AI returns `{"entities": []}` which flows correctly to Aggregate Extractions
3. **No workflow changes**: Works with existing structure
4. **Predictable**: Aggregate Extractions receives expected format, handles it normally

## Token Breakdown

**If all emails filtered:**
- Filter node: 0 tokens (Code node)
- AI Agent with empty text: ~20-30 tokens (prompt) + ~10 tokens (response) = **~30-40 tokens total**
- Aggregate Extractions: Processes 1 item with `{"entities": []}` format
- Consolidator: Gets "No extractions found" message

**Total cost for empty case: ~30-40 tokens** (vs 0 if we stop workflow, but then no results saved)

## Alternative: Bypass AI Entirely (0 tokens, but complex)

If you want 0 tokens and are willing to restructure the workflow:
1. Add IF node after "Filter Out Blank Emails" to check if results are empty
2. If empty, create Code node that outputs expected format: `{"entities": []}`
3. If not empty, go to AI agent
4. Merge both paths before Aggregate Extractions

This saves ~30-40 tokens but adds workflow complexity. **Not recommended** unless token costs are critical (savings: ~$0.00004 per execution).





