// Task status types
export type TaskStatus = 'done' | 'not_done' | 'skipped' | 'dismissed'

// Task section types for UI grouping
export type TaskSection = 'overdue' | 'today' | 'this_week' | 'upcoming' | 'skipped' | 'completed'

// Main task interface
export interface Task {
  id: string
  family_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  source_type: string | null
  source_id: string | null
  source_snippet: string | null
  feedback: string | null
  feedback_submitted_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

// Family interfaces
export interface Family {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  email: string
  display_name: string | null
  unipile_account_id: string | null
  role: string
  created_at: string
  updated_at: string
}

// API response types
export interface TasksResponse {
  tasks: Task[]
  sections: {
    overdue: string[]
    today: string[]
    this_week: string[]
    upcoming: string[]
    skipped: string[]
    completed: string[]
  }
}

export interface TaskUpdatePayload {
  status?: TaskStatus
  due_date?: string | null
  feedback?: string
}

// Section metadata for UI
export interface SectionConfig {
  id: TaskSection
  title: string
  icon: string
  emptyMessage: string
  defaultCollapsed: boolean
}
