# n8n HTTP Request Node Checklist

## Critical Fields for Gmail API Requests

When creating or updating HTTP Request nodes for Gmail API, **ALWAYS verify these fields exist**:

### 1. URL (Required)
- **Field**: `parameters.url`
- **Value**: Must be set to the Gmail API endpoint
- **Example**: `https://gmail.googleapis.com/gmail/v1/users/me/messages`
- **Check**: The node should have a `url` parameter, not just query parameters

### 2. Query Parameters (Required for searches)
- **Field**: `parameters.queryParameters.parameters[]`
- **Required parameters for Gmail search**:
  - `q`: The search query string
  - `maxResults`: Number of results (must be in query parameters, NOT in URL)

### 3. Headers (Required for authenticated requests)
- **Field**: `parameters.sendHeaders` must be `true`
- **Field**: `parameters.headerParameters.parameters[]` must include:
  - `Authorization`: `Bearer {{ $node['Get Token from Supabase'].json.access_token }}`

## Common Mistakes

1. **Missing URL**: Only query parameters, no URL → Request fails silently or returns empty
2. **Missing Headers**: No Authorization header → 401 Unauthorized
3. **maxResults in URL**: Should be in queryParameters, not concatenated in URL string
4. **Query parameters in URL string**: Use `queryParameters` object, not URL concatenation

## Verification Steps

Before saving any HTTP Request node update:

1. ✅ Does it have a `url` field?
2. ✅ Does it have `sendHeaders: true`?
3. ✅ Does it have `headerParameters` with Authorization header?
4. ✅ Are query parameters in `queryParameters.parameters[]`, not in URL string?
5. ✅ For Gmail search: Does it have both `q` and `maxResults` in queryParameters?

## Example: Complete Gmail Search Node Configuration

```json
{
  "parameters": {
    "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "q",
          "value": "(school OR academy) newer_than:30d"
        },
        {
          "name": "maxResults",
          "value": "120"
        }
      ]
    },
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ $node['Get Token from Supabase'].json.access_token }}"
        }
      ]
    },
    "options": {}
  }
}
```

## IF Node Branch Connection Checklist

When creating or updating IF nodes, **ALWAYS verify branch connections are correct**:

### Understanding IF Node Branches

- **Index 0** = TRUE branch (condition is true)
- **Index 1** = FALSE branch (condition is false)

### Critical Verification Steps

1. ✅ **Understand the condition logic**: What does TRUE mean? What does FALSE mean?
2. ✅ **Check which branch should connect**: Based on the condition, which branch (TRUE/FALSE) should route to the next node?
3. ✅ **Verify connection index**: In the connections object, verify `sourceOutputIndex` matches the intended branch
4. ✅ **Read the condition carefully**: Check the operator (`gt`, `equals`, `exists`, etc.) to understand which branch fires when

### Common Mistakes

1. **Wrong branch index**: Connecting to index 0 (TRUE) when you meant index 1 (FALSE)
   - **Example**: Condition is `itemCount > 0` → TRUE means record exists, FALSE means insert needed
   - **Mistake**: Connecting INSERT node to index 0 (TRUE branch)
   - **Fix**: Should connect to index 1 (FALSE branch)

2. **Logic mismatch**: Not understanding what TRUE/FALSE means for the condition
   - **Example**: Condition `itemCount > 0` means:
     - TRUE: `itemCount > 0` → Record found, UPDATE succeeded
     - FALSE: `itemCount == 0` → No record found, INSERT needed

3. **Both branches connecting to same node**: Sometimes only ONE branch should connect
   - **Example**: Upsert pattern - FALSE branch goes to INSERT, TRUE branch might go nowhere (or to success)

### Verification Steps for IF Nodes

Before saving any IF node connection changes:

1. ✅ **Read the condition**: What is the IF node checking?
2. ✅ **Determine intended flow**: What should happen when condition is TRUE? What when FALSE?
3. ✅ **Check connections object**: 
   - Does `sourceOutputIndex: 0` (TRUE branch) connect to the right node?
   - Does `sourceOutputIndex: 1` (FALSE branch) connect to the right node?
4. ✅ **Verify logic matches**: Does the branch index match the intended behavior?

### Example: Upsert Pattern with IF Node

```javascript
// IF Node: "Check Update Result"
// Condition: itemCount > 0

// Logic:
// - TRUE (index 0): itemCount > 0 → UPDATE found a record, done
// - FALSE (index 1): itemCount == 0 → No record found, need INSERT

// Connections should be:
{
  "Check Update Result": {
    "main": [
      [],  // Index 0 (TRUE): No connection needed, UPDATE succeeded
      [    // Index 1 (FALSE): Connect to INSERT node
        {
          "node": "Insert Onboarding Summaries",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}

// In MCP operations:
// - sourceOutputIndex: 1 (FALSE branch)
// - target: "insert-summaries"
```

### Example: OAuth Check Pattern

```javascript
// IF Node: "OAuth Successful?"
// Condition: userId exists

// Logic:
// - TRUE (index 0): userId exists → OAuth successful, continue workflow
// - FALSE (index 1): userId missing → OAuth failed, stop workflow

// Connections should be:
{
  "OAuth Successful?": {
    "main": [
      [    // Index 0 (TRUE): Continue to next step
        {
          "node": "Check if User Exists",
          "type": "main",
          "index": 0
        }
      ],
      []   // Index 1 (FALSE): No connection, workflow stops
    ]
  }
}
```

## Prevention Strategy

**Before updating HTTP Request nodes via MCP:**
1. Always fetch the current workflow first
2. Verify the node has ALL required fields (URL, headers, query params)
3. Compare with a known-good configuration
4. If only updating one field (e.g., query string), verify all other fields remain intact

**Before updating IF node connections via MCP:**
1. Always fetch the current workflow first
2. Read the IF node's condition carefully to understand TRUE vs FALSE
3. Determine which branch (TRUE/FALSE) should connect to each downstream node
4. Verify the `sourceOutputIndex` in the connection matches the intended branch (0=TRUE, 1=FALSE)
5. Test the logic mentally: "If condition is TRUE, does it go to the right place? If FALSE, does it go to the right place?"
6. If unsure, check execution logs to see which branch actually fired and where data went

