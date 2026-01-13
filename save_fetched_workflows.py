#!/usr/bin/env python3
"""
Save workflows that have been fetched via n8n MCP tools.
This script processes workflow JSON from the tool responses.
"""
import json
import re
import os
import sys

def sanitize_filename(name):
    if not name:
        return "unknown"
    name = name.lower()
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = re.sub(r'-+', '-', name)
    name = name.strip('-')
    return name or "unknown"

def save_workflow(workflow_data):
    """Save a single workflow to a file."""
    # Extract workflow data if it's an n8n API response
    if isinstance(workflow_data, dict) and 'data' in workflow_data:
        workflow = workflow_data['data']
    else:
        workflow = workflow_data
    
    workflow_name = workflow.get('name', 'unknown')
    workflow_id = workflow.get('id', 'unknown')
    
    filename = sanitize_filename(workflow_name)
    if not filename or filename == "unknown":
        filename = f"workflow-{workflow_id}"
    
    output_path = f'workflows/{filename}.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(workflow, f, indent=2)
    
    print(f"Saved: {workflow_name} (ID: {workflow_id}) -> {filename}.json")
    return output_path

if __name__ == "__main__":
    # This script is meant to be called with workflow JSON piped to it
    # or with a file path as argument
    if len(sys.argv) > 1:
        # Read from file
        with open(sys.argv[1], 'r') as f:
            workflow_data = json.load(f)
        save_workflow(workflow_data)
    else:
        # Read from stdin
        try:
            workflow_data = json.load(sys.stdin)
            save_workflow(workflow_data)
        except json.JSONDecodeError:
            print("Error: Invalid JSON input", file=sys.stderr)
            sys.exit(1)


