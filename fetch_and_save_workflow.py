#!/usr/bin/env python3
"""Fetch and save a single workflow"""
import json
import re
import sys
from pathlib import Path

def sanitize_filename(name):
    """Convert workflow name to safe filename"""
    name = name.lower()
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-')

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 fetch_and_save_workflow.py <workflow_id> <workflow_name>")
        sys.exit(1)
    
    workflow_id = sys.argv[1]
    workflow_name = sys.argv[2]
    
    # Read workflow JSON from stdin
    workflow_data = json.load(sys.stdin)
    
    # Sanitize filename
    filename = sanitize_filename(workflow_name) + ".json"
    filepath = Path("workflows") / filename
    
    # Save workflow
    with open(filepath, 'w') as f:
        json.dump(workflow_data, f, indent=2)
    
    print(f"Saved: {filepath}")








