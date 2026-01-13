#!/usr/bin/env python3
"""
Script to save n8n workflows from tool response JSON.
Reads workflow JSON from stdin (can be n8n API response format or direct workflow format).
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

if __name__ == "__main__":
    # Read workflow JSON from stdin
    # Handle both n8n API response format ({success: true, data: {...}}) and direct workflow format
    input_data = json.load(sys.stdin)
    
    # Extract workflow data if it's an n8n API response
    if isinstance(input_data, dict) and 'data' in input_data:
        workflow_data = input_data['data']
    else:
        workflow_data = input_data
    
    workflow_name = workflow_data.get('name', 'unknown')
    workflow_id = workflow_data.get('id', 'unknown')
    
    filename = sanitize_filename(workflow_name)
    if not filename or filename == "unknown":
        filename = f"workflow-{workflow_id}"
    
    output_path = f'workflows/{filename}.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(workflow_data, f, indent=2)
    
    print(f"Saved: {workflow_name} (ID: {workflow_id}) -> {filename}.json")


