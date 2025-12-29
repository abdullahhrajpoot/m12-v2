"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, MessageSquare, Send, ThumbsUp, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

interface LoadingStateProps {
  progress: number
  elapsed: number
  tip: string
}

const LoadingState = ({ progress, elapsed, tip }: LoadingStateProps) => {
  const stages = [
    { threshold: 0, label: "Connecting to Gmail...", icon: "📧" },
    { threshold: 20, label: "Searching for kid-related keywords...", icon: "🔍" },
    { threshold: 40, label: "Extracting facts about your family...", icon: "✨" },
    { threshold: 70, label: "Consolidating information...", icon: "🧩" },
    { threshold: 90, label: "Finishing up...", icon: "🎯" }
  ]

  const currentStage = stages.reduce((acc, stage) => 
    progress >= stage.threshold ? stage : acc
  , stages[0])

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Analyzing your inbox...</h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            This can take up to 6 minutes. We're searching for keywords like "school," "elementary," "soccer," and "ballet" to find what matters to your family.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-2 mb-3" />
            <div className="flex justify-between text-sm text-slate-500">
              <span>{Math.round(progress)}%</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {elapsed}s elapsed
              </span>
            </div>
          </div>

          {/* Current Stage */}
          <motion.div
            key={currentStage.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-4 p-6 bg-slate-50 rounded-xl"
          >
            <div className="text-4xl animate-bounce">{currentStage.icon}</div>
            <div>
              <div className="font-semibold text-slate-900 mb-1">{currentStage.label}</div>
              <div className="text-sm text-slate-500">
                Hang tight, we're processing your emails...
              </div>
            </div>
          </motion.div>

          {/* Tip/Message */}
          {tip && (
            <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="text-sm text-indigo-900">
                  {tip}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

interface FactCardProps {
  fact: string
  index: number
}

const FactCard = ({ fact, index }: FactCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
  >
    <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
    <span className="text-slate-900 leading-relaxed">{fact}</span>
  </motion.div>
)

export default function WhatWeFound() {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [facts, setFacts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tip, setTip] = useState("")
  const router = useRouter()

  const EXPECTED_DURATION = 360 // 6 minutes maximum wait time

  // Fetch random tip on mount
  useEffect(() => {
    const fetchTip = async () => {
      try {
        const response = await fetch('/api/onboarding/tip')
        if (response.ok) {
          const data = await response.json()
          setTip(data.message)
        }
      } catch (err) {
        // Silently fail - tip is not critical
        console.log('Could not fetch tip:', err)
      }
    }
    fetchTip()
  }, [])

  useEffect(() => {
    let progressInterval: NodeJS.Timeout
    let elapsedInterval: NodeJS.Timeout
    let checkInterval: NodeJS.Timeout
    let startTime = Date.now()
    let hasLoadedFacts = false

    // Start progress simulation
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev // Cap at 95% until we get real data
        // Slow down as we approach 90%
        const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5
        return Math.min(prev + increment, 95)
      })
    }, 1000)

    // Track elapsed time
    elapsedInterval = setInterval(() => {
      const secondsElapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsed(secondsElapsed)
    }, 1000)

    // Poll for results
    const checkForResults = async () => {
      if (hasLoadedFacts) return // Stop polling if we've already loaded facts
      
      try {
        const response = await fetch('/api/onboarding/summary')
        const data = await response.json()
        
        if (response.ok) {
          // Check if we have summary sentences
          if (data.summary_sentences && Array.isArray(data.summary_sentences) && data.summary_sentences.length > 0) {
            hasLoadedFacts = true
            setFacts(data.summary_sentences)
            setProgress(100)
            setLoading(false)
            
            clearInterval(progressInterval)
            clearInterval(elapsedInterval)
            clearInterval(checkInterval)
          } else {
            // Data structure exists but no sentences yet - keep polling
            console.log('No sentences yet, status:', data.status)
          }
        } else {
          // API returned an error
          console.error('API error:', response.status, data)
          // Continue polling for a bit, then show error if it persists
        }
      } catch (err) {
        // Network error - continue polling
        console.error('Error fetching summary:', err)
      }
    }

    // Start checking for results immediately, then every 3 seconds
    checkForResults()
    checkInterval = setInterval(checkForResults, 3000)

    // Force show results after 6 minutes (failsafe)
    const timeout = setTimeout(() => {
      if (!hasLoadedFacts) {
        // If no facts loaded after 6 minutes, show error
        setError("Taking longer than expected. Please refresh the page or contact support.")
        setLoading(false)
      }
      clearInterval(progressInterval)
      clearInterval(elapsedInterval)
      clearInterval(checkInterval)
    }, 360000) // 6 minutes

    return () => {
      clearInterval(progressInterval)
      clearInterval(elapsedInterval)
      clearInterval(checkInterval)
      clearTimeout(timeout)
    }
  }, []) // Run once on mount

  const handleSubmit = async (isAllGood = false) => {
    setSubmitting(true)
    try {
      // Call API endpoint to finalize onboarding
      const response = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facts: facts,
          userEdits: isAllGood ? null : comment.trim() || null, // null if "It's All Good", otherwise the edits
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process facts')
      }

      toast.success(isAllGood ? "Great! We're saving your facts." : "Thanks! We're refining your facts with your edits.")
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingState progress={progress} elapsed={elapsed} tip={tip} />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Here's what we found ✨</h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            We searched your inbox for kid-related keywords and extracted key facts about your family. Let us know if we got it right.
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <Check className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900">
              {facts.length} fact{facts.length !== 1 ? 's' : ''} extracted
            </h3>
          </div>
          
          <div className="space-y-1.5">
            {facts.map((fact, index) => (
              <FactCard key={index} fact={fact} index={index} />
            ))}
          </div>

          {facts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">📭</div>
              <p className="text-slate-600">
                We didn't find any facts in your recent emails. This might mean:
              </p>
              <ul className="text-sm text-slate-500 mt-2 space-y-1">
                <li>• You don't have school/activity emails yet</li>
                <li>• Your emails don't match our search patterns</li>
              </ul>
            </div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">Anything we missed or got wrong?</h3>
          </div>
          
          <Textarea 
            placeholder="e.g., We also have ballet on Wednesdays at 3:30pm..."
            className="min-h-[120px] mb-6 resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <Button 
            onClick={() => handleSubmit(comment.trim().length === 0)}
            disabled={submitting}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium"
          >
            {comment.trim() ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Edits
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Confirm Facts Above
              </>
            )}
          </Button>
        </motion.div>

        <p className="text-center text-sm text-slate-400 mt-8">
          We'll use this information to help manage your calendar and tasks. <br />
          You can always update this later in your settings.
        </p>
      </div>
    </div>
  )
}
