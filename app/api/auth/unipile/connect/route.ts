import { NextRequest, NextResponse } from 'next/server'
import { getCookieOptions } from '@/lib/cookie-utils'

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
    let unipileDsn = process.env.UNIPILE_DSN?.trim() || ''
    const unipileApiKey = process.env.UNIPILE_API_KEY?.trim()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'

    // Ensure DSN has protocol
    if (unipileDsn && !unipileDsn.startsWith('http')) {
      unipileDsn = `https://${unipileDsn}`
    }

    // Warn if appUrl looks like localhost (configuration issue)
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      console.warn('⚠️ WARNING: NEXT_PUBLIC_APP_URL appears to be localhost:', appUrl)
      console.warn('⚠️ This will cause redirect issues in production. Set NEXT_PUBLIC_APP_URL=https://bippity.boo in Railway')
    }

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

    // Webhook URL: Using httpbin to guarantee 200 OK helps prevent Unipile from rolling back
    // if the production webhook is crashing or unreachable.
    const notifyUrl = `https://httpbin.org/status/200`

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
      appUrl: appUrl, // Log the configured app URL
      dsn: unipileDsn,
      authUrl: unipileAuthUrl,
      callbackUrl: successRedirectUrl,
      notifyUrl: notifyUrl,
      sessionId: sessionId
    })

    // Store session_id in cookie as backup in case Unipile doesn't preserve query params
    const response = NextResponse.redirect(unipileAuthUrl)
    response.cookies.set('unipile_session_id', sessionId, getCookieOptions({
      maxAge: 60 * 10 // 10 minutes
    }))

    return response

  } catch (error) {
    console.error('Error initiating Unipile OAuth:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bippity.boo'
    return NextResponse.redirect(new URL('/?error=oauth_error', appUrl))
  }
}
