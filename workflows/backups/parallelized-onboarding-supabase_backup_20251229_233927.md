# Workflow Backup - Parallelized_Onboarding_Supabase

**Backup Date**: 2025-12-29 23:39:27  
**Workflow ID**: vexJG6Y46lso0qKf  
**Workflow Name**: Parallelized_Onboarding_Supabase  
**Current Version**: 208  
**Last Updated (n8n Cloud)**: 2025-12-30T04:35:52.399Z  

## Current State

The workflow is active and stored in n8n Cloud. This backup reference documents the current state.

### Recent Changes (as of this backup)

1. **Merge Node Fix**: Changed from `combineAll` mode to `multiplex` mode to fix blank merge fields error
2. **User Creation Logic Fix**: Added "Check User Count" Code node to properly normalize itemCount from Supabase getAll operation

### Key Nodes

- Merge Gmail Results: Uses `multiplex` mode (no merge fields needed)
- Check User Count: Code node that normalizes itemCount for user existence check
- Search Gmail - School: Parallel Gmail search for school-related emails
- Search Gmail - Activities: Parallel Gmail search for activity-related emails
- Aggregate Gmail Results: Aggregates results from both searches
- Select 45 Emails by Ratio: Hybrid sampling (35 most recent + 10 weighted random)

### To Restore

The full workflow JSON can be retrieved from n8n Cloud using:
```
mcp_n8n-mcp_n8n_get_workflow(id="vexJG6Y46lso0qKf", mode="full")
```

### Backup Location

This is a reference backup. The actual workflow state is stored in n8n Cloud.
For a full JSON backup, fetch the workflow from n8n Cloud and save to a JSON file.


