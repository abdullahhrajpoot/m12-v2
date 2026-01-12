# Always Output Data Principle

## Core Problem

**When a node returns an empty array `[]`, n8n stops workflow execution and the next node never triggers.**

This is a critical workflow design principle that must be followed to ensure workflows complete successfully.

## The Issue

In n8n, if a Code node (or any node) returns an empty array:
- The workflow execution stops at that node
- Downstream nodes never execute
- No error is thrown - execution just silently stops
- This is often the root cause of "workflow didn't complete" issues

## Solution: Always Output Data

**Every node that might produce no results must be configured to "Always Output Data":**

### Pattern 1: Code Nodes

```javascript
// ❌ BAD - Returns empty array, workflow stops
const results = [];
for (const item of items) {
  if (isValid(item)) {
    results.push(item);
  }
}
return results; // If empty, workflow stops!

// ✅ GOOD - Always returns at least one item
const results = [];
for (const item of items) {
  if (isValid(item)) {
    results.push(item);
  }
}

// Always ensure at least one item flows through
if (results.length === 0) {
  return [{
    json: {
      _noData: true,
      // ... minimal data needed for downstream
    }
  }];
}
return results;
```

### Pattern 2: Filtering Nodes

```javascript
// When filtering results, always return at least one item
const filtered = [];
for (const item of items) {
  if (meetsCriteria(item)) {
    filtered.push(item);
  }
}

// If nothing matches, return minimal item with flag
if (filtered.length === 0) {
  return [{
    json: {
      _empty: true,
      // Minimal data for downstream processing
    }
  }];
}
return filtered;
```

### Pattern 3: Nodes with Empty Input

```javascript
// Handle case where input might be empty
const items = $input.all();
const results = [];

// Process items...
for (const item of items) {
  results.push(processItem(item));
}

// If no input, return minimal item so workflow continues
if (results.length === 0) {
  return [{
    json: {
      _noInput: true,
      message: 'No items to process'
    }
  }];
}

return results;
```

## Token Efficiency Consideration

When returning a "no data" item that will be processed by AI nodes:

**Most token-efficient approach:**
- Return minimal data (empty strings, flags)
- AI will process with minimal tokens (~30-40 tokens for base prompt + minimal response)
- Allows workflow to continue while minimizing costs

Example:
```javascript
if (results.length === 0) {
  return [{
    json: {
      text: '',  // Empty string - minimal AI prompt (~30-40 tokens)
      _noData: true  // Flag for downstream handling
    }
  }];
}
```

## Best Practices

1. **Always check**: Before returning from a Code node, ask: "Could this return an empty array?"
2. **Always handle**: If yes, ensure you return at least one item with flags/metadata
3. **Use flags**: Include `_noData`, `_empty`, `_skipped` flags to help downstream nodes handle gracefully
4. **Preserve context**: When returning "no data" items, include any context needed downstream (userId, timestamps, etc.)
5. **Document intent**: Add comments explaining why you're returning a minimal item

## Common Scenarios

### Scenario 1: Filtering
**Problem**: Filter out invalid items, but all items are invalid
**Solution**: Return minimal item with `_allFiltered: true` flag

### Scenario 2: Processing Empty Input
**Problem**: Input node receives no data
**Solution**: Return minimal item indicating no input received

### Scenario 3: Conditional Processing
**Problem**: IF node routes to Code node that processes nothing
**Solution**: Always return at least one item, even if just a flag

### Scenario 4: AI Agent Processing
**Problem**: No valid items to send to AI
**Solution**: Return minimal item with empty text (triggers minimal prompt, ~30-40 tokens)

## Downstream Handling

Downstream nodes should check for flags and handle gracefully:

```javascript
// In downstream Code node
const items = $input.all();
const results = [];

for (const item of items) {
  // Skip "no data" items if appropriate
  if (item.json._noData || item.json._empty) {
    // Option 1: Skip entirely
    continue;
    
    // Option 2: Pass through with handling
    results.push({
      json: {
        ...item.json,
        processed: false,
        reason: 'no data flag'
      }
    });
  }
  
  // Normal processing...
}
```

## Error Handling

Use `onError: 'continueRegularOutput'` or `onError: 'continueErrorOutput'` for nodes that might fail, but **this doesn't solve the empty array problem** - you still need to ensure nodes always output data.

## Testing

Always test workflows with:
- Empty input
- All items filtered out
- Edge cases where processing produces no results

Verify that:
- Workflow continues to completion
- Final nodes execute
- Database saves occur (if applicable)
- Emails send (if applicable)

## Related Patterns

- **Error handling**: Use `onError` properties for nodes that might fail
- **Continue on fail**: For Supabase/HTTP nodes, use `onError: 'continueRegularOutput'`
- **Fallback values**: Always provide fallback values in expressions

## Key Takeaway

**Empty arrays stop workflows. Always return at least one item when workflow continuation is required.**







