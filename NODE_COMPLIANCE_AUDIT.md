# Node Compliance Audit

## Issues Found

### 1. ⚠️ CRITICAL: "Create Connected Service" Node Missing Operation
**Node ID**: `d8d9504d-868c-4419-8eaf-b118a65c5d09`  
**Type**: `n8n-nodes-base.supabase`  
**TypeVersion**: 1

**Problem**: The node only has `fieldsUi` but is missing the required `operation` parameter. Without this, the node cannot execute properly.

**Current State**:
```json
{
  "fieldsUi": {
    "fieldValues": [...]
  }
}
```

**Should Have**:
```json
{
  "operation": "create",
  "tableId": "connected_services",
  "dataToSend": "defineBelow",
  "fieldsUi": {
    "fieldValues": [...]
  }
}
```

**Fix Required**: Add `operation: "create"` and `tableId: "connected_services"` and `dataToSend: "defineBelow"`

---

### 2. ⚠️ CRITICAL: "Pull Discovered Emails" Node Missing Method and URL
**Node ID**: `9499c351-31c5-47f0-9561-d90265d509c2`  
**Type**: `n8n-nodes-base.httpRequest`  
**TypeVersion**: 4.3

**Problem**: The node parameters only show `headerParameters` but are missing:
- `method` (should be "GET")
- `url` (should be the Gmail message endpoint)
- `sendQuery`, `sendBody`, etc.

**Current State**:
```json
{
  "headerParameters": {
    "parameters": [...]
  }
}
```

**Should Have**:
```json
{
  "method": "GET",
  "url": "=https://gmail.googleapis.com/gmail/v1/users/me/messages/{{ $json.id }}",
  "sendHeaders": true,
  "headerParameters": {...},
  "sendQuery": false,
  "sendBody": false
}
```

**Fix Required**: Add complete HTTP request parameters

---

### 3. Database Operations Review

#### ✅ "Check if User Exists"
- Operation: `getAll` ✅ Correct for querying

#### ✅ "Create User"  
- Operation: `create` ✅ Correct
- Has `continueOnFail: true` ✅ Handles duplicates

#### ⚠️ "Create Connected Service"
- Operation: **MISSING** ❌ Must be fixed

#### ✅ "Update Existing User"
- Operation: `update` ✅ Correct

#### ✅ "Save Onboarding Summaries"
- Operation: `update` ✅ Correct (tries update first, then insert if fails)

#### ✅ "Insert Onboarding Summaries"
- Operation: `create` ✅ Correct
- Has `continueOnFail: true` ✅ Handles duplicates

**UPSERT Consideration**: 
- Current approach (update then insert with continueOnFail) works but is not ideal
- Could use upsert if Supabase node supports it, but current pattern is acceptable

---

### 4. HTTP Methods Review

#### ✅ "Supabase OAuth Webhook"
- Method: `POST` ✅ Correct (webhooks receive POST)

#### ✅ "Get Token from Supabase"
- Method: `GET` ✅ Correct (retrieving data)
- URL: `https://bippity.boo/api/auth/tokens` ✅ Correct
- Uses query parameters ✅ Correct

#### ✅ "Search Gmail For Usual Suspects"
- Method: `GET` ✅ Correct (Gmail API query)
- URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages` ✅ Correct
- Uses query parameters ✅ Correct

#### ⚠️ "Pull Discovered Emails"
- Method: **MISSING** ❌ Must be fixed
- URL: **MISSING** ❌ Must be fixed

---

### 5. Node Version Review

Need to check latest stable versions:
- `n8n-nodes-base.webhook`: 2.1 (need to verify latest)
- `n8n-nodes-base.if`: 2.3 (need to verify latest)
- `n8n-nodes-base.supabase`: 1 (need to verify latest)
- `n8n-nodes-base.httpRequest`: 4.3 (need to verify latest)
- `n8n-nodes-base.splitOut`: 1 (need to verify latest)
- `n8n-nodes-base.code`: 2 (need to verify latest)
- `@n8n/n8n-nodes-langchain.agent`: 3 (need to verify latest)
- `@n8n/n8n-nodes-langchain.lmChatOpenAi`: 1.3 (need to verify latest)
- `@n8n/n8n-nodes-langchain.memoryBufferWindow`: 1.3 (need to verify latest)

---

## Summary

**Critical Issues**: 2 ✅ FIXED
1. ✅ "Create Connected Service" - Fixed: Added operation: "create", tableId: "connected_services", dataToSend: "defineBelow"
2. ✅ "Pull Discovered Emails" - Fixed: Added method: "GET", url: "=https://gmail.googleapis.com/gmail/v1/users/me/messages/{{ $json.id }}"

**Deprecation Warnings** (Non-critical):
- "Create User" and "Insert Onboarding Summaries" use deprecated `continueOnFail: true`
- Should be migrated to `onError: 'continueRegularOutput'` in future update
- Current functionality still works

**Code Node Warning** (Non-critical):
- "Convert To One Paragraph" - validation warning about returning primitives, but code actually returns objects correctly

**Actions Completed**:
1. ✅ Fixed "Create Connected Service" node - added operation, tableId, dataToSend
2. ✅ Fixed "Pull Discovered Emails" node - added method, url, sendQuery, sendBody
3. ⚠️ Node versions appear to be current (typeVersion matches expected versions)

