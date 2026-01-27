'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/types/task'

interface TaskSectionProps {
  title: string
  icon: string
  tasks: Task[]
  defaultCollapsed?: boolean
  emptyMessage: string
  onUpdate: (taskId: string, status: TaskStatus) => Promise<void>
  onUpdateDate: (taskId: string, date: string | null) => Promise<void>
  onSubmitFeedback: (taskId: string, feedback: string) => Promise<void>
}

export function TaskSection({
  title,
  icon,
  tasks,
  defaultCollapsed = false,
  emptyMessage,
  onUpdate,
  onUpdateDate,
  onSubmitFeedback
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const taskCount = tasks.length

  return (
    <div className="mb-6">
      {/* Section Header */}
      <Button
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full justify-between p-3 h-auto hover:bg-slate-100 mb-3"
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-semibold">
            {title} ({taskCount})
          </h2>
        </div>
      </Button>

      {/* Section Content */}
      {!isCollapsed && (
        <div>
          {taskCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onUpdate}
                  onUpdateDate={onUpdateDate}
                  onSubmitFeedback={onSubmitFeedback}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
