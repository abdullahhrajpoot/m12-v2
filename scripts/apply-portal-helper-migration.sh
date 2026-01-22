#!/bin/bash

# Script to apply the portal helper migration
# Usage: ./scripts/apply-portal-helper-migration.sh

set -e

echo "🔧 Applying Portal Helper Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it with:"
  echo "  export DATABASE_URL='your-database-url'"
  echo ""
  echo "Or if using .env file, run:"
  echo "  source .env"
  exit 1
fi

# Apply the migration
echo "📊 Creating portal_credentials and captured_content tables..."
psql "$DATABASE_URL" -f migrations/004_create_portal_helper_tables.sql

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Navigate to /portal-helper in your app"
echo "  2. Add your first portal credentials"
echo "  3. Start capturing content!"
echo ""
