# n8n Tool Node Update Checklist

**CRITICAL**: Before updating ANY tool node in n8n, verify ALL items below.

## Pre-Update Checklist

- [ ] Read the COMPLETE configuration from `N8N_TOOL_CONFIGS_REFERENCE.md`
- [ ] Identify the correct node ID from the reference file
- [ ] Verify the workflow ID matches the reference
- [ ] Prepare the COMPLETE parameters object (not just one field)

## Required Fields for Each Tool Node

Every tool node MUST include ALL of these fields:

1. **`description`** - Tool description for AI agent
2. **`workflowId`** - Complete object with `__rl`, `value`, and `mode`
3. **`workflowInputs`** - Complete object with:
   - `mappingMode`: "defineBelow"
   - `value`: All input fields (query/keyword/task_id/etc. + access_token)
   - `matchingColumns`: [] (empty array)
   - `schema`: Complete array of all field definitions
   - `attemptToConvertTypes`: false
   - `convertFieldsToString`: false

## Update Process

1. Copy the ENTIRE JSON configuration from the reference file
2. Use `updateNode` with the COMPLETE `parameters` object
3. NEVER update just one field (e.g., only `access_token`)
4. Always include ALL fields from the reference

## Post-Update Verification

- [ ] Verify workflow is active
- [ ] Check at least 2-3 tool nodes in n8n UI to confirm:
  - [ ] Workflow ID is selected
  - [ ] All input fields are present
  - [ ] Description is present
  - [ ] Schema is complete
- [ ] Test one tool execution to verify it works

## Common Mistakes to Avoid

❌ **DON'T**: Update only `access_token` field
❌ **DON'T**: Update only `workflowInputs.value`
❌ **DON'T**: Skip `description` field
❌ **DON'T**: Skip `schema` array
❌ **DON'T**: Skip `matchingColumns`, `attemptToConvertTypes`, `convertFieldsToString`

✅ **DO**: Copy the ENTIRE parameters object from reference file
✅ **DO**: Include ALL fields in a single update operation
✅ **DO**: Verify in n8n UI after update
✅ **DO**: Test execution after update
