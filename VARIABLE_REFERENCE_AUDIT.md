# Variable Reference Audit

## Issues Found

### ⚠️ CRITICAL: "Create Connected Service" Missing fieldsUi
**Node**: `d8d9504d-868c-4419-8eaf-b118a65c5d09`  
**Problem**: The node has `operation: "create"`, `tableId: "connected_services"`, and `dataToSend: "defineBelow"` but is **missing the `fieldsUi` section** with field values.

**Current State**:
```json
{
  "operation": "create",
  "tableId": "connected_services",
  "dataToSend": "defineBelow"
  // MISSING: fieldsUi with fieldValues
}
```

**Should Have**:
```json
{
  "operation": "create",
  "tableId": "connected_services",
  "dataToSend": "defineBelow",
  "fieldsUi": {
    "fieldValues": [
      {
        "fieldId": "user_id",
        "fieldValue": "={{ $('Supabase OAuth Webhook').item.json.body.userId }}"
      },
      {
        "fieldId": "service_name",
        "fieldValue": "Gmail"
      },
      {
        "fieldId": "service_type",
        "fieldValue": "email"
      }
    ]
  }
}
```

---

### ✅ Variable References - All Correct

#### Workflow Variables
- `$vars.N8N_API_KEY` ✅ Correct syntax for workflow variables

#### Current Item References (`$json`)
- `$json.body.userId` ✅ Correct (webhook body)
- `$json.itemCount` ✅ Correct (Supabase getAll output)
- `$json.access_token` ✅ Correct (HTTP Request output)
- `$json.id` ✅ Correct (Split Out item)
- `$json.text` ✅ Correct (Code node output)
- `$json.combined_output` ✅ Correct (Code node output)
- `$json.sentences` ✅ Correct (Code node output)

#### Cross-Node References (`$('Node Name')`)
- `$('Supabase OAuth Webhook').item.json.body.userId` ✅ Correct (accesses webhook node)
- `$('Supabase OAuth Webhook').item.json.body.email` ✅ Correct
- `$('Get Token from Supabase').item(0).json.access_token` ✅ Correct (Code node syntax)

#### Built-in Functions
- `$now.toISO()` ✅ Correct syntax
- `$input.all()` ✅ Correct (Code node syntax)
- `item(0)` ✅ Correct (Code node array access)

#### Field References
- `=messages` ✅ Correct (Split Out field reference)

#### Expression Syntax
- `={{ expression }}` ✅ Correct (expression evaluation)
- `=Bearer {{ $vars.N8N_API_KEY }}` ✅ Correct (mixed literal + expression)
- `{{$json.text}}` ✅ Correct (AI Agent prompt syntax)

---

## Summary

**Critical Issues**: 1 ✅ FIXED
- ✅ "Create Connected Service" - Fixed: Added operation, tableId, dataToSend, and fieldsUi

**Variable References**: All syntax correct ✅
- All `$json` references are valid
- All cross-node references use correct syntax
- Workflow variable reference is correct
- Code node variable usage is correct

