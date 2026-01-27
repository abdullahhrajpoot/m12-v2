'use client'

import { TaskSection } from './TaskSection'
import { SECTION_CONFIGS } from '@/lib/task-helpers'
import type { Task, TasksResponse, TaskStatus, TaskSection as TaskSectionType } from '@/types/task'

interface TaskListProps {
  tasks: Task[]
  sections: TasksResponse['sections']
  onUpdate: (taskId: string, status: TaskStatus) => Promise<void>
  onUpdateDate: (taskId: string, date: string | null) => Promise<void>
  onSubmitFeedback: (taskId: string, feedback: string) => Promise<void>
}

export function TaskList({
  tasks,
  sections,
  onUpdate,
  onUpdateDate,
  onSubmitFeedback
}: TaskListProps) {
  // Create a map for quick task lookup
  const taskMap = new Map(tasks.map(task => [task.id, task]))

  // Define section order
  const sectionOrder: TaskSectionType[] = [
    'overdue',
    'today',
    'this_week',
    'upcoming',
    'skipped',
    'completed'
  ]

  return (
    <div className="space-y-2">
      {sectionOrder.map((sectionId) => {
        const config = SECTION_CONFIGS[sectionId]
        const taskIds = sections[sectionId] || []
        const sectionTasks = taskIds
          .map(id => taskMap.get(id))
          .filter((task): task is Task => task !== undefined)

        return (
          <TaskSection
            key={sectionId}
            title={config.title}
            icon={config.icon}
            tasks={sectionTasks}
            defaultCollapsed={config.defaultCollapsed}
            emptyMessage={config.emptyMessage}
            onUpdate={onUpdate}
            onUpdateDate={onUpdateDate}
            onSubmitFeedback={onSubmitFeedback}
          />
        )
      })}
    </div>
  )
}
