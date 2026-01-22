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

    // Generate expiration date (24 hours from now)
    const expiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    // Generate a session ID to match webhook with callback
    const sessionId = crypto.randomUUID()
    
    // Build redirect URLs
    const successRedirectUrl = `${appUrl}/api/auth/unipile/callback?session_id=${sessionId}`
    const failureRedirectUrl = `${appUrl}/?error=oauth_failed`
    const notifyUrl = `${appUrl}/api/webhooks/unipile/account`

    // Call Unipile API to generate hosted auth link
    // Correct endpoint: POST /api/v1/hosted/accounts/link
    const linkResponse = await fetch(`${unipileDsn}/api/v1/hosted/accounts/link`, {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        type: 'create',
        providers: ['GOOGLE'],
        api_url: unipileDsn,
        expiresOn: expiresOn,
        success_redirect_url: successRedirectUrl,
        failure_redirect_url: failureRedirectUrl,
        notify_url: notifyUrl,
        name: sessionId // Pass session ID so webhook can match it
      })
    })

    if (!linkResponse.ok) {
      const errorText = await linkResponse.text()
      console.error('Failed to create Unipile hosted auth link:', {
        status: linkResponse.status,
        error: errorText
      })
      return NextResponse.redirect(new URL('/?error=unipile_api_error', appUrl))
    }

    const { url: unipileAuthUrl } = await linkResponse.json()

    if (!unipileAuthUrl) {
      console.error('No URL returned from Unipile API')
      return NextResponse.redirect(new URL('/?error=no_auth_url', appUrl))
    }

    console.log('🔐 Redirecting to Unipile OAuth:', {
      dsn: unipileDsn,
      authUrl: unipileAuthUrl,
      callbackUrl: successRedirectUrl
    })

    return NextResponse.redirect(unipileAuthUrl)

  } catch (error) {
    console.error('Error initiating Unipile OAuth:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'
    return NextResponse.redirect(new URL('/?error=oauth_error', appUrl))
  }
}
