#!/bin/bash

# Quick script to clear all users using SQL
# This only clears database tables, not auth users
# For auth users, use the TypeScript script

echo "🚨 WARNING: This will delete ALL data from Supabase!"
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
  echo "📊 Using Supabase CLI..."
  supabase db execute --file scripts/clear-all-users.sql
else
  echo "⚠️  Supabase CLI not found. Please run the SQL manually in Supabase Dashboard:"
  echo "   1. Go to Supabase Dashboard → SQL Editor"
  echo "   2. Copy contents of scripts/clear-all-users.sql"
  echo "   3. Paste and run"
  echo ""
  echo "Or use the TypeScript script:"
  echo "   npx tsx scripts/clear-all-users.ts"
fi
