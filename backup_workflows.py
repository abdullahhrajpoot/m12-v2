#!/usr/bin/env python3
"""Backup n8n workflows to git"""
import json
import re
import subprocess
from pathlib import Path

def sanitize_filename(name):
    """Convert workflow name to safe filename"""
    # Lowercase, replace spaces with hyphens, remove special chars
    name = name.lower()
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-')

def should_skip(name):
    """Skip test/copy workflows if they're duplicates"""
    name_lower = name.lower()
    # Skip if it's a test or copy AND has a non-test/copy version
    # For now, we'll backup everything and let git track changes
    return False

# Workflow directory
workflows_dir = Path("workflows")
workflows_dir.mkdir(exist_ok=True)

print(f"Workflow backup directory: {workflows_dir.absolute()}")
print("Ready to receive workflow data...")
