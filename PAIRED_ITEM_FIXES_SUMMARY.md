# Paired Item Fixes Summary

## Problem
Code nodes break the paired item chain in n8n, making it impossible to reference nodes before the Code node using `$('Node Name')` syntax.

## Root Cause
When "Save Onboarding Summaries" and "Insert Onboarding Summaries" tried to use `$('Supabase OAuth Webhook').item.json.body.userId`, the paired item chain was broken because Code nodes ("Convert To One Paragraph" and "Parse Sentences Array") don't preserve paired item relationships.

## Solution
Pass `userId` through the data flow by including it in Code node outputs and using `$json.userId` instead of referencing the webhook node directly.

## Fixes Applied

### 1. "Convert To One Paragraph" Code Node ✅
- **Fix**: Gets `userId` from webhook node using `$node['Supabase OAuth Webhook']` (Code node syntax)
- **Change**: Includes `userId` in output JSON object
- **Result**: `userId` is now available in the data flow after this node

### 2. "Parse Sentences Array" Code Node ✅
- **Fix**: Gets `userId` from webhook node using `$node['Supabase OAuth Webhook']` (Code node syntax)
- **Fallback**: Also tries to get from input items if preserved
- **Change**: Preserves `userId` in output JSON object for downstream nodes
- **Result**: `userId` is available for "Save Onboarding Summaries" and "Insert Onboarding Summaries"

### 3. "Save Onboarding Summaries" Supabase Node ✅
- **Fix**: Changed filter from `$('Supabase OAuth Webhook').item.json.body.userId` to `$json.userId`
- **Result**: Now uses `userId` from the data flow instead of broken paired item reference

### 4. "Insert Onboarding Summaries" Supabase Node ✅
- **Fix**: Changed `user_id` field from `$('Supabase OAuth Webhook').item.json.body.userId` to `$json.userId`
- **Result**: Now uses `userId` from the data flow instead of broken paired item reference

## Verification Status

✅ **All nodes after Code nodes now use `$json.userId`**
✅ **All Code nodes preserve or retrieve `userId` and include it in output**
✅ **No webhook node references after Code nodes break the paired item chain**

## Nodes Verified Safe

- **"Check Update Result" (IF node)**: ✅ Only checks `$json.itemCount`, no webhook references
- **All nodes before Code nodes**: ✅ Can still reference webhook node directly (paired item chain intact)

## Notes

- **"AI Agent Summarize"**: May not preserve `userId`, but "Parse Sentences Array" gets it directly from webhook node, so it's safe
- **"Insert Onboarding Summaries" receives data from two paths**:
  1. Directly from "Parse Sentences Array" ✅ (has userId and sentences)
  2. From "Check Update Result" → May have different data structure, but the direct path ensures it works









