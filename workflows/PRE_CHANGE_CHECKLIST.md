# Pre-Change Checklist for n8n Workflow Edits

## BEFORE making ANY change, verify:

### 1. ⚠️ ONLY change the node that needs fixing
- [ ] Identify the EXACT node causing the error
- [ ] Do NOT modify nodes that are working correctly
- [ ] If unsure which node is broken, add instrumentation FIRST

### 2. Never use `return []` in Code nodes
- [ ] `return []` breaks downstream data flow
- [ ] If no data, let workflow continue - downstream errors are more informative
- [ ] Use `alwaysOutputData: true` on nodes instead

### 3. Don't add complex fallbacks
- [ ] Simple expressions are more reliable than complex fallbacks
- [ ] `$json.field` is better than `$json.field || $('Node').first().json.field || ''`
- [ ] Complex fallbacks fail silently and hide the real problem

### 4. Test impact before committing
- [ ] Will this change break downstream nodes?
- [ ] Run a test execution after the change
- [ ] Check execution logs for all affected nodes

### 5. Minimal changes only
- [ ] Fix ONE thing at a time
- [ ] Do not "improve" code that isn't broken
- [ ] Do not refactor while fixing bugs

## Common Mistakes to Avoid

| Mistake | Why It's Bad | What to Do Instead |
|---------|--------------|-------------------|
| `return []` when no data | Breaks all downstream nodes | Let workflow continue, 401 is informative |
| Changing multiple nodes | Breaks working code | Fix ONLY the broken node |
| Complex token fallbacks | Fails silently | Keep it simple: `$json.access_token` |
| "Defensive" empty returns | Hides real errors | Let errors surface naturally |

## When Debugging Auth Errors

1. Check n8n execution logs to find WHICH node fails
2. Check THAT node's input - does it have the expected data?
3. Fix ONLY that node
4. Do NOT change upstream nodes that are passing data correctly

## Lessons Learned - DO NOT REPEAT

### 1. Don't add early returns in auth callback
- Any `return NextResponse.redirect()` BEFORE the n8n webhook will skip the webhook
- This breaks the entire workflow

### 2. Don't trust external API calls in critical paths
- The scope verification called Google's tokeninfo API
- If that API fails for ANY reason, it caused false "missing permissions" errors
- This blocked legitimate users and skipped the workflow

### 3. Adding "safety features" can break core functionality
- The scope verification was meant to help users
- But it introduced a fragile dependency on an external API
- Test thoroughly before adding features that can interrupt the auth flow
