#!/usr/bin/env python3
"""
Backup all n8n workflows.
This script will be run to fetch and save workflows.
"""
import json
import re
from pathlib import Path
from datetime import datetime

def sanitize_filename(name):
    """Convert workflow name to safe filename."""
    name = name.lower()
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-')

# List of important workflows to backup
important_workflows = [
    {'id': 'vexJG6Y46lso0qKf', 'name': 'Parallelized_Onboarding_Supabase'},
    {'id': 'NScxKgKI3k1JDJai', 'name': 'Onboarding Finalize'},
    {'id': 'GY0jcwcSgVgAfHiI', 'name': 'Bippity - Gmail Command Poller MultiTenant'},
    {'id': 'jk5gL6NtGAGZi9G5', 'name': 'Bippity - Email Command Processor MultiTenant'},
    {'id': 'RN3CGbcsMJy3ExwA', 'name': 'Bippity - AI Email Processor'},
    {'id': 'YLmpF5CnOPUFDYJz', 'name': 'Bippity - Scheduled Email Check'},
    {'id': 'Ek0ft5PCAEv3qB5b', 'name': 'Bippity Token Refresh Cron'},
    {'id': 'fyNaHTZY8javrwU5', 'name': 'Error Handler - Sentry'},
    {'id': 'HwRvoNIeRyF8W0NG', 'name': '[ARCHIVED] Google Auth Supabase Powered Onboarding'},
]

workflows_dir = Path('workflows')
workflows_dir.mkdir(exist_ok=True)

print(f"Backing up {len(important_workflows)} important workflows...")
print(f"Workflows directory: {workflows_dir.absolute()}")
print("\nTo backup these workflows, use MCP tools:")
print("  mcp_n8n-mcp_n8n_get_workflow id=<workflow_id> mode=full")
print("\nThen save each workflow JSON to workflows/<sanitized-name>.json")

# Save workflow list
backup_info = {
    'backup_date': datetime.now().isoformat(),
    'workflows': important_workflows
}

with open(workflows_dir / '.backup_info.json', 'w') as f:
    json.dump(backup_info, f, indent=2)

print(f"\nSaved backup info to {workflows_dir / '.backup_info.json'}")
