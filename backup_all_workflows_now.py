#!/usr/bin/env python3
"""
Backup all n8n workflows to local filesystem.
This script uses the n8n MCP tools via subprocess calls.
"""

import json
import subprocess
import re
from pathlib import Path
from datetime import datetime

def sanitize_filename(name):
    """Convert workflow name to safe filename."""
    # Replace spaces with hyphens, lowercase, remove special chars
    name = name.lower()
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-')

def get_all_workflows():
    """Get all workflows from n8n using MCP."""
    workflows = []
    cursor = None
    
    while True:
        cmd = ['npx', '-y', '@modelcontextprotocol/cli', 'mcp_n8n-mcp_n8n_list_workflows', '--limit', '100']
        if cursor:
            cmd.extend(['--cursor', cursor])
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
            
            if 'workflows' in data:
                workflows.extend(data['workflows'])
            
            if not data.get('hasMore', False):
                break
            
            cursor = data.get('nextCursor')
        except subprocess.CalledProcessError as e:
            print(f"Error fetching workflows: {e.stderr}")
            break
        except json.JSONDecodeError:
            print(f"Error parsing JSON: {result.stdout}")
            break
    
    return workflows

def fetch_workflow(workflow_id):
    """Fetch full workflow JSON by ID."""
    # Note: This is a simplified version - in practice you'd use the MCP tool
    # For now, we'll need to use the actual MCP interface
    return None

def main():
    workflows_dir = Path(__file__).parent / 'workflows'
    workflows_dir.mkdir(exist_ok=True)
    
    print("Fetching all workflows...")
    workflows = get_all_workflows()
    print(f"Found {len(workflows)} workflows")
    
    # Save workflow list
    workflow_list = []
    for wf in workflows:
        workflow_list.append({
            'id': wf['id'],
            'name': wf['name'],
            'active': wf.get('active', False),
            'isArchived': wf.get('isArchived', False),
            'nodeCount': wf.get('nodeCount', 0),
            'updatedAt': wf.get('updatedAt', '')
        })
    
    list_file = workflows_dir / '.workflow_list_backup.json'
    with open(list_file, 'w') as f:
        json.dump({
            'backup_date': datetime.now().isoformat(),
            'total_workflows': len(workflows),
            'workflows': workflow_list
        }, f, indent=2)
    
    print(f"Saved workflow list to {list_file}")
    print(f"\nTo backup individual workflows, use:")
    print(f"  mcp_n8n-mcp_n8n_get_workflow id=<workflow_id> mode=full")

if __name__ == '__main__':
    main()
