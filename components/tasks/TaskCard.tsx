'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActionButtons } from './ActionButtons'
import { DatePicker } from './DatePicker'
import { FeedbackInput } from './FeedbackInput'
import { formatDueDate } from '@/lib/task-helpers'
import type { Task, TaskStatus } from '@/types/task'

interface TaskCardProps {
  task: Task
  onUpdate: (taskId: string, status: TaskStatus) => Promise<void>
  onUpdateDate: (taskId: string, date: string | null) => Promise<void>
  onSubmitFeedback: (taskId: string, feedback: string) => Promise<void>
}

export function TaskCard({ 
  task, 
  onUpdate, 
  onUpdateDate,
  onSubmitFeedback 
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const hasLongDescription = task.description && task.description.length > 150

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg leading-tight">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <div className="text-sm text-muted-foreground">
            {isExpanded || !hasLongDescription ? (
              <p className="whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="line-clamp-2">{task.description}</p>
            )}
            {hasLongDescription && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto font-normal"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1 text-sm">
          {task.due_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          )}
          
          {task.source_snippet && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{task.source_snippet}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t pt-3 space-y-3">
          {/* Action Buttons */}
          <ActionButtons
            taskId={task.id}
            currentStatus={task.status}
            onUpdate={onUpdate}
            onDateClick={() => setShowDatePicker(!showDatePicker)}
          />

          {/* Date Picker */}
          {showDatePicker && (
            <div className="pt-2">
              <DatePicker
                taskId={task.id}
                currentDate={task.due_date}
                onUpdate={onUpdateDate}
              />
            </div>
          )}

          {/* Feedback Input */}
          <FeedbackInput
            taskId={task.id}
            currentFeedback={task.feedback}
            onSubmit={onSubmitFeedback}
          />
        </div>
      </CardContent>
    </Card>
  )
}
