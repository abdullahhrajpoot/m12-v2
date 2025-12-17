#!/bin/bash
# Script to create Nango connection for ParentSquare credentials
# Usage: ./setup_parentsquare_nango.sh

# Configuration
NANGO_SERVER_URL="${NANGO_SERVER_URL:-https://api.nango.dev}"
NANGO_SECRET_KEY="${NANGO_SECRET_KEY}"
CONNECTION_ID="6dc4ce22-5815-4f6c-9ad7-18a95a489243"
PROVIDER_KEY="parentsquare"
USERNAME="chungfamilyparents@gmail.com"
PASSWORD="ChungChinese79!"

if [ -z "$NANGO_SECRET_KEY" ]; then
  echo "Error: NANGO_SECRET_KEY environment variable is not set"
  echo "Please set it before running this script:"
  echo "export NANGO_SECRET_KEY='your-secret-key'"
  exit 1
fi

echo "Creating Nango connection for ParentSquare..."
echo "Connection ID: $CONNECTION_ID"
echo "Provider Key: $PROVIDER_KEY"

# Try different Nango API endpoints for storing credentials
# Option 1: Standard connection endpoint (for OAuth providers)
# Option 2: Config endpoint (for custom providers)
# Option 3: Direct credential storage

echo "Attempting to create connection via standard endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${NANGO_SERVER_URL}/connection/${CONNECTION_ID}/${PROVIDER_KEY}" \
  -H "Authorization: Bearer ${NANGO_SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"credentials\": {
      \"username\": \"${USERNAME}\",
      \"password\": \"${PASSWORD}\"
    }
  }" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# If 404, try alternative endpoints
if [ "$HTTP_CODE" -eq 404 ]; then
  echo "Standard endpoint returned 404. Trying config endpoint..."
  
  # Try PUT instead of POST (update/create)
  RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    "${NANGO_SERVER_URL}/connection/${CONNECTION_ID}/${PROVIDER_KEY}" \
    -H "Authorization: Bearer ${NANGO_SECRET_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"credentials\": {
        \"username\": \"${USERNAME}\",
        \"password\": \"${PASSWORD}\"
      }
    }" 2>&1)
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 404 ]; then
    echo "Config endpoint also returned 404."
    echo ""
    echo "The 'parentsquare' provider may need to be registered in Nango first."
    echo "Please check:"
    echo "1. Go to your Nango dashboard"
    echo "2. Register/create a custom provider called 'parentsquare'"
    echo "3. Configure it as a 'credentials' type provider (not OAuth)"
    echo "4. Then run this script again"
    echo ""
    echo "Alternatively, you may need to use Nango's config API to create the provider first."
  fi
fi

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✓ Nango connection created successfully"
  echo "Response: $BODY"
else
  echo "✗ Failed to create Nango connection"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $BODY"
  echo ""
  echo "Note: If the connection already exists, you may need to update it instead."
  echo "Try using PUT method or check Nango dashboard."
  exit 1
fi

