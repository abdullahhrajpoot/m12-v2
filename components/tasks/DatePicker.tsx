'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  taskId: string
  currentDate: string | null
  onUpdate: (taskId: string, date: string | null) => Promise<void>
}

export function DatePicker({ taskId, currentDate, onUpdate }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate) : undefined
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSelect = async (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setIsUpdating(true)
    
    try {
      const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
      await onUpdate(taskId, dateString)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update date:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearDate = async () => {
    setDate(undefined)
    setIsUpdating(true)
    
    try {
      await onUpdate(taskId, null)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to clear date:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={isUpdating}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
        {date && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDate}
              disabled={isUpdating}
              className="w-full"
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
