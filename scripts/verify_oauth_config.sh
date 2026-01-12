#!/bin/bash

# Script to verify OAuth configuration
# This helps identify what might be misconfigured

echo "🔍 OAuth Configuration Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ Found .env.local"
    
    # Extract Supabase URL
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -n "$SUPABASE_URL" ]; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL"
        
        # Extract project ID
        PROJECT_ID=$(echo "$SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')
        
        if [ -n "$PROJECT_ID" ]; then
            echo "✅ Supabase Project ID: $PROJECT_ID"
            echo ""
            echo "🔗 Required Redirect URI for Google Cloud Console:"
            echo "   https://${PROJECT_ID}.supabase.co/auth/v1/callback"
            echo ""
        else
            echo "❌ Could not extract project ID from Supabase URL"
        fi
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    fi
    
    # Check for Google Client ID
    GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" || grep "^NEXT_PUBLIC_GOOGLE_CLIENT_ID=" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -n "$GOOGLE_CLIENT_ID" ]; then
        echo "✅ GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}... (first 20 chars)"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Go to: https://console.cloud.google.com"
        echo "2. Find OAuth client with this Client ID: ${GOOGLE_CLIENT_ID:0:20}..."
        echo "3. Add redirect URI: https://${PROJECT_ID}.supabase.co/auth/v1/callback"
    else
        echo "⚠️  GOOGLE_CLIENT_ID not found (might be configured in Supabase instead)"
    fi
    
else
    echo "❌ .env.local not found"
    echo "💡 Create .env.local with NEXT_PUBLIC_SUPABASE_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For complete instructions, see: GOOGLE_CLOUD_CONSOLE_CHECKLIST.md"
