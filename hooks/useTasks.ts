import { useState, useCallback } from 'react'
import type { Task, TasksResponse, TaskUpdatePayload } from '@/types/task'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sections, setSections] = useState<TasksResponse['sections']>({
    overdue: [],
    today: [],
    this_week: [],
    upcoming: [],
    skipped: [],
    completed: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/tasks')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tasks')
      }

      const data: TasksResponse = await response.json()
      setTasks(data.tasks)
      setSections(data.sections)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    tasks,
    sections,
    isLoading,
    error,
    fetchTasks,
    refetch: fetchTasks
  }
}

export function useTaskMutations(onSuccess?: () => void) {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateTask = useCallback(async (
    taskId: string,
    updates: TaskUpdatePayload
  ) => {
    try {
      setIsUpdating(true)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const data = await response.json()
      
      if (onSuccess) {
        onSuccess()
      }

      return data.task
    } catch (err) {
      console.error('Error updating task:', err)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [onSuccess])

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setIsUpdating(true)

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      if (onSuccess) {
        onSuccess()
      }

      return true
    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [onSuccess])

  return {
    updateTask,
    deleteTask,
    isUpdating
  }
}
