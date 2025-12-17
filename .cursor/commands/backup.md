# Backup Workflows to Git

Export all n8n workflows and commit to local git for version history.

## Steps

1. Use n8n MCP to list all workflows
2. For each workflow, fetch the full JSON
3. Save each to `/workflows/[workflow-name].json` (sanitize filename: lowercase, replace spaces with hyphens)
4. Stage and commit:
   ```bash
   git add workflows/
   git commit -m "Workflow backup $(date +%Y-%m-%d)"
   ```
5. Confirm what was backed up

## Notes
- Skip any workflow with "test" or "copy" in the name if it's a duplicate
- Overwrite existing files — git tracks the history
