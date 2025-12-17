# n8n Workflow Backups

This directory contains backups of all n8n workflows, saved as JSON files.

## Backup Status

- **Total Workflows**: 114
- **Backed Up**: 0 (workflows need to be fetched and saved)

## How to Complete Backup

1. Use n8n MCP tools to fetch each workflow:
   ```python
   # For each workflow ID, call:
   mcp_n8n-mcp_n8n_get_workflow(id="WORKFLOW_ID", mode="full")
   ```

2. Save each workflow JSON to this directory with sanitized filename:
   - Filename format: `[workflow-name].json` (lowercase, hyphens for spaces)
   - Example: `TLDRpal - AI Email Processor_TEST` → `tldrpal-ai-email-processor_test.json`

3. Commit to git:
   ```bash
   git add workflows/
   git commit -m "Workflow backup $(date +%Y-%m-%d)"
   ```

## Workflow List

All 114 workflow IDs are available in `backup_all_workflows.py`
