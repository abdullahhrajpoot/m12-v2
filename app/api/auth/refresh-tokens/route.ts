import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to proactively refresh expiring OAuth tokens
 * 
 * This endpoint is designed to be called by a cron job (e.g., n8n workflow)
 * to refresh tokens before they expire, ensuring they're always fresh when needed.
 * 
 * Authentication: API Key in Authorization header
 * 
 * Query Parameters:
 * - hoursBeforeExpiry (optional): Refresh tokens expiring within this many hours (default: 24)
 * - provider (optional): OAuth provider, defaults to 'google'
 * 
 * Usage from n8n cron:
 * POST /api/auth/refresh-tokens?hoursBeforeExpiry=24&provider=google
 * Headers: Authorization: Bearer <N8N_API_KEY>
 */

// Helper to add no-cache headers to all responses
function jsonResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(init?.headers || {})
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    const expectedApiKey = process.env.N8N_API_KEY

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return jsonResponse(
        { error: 'Unauthorized - Invalid or missing API key' },
        { status: 401 }
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return jsonResponse(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const hoursBeforeExpiry = parseInt(searchParams.get('hoursBeforeExpiry') || '24', 10)
    const provider = searchParams.get('provider') || 'google'

    // Get Google OAuth credentials
    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!googleClientId || !googleClientSecret) {
      return jsonResponse(
        { error: 'Google OAuth credentials not configured' },
        { status: 500 }
      )
    }

    // Calculate expiry threshold (tokens expiring within X hours)
    const expiryThreshold = new Date(Date.now() + hoursBeforeExpiry * 60 * 60 * 1000)

    // Find tokens that are expiring soon and have refresh tokens
    const { data: expiringTokens, error: queryError } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('provider', provider)
      .not('refresh_token', 'is', null)
      .or(`expires_at.is.null,expires_at.lte.${expiryThreshold.toISOString()}`)

    if (queryError) {
      console.error('Error querying expiring tokens:', queryError)
      return jsonResponse(
        { error: 'Failed to query tokens' },
        { status: 500 }
      )
    }

    if (!expiringTokens || expiringTokens.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No tokens need refreshing',
        refreshed: 0,
        failed: 0,
      })
    }

    const results = {
      refreshed: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Refresh each token
    for (const tokenData of expiringTokens) {
      try {
        // Skip if already expired and no refresh token
        if (!tokenData.refresh_token) {
          continue
        }

        // Check if token is actually expired or expiring soon
        const isExpired = tokenData.expires_at 
          ? new Date(tokenData.expires_at) < new Date()
          : true
        const isExpiringSoon = tokenData.expires_at
          ? new Date(tokenData.expires_at) <= expiryThreshold
          : true

        if (!isExpired && !isExpiringSoon) {
          continue // Token is still fresh, skip
        }

        console.log(`🔄 Refreshing token for user: ${tokenData.user_id}`)

        // Refresh Google OAuth token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json()
          
          // Calculate new expiration time
          const newExpiresAt = refreshedData.expires_in
            ? new Date(Date.now() + refreshedData.expires_in * 1000).toISOString()
            : null

          // Update tokens in database
          const { error: updateError } = await supabaseAdmin
            .from('oauth_tokens')
            .update({
              access_token: refreshedData.access_token,
              expires_at: newExpiresAt,
              updated_at: new Date().toISOString(),
              // Note: refresh_token may or may not be returned - keep existing if not provided
              refresh_token: refreshedData.refresh_token || tokenData.refresh_token,
            })
            .eq('user_id', tokenData.user_id)
            .eq('provider', provider)

          if (updateError) {
            console.error(`Error updating refreshed token for user ${tokenData.user_id}:`, updateError)
            results.failed++
            results.errors.push(`User ${tokenData.user_id}: Update failed`)
          } else {
            console.log(`✅ Token refreshed successfully for user: ${tokenData.user_id}`)
            results.refreshed++
          }
        } else {
          const errorText = await refreshResponse.text()
          console.error(`Failed to refresh token for user ${tokenData.user_id}:`, refreshResponse.status, errorText)
          
          // If refresh fails, token is invalid - mark user as needs_reauth
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ status: 'needs_reauth' })
            .eq('id', tokenData.user_id)

          if (updateError) {
            console.error(`Error marking user ${tokenData.user_id} as needs_reauth:`, updateError)
          }

          results.failed++
          results.errors.push(`User ${tokenData.user_id}: Refresh failed (${refreshResponse.status})`)
        }
      } catch (error: any) {
        console.error(`Error refreshing token for user ${tokenData.user_id}:`, error)
        results.failed++
        results.errors.push(`User ${tokenData.user_id}: ${error.message || 'Unknown error'}`)
      }
    }

    return jsonResponse({
      success: true,
      message: `Refreshed ${results.refreshed} tokens, ${results.failed} failed`,
      refreshed: results.refreshed,
      failed: results.failed,
      total: expiringTokens.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })

  } catch (error: any) {
    console.error('Error in refresh-tokens endpoint:', error)
    return jsonResponse(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}



