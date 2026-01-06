# Workflow Issue Analysis

## Issues Found

### 1. "Create Connected Service" Node
**Issue**: If "Create User" fails (user already exists, but workflow continues due to `continueOnFail`), this node receives empty data but still tries to execute.

**Location**: Node ID `d8d9504d-868c-4419-8eaf-b118a65c5d09`
**Current Config**: Uses `={{ $json.id }}` from "Create User" output
**Problem**: When Create User fails, `$json.id` will be empty/undefined

**Impact**: Will fail with "missing required field" or create invalid record

**Fix**: Add `continueOnFail: true` OR add IF node to check if user was created OR get user_id from webhook instead

---

### 2. "Insert Onboarding Summaries" Node
**Issue**: Could fail if record already exists (duplicate key constraint)

**Location**: Node ID `insert-onboarding-summaries`
**Current Config**: Uses `operation: "create"` - will fail on duplicate
**Problem**: If workflow runs twice, or "Save Onboarding Summaries" partially succeeded, this will fail

**Impact**: Workflow stops even though data might already be saved

**Fix**: Add `continueOnFail: true` OR use upsert operation instead

---

### 3. "Get Token from Supabase" Node
**Status**: ✅ INTENTIONAL - Should fail fast if token cannot be retrieved

**Location**: Node ID `6bd96c4d-e31b-4644-bab4-982f62d7e380`
**Reasoning**: Unlike "Create User" which can fail safely (user might already exist), token fetch failure means the workflow cannot proceed. It's better to fail immediately rather than continue with invalid/empty token data that would cause 401 errors downstream.

**Note**: If we want to handle token fetch failures gracefully in the future, we could add an error handling branch, but for now, failing fast is the correct behavior.

---

### 4. "Search Gmail For Usual Suspects" Node
**Status**: ✅ OK - Already has `alwaysOutputData: true` to handle empty results

---

### 5. "Pull Discovered Emails" Node
**Status**: ✅ FIXED - Now uses `$json.access_token` from Code node

---

### 6. Cross-Node References Using `$('Supabase OAuth Webhook')`
**Status**: ✅ OK - These should work as long as webhook is in workflow:
- "Check if User Exists" - uses for userId
- "Create User" - uses for userId and email  
- "Update Existing User" - uses for userId
- "Save Onboarding Summaries" - uses for userId
- "Insert Onboarding Summaries" - uses for userId

**Note**: These are safe because webhook is the starting node, so it will always exist.

---

### 7. "Save Onboarding Summaries" Node  
**Issue**: Could fail if record doesn't exist (no rows updated)

**Location**: Node ID `save-onboarding-summaries`
**Current Config**: Uses `operation: "update"` - returns 0 rows if doesn't exist
**Problem**: This is actually handled by "Check Update Result" IF node, which routes to "Insert Onboarding Summaries" if update found 0 rows

**Status**: ✅ OK - Logic is correct

---

## Recommended Fixes

### Priority 1: Critical (Workflow Stoppers)

1. **"Get Token from Supabase"** - Add `continueOnFail: true` OR add error handling
   - If token fetch fails, workflow should gracefully fail rather than hang

2. **"Create Connected Service"** - Handle case when "Create User" fails
   - Get user_id from webhook instead of relying on Create User output
   - OR add `continueOnFail: true` and check downstream nodes handle empty data

### Priority 2: Important (Data Integrity)

3. **"Insert Onboarding Summaries"** - Add `continueOnFail: true`
   - Prevents workflow failure if record already exists
   - OR change to upsert operation

### Priority 3: Nice to Have (Resilience)

4. Consider adding error handling nodes for critical paths
5. Consider adding validation nodes to check data exists before using it

