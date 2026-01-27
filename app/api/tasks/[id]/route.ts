import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { TaskUpdatePayload } from '@/types/task'

/**
 * PATCH /api/tasks/[id]
 * Update a task's status, due_date, or feedback
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore errors in Server Component context
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: TaskUpdatePayload = await request.json()

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['done', 'not_done', 'skipped', 'dismissed']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (body.status !== undefined) {
      updatePayload.status = body.status
      
      // Set completed_at when status changes to 'done'
      if (body.status === 'done') {
        updatePayload.completed_at = new Date().toISOString()
      } else if (updatePayload.completed_at) {
        // Clear completed_at if status changes from 'done' to something else
        updatePayload.completed_at = null
      }
    }

    if (body.due_date !== undefined) {
      updatePayload.due_date = body.due_date
    }

    if (body.feedback !== undefined) {
      updatePayload.feedback = body.feedback
      updatePayload.feedback_submitted_at = new Date().toISOString()
    }

    // Update task (RLS will ensure user has permission)
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      
      // Check if it's a permission error
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Task not found or you do not have permission to update it' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    })

  } catch (error) {
    console.error('Error in PATCH /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Soft delete a task (set status to 'dismissed')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore errors in Server Component context
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Soft delete by setting status to 'dismissed'
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Error deleting task:', updateError)
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Task not found or you do not have permission to delete it' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    })

  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
