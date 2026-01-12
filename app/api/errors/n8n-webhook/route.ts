import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * API endpoint to receive errors from n8n workflows
 * 
 * This endpoint receives errors from n8n workflows and forwards them to Sentry
 * with proper context (workflow_id, execution_id, user_id, etc.)
 * 
 * Authentication: Requires API key in Authorization header (same as tokens endpoint)
 * 
 * Usage from n8n:
 * POST /api/errors/n8n-webhook
 * Headers: Authorization: Bearer <N8N_API_KEY>
 * Body: {
 *   workflow_id: string,
 *   execution_id: string,
 *   user_id?: string,
 *   error: {
 *     message: string,
 *     stack?: string,
 *     name?: string
 *   },
 *   node?: {
 *     name: string,
 *     type: string
 *   },
 *   context?: Record<string, any>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key (same as tokens endpoint)
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    const expectedApiKey = process.env.N8N_API_KEY

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      workflow_id,
      execution_id,
      user_id,
      error: errorData,
      node,
      context
    } = body

    if (!workflow_id || !execution_id || !errorData || !errorData.message) {
      return NextResponse.json(
        { error: 'Missing required fields: workflow_id, execution_id, error.message' },
        { status: 400 }
      )
    }

    // Create error object for Sentry
    const error = new Error(errorData.message)
    if (errorData.name) {
      error.name = errorData.name
    }
    if (errorData.stack) {
      error.stack = errorData.stack
    }

    // Capture error in Sentry with context
    Sentry.withScope((scope) => {
      // Set error level
      scope.setLevel('error')
      
      // Set tags for filtering in Sentry
      scope.setTag('source', 'n8n')
      scope.setTag('workflow_id', workflow_id)
      scope.setTag('execution_id', execution_id)
      
      if (node) {
        scope.setTag('node_name', node.name)
        scope.setTag('node_type', node.type)
      }

      // Set user context
      if (user_id) {
        scope.setUser({ id: user_id })
      }

      // Set additional context
      scope.setContext('n8n', {
        workflow_id,
        execution_id,
        user_id,
        node: node ? {
          name: node.name,
          type: node.type
        } : undefined,
        ...context
      })

      // Set fingerprint for better error grouping
      scope.setFingerprint([
        'n8n',
        workflow_id,
        errorData.message
      ])

      // Capture the error
      Sentry.captureException(error)
    })

    console.log('n8n error captured in Sentry:', {
      workflow_id,
      execution_id,
      user_id,
      error_message: errorData.message,
      node: node?.name
    })

    return NextResponse.json({
      success: true,
      message: 'Error captured in Sentry'
    })

  } catch (error) {
    console.error('Error processing n8n webhook:', error)
    
    // Try to capture this error too
    try {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
    } catch (sentryError) {
      console.error('Failed to capture error in Sentry:', sentryError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


