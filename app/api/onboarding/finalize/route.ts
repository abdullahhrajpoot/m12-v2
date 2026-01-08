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
    // Fire-and-forget to prevent 502 errors from blocking user response
    const n8nWebhookUrl = process.env.N8N_ONBOARDING_FINALIZE_WEBHOOK_URL ||
      'https://chungxchung.app.n8n.cloud/webhook/onboarding-finalize'
    
    // Don't await - let webhook process in background
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        facts: facts,
        userEdits: userEdits, // null if "It's All Good", otherwise the user's edits
      }),
    })
    .then(async (webhookResponse) => {
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text().catch(() => 'Unknown error')
        console.error('n8n webhook returned error status:', webhookResponse.status, 'error:', errorText)
      } else {
        console.log('✅ Onboarding finalize webhook triggered successfully for user:', user.id)
      }
    })
    .catch((webhookError) => {
      // Log but don't fail - webhook processing is async
      console.error('Error calling n8n onboarding finalize webhook:', webhookError)
    })

    // Return success immediately - don't wait for webhook
    return NextResponse.json({
      success: true,
      message: 'Onboarding finalized successfully',
    })

  } catch (error) {
    console.error('Error in onboarding finalize endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





