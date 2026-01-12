# Workflow Parallelization Implementation

**Date**: December 19, 2025
**Status**: ✅ Complete - Ready for prompt customization

## Summary

Successfully created a new parallelized n8n workflow that reduces execution time from **8 minutes to an estimated 30-60 seconds** (8-16x faster).

## Changes Made

### 1. Archived Original Workflow
- **Old Name**: `Google Auth Supabase Powered Onboarding`
- **New Name**: `[ARCHIVED] Google Auth Supabase Powered Onboarding`
- **Status**: Active (kept active for safety)
- **Backup**: Saved to `archived_Google_Auth_Supabase_Powered_Onboarding_backup.json`
- **Workflow ID**: `HwRvoNIeRyF8W0NG`

### 2. Created New Optimized Workflow
- **Name**: `Parallelized_Onboarding_Supabase`
- **Workflow ID**: `vexJG6Y46lso0qKf`
- **Status**: Inactive (needs prompt customization before activation)
- **Webhook Path**: `parallelized-supabase-oauth`

## Architecture Changes

### Original Flow (Sequential - 8 minutes)
```
25 emails → AI Agent Filter (260s) → Convert Para (2.4s) → AI Agent Summarize (7s) → Save
```

### New Flow (Parallel Batches - 30-60 seconds)
```
25 emails → Split In Batches (5 batches of 5) → Pull Emails (parallel) → 
Convert Readable (parallel) → Combined AI Agent GPT-4o (parallel 20-30s per batch) → 
Aggregate Results → Parse Sentences → Save
```

## Key Optimizations

### 1. **Parallel Batch Processing**
- Added `Split In Batches` node after `Add Token To Items`
- Batch size: 5 emails per batch
- Result: 5 batches process simultaneously instead of sequentially
- Speed gain: **~5x faster**

### 2. **Combined AI Agent**
- Merged two separate AI agents (Filter + Summarize) into one
- Single pass processing eliminates intermediate steps
- Speed gain: **~2x faster**

### 3. **GPT-4o Model**
- Upgraded from GPT-4.1-mini to GPT-4o
- Speed: 2-3x faster than GPT-4
- Quality: Highest accuracy for entity/fact extraction
- Speed gain: **~2x faster**

### 4. **Removed Obsolete Nodes**
The following nodes were removed:
1. **AI Agent** (old filtering agent)
2. **OpenAI Chat Model** (GPT-4.1-mini for filtering)
3. **Simple Memory** (memory buffer)
4. **Convert To One Paragraph** (aggregation code)
5. **AI Agent Summarize** (old summarization agent)
6. **OpenAI Chat Model1** (GPT-4.1-mini for summarization)

### 5. **Updated Node Logic**

#### **Parse Sentences Array** (Updated)
- Now handles combined AI output format
- Expects JSON array with structure: `[{"relevant": true/false, "facts": ["sentence 1", ...]}]`
- Filters for relevant emails and extracts facts
- Deduplicates across all batches
- Preserves `userId` from webhook node

#### **Combined AI Agent** (New)
- **PLACEHOLDER PROMPT** - User needs to customize
- Should perform both filtering AND extraction
- Returns structured JSON with relevance flags and extracted facts
- Connected to GPT-4o model

## Nodes Preserved from Original Workflow

All the following nodes remain unchanged:
1. **Supabase OAuth Webhook**
2. **OAuth Successful?**
3. **Check if User Exists**
4. **Is New User?**
5. **Create User**
6. **Create Connected Service**
7. **Update Existing User**
8. **Get Token from Supabase**
9. **Search Gmail For Usual Suspects**
10. **Split Out**
11. **Add Token To Items**
12. **Pull Discovered Emails**
13. **Convert To Readable Email**
14. **Save Onboarding Summaries**
15. **Check Update Result**
16. **Insert Onboarding Summaries**

## Expected Performance

### Current Performance (Original Workflow)
- **Execution Time**: ~480 seconds (8 minutes)
- **Bottleneck**: Sequential AI processing (260s for filtering)
- **Email Processing Rate**: ~19 seconds per email

### Expected Performance (New Workflow)
- **Execution Time**: ~30-60 seconds
- **Bottleneck**: Parallel AI processing (20-30s per batch)
- **Email Processing Rate**: ~1-2 seconds per email (parallel)
- **Speed Improvement**: 8-16x faster

## Next Steps for User

### 1. Customize the Combined AI Agent Prompt ⚠️ REQUIRED

The `Combined AI Agent` node has a **PLACEHOLDER** prompt that must be customized. The prompt should:

**Objectives:**
1. Filter emails for relevance (school/activity emails only)
2. Extract key facts from relevant emails
3. Return structured JSON output

**Expected Output Format:**
```json
[
  {
    "relevant": true,
    "facts": [
      "Child A attends Lincoln Elementary School.",
      "Child A plays soccer on the Tigers team.",
      "Child B takes piano lessons at Music Academy."
    ]
  },
  {
    "relevant": false,
    "facts": []
  }
]
```

**Example Prompt Structure:**
```
You are analyzing emails to identify schools and activities that a family's children participate in.

For each email in the batch below, determine:
1. Is this email about a school or activity the children are enrolled in? (not promotional)
2. If relevant, extract specific facts about schools and activities

Return a JSON array with one object per email:
[
  {"relevant": true/false, "facts": ["sentence 1", "sentence 2", ...]}
]

Guidelines:
- Each fact should be a complete sentence
- Include school names, activity types, team names, locations
- If a child is not known, use "The family" or "Unknown child"
- Ignore promotional emails about classes they're not signed up for

Emails:
{{ $json.text }}
```

### 2. Test the New Workflow

Once the prompt is ready:

```bash
# 1. Get the new workflow for inspection
curl -X GET "https://n8n.cloud/api/v1/workflows/vexJG6Y46lso0qKf" \
  -H "Authorization: Bearer $N8N_API_KEY"

# 2. Activate the workflow
curl -X PATCH "https://n8n.cloud/api/v1/workflows/vexJG6Y46lso0qKf" \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

# 3. Update the Next.js app to use the new webhook path
# In app/auth/callback/route.ts, update:
# OLD: https://your-instance.n8n.cloud/webhook/supabase-oauth
# NEW: https://your-instance.n8n.cloud/webhook/parallelized-supabase-oauth

# 4. Test with OAuth flow and monitor execution time
```

### 3. Compare Performance

After testing:
- Check execution logs to verify 30-60 second completion time
- Compare quality of extracted facts vs original workflow
- Monitor for any errors or missing data

### 4. Decommission Old Workflow (When Ready)

Once the new workflow is verified:
```bash
# Deactivate the old workflow
curl -X PATCH "https://n8n.cloud/api/v1/workflows/HwRvoNIeRyF8W0NG" \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

## Rollback Plan

If issues arise with the new workflow:

1. **Revert webhook path** in Next.js app back to `supabase-oauth`
2. **Original workflow is still active** and will continue to work
3. **Debug new workflow** using n8n Cloud UI
4. **Compare execution logs** between old and new workflows

## Files Created

1. `workflows/archived_Google_Auth_Supabase_Powered_Onboarding_backup.json` - Full backup of original workflow
2. `workflows/PARALLELIZATION_IMPLEMENTATION.md` - This documentation

## Technical Notes

### Batch Processing Details
- **Split In Batches** node divides 25 emails into 5 batches of 5
- Each batch processes independently through the AI agent
- Batches run in parallel (not sequential)
- Results are aggregated in `Parse Sentences Array` code node

### userId Preservation
- Code nodes break the n8n "paired item" chain
- `Parse Sentences Array` explicitly retrieves `userId` from webhook node using `$node['Supabase OAuth Webhook'].json.body.userId`
- This ensures downstream Supabase nodes can filter by `user_id`

### Error Handling
- All Supabase insert/update nodes have appropriate error handling
- `continueOnFail` enabled for duplicate prevention
- Webhook response mode: `lastNode` for clean client responses

## Cost Comparison

### Original Workflow (GPT-4.1-mini)
- Model: GPT-4.1-mini
- Calls: 25 individual emails + 1 summarization = 26 API calls
- Estimated cost: ~$0.05 per execution

### New Workflow (GPT-4o)
- Model: GPT-4o
- Calls: 5 batch calls (5 emails per call)
- Estimated cost: ~$0.08 per execution (60% increase)

**Trade-off**: 60% higher cost for 8-16x faster execution and better quality.

## Questions?

If you encounter issues:
1. Check n8n execution logs for error details
2. Verify GPT-4o model is available in your OpenAI account
3. Ensure webhook path is updated in Next.js app
4. Compare execution data with original workflow

---

**Implementation Completed**: ✅
**Ready for Prompt Customization**: ⚠️
**Performance Testing**: ⏳ Pending








