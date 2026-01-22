# Aurinko Migration: Revised Time Estimate

## Assumptions
- **I (AI) am doing the migration** - modifying JSON files locally
- **You upload and test** - you handle n8n import and testing
- **Includes debugging time** - fixing issues discovered during testing
- **Calendar days** (not working hours) - accounting for testing cycles and feedback loops

---

## Migration Breakdown

### Phase 1: Main Workflows (3 workflows)

#### 1. Parallelized Onboarding Workflow
- **Nodes to change**: 8 Gmail HTTP Request nodes + 2 Code nodes
- **Complexity**: Medium (search queries, response parsing)
- **Migration time**: 2-3 hours
- **Testing/debugging**: 4-6 hours (response format differences, query syntax)
- **Total**: **1-2 calendar days**

#### 2. Gmail Command Poller Workflow  
- **Nodes to change**: 1 Gmail node → HTTP Request + 2 modify HTTP Requests + 1 send Gmail node → HTTP Request
- **Complexity**: Medium-High (Gmail node replacement, label operations)
- **Migration time**: 3-4 hours
- **Testing/debugging**: 6-8 hours (label operations, send email format)
- **Total**: **2-3 calendar days**

#### 3. Email Processor Workflow
- **Nodes to change**: 1 Gmail send node
- **Complexity**: Low-Medium
- **Migration time**: 1-2 hours
- **Testing/debugging**: 2-4 hours
- **Total**: **1 calendar day**

**Phase 1 Subtotal**: **4-6 calendar days**

---

### Phase 2: Tool Subworkflows (9 workflows)

#### Calendar Tools (4 workflows)

**Calendar_Create_Tool**
- **Nodes to change**: 1 HTTP Request (POST to create event)
- **Complexity**: Medium (request body format differences)
- **Migration time**: 2 hours
- **Testing/debugging**: 4-6 hours (event format, timezone handling)
- **Total**: **1-2 calendar days**

**Calendar_Update_Tool**
- **Nodes to change**: 1 HTTP Request (PATCH to update event)
- **Complexity**: Medium
- **Migration time**: 1-2 hours
- **Testing/debugging**: 3-4 hours
- **Total**: **1 calendar day**

**Calendar_By_Date_Tool**
- **Nodes to change**: 1 HTTP Request (GET with date range)
- **Complexity**: Medium (query parameter format)
- **Migration time**: 1-2 hours
- **Testing/debugging**: 3-4 hours
- **Total**: **1 calendar day**

**Calendar_Search_Tool**
- **Nodes to change**: 1 HTTP Request (GET with search query)
- **Complexity**: Medium
- **Migration time**: 1-2 hours
- **Testing/debugging**: 3-4 hours
- **Total**: **1 calendar day**

**Calendar Subtotal**: **4-5 calendar days**

#### Tasks Tools (5 workflows)

**Tasks_Create_Tool**
- **Nodes to change**: 1 HTTP Request (POST to create task)
- **Complexity**: Medium
- **Migration time**: 2 hours
- **Testing/debugging**: 4-6 hours
- **Total**: **1-2 calendar days**

**Tasks_Update_Tool**
- **Nodes to change**: 1 HTTP Request (PATCH to update task)
- **Complexity**: Medium
- **Migration time**: 1-2 hours
- **Testing/debugging**: 3-4 hours
- **Total**: **1 calendar day**

**Tasks_Search_Tool**
- **Nodes to change**: 1 HTTP Request (may need client-side filtering)
- **Complexity**: Medium-High (Aurinko may not have native search)
- **Migration time**: 2-3 hours
- **Testing/debugging**: 4-6 hours
- **Total**: **1-2 calendar days**

**Tasks_Complete_Tool**
- **Nodes to change**: 1 HTTP Request (PATCH to mark complete)
- **Complexity**: Low-Medium
- **Migration time**: 1 hour
- **Testing/debugging**: 2-3 hours
- **Total**: **1 calendar day**

**Tasks_Delete_Tool**
- **Nodes to change**: 1 HTTP Request (DELETE)
- **Complexity**: Low
- **Migration time**: 1 hour
- **Testing/debugging**: 2-3 hours
- **Total**: **1 calendar day**

**Tasks Subtotal**: **5-7 calendar days**

**Phase 2 Subtotal**: **9-12 calendar days**

---

### Phase 3: Frontend Code (3 files)

#### app/auth/callback/route.ts
- **Changes**: OAuth flow rewrite, token storage logic
- **Complexity**: High (core auth logic)
- **Migration time**: 4-6 hours
- **Testing/debugging**: 8-12 hours (OAuth flow testing, edge cases)
- **Total**: **2-3 calendar days**

#### app/api/auth/tokens/route.ts
- **Changes**: Return Aurinko credentials instead of Google tokens
- **Complexity**: Medium
- **Migration time**: 2-3 hours
- **Testing/debugging**: 4-6 hours
- **Total**: **1-2 calendar days**

#### app/api/auth/verify-scopes/route.ts
- **Changes**: Verify Aurinko account scopes
- **Complexity**: Medium
- **Migration time**: 2-3 hours
- **Testing/debugging**: 3-4 hours
- **Total**: **1 calendar day**

**Phase 3 Subtotal**: **4-6 calendar days**

---

### Phase 4: Database Schema

#### oauth_tokens table migration
- **Changes**: Add `aurinko_account_id` column, migration script
- **Complexity**: Low-Medium
- **Migration time**: 1-2 hours
- **Testing/debugging**: 2-3 hours
- **Total**: **1 calendar day**

**Phase 4 Subtotal**: **1 calendar day**

---

### Phase 5: Integration Testing & Bug Fixes

- **End-to-end testing**: 2-3 days
- **Bug fixes from testing**: 2-4 days
- **Response format adjustments**: 1-2 days
- **Error handling updates**: 1-2 days

**Phase 5 Subtotal**: **6-11 calendar days**

---

## Total Estimate

| Phase | Calendar Days |
|-------|---------------|
| Phase 1: Main Workflows | 4-6 |
| Phase 2: Tool Subworkflows | 9-12 |
| Phase 3: Frontend Code | 4-6 |
| Phase 4: Database | 1 |
| Phase 5: Testing & Debugging | 6-11 |
| **TOTAL** | **24-36 calendar days** |

---

## Realistic Timeline (with feedback loops)

### Best Case Scenario: **3-4 weeks**
- All API formats match expectations
- Minimal response format differences
- Quick testing cycles
- No major blockers

### Most Likely Scenario: **4-6 weeks**
- Some API format differences require adjustments
- Response parsing needs updates
- Testing reveals edge cases
- 2-3 iteration cycles

### Worst Case Scenario: **6-8 weeks**
- Significant API format differences
- Aurinko API documentation gaps
- Multiple testing cycles needed
- Major debugging required

---

## Factors That Could Extend Timeline

1. **Aurinko API Documentation Gaps**
   - Unclear endpoint formats
   - Missing examples
   - Response structure differences
   - **Impact**: +3-5 days

2. **Response Format Differences**
   - Gmail vs Aurinko message structure
   - Calendar event format differences
   - Task format differences
   - **Impact**: +2-4 days per workflow type

3. **Query Syntax Differences**
   - Gmail search queries may not translate directly
   - Date range queries may differ
   - **Impact**: +2-3 days

4. **Testing & Feedback Cycles**
   - Each workflow needs testing
   - Bug fixes require re-testing
   - **Impact**: +1-2 days per iteration

5. **OAuth Flow Complexity**
   - Aurinko OAuth may work differently
   - Account ID management
   - Token refresh logic
   - **Impact**: +3-5 days

---

## Recommended Approach

### Sequential Migration (Safer)
1. Migrate one workflow at a time
2. Test each before moving to next
3. **Timeline**: 4-6 weeks (more reliable)

### Parallel Migration (Faster but Riskier)
1. Migrate all workflows
2. Test everything together
3. **Timeline**: 3-4 weeks (if no major issues)

---

## Critical Path Items

These must be done first and will block other work:

1. **OAuth Flow** (app/auth/callback/route.ts) - Blocks all workflows
2. **Token Endpoint** (app/api/auth/tokens/route.ts) - Blocks all workflows
3. **Database Schema** - Blocks token storage

**Critical Path Time**: 4-6 calendar days

---

## Summary

**Realistic Estimate: 4-6 calendar weeks (28-42 days)**

This accounts for:
- ✅ JSON file modifications (my work)
- ✅ Testing cycles (your work + my fixes)
- ✅ Debugging and adjustments
- ✅ Response format differences
- ✅ Integration issues
- ✅ Feedback loops

**Conservative Estimate: 6-8 calendar weeks** (if significant API differences discovered)

---

*Last updated: 2026-01-16*
