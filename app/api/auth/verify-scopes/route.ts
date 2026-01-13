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

    // Use Google's tokeninfo endpoint to get granted scopes (for Gmail, email, profile)
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(access_token)}`,
      { method: 'GET' }
    )

    let grantedScopes: string[] = []
    let hasEmail = false
    let hasProfile = false
    let hasGmailReadonly = false
    let hasGmailLabels = false

    if (tokenInfoResponse.ok) {
      const tokenInfo = await tokenInfoResponse.json()
      grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : []
      
      // Check for email/profile which might be implicit
      hasEmail = grantedScopes.includes('email') || !!tokenInfo.email
      hasProfile = grantedScopes.includes('profile') || !!tokenInfo.user_id
      hasGmailReadonly = grantedScopes.includes('https://www.googleapis.com/auth/gmail.readonly')
      hasGmailLabels = grantedScopes.includes('https://www.googleapis.com/auth/gmail.labels')
      
      if (hasEmail) grantedScopes.push('email')
      if (hasProfile) grantedScopes.push('profile')
    }

    // Test Calendar and Tasks scopes with actual GET API calls
    const scopeTestResults: Record<string, boolean> = {}
    let hasCalendar = false
    let hasTasks = false

    // Test Calendar scope
    try {
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      hasCalendar = calendarResponse.ok
      scopeTestResults.calendar = hasCalendar
      if (hasCalendar) {
        grantedScopes.push('https://www.googleapis.com/auth/calendar')
      }
    } catch (e) {
      hasCalendar = false
      scopeTestResults.calendar = false
    }

    // Test Tasks scope
    try {
      const tasksResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      hasTasks = tasksResponse.ok
      scopeTestResults.tasks = hasTasks
      if (hasTasks) {
        grantedScopes.push('https://www.googleapis.com/auth/tasks')
      }
    } catch (e) {
      hasTasks = false
      scopeTestResults.tasks = false
    }

    // Determine missing scopes
    const missingScopes: string[] = []
    
    if (!hasGmailReadonly) {
      missingScopes.push('https://www.googleapis.com/auth/gmail.readonly')
    }
    if (!hasGmailLabels) {
      missingScopes.push('https://www.googleapis.com/auth/gmail.labels')
    }
    if (!hasCalendar) {
      missingScopes.push('https://www.googleapis.com/auth/calendar')
    }
    if (!hasTasks) {
      missingScopes.push('https://www.googleapis.com/auth/tasks')
    }
    if (!hasEmail) {
      missingScopes.push('email')
    }
    if (!hasProfile) {
      missingScopes.push('profile')
    }

    return NextResponse.json({
      hasAllScopes: missingScopes.length === 0,
      missingScopes: missingScopes,
      grantedScopes: grantedScopes,
      requiredScopes: REQUIRED_SCOPES,
      scopeTestResults: scopeTestResults
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
