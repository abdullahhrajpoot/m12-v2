import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Test endpoint to verify SUPABASE_SERVICE_ROLE_KEY is correct
 * 
 * This endpoint tests if the service role key can:
 * 1. Connect to Supabase
 * 2. Bypass RLS and read from oauth_tokens table
 * 
 * Usage: GET /api/test-service-role
 */
export async function GET(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables',
        checks: {
          keyExists: false,
          keyLength: 0,
          supabaseUrl: supabaseUrl || 'MISSING'
        }
      }, { status: 500 })
    }

    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL is not set',
        checks: {
          keyExists: true,
          keyLength: serviceRoleKey.length,
          supabaseUrl: 'MISSING'
        }
      }, { status: 500 })
    }

    // Test 1: Key format check (should be a JWT)
    const keyFormatValid = serviceRoleKey.startsWith('eyJ') && serviceRoleKey.includes('.')
    
    // Test 2: Try to create admin client
    let adminClientCreated = false
    let canReadOAuthTokens = false
    let canReadUsers = false
    let errorMessage: string | null = null
    let tokenCount = 0

    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
      adminClientCreated = true

      // Test 3: Try to read from oauth_tokens table (bypasses RLS)
      const { data: tokens, error: tokensError } = await supabaseAdmin
        .from('oauth_tokens')
        .select('user_id, provider')
        .limit(5)

      if (tokensError) {
        errorMessage = `Cannot read oauth_tokens: ${tokensError.message}`
      } else {
        canReadOAuthTokens = true
        tokenCount = tokens?.length || 0
      }

      // Test 4: Try to read from users table
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .limit(1)

      if (usersError) {
        errorMessage = errorMessage 
          ? `${errorMessage}; Cannot read users: ${usersError.message}`
          : `Cannot read users: ${usersError.message}`
      } else {
        canReadUsers = true
      }

    } catch (clientError: any) {
      errorMessage = `Failed to create admin client: ${clientError.message}`
    }

    const allTestsPassed = adminClientCreated && canReadOAuthTokens && canReadUsers

    return NextResponse.json({
      success: allTestsPassed,
      checks: {
        keyExists: true,
        keyLength: serviceRoleKey.length,
        keyFormatValid: keyFormatValid,
        supabaseUrl: supabaseUrl,
        adminClientCreated: adminClientCreated,
        canReadOAuthTokens: canReadOAuthTokens,
        canReadUsers: canReadUsers,
        tokenCount: tokenCount
      },
      error: errorMessage,
      message: allTestsPassed 
        ? '✅ Service role key is valid and working correctly!'
        : '❌ Service role key has issues - see checks above'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      checks: {}
    }, { status: 500 })
  }
}
