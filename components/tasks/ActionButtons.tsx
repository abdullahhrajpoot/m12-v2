'use client'

import { useState } from 'react'
import { Check, Forward, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TaskStatus } from '@/types/task'

interface ActionButtonsProps {
  taskId: string
  currentStatus: TaskStatus
  onUpdate: (taskId: string, status: TaskStatus) => Promise<void>
  onDateClick: () => void
}

export function ActionButtons({ 
  taskId, 
  currentStatus, 
  onUpdate,
  onDateClick 
}: ActionButtonsProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (status: TaskStatus) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await onUpdate(taskId, status)
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        size="sm"
        variant={currentStatus === 'done' ? 'default' : 'outline'}
        onClick={() => handleStatusUpdate('done')}
        disabled={isUpdating}
        className="flex items-center gap-1"
      >
        <Check className="h-4 w-4" />
        Done
      </Button>
      
      <Button
        size="sm"
        variant={currentStatus === 'skipped' ? 'default' : 'outline'}
        onClick={() => handleStatusUpdate('skipped')}
        disabled={isUpdating}
        className="flex items-center gap-1"
      >
        <Forward className="h-4 w-4" />
        Skip
      </Button>
      
      <Button
        size="sm"
        variant={currentStatus === 'dismissed' ? 'default' : 'outline'}
        onClick={() => handleStatusUpdate('dismissed')}
        disabled={isUpdating}
        className="flex items-center gap-1"
      >
        <Trash2 className="h-4 w-4" />
        Dismiss
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onDateClick}
        disabled={isUpdating}
        className="flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Date
      </Button>
    </div>
  )
}
