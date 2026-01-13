#!/usr/bin/env python3
"""
Script to fetch all n8n workflows and save them to files.
This script uses the n8n MCP tools via subprocess calls.
"""
import json
import subprocess
import re
import os
import time

def sanitize_filename(name):
    if not name:
        return "unknown"
    name = name.lower()
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = re.sub(r'-+', '-', name)
    name = name.strip('-')
    return name or "unknown"

def fetch_workflow(workflow_id):
    """Fetch a single workflow using n8n_get_workflow MCP tool"""
    try:
        # Note: This would need to be adapted to actually call the MCP tool
        # For now, this is a placeholder structure
        result = subprocess.run(
            ['n8n_get_workflow', '--id', workflow_id],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error fetching workflow {workflow_id}: {e}", file=sys.stderr)
        return None

def save_workflow(workflow_data, output_dir='workflows'):
    """Save workflow data to a file"""
    if not workflow_data or not workflow_data.get('success'):
        return False
    
    workflow = workflow_data.get('data', {})
    workflow_name = workflow.get('name', 'unknown')
    workflow_id = workflow.get('id', 'unknown')
    
    filename = sanitize_filename(workflow_name)
    if not filename or filename == "unknown":
        filename = f"workflow-{workflow_id}"
    
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f'{filename}.json')
    
    with open(output_path, 'w') as f:
        json.dump(workflow, f, indent=2)
    
    print(f"Saved: {workflow_name} (ID: {workflow_id}) -> {filename}.json")
    return True

if __name__ == "__main__":
    print("This script requires manual execution with n8n MCP tools.")
    print("Please use the n8n MCP tools directly to fetch workflows.")
