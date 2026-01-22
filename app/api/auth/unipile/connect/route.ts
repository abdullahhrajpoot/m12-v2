import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to initiate Unipile OAuth flow
 * 
 * Redirects user to Unipile's hosted authentication page.
 * After successful authentication, Unipile redirects back to our callback.
 * 
 * GET /api/auth/unipile/connect
 */
export async function GET(request: NextRequest) {
  try {
    const unipileDsn = process.env.UNIPILE_DSN
    const unipileApiKey = process.env.UNIPILE_API_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'

    if (!unipileDsn || !unipileApiKey) {
      console.error('Unipile configuration missing:', {
        hasDsn: !!unipileDsn,
        hasApiKey: !!unipileApiKey
      })
      return NextResponse.redirect(new URL('/?error=config_error', appUrl))
    }

    // Build Unipile hosted auth URL
    // Unipile will handle the OAuth flow and redirect back to our callback
    const successRedirectUrl = `${appUrl}/api/auth/unipile/callback`
    
    const unipileAuthUrl = `${unipileDsn}/api/v1/hosting/accounts/create?` +
      `api_key=${encodeURIComponent(unipileApiKey)}&` +
      `provider=GOOGLE&` +
      `success_redirect=${encodeURIComponent(successRedirectUrl)}`

    console.log('🔐 Redirecting to Unipile OAuth:', {
      dsn: unipileDsn,
      callbackUrl: successRedirectUrl
    })

    return NextResponse.redirect(unipileAuthUrl)

  } catch (error) {
    console.error('Error initiating Unipile OAuth:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'
    return NextResponse.redirect(new URL('/?error=oauth_error', appUrl))
  }
}
