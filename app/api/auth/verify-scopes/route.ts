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

    // #region agent log
    console.log('🔍 DEBUG H3 - Starting scope verification:', JSON.stringify({tokenPrefix:access_token?.substring(0,30),tokenLength:access_token?.length}));
    fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-scopes/route.ts:33',message:'Starting scope verification',data:{tokenPrefix:access_token?.substring(0,30),tokenLength:access_token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
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
    let tokeninfoFailed = false

    // #region agent log
    console.log('🔍 DEBUG H3 - Tokeninfo response:', JSON.stringify({ok:tokenInfoResponse.ok,status:tokenInfoResponse.status,statusText:tokenInfoResponse.statusText}));
    fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-scopes/route.ts:52',message:'Tokeninfo response',data:{ok:tokenInfoResponse.ok,status:tokenInfoResponse.status,statusText:tokenInfoResponse.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (tokenInfoResponse.ok) {
      try {
        const tokenInfo = await tokenInfoResponse.json()
        grantedScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : []
        
        // Check for email/profile which might be implicit
        hasEmail = grantedScopes.includes('email') || !!tokenInfo.email
        hasProfile = grantedScopes.includes('profile') || !!tokenInfo.user_id
        hasGmailReadonly = grantedScopes.includes('https://www.googleapis.com/auth/gmail.readonly')
        hasGmailLabels = grantedScopes.includes('https://www.googleapis.com/auth/gmail.labels')
        
        if (hasEmail) grantedScopes.push('email')
        if (hasProfile) grantedScopes.push('profile')
      } catch (e) {
        console.error('Error parsing tokeninfo response:', e)
        tokeninfoFailed = true
      }
    } else {
      console.warn('Tokeninfo endpoint failed:', tokenInfoResponse.status, tokenInfoResponse.statusText)
      tokeninfoFailed = true
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
      // #region agent log
      console.log('🔍 DEBUG H3 - Calendar API test:', JSON.stringify({ok:calendarResponse.ok,status:calendarResponse.status}));
      fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-scopes/route.ts:95',message:'Calendar API test',data:{ok:calendarResponse.ok,status:calendarResponse.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      console.log('🔍 DEBUG H3 - Tasks API test:', JSON.stringify({ok:tasksResponse.ok,status:tasksResponse.status}));
      fetch('http://127.0.0.1:7242/ingest/5beb2915-5867-4232-9971-7d67e3e68583',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-scopes/route.ts:109',message:'Tasks API test',data:{ok:tasksResponse.ok,status:tasksResponse.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      if (hasTasks) {
        grantedScopes.push('https://www.googleapis.com/auth/tasks')
      }
    } catch (e) {
      hasTasks = false
      scopeTestResults.tasks = false
    }

    // Determine missing scopes
    const missingScopes: string[] = []
    
    // If tokeninfo failed, we can't verify Gmail/email/profile, so mark them as missing
    // This ensures we catch missing scopes even if tokeninfo is unavailable
    if (tokeninfoFailed) {
      missingScopes.push('https://www.googleapis.com/auth/gmail.readonly')
      missingScopes.push('https://www.googleapis.com/auth/gmail.labels')
      missingScopes.push('email')
      missingScopes.push('profile')
    } else {
      // Only check Gmail/email/profile if tokeninfo succeeded
      if (!hasGmailReadonly) {
        missingScopes.push('https://www.googleapis.com/auth/gmail.readonly')
      }
      if (!hasGmailLabels) {
        missingScopes.push('https://www.googleapis.com/auth/gmail.labels')
      }
      if (!hasEmail) {
        missingScopes.push('email')
      }
      if (!hasProfile) {
        missingScopes.push('profile')
      }
    }
    
    // Calendar and Tasks are always tested via GET API calls
    if (!hasCalendar) {
      missingScopes.push('https://www.googleapis.com/auth/calendar')
    }
    if (!hasTasks) {
      missingScopes.push('https://www.googleapis.com/auth/tasks')
    }

    const result = {
      hasAllScopes: missingScopes.length === 0,
      missingScopes: missingScopes,
      grantedScopes: grantedScopes,
      requiredScopes: REQUIRED_SCOPES,
      scopeTestResults: scopeTestResults,
      tokeninfoFailed: tokeninfoFailed
    }
    
    console.log('🔍 Scope verification result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Error verifying scopes:', error)
    // Fail open - if verification fails, assume scopes are present
    // This prevents blocking legitimate users due to verification errors
    // BUT log the error so we can debug issues
    return NextResponse.json({
      hasAllScopes: true,
      missingScopes: [],
      grantedScopes: [],
      error: 'Verification failed, but continuing with flow',
      errorDetails: error.message || String(error)
    })
  }
}
