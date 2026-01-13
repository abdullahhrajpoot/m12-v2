#!/usr/bin/env python3
"""
Save multiple n8n workflows from JSON data.
Reads workflow JSON objects from stdin (one per line, or as JSON array).
"""
import json
import re
import sys
import os

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
    try:
        # Try to read as JSON array first
        input_data = json.load(sys.stdin)
        
        if isinstance(input_data, list):
            # Multiple workflows
            for workflow_data in input_data:
                save_workflow(workflow_data)
        else:
            # Single workflow
            save_workflow(input_data)
    except json.JSONDecodeError:
        print("Error: Invalid JSON input", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


