import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { groupTasksBySections } from '@/lib/task-helpers'
import type { Task, TasksResponse } from '@/types/task'

/**
 * GET /api/tasks
 * Fetch all tasks for the authenticated user's family
 * Returns tasks grouped into sections: overdue, today, this_week, upcoming, skipped, completed
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Supabase session
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

    // Get user's family_id
    const { data: familyMember, error: familyError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('email', user.email!)
      .single()

    if (familyError || !familyMember) {
      console.error('Error fetching family membership:', familyError)
      return NextResponse.json(
        { error: 'Family membership not found. Please complete onboarding.' },
        { status: 404 }
      )
    }

    // Fetch all tasks for this family
    // RLS policies will automatically filter by family_id
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Group tasks into sections
    const sections = groupTasksBySections(tasks as Task[])

    const response: TasksResponse = {
      tasks: tasks as Task[],
      sections
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
