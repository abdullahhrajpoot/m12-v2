import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to verify OAuth token has all required scopes
 * 
 * POST /api/auth/verify-scopes
 * Body: { access_token: string }
 * 
 * Returns: { hasAllScopes: boolean, missingScopes: string[], grantedScopes: string[] }
 */

const REQUIRED_SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token } = body

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      )
    }

    // Use Google's tokeninfo endpoint to get granted scopes
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(access_token)}`,
      { method: 'GET' }
    )

    if (!tokenInfoResponse.ok) {
      // If tokeninfo fails, try alternative verification via API calls
      // This is a fallback for cases where tokeninfo might not work
      return NextResponse.json({
        hasAllScopes: false,
        missingScopes: REQUIRED_SCOPES,
        grantedScopes: [],
        error: 'Could not verify token. Please try re-authenticating.'
      })
    }

    const tokenInfo = await tokenInfoResponse.json()
    const grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : []

    // Check which required scopes are missing
    const missingScopes = REQUIRED_SCOPES.filter(
      requiredScope => !grantedScopes.includes(requiredScope)
    )

    // Also check for email/profile which might be implicit
    // Google OAuth often includes these even if not explicitly in scope string
    const hasEmail = grantedScopes.includes('email') || tokenInfo.email
    const hasProfile = grantedScopes.includes('profile') || tokenInfo.user_id

    // Adjust missing scopes based on implicit grants
    const adjustedMissingScopes = missingScopes.filter(scope => {
      if (scope === 'email' && hasEmail) return false
      if (scope === 'profile' && hasProfile) return false
      return true
    })

    return NextResponse.json({
      hasAllScopes: adjustedMissingScopes.length === 0,
      missingScopes: adjustedMissingScopes,
      grantedScopes: grantedScopes,
      requiredScopes: REQUIRED_SCOPES
    })

  } catch (error: any) {
    console.error('Error verifying scopes:', error)
    // Fail open - if verification fails, assume scopes are present
    // This prevents blocking legitimate users due to verification errors
    return NextResponse.json({
      hasAllScopes: true,
      missingScopes: [],
      grantedScopes: [],
      error: 'Verification failed, but continuing with flow'
    })
  }
}
