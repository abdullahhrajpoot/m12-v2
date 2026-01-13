#!/usr/bin/env python3
"""
Script to save multiple workflows from n8n API responses.
Reads a list of workflow JSON responses from stdin and saves each to a file.
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
    workflow_name = workflow_data.get('name', 'unknown')
    workflow_id = workflow_data.get('id', 'unknown')
    
    filename = sanitize_filename(workflow_name)
    if not filename or filename == "unknown":
        filename = f"workflow-{workflow_id}"
    
    output_path = f'workflows/{filename}.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(workflow_data, f, indent=2)
    
    print(f"Saved: {workflow_name} -> {filename}.json")

if __name__ == "__main__":
    try:
        # Read the list of workflow responses from stdin
        responses = json.load(sys.stdin)
        
        for response in responses:
            if response.get('success') and response.get('data'):
                save_workflow(response['data'])
            else:
                print(f"Skipping invalid response: {response.get('error', 'No data or success false')}", file=sys.stderr)
    except Exception as e:
        print(f"Error processing batch: {e}", file=sys.stderr)
        sys.exit(1)
