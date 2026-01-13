# Required Fields Checklist for Parallelized Onboarding Workflow

## Quick Check: All Required Fields Present?

### HTTP Request Nodes

**"Get Token from Supabase"**
- ✅ URL: `https://bippity.boo/api/auth/tokens`
- ✅ Query Parameters: `userId`, `provider`
- ✅ Headers: `Authorization: Bearer {{ $vars.N8N_API_KEY }}`
- ✅ Method: GET (default)

**"Search Gmail - Recent/Fall/Winter/Spring/BackToSchool"** (5 nodes)
- ✅ URL: `https://gmail.googleapis.com/gmail/v1/users/me/messages`
- ✅ Query Parameters: `q`, `maxResults`
- ✅ Headers: `Authorization: Bearer {{ ... }}`
- ⚠️ **Check**: Credentials not in JSON (stored in n8n, not in exported workflow)

**"Fetch Message Metadata"**
- ✅ URL: `={{ 'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + ($json.id || '') }}`
- ✅ Query Parameters: `format`, `metadataHeaders`
- ✅ Headers: `Authorization: Bearer {{ ... }}`
- ⚠️ **Check**: Credentials not in JSON (stored in n8n, not in exported workflow)

**"Pull Discovered Emails"**
- ✅ URL: `={{ 'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + ($json.id || '') }}`
- ✅ Query Parameters: `format: full`
- ✅ Headers: `Authorization: Bearer {{ ... }}`
- ⚠️ **Check**: Credentials not in JSON (stored in n8n, not in exported workflow)

### Supabase Nodes

**"Check if User Exists"**
- ✅ Operation: `getAll`
- ✅ Table: `users`
- ✅ Filters: `id` equals `userId`
- ✅ Credentials: Present (stored in n8n)

**"Create User"**
- ✅ Operation: `create`
- ✅ Table: `users`
- ✅ Fields: `id`, `email`
- ✅ Credentials: Present (stored in n8n)

**"Update Existing User"**
- ✅ Operation: `update`
- ✅ Table: `users`
- ✅ Filters: `id` equals `userId`
- ✅ Fields: `last_login_at`, `status`
- ✅ Credentials: Present (stored in n8n)

**"Save Onboarding Summaries"**
- ✅ Operation: `update`
- ✅ Table: `onboarding_summaries`
- ✅ Filters: `user_id` equals `userId`
- ✅ Fields: `summary_sentences`
- ✅ Credentials: Present (stored in n8n)

**"Insert Onboarding Summaries"**
- ✅ Operation: `create`
- ✅ Table: `onboarding_summaries`
- ✅ Fields: `user_id`, `summary_sentences`
- ✅ Credentials: Present (stored in n8n)

### Code Nodes

All Code nodes have:
- ✅ `jsCode` parameter present
- ✅ All have code in them

### IF Nodes

**"OAuth Successful?"**
- ✅ Conditions: `userId` exists
- ✅ Combinator: `and`

**"Is New User?"**
- ✅ Conditions: `itemCount` equals `0`
- ✅ Combinator: `and`

**"Check Update Result"**
- ✅ Conditions: `itemCount` equals `0`
- ✅ Combinator: `and`

### Webhook Node

**"Supabase OAuth Webhook"**
- ✅ Path: `parallelized-supabase-oauth`
- ✅ Method: POST
- ✅ Response Data: `firstEntryJson`

### Agent Nodes (LangChain)

**"Extraction System"**
- ✅ Prompt Type: `define`
- ✅ Text: Present
- ✅ System Message: Present
- ✅ Model: Connected to "OpenAI Chat Model GPT-4o"

**"Consolidator System"**
- ✅ Prompt Type: `define`
- ✅ Text: Present
- ✅ System Message: Present
- ✅ Model: Connected to "OpenAI Chat Model"

### Model Nodes

**"OpenAI Chat Model GPT-4o"**
- ✅ Model: `gpt-4o`
- ✅ Options: `maxTokens`, `temperature`
- ✅ Credentials: Present (stored in n8n)

**"OpenAI Chat Model"**
- ✅ Model: `chatgpt-4o-latest`
- ✅ Credentials: Present (stored in n8n)

## Common Missing Fields to Watch For

### 1. Credentials
- **Note**: Credentials are stored in n8n Cloud, not in the exported JSON
- When importing, n8n will prompt you to map credentials
- **Check**: Make sure credentials are configured in n8n UI after import

### 2. Environment Variables
- **"Get Token from Supabase"** uses `{{ $vars.N8N_API_KEY }}`
- **Check**: Make sure `N8N_API_KEY` is set in n8n environment variables

### 3. URL Parameters
- All HTTP Request nodes have URLs
- **Check**: Verify URLs are correct (especially `https://bippity.boo/api/auth/tokens`)

### 4. Authorization Headers
- All Gmail API calls have Authorization headers
- **Check**: Headers reference tokens correctly

## Validation Steps After Import

1. **Open workflow in n8n UI**
2. **Check each node** - look for red error indicators
3. **Map credentials** - n8n will prompt for missing credentials
4. **Set environment variables** - verify `N8N_API_KEY` is set
5. **Validate workflow** - Click "Validate" button (if available)
6. **Test execute** - Run a test execution to verify all nodes work

## Quick Test Checklist

- [ ] All HTTP Request nodes have URLs
- [ ] All HTTP Request nodes have Authorization headers
- [ ] All Supabase nodes have tableId and operation
- [ ] All Code nodes have jsCode
- [ ] All IF nodes have conditions
- [ ] Webhook has path configured
- [ ] Credentials are mapped in n8n UI
- [ ] Environment variables are set (`N8N_API_KEY`)
- [ ] Workflow validates without errors
- [ ] Test execution completes successfully

## If Validation Fails

Common issues:
1. **Missing credentials** → Map credentials in n8n UI
2. **Missing environment variable** → Set `N8N_API_KEY` in n8n
3. **Invalid expressions** → Check `{{ }}` syntax
4. **Missing node references** → Verify node names match
5. **Invalid JSON** → JSON is now valid (we fixed it)
