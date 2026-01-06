#!/usr/bin/env python3
"""Check workflow for empty field names or values"""
import json
import sys

def check_node(node, path="", issues=[]):
    """Recursively check a node for empty field names or values"""
    if isinstance(node, dict):
        for key, value in node.items():
            current_path = f"{path}.{key}" if path else key
            
            # Check for empty field names
            if key == "":
                issues.append(f"Empty field name found at: {path}")
            
            # Check for empty string values (but allow empty strings in certain contexts)
            if value == "":
                # Some empty strings are valid (like empty descriptions, empty arrays)
                # But we should flag them for review
                if key not in ["description", "notes", "text", "value"]:  # These can legitimately be empty
                    issues.append(f"Empty string value for '{key}' at: {current_path}")
            
            # Recursively check nested structures
            if isinstance(value, (dict, list)):
                check_node(value, current_path, issues)
    
    elif isinstance(node, list):
        for i, item in enumerate(node):
            check_node(item, f"{path}[{i}]", issues)
    
    return issues

# Read workflow JSON from stdin
workflow = json.load(sys.stdin)

issues = []
for i, node in enumerate(workflow.get("nodes", [])):
    node_path = f"nodes[{i}].{node.get('name', 'unnamed')}"
    check_node(node, node_path, issues)

if issues:
    print("Found issues:")
    for issue in issues:
        print(f"  - {issue}")
    sys.exit(1)
else:
    print("✓ No empty field names or problematic empty values found")
    sys.exit(0)








