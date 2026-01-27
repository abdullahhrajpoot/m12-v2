'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { useTasks, useTaskMutations } from '@/hooks/useTasks'
import { toast } from 'sonner'
import type { TaskStatus } from '@/types/task'

export default function TasksPage() {
  const router = useRouter()
  const { tasks, sections, isLoading, error, fetchTasks } = useTasks()
  const { updateTask } = useTaskMutations(() => {
    // Refetch tasks after successful mutation
    fetchTasks()
  })

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        toast.error('Failed to log out')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('An error occurred during logout')
    }
  }

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(taskId, { status })
      toast.success('Task updated')
    } catch (error) {
      toast.error('Failed to update task')
      throw error
    }
  }

  const handleUpdateDate = async (taskId: string, date: string | null) => {
    try {
      await updateTask(taskId, { due_date: date })
      toast.success('Due date updated')
    } catch (error) {
      toast.error('Failed to update due date')
      throw error
    }
  }

  const handleSubmitFeedback = async (taskId: string, feedback: string) => {
    try {
      await updateTask(taskId, { feedback })
      // Toast is handled in FeedbackInput component
    } catch (error) {
      // Error toast is handled in FeedbackInput component
      throw error
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Error Loading Tasks
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => fetchTasks()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Tasks</h1>
            <p className="text-slate-600 mt-1">
              Manage your family's tasks and deadlines
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchTasks()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && tasks.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-white rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          /* Task List */
          <TaskList
            tasks={tasks}
            sections={sections}
            onUpdate={handleUpdateStatus}
            onUpdateDate={handleUpdateDate}
            onSubmitFeedback={handleSubmitFeedback}
          />
        )}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              No tasks yet
            </h2>
            <p className="text-slate-600">
              Tasks from your emails will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
