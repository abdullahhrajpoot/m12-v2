"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reason: reason || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      toast.success('You\'re on the list! We\'ll be in touch soon.')
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
      
    } catch (error: any) {
      console.error('Waitlist signup error:', error)
      toast.error(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-50/30 rounded-full blur-3xl" />
      </div>

      {/* Header with Logo */}
      <header className="relative z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="bippity.boo" 
                className="w-auto h-[100px] object-contain"
              />
              <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">bippity.boo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative z-10 py-20 lg:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Early Access
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Waiting List</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              We're accepting a limited number of early access users. Tell us about your situation and we'll get you set up as soon as possible.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900"
                required
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-semibold text-slate-900 mb-2">
                Why do you want access? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="we have 3 kids and use parentsquare, brightwheel, and 3 other apps and portal, help!"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 min-h-[120px] resize-y"
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-70"
              size="lg"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Joining...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Get Early Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              We'll email you when your account is ready. No spam, promise.
            </p>
          </form>

          {/* Social Proof */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-600 mb-4">
              Join parents who are tired of juggling
            </p>
            <div className="flex flex-wrap justify-center gap-3 opacity-70">
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">ParentSquare</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">Brightwheel</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">ClassDojo</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">TeamSnap</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">Remind</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">Konstella</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
