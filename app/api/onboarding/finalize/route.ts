import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to finalize onboarding
 * 
 * Called from the "whatwefound" page when user confirms facts or submits edits.
 * Triggers n8n workflow to:
 * - Optionally refine facts with AI if user provided edits
 * - Save facts to family_facts table
 * - Send welcome email
 * 
 * POST /api/onboarding/finalize
 * Body: { facts: string[], userEdits: string | null }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Not needed for read operations
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { facts, userEdits } = body

    if (!facts || !Array.isArray(facts)) {
      console.error('Invalid facts array:', { facts, userId: user.id })
      return NextResponse.json(
        { error: 'facts array is required' },
        { status: 400 }
      )
    }

    if (facts.length === 0) {
      console.error('Empty facts array submitted:', { userId: user.id })
      return NextResponse.json(
        { error: 'facts array cannot be empty' },
        { status: 400 }
      )
    }

    // Trigger n8n workflow to process facts and send welcome email
    // Wait with timeout to catch immediate errors, but don't block forever
    const n8nWebhookUrl = process.env.N8N_ONBOARDING_FINALIZE_WEBHOOK_URL ||
      'https://chungxchung.app.n8n.cloud/webhook/onboarding-finalize'
    
    const webhookPayload = {
      userId: user.id,
      facts: facts,
      userEdits: userEdits, // null if "It's All Good", otherwise the user's edits
    }

    // Wait for webhook with 8 second timeout to catch immediate errors
    // If it times out, we still return success (webhook may process async)
    const webhookPromise = fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })
    .then(async (webhookResponse) => {
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text().catch(() => 'Unknown error')
        console.error('❌ n8n webhook returned error status:', webhookResponse.status, 'error:', errorText)
        throw new Error(`Webhook returned ${webhookResponse.status}: ${errorText}`)
      }
      console.log('✅ Onboarding finalize webhook triggered successfully for user:', user.id)
      return true
    })
    .catch((webhookError) => {
      console.error('❌ Error calling n8n onboarding finalize webhook:', webhookError)
      // Still return success - webhook may process async or can be retried
      return false
    })

    // Race between webhook and timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('⏱️ Webhook timeout after 8 seconds - proceeding anyway (may process async)')
        resolve(false)
      }, 8000) // 8 second timeout
    })

    // Wait for whichever completes first
    const webhookSuccess = await Promise.race([webhookPromise, timeoutPromise]) as boolean

    // Return success regardless - webhook processing is async
    // If webhook failed, it's logged and can be retried manually if needed
    return NextResponse.json({
      success: true,
      message: 'Onboarding finalized successfully',
      webhookProcessed: webhookSuccess, // Indicates if webhook responded within timeout
    })

  } catch (error) {
    console.error('Error in onboarding finalize endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





