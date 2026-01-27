import { startOfDay, endOfWeek, isAfter, isBefore, isSameDay, subDays, parseISO } from 'date-fns'
import type { Task, TaskSection, TasksResponse, SectionConfig } from '@/types/task'

/**
 * Get the start of today in local timezone
 */
export function getToday(): Date {
  return startOfDay(new Date())
}

/**
 * Get the end of the current week (Sunday)
 */
export function getEndOfWeek(): Date {
  return endOfWeek(new Date(), { weekStartsOn: 0 }) // Week starts on Sunday
}

/**
 * Check if a date is overdue (before today)
 */
export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false
  const date = parseISO(dateString)
  const today = getToday()
  return isBefore(date, today)
}

/**
 * Check if a date is today
 */
export function isDueToday(dateString: string | null): boolean {
  if (!dateString) return false
  const date = parseISO(dateString)
  const today = getToday()
  return isSameDay(date, today)
}

/**
 * Check if a date is this week (after today, before end of week)
 */
export function isDueThisWeek(dateString: string | null): boolean {
  if (!dateString) return false
  const date = parseISO(dateString)
  const today = getToday()
  const endOfWeekDate = getEndOfWeek()
  return isAfter(date, today) && !isAfter(date, endOfWeekDate)
}

/**
 * Check if a date is in the last 30 days
 */
export function isWithinLast30Days(dateString: string | null): boolean {
  if (!dateString) return false
  const date = parseISO(dateString)
  const thirtyDaysAgo = subDays(new Date(), 30)
  return isAfter(date, thirtyDaysAgo) || isSameDay(date, thirtyDaysAgo)
}

/**
 * Determine which section a task belongs to
 */
export function getTaskSection(task: Task): TaskSection | null {
  const { status, due_date, updated_at } = task

  // Completed/dismissed tasks (last 30 days)
  if ((status === 'done' || status === 'dismissed') && isWithinLast30Days(updated_at)) {
    return 'completed'
  }

  // Skipped tasks (last 30 days)
  if (status === 'skipped' && isWithinLast30Days(updated_at)) {
    return 'skipped'
  }

  // Only 'not_done' tasks appear in active sections
  if (status !== 'not_done') {
    return null // Don't show older completed/skipped tasks
  }

  // Active tasks by due date
  if (isOverdue(due_date)) {
    return 'overdue'
  }

  if (isDueToday(due_date)) {
    return 'today'
  }

  if (isDueThisWeek(due_date)) {
    return 'this_week'
  }

  // Upcoming (future dates or no date)
  return 'upcoming'
}

/**
 * Group tasks into sections
 */
export function groupTasksBySections(tasks: Task[]): TasksResponse['sections'] {
  const sections: TasksResponse['sections'] = {
    overdue: [],
    today: [],
    this_week: [],
    upcoming: [],
    skipped: [],
    completed: []
  }

  tasks.forEach(task => {
    const section = getTaskSection(task)
    if (section) {
      sections[section].push(task.id)
    }
  })

  return sections
}

/**
 * Section configuration for UI rendering
 */
export const SECTION_CONFIGS: Record<TaskSection, SectionConfig> = {
  overdue: {
    id: 'overdue',
    title: 'Overdue',
    icon: '⚠️',
    emptyMessage: 'No overdue tasks',
    defaultCollapsed: false
  },
  today: {
    id: 'today',
    title: 'Due Today',
    icon: '📅',
    emptyMessage: 'Nothing due today',
    defaultCollapsed: false
  },
  this_week: {
    id: 'this_week',
    title: 'Due This Week',
    icon: '📆',
    emptyMessage: 'Nothing due this week',
    defaultCollapsed: false
  },
  upcoming: {
    id: 'upcoming',
    title: 'Upcoming',
    icon: '🗓️',
    emptyMessage: 'No upcoming tasks',
    defaultCollapsed: false
  },
  skipped: {
    id: 'skipped',
    title: 'Skipped - Last 30 Days',
    icon: '⏭️',
    emptyMessage: 'No skipped tasks',
    defaultCollapsed: true
  },
  completed: {
    id: 'completed',
    title: 'Completed - Last 30 Days',
    icon: '✅',
    emptyMessage: 'No completed tasks',
    defaultCollapsed: true
  }
}

/**
 * Format a date string for display
 */
export function formatDueDate(dateString: string | null): string {
  if (!dateString) return 'No due date'
  
  const date = parseISO(dateString)
  const today = getToday()
  
  if (isSameDay(date, today)) {
    return 'Today'
  }
  
  if (isOverdue(dateString)) {
    const daysOverdue = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue)`
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
