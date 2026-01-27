'use client'

import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'

interface FeedbackInputProps {
  taskId: string
  currentFeedback: string | null
  onSubmit: (taskId: string, feedback: string) => Promise<void>
}

export function FeedbackInput({ 
  taskId, 
  currentFeedback, 
  onSubmit 
}: FeedbackInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState(currentFeedback || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter some feedback')
      return
    }

    if (feedback.length > 500) {
      toast.error('Feedback must be 500 characters or less')
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(taskId, feedback)
      toast.success('Feedback submitted')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {currentFeedback ? 'Edit Feedback' : 'Add Feedback'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2">
          <Textarea
            placeholder="Let us know if this task is wrong, missing details, or shouldn't exist..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[80px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {feedback.length}/500 characters
            </span>
            <Button 
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="flex items-center gap-1"
            >
              <Send className="h-3 w-3" />
              Send Feedback
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
