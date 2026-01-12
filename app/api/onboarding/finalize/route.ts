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

    // Allow empty facts ONLY if userEdits is provided (manual family info entry from timeout state)
    if (facts.length === 0 && !userEdits?.trim()) {
      console.error('Empty facts array submitted without userEdits:', { userId: user.id })
      return NextResponse.json(
        { error: 'Either facts or userEdits must be provided' },
        { status: 400 }
      )
    }

    // Trigger n8n workflow to process facts and send welcome email
    // CRITICAL: Wait for webhook to confirm data is saved (up to 60 seconds)
    const n8nWebhookUrl = process.env.N8N_ONBOARDING_FINALIZE_WEBHOOK_URL ||
      'https://chungxchung.app.n8n.cloud/webhook/onboarding-finalize'
    
    const webhookPayload = {
      userId: user.id,
      facts: facts,
      userEdits: userEdits, // null if "It's All Good", otherwise the user's edits
    }

    // Wait for webhook with 60 second timeout - user must wait for confirmation
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
      console.log('✅ Onboarding finalize webhook confirmed data saved for user:', user.id)
      return { success: true, timedOut: false }
    })
    .catch((webhookError) => {
      console.error('❌ Error calling n8n onboarding finalize webhook:', webhookError)
      throw webhookError
    })

    // Race between webhook and 60 second timeout
    const timeoutPromise = new Promise<{ success: false, timedOut: true }>((resolve) => {
      setTimeout(() => {
        console.warn('⏱️ Webhook timeout after 60 seconds - data may not be saved')
        resolve({ success: false, timedOut: true })
      }, 60000) // 60 second timeout
    })

    // Wait for whichever completes first
    const result = await Promise.race([webhookPromise, timeoutPromise])

    if (result.timedOut) {
      // Timeout - return error so user can use email fallback
      return NextResponse.json({
        success: false,
        timedOut: true,
        message: 'Processing is taking longer than expected',
        facts: facts, // Include facts for email fallback
      }, { status: 408 }) // 408 Request Timeout
    }

    // Success - data is confirmed saved
    return NextResponse.json({
      success: true,
      message: 'Onboarding finalized successfully - data saved',
    })

  } catch (error) {
    console.error('Error in onboarding finalize endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





