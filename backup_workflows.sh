#!/bin/bash
# Backup n8n workflows to git
# This script will be called with workflow data from Python

set -e

WORKFLOWS_DIR="workflows"
mkdir -p "$WORKFLOWS_DIR"

echo "Workflow backup directory ready: $WORKFLOWS_DIR"


