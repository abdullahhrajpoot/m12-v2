#!/usr/bin/env python3
"""
Backup all n8n workflows to git.

This script expects workflow data to be provided via MCP tools.
Run this after fetching workflows using n8n MCP tools.
"""
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime

def sanitize_filename(name):
    """Convert workflow name to safe filename"""
    name = name.lower()
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-')

def save_workflow(workflow_data, workflows_dir):
    """Save a workflow to file"""
    workflow_id = workflow_data.get('id')
    workflow_name = workflow_data.get('name', 'unnamed')
    
    filename = sanitize_filename(workflow_name) + ".json"
    filepath = workflows_dir / filename
    
    with open(filepath, 'w') as f:
        json.dump(workflow_data, f, indent=2)
    
    return filepath

# Main execution
workflows_dir = Path("workflows")
workflows_dir.mkdir(exist_ok=True)

print(f"Workflow backup directory: {workflows_dir.absolute()}")
print("This script is a helper. Workflows should be fetched via MCP and saved individually.")
print("\nTo backup workflows:")
print("1. Use n8n MCP tools to fetch each workflow")
print("2. Save each workflow JSON to workflows/ directory")
print("3. Run: git add workflows/ && git commit -m 'Workflow backup $(date +%Y-%m-%d)'")


