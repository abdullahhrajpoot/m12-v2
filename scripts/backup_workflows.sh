#!/bin/bash

# Workflow Backup Script for n8n
# Exports all active and non-duplicate workflows to /workflows/

set -e

API_KEY="$N8N_API_KEY"
N8N_URL="https://chungxchung.app.n8n.cloud"
WORKFLOWS_DIR="/Users/hanschung/Documents/Parser/Cursor/projects/tldrpal/workflows"

# List of workflow IDs to backup (active + important non-active)
WORKFLOW_IDS=(
  "vexJG6Y46lso0qKf:Parallelized_Onboarding_Supabase"
  "HwRvoNIeRyF8W0NG:[ARCHIVED]_Google_Auth_Supabase_Powered_Onboarding"
  "RN3CGbcsMJy3ExwA:TLDRpal_-_AI_Email_Processor"
  "YLmpF5CnOPUFDYJz:TLDRpal_-_Scheduled_Email_Check"
  "o4VUMvk9YLJhXyLH:TLDRpal_-_Extract_Keywords_from_Facts"
  "f5N60eCR4nqqcvsT:Oct_7_BETA"
  "BpwOsPaR7UZ53x90:Kelly_Family_bot"
  "8hgS7z7wiooqgalH:Moore_Family_Beta"
  "dcAWKFpvbuFEre5I:Farah_Family_Beta"
  "ASdZ3yxV9uBAl7EJ:Low_Family_Beta"
  "M5H3Sqtaz1a1HhWd:Elkington_BETA"
  "PhSs42YTahxg9WBB:Ferrari_BETA"
  "jvr8JN3s7iNos8fm:LeoKaius_Oct_7_BETA"
  "74C5MdgMCg0SwLXN:Ninisbot_BETA"
  "QP57OFwH0eA4e7Or:autoclicker"
  "P4p9ni1JenLGy1Bp:onboarding_email_clicker"
  "6rpCS1leS0IfbfLU:Kelly_Refine_Bot"
  "I9NaL6YAmjJntr2B:Ninis_Chat_Bot_v2"
  "JhdxQv1GjDZ1O75e:Low_Chat_Bot"
)

echo "🔄 Starting workflow backup..."
echo "Target directory: $WORKFLOWS_DIR"
echo ""

count=0
for item in "${WORKFLOW_IDS[@]}"; do
  IFS=':' read -r id filename <<< "$item"
  
  echo "Fetching: $filename ($id)"
  
  curl -k -s -X GET "$N8N_URL/api/v1/workflows/$id" \
    -H "X-N8N-API-KEY: $API_KEY" \
    -o "$WORKFLOWS_DIR/${filename}.json"
  
  if [ $? -eq 0 ]; then
    echo "✅ Saved: ${filename}.json"
    ((count++))
  else
    echo "❌ Failed: ${filename}.json"
  fi
  
  sleep 0.5  # Rate limiting
done

echo ""
echo "✅ Backup complete: $count workflows saved"
echo "Location: $WORKFLOWS_DIR"








