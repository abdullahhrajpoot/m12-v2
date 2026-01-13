# Comprehensive Authentication & Header Audit

## HTTP Request Nodes

### 1. "Get Token from Supabase" ✅
- **Method**: GET ✅
- **URL**: `https://bippity.boo/api/auth/tokens` ✅
- **Query Parameters**: 
  - `userId`: `={{ $('Supabase OAuth Webhook').item.json.body.userId }}` ✅
  - `provider`: `google` ✅
- **Headers**: ✅
  - `Authorization`: `=Bearer {{ $vars.N8N_API_KEY }}` ✅
  - Uses workflow variable (correct) ✅
  - Expression prefix `=` ✅
- **sendHeaders**: `true` ✅
- **Status**: ✅ CORRECT

### 2. "Search Gmail For Usual Suspects" ✅
- **Method**: GET ✅
- **URL**: `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25` ✅
- **Query Parameters**: `q` with search terms ✅
- **Headers**: ✅
  - `Authorization`: `=Bearer {{ $json.access_token }}` ✅
  - References token from "Get Token from Supabase" (correct) ✅
  - Expression prefix `=` ✅
- **sendHeaders**: `true` ✅
- **Token Source**: Direct from "Get Token from Supabase" node ✅
- **Status**: ✅ CORRECT

### 3. "Pull Discovered Emails" ⚠️ ISSUE FOUND
- **Method**: ❌ MISSING
- **URL**: ❌ MISSING  
- **Headers**: ✅
  - `Authorization`: `=Bearer {{ $json.access_token }}` ✅
  - Expression prefix `=` ✅
- **sendHeaders**: `true` ✅
- **Token Source**: From "Add Token To Items" Code node (correct) ✅
- **Status**: ⚠️ MISSING METHOD AND URL

## Supabase Nodes (Credential-Based)

All Supabase nodes use `supabaseApi` credentials correctly:
- ✅ "Check if User Exists"
- ✅ "Create User"
- ✅ "Create Connected Service"
- ✅ "Update Existing User"
- ✅ "Save Onboarding Summaries"
- ✅ "Insert Onboarding Summaries"

## OpenAI Nodes (Credential-Based)

All OpenAI nodes use `openAiApi` credentials correctly:
- ✅ "OpenAI Chat Model"
- ✅ "OpenAI Chat Model1"

## Code Nodes - Token References

### "Add Token To Items" Code Node
- **Code**: `const token = $node['Get Token from Supabase'].json.access_token;`
- **Syntax**: ✅ Uses `$node['Node Name']` (correct for Code nodes)
- **Node Reference**: ✅ References "Get Token from Supabase" node (exists)
- **Field Access**: ✅ Accesses `access_token` field (matches API response structure)
- **Status**: ✅ CORRECT

## Expression References Verification

### Cross-Node References (using $())
1. ✅ `$('Supabase OAuth Webhook').item.json.body.userId` - Webhook node exists, field structure correct
2. ✅ `$('Supabase OAuth Webhook').item.json.body.email` - Webhook node exists, field structure correct

### Current Item References (using $json)
1. ✅ `$json.body.userId` - References webhook body (correct)
2. ✅ `$json.itemCount` - References Supabase query result (correct)
3. ✅ `$json.access_token` - References token field (correct)
4. ✅ `$json.id` - References message ID (correct)
5. ✅ `$json.sentences` - References parsed sentences array (correct)

### Workflow Variables (using $vars)
1. ✅ `$vars.N8N_API_KEY` - Workflow variable (correct)

### System Variables (using $now)
1. ✅ `$now.toISO()` - System variable (correct)

## Token Flow Verification

1. ✅ "Get Token from Supabase" → Returns `{ access_token: "...", ... }`
2. ✅ "Search Gmail For Usual Suspects" → Uses `$json.access_token` from step 1
3. ✅ "Split Out" → Splits messages (loses token reference - expected)
4. ✅ "Add Token To Items" → Adds `access_token` to each item using `$node['Get Token from Supabase'].json.access_token`
5. ⚠️ "Pull Discovered Emails" → Should use `$json.access_token` but missing method/URL

## Issues Found

### Critical Issue
1. **"Pull Discovered Emails" node** - Missing `method` and `url` parameters

## Recommendations

Fix "Pull Discovered Emails" node by adding:
- `method: "GET"`
- `url: "=https://gmail.googleapis.com/gmail/v1/users/me/messages/{{ $json.id }}"`









