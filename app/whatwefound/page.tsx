"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, MessageSquare, Send, ThumbsUp, Clock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

import LogoutButton from "@/components/LogoutButton"

const Header = () => (
  <header className="relative z-50 bg-transparent">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="bippity.boo"
            className="w-auto h-[100px] object-contain"
          />
          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">bippity.boo</span>
        </div>
        <LogoutButton />
      </div>
    </div>
  </header>
)

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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
              <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Getting to know your family...</h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              I'm scanning your recent emails to learn about your kids' schools, activities, and schedules. This can take up to 3 minutes.
            </p>
            <p className="text-sm text-slate-400 mt-4 max-w-md mx-auto">
              This is just a first pass — I won't catch everything, and I might get some things wrong. You'll be able to correct me next.
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
    </div>
  )
}

// Manual Email Verification Modal
const EmailVerificationModal = ({ onSubmit, isSubmitting }: { onSubmit: (email: string) => void, isSubmitting: boolean }) => {
  const [email, setEmail] = useState('')

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Mail className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Verify Email Address</h2>
        </div>

        <p className="text-slate-600 mb-6">
          We successfully connected your Google Account, but we couldn't automatically verify your email address.
          Please enter it manually to continue.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(email); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={!email || isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Confirm Email'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

function groupFactsByFirstWord(facts: string[]): { word: string; facts: string[] }[] {
  const groups: Record<string, string[]> = {}

  facts.forEach(fact => {
    const firstWord = fact.trim().split(/\s+/)[0] || 'Other'
    if (!groups[firstWord]) {
      groups[firstWord] = []
    }
    groups[firstWord].push(fact)
  })

  return Object.entries(groups)
    .sort((a, b) => {
      const countDiff = b[1].length - a[1].length
      if (countDiff !== 0) return countDiff
      return a[0].localeCompare(b[0])
    })
    .map(([word, facts]) => ({ word, facts }))
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

interface TimeoutStateProps {
  onSubmit: (text: string) => Promise<void>
  submitting: boolean
}

const TimeoutState = ({ onSubmit, submitting }: TimeoutStateProps) => {
  const [familyInfo, setFamilyInfo] = useState("")

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
              <Mail className="w-6 h-6 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">I didn't find much yet</h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              Your inbox didn't have many clues about your kids' schedules — maybe you're new to these activities, or the emails haven't started yet. No problem! Just tell me a bit about your family and I'll take it from there.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Who are your kids, and what are they up to these days?</h3>
            </div>

            <Textarea
              placeholder="e.g., I have two kids - Emma (8) does soccer on Saturdays and piano on Tuesdays. Jake (5) just started kindergarten at Lincoln Elementary..."
              className="min-h-[200px] mb-6 resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              value={familyInfo}
              onChange={(e) => setFamilyInfo(e.target.value)}
            />

            <Button
              onClick={() => onSubmit(familyInfo)}
              disabled={submitting || !familyInfo.trim()}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Saving..." : "Tell Me About Your Family"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const SavingState = ({ facts }: { facts: string[] }) => {
  const emailBody = encodeURIComponent(
    `Hi,\n\nI tried to submit my onboarding facts but the system timed out. Here are my facts:\n\n${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nPlease save these for me.\n\nThanks!`
  )
  const emailLink = `mailto:fgm@bippity.boo?subject=Onboarding Facts - Timeout&body=${emailBody}`

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Saving your data...</h2>
          <p className="text-slate-600 mb-6">
            Please wait while we confirm your facts are saved. This may take up to a minute.
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-8">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              If this takes more than a minute, you can email your facts directly:
            </p>
            <a
              href={emailLink}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Facts to fgm@bippity.boo
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const TimeoutEmailState = ({ facts }: { facts: string[] }) => {
  const emailBody = encodeURIComponent(
    `Hi,\n\nI tried to submit my onboarding facts but the system timed out after 1 minute. Here are my facts:\n\n${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nPlease save these for me.\n\nThanks!`
  )
  const emailLink = `mailto:fgm@bippity.boo?subject=Onboarding Facts - Timeout&body=${emailBody}`

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Saving took longer than expected</h2>
          <p className="text-slate-600 mb-6">
            We couldn't confirm your data was saved within 1 minute. To make sure your facts are saved, please email them directly:
          </p>
          <a
            href={emailLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors mb-4"
          >
            <Mail className="w-4 h-4" />
            Email Facts to fgm@bippity.boo
          </a>
          <p className="text-sm text-slate-500">
            The email will be pre-filled with your facts. Just click send!
          </p>
        </motion.div>
      </div>
    </div>
  )
}

const SuccessState = () => (
  <div className="min-h-screen bg-slate-50">
    <Header />
    <div className="py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Got it — I'll remember that.</h2>
        <p className="text-slate-600 leading-relaxed">
          Feel free to email me at{' '}
          <a href="mailto:fgm@bippity.boo" className="text-indigo-600 hover:text-indigo-700 font-medium">
            fgm@bippity.boo
          </a>
          {' '}when any facts change or if you want to correct or adjust how I handle things.
        </p>
      </motion.div>
    </div>
  </div>
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
  const [timedOut, setTimedOut] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveTimedOut, setSaveTimedOut] = useState(false)
  const [checkingAccount, setCheckingAccount] = useState(false)
  // New States for Manual Link
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  const EXPECTED_DURATION = 180 // 3 minutes maximum wait time

  // Check for missing_email manual fallback
  useEffect(() => {
    if (searchParams.get('missing_email') === 'true') {
      setShowEmailModal(true)
    }
  }, [searchParams])

  const handleManualLink = async (email: string) => {
    // Get session from URL or Params
    const sessionId = searchParams.get('session_id') || searchParams.get('session')
    if (!sessionId) return

    setIsLinking(true)
    try {
      const res = await fetch('/api/auth/unipile/manual-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionId })
      })

      if (!res.ok) throw new Error('Failed to link')

      toast.success('Email verified successfully!')
      setShowEmailModal(false)
      // Remove missing_email param and reload to restart polling
      window.location.href = `/whatwefound?session=${sessionId}`

    } catch (e) {
      toast.error('Failed to verify email. Please try again.')
    } finally {
      setIsLinking(false)
    }
  }

  // Check for pending Unipile account creation
  useEffect(() => {
    if (showEmailModal) return // Don't poll while waiting for user input

    const checkAccountStatus = async () => {
      // Get session_id from URL params or cookie
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get('session')

      if (!sessionId) {
        // No pending session, proceed with normal flow
        return
      }

      setCheckingAccount(true)
      let pollCount = 0
      const maxPolls = 100 // 5 minutes max (100 * 3 seconds)
      let pollInterval: NodeJS.Timeout

      const poll = async () => {
        if (pollCount >= maxPolls) {
          setCheckingAccount(false)
          setError('Account creation is taking longer than expected. Please try signing up again.')
          clearInterval(pollInterval)
          return
        }

        try {
          const response = await fetch(`/api/auth/unipile/check-status?session_id=${sessionId}`)
          const data = await response.json()

          if (data.status === 'created' && data.account_id) {
            // Account found! The callback route should have already handled user creation
            setCheckingAccount(false)
            clearInterval(pollInterval)

            // Account is ready, continue with normal onboarding flow
            console.log('✅ Unipile account created:', data.account_id)

            // Store session_id in localStorage so onboarding summary can use it
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('unipile_session_id', sessionId)
            }
          } else if (data.status === 'pending') {
            // Still waiting, continue polling
            pollCount++
          } else {
            // Error or unknown status
            console.warn('Unexpected account status:', data)
            pollCount++
          }
        } catch (err) {
          console.error('Error checking account status:', err)
          pollCount++
        }
      }

      // Start polling immediately, then every 3 seconds
      poll()
      pollInterval = setInterval(poll, 3000)

      // Cleanup on unmount
      return () => {
        clearInterval(pollInterval)
      }
    }

    checkAccountStatus()
  }, [showEmailModal])

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
    // Don't start Onboarding polling if we're still checking account status OR waiting for manual email
    if (checkingAccount || showEmailModal) {
      return
    }

    let progressInterval: NodeJS.Timeout
    let elapsedInterval: NodeJS.Timeout
    let checkInterval: NodeJS.Timeout
    let startTime = Date.now()
    let hasLoadedFacts = false

    // Start progress simulation - calibrated for 3 minutes (180 seconds)
    // We want to reach ~95% around 170 seconds
    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev // Cap at 95% until we get real data
        // Slow down as we approach 90% - targeting ~95% at 170 seconds
        // 0-50%: ~60 seconds (0.83%/sec), 50-80%: ~60 seconds (0.5%/sec), 80-95%: ~50 seconds (0.3%/sec)
        const increment = prev < 50 ? 0.83 : prev < 80 ? 0.5 : 0.3
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
        // Get session_id from URL or localStorage for fallback auth
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('session') ||
          (typeof window !== 'undefined' ? window.localStorage.getItem('unipile_session_id') : null)

        // Include session_id in request if available (for users without session cookie)
        const url = sessionId
          ? `/api/onboarding/summary?session_id=${sessionId}`
          : '/api/onboarding/summary'

        const response = await fetch(url)
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
          if (response.status === 401) {
            // Auth error - session might not be established yet
            console.log('Auth error - session may not be ready yet, continuing to poll')
            // Continue polling - session might be established soon
          } else {
            console.error('API error:', response.status, data)
            // Continue polling for a bit, then show error if it persists
          }
        }
      } catch (err) {
        // Network error - continue polling
        console.error('Error fetching summary:', err)
      }
    }

    // Start checking for results immediately, then every 3 seconds
    checkForResults()
    checkInterval = setInterval(checkForResults, 3000)

    // Force show results after 3 minutes (failsafe)
    const timeout = setTimeout(() => {
      if (!hasLoadedFacts) {
        // If no facts loaded after 3 minutes, show timeout state
        setTimedOut(true)
        setLoading(false)
      }
      clearInterval(progressInterval)
      clearInterval(elapsedInterval)
      clearInterval(checkInterval)
    }, 180000) // 3 minutes

    return () => {
      clearInterval(progressInterval)
      clearInterval(elapsedInterval)
      clearInterval(checkInterval)
      clearTimeout(timeout)
    }
  }, [checkingAccount, showEmailModal]) // Re-run if checkingAccount or showEmailModal changes

  const handleSubmit = async (isAllGood = false) => {
    // Validate facts array before submitting
    if (!facts || facts.length === 0) {
      toast.error("No facts to submit. Please wait for the facts to load.")
      return
    }

    setSubmitting(true)
    setSaving(true)
    setSaveTimedOut(false)

    try {
      // Call API endpoint to finalize onboarding - waits up to 60 seconds for confirmation
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

      const result = await response.json()

      if (!response.ok) {
        // Check if it's a timeout (408)
        if (response.status === 408 && result.timedOut) {
          setSaveTimedOut(true)
          setSaving(false)
          toast.error("Saving is taking longer than expected. Please use the email option below.", {
            duration: 10000,
          })
          return
        }

        console.error('Finalize API error:', response.status, result)
        throw new Error(result.error || `Failed to process facts (${response.status})`)
      }

      // Success - data is confirmed saved
      setSaving(false)
      setSubmitted(true)
      toast.success("Onboarding finalized successfully! Your data has been saved.")
    } catch (error: any) {
      console.error('Error submitting facts:', error)
      setSaving(false)
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle timeout state submission (when user provides family info manually)
  const handleTimeoutSubmit = async (familyInfo: string) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facts: [],
          userEdits: familyInfo.trim(),
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save family information')
      }

      // Show success state
      setSubmitted(true)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Early Return for Manual Email Verification Modal
  if (showEmailModal) {
    return <EmailVerificationModal onSubmit={handleManualLink} isSubmitting={isLinking} />
  }

  // Show success state after submission
  if (saveTimedOut) {
    return <TimeoutEmailState facts={facts} />
  }

  if (saving) {
    return <SavingState facts={facts} />
  }

  if (submitted) {
    return <SuccessState />
  }

  if (loading) {
    return <LoadingState progress={progress} elapsed={elapsed} tip={tip} />
  }

  // Show timeout state when no facts were found after waiting
  if (timedOut || (facts.length === 0 && !loading)) {
    return <TimeoutState onSubmit={handleTimeoutSubmit} submitting={submitting} />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="py-12 px-4 flex items-center justify-center">
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
      </div>
    )
  }

  // Group facts by first word for display
  const groupedFacts = groupFactsByFirstWord(facts)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Here's what I found so far</h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              Based on your emails, here's my best guess about your family. Some of this might be wrong or incomplete — that's normal! Help me learn by confirming what's right and filling in what I missed.
            </p>
          </motion.div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">

            <div className="space-y-4">
              {groupedFacts.map((group, groupIndex) => (
                <motion.div
                  key={group.word}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  {groupedFacts.length > 1 && (
                    <div className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-3">
                      {group.word}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {group.facts.map((fact, factIndex) => (
                      <li key={`${groupIndex}-${factIndex}`} className="flex items-start gap-2">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span className="text-slate-900 leading-relaxed">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Anything we missed or got wrong?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Just tell me what's off — or what I missed entirely. Plain English is fine.
            </p>

            <Textarea
              placeholder="Actually, Cora does gymnastics on Thursdays, not Tuesdays..."
              className="min-h-[120px] mb-6 resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <Button
              onClick={() => handleSubmit(comment.trim().length === 0)}
              disabled={submitting || saving}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium disabled:opacity-70"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving... Please wait
                </>
              ) : comment.trim() ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Edits
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Looks Good!
                </>
              )}
            </Button>
          </motion.div>

          <p className="text-center text-sm text-slate-400 mt-8">
            You can always email me at <a href="mailto:fgm@bippity.boo" className="text-indigo-500 hover:text-indigo-600">fgm@bippity.boo</a> to update this later.
          </p>
        </div>
      </div>
    </div>
  )
}
