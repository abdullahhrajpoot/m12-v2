#!/usr/bin/env python3
"""
Backup all n8n workflows to local git repository.
This script will be called with workflow data from n8n MCP.
"""

import json
import os
import re
import sys
from pathlib import Path

def sanitize_filename(name):
    """Sanitize workflow name for filename: lowercase, replace spaces with hyphens"""
    # Convert to lowercase
    name = name.lower()
    # Replace spaces, underscores, and special chars with hyphens
    name = re.sub(r'[\s_]+', '-', name)
    # Remove special characters except hyphens
    name = re.sub(r'[^a-z0-9\-]', '', name)
    # Remove multiple consecutive hyphens
    name = re.sub(r'-+', '-', name)
    # Remove leading/trailing hyphens
    name = name.strip('-')
    return name or 'unnamed-workflow'

def save_workflow(workflow_data, workflows_dir):
    """Save a single workflow to JSON file"""
    workflow_id = workflow_data.get('id')
    workflow_name = workflow_data.get('name', 'Unnamed Workflow')
    
    # Sanitize filename
    filename = sanitize_filename(workflow_name)
    filepath = workflows_dir / f"{filename}.json"
    
    # Write workflow JSON
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(workflow_data, f, indent=2, ensure_ascii=False)
    
    return filepath

if __name__ == '__main__':
    workflows_dir = Path(__file__).parent / 'workflows'
    workflows_dir.mkdir(exist_ok=True)
    
    # This script expects workflow JSON to be passed via stdin or as argument
    # For now, it's a placeholder - actual saving will be done via write tool
    print(f"Workflows directory: {workflows_dir}")
    print("Ready to save workflows...")
