# Fix for "Save Onboarding Summaries" Node Issues

## Problems Identified

1. **Duplicate Connection**: "Parse Sentences Array" connects to BOTH "Save Onboarding Summaries" AND "Insert Onboarding Summaries" directly, causing both to execute in parallel (wrong behavior).

2. **Incorrect Field Reference**: "Insert Onboarding Summaries" was using `$node['Parse Sentences Array']` which doesn't work reliably because Code nodes break the paired item chain.

## Root Cause

The workflow needs to implement an "upsert" pattern:
- Try UPDATE first (Save Onboarding Summaries)
- If UPDATE finds 0 records (Check Update Result FALSE branch)
- Then INSERT (Insert Onboarding Summaries)

However, UPDATE operations return `itemCount`, not the original input data. So "Insert Onboarding Summaries" can't get `userId` and `sentences` from the UPDATE result.

## Current State

- ✅ "Insert Onboarding Summaries" now uses `$node['Parse Sentences Array']` to get userId and sentences
- ⚠️ Still has duplicate connection from "Parse Sentences Array" to "Insert Onboarding Summaries"
- ⚠️ "Check Update Result" connects to "Insert Onboarding Summaries" on TRUE branch (should be FALSE)

## Solution Needed

1. Remove duplicate connection from "Parse Sentences Array" to "Insert Onboarding Summaries"
2. Ensure "Check Update Result" FALSE branch (itemCount == 0) connects to "Insert Onboarding Summaries"
3. "Insert Onboarding Summaries" uses `$node['Parse Sentences Array']` which should work if the node executed

**Note**: `$node['Parse Sentences Array']` should work in n8n expressions even for Code nodes, as long as the node executed. If it doesn't work, we'll need to add a Code node to preserve data through the UPDATE operation.






