"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, MessageSquare, Send, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from '@/lib/supabase-client'

interface KidCardProps {
  kid: {
    id: number
    name: string
    school?: string
    grade?: string
    aftercare?: string
    activities?: string[]
  }
}

const KidCard = ({ kid }: KidCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6"
  >
    <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
        {kid.name.charAt(0)}
      </div>
      <h3 className="text-xl font-bold text-slate-900">{kid.name}</h3>
    </div>
    
    <div className="space-y-4">
      {kid.school && (
        <div className="flex gap-4">
          <span className="w-24 text-sm font-medium text-slate-500 shrink-0">School</span>
          <span className="text-slate-900 font-medium">{kid.school}</span>
        </div>
      )}
      
      {kid.grade && (
        <div className="flex gap-4">
          <span className="w-24 text-sm font-medium text-slate-500 shrink-0">Grade</span>
          <span className="text-slate-900 font-medium">{kid.grade}</span>
        </div>
      )}
      
      {kid.aftercare && (
        <div className="flex gap-4">
          <span className="w-24 text-sm font-medium text-slate-500 shrink-0">Aftercare</span>
          <span className="text-slate-900 font-medium">{kid.aftercare}</span>
        </div>
      )}
      
      {kid.activities && kid.activities.length > 0 && (
        <div className="flex gap-4">
          <span className="w-24 text-sm font-medium text-slate-500 shrink-0 pt-1">Activities</span>
          <div className="space-y-2">
            {kid.activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-slate-900">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </motion.div>
)

export default function WhatWeFound() {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  // Mock data - in production, this should come from your API/Supabase
  const kidsData = [
    {
      id: 1,
      name: "Kid 1",
      school: "Nesbit Elementary",
      grade: "Grade 1",
      aftercare: "Footsteps",
      activities: [
        "HipHop at Heart Beat Dance",
        "Soccer with AYSO",
        "Gymnastics at Peninsula Gymnastics Level 2"
      ]
    },
    {
      id: 2,
      name: "Kid 2",
      school: "Footsteps",
      grade: "Pre-K",
      activities: [
        "Ballet at Heart Beat Dance",
        "Gymnastics at Belmont Gymnastics Level 1"
      ]
    }
  ]

  const handleSubmit = async (isAllGood = false) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/scan-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: isAllGood ? "It's all good!" : comment,
          is_correct: isAllGood
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      toast.success(isAllGood ? "Great! We're glad we got it right." : "Thanks for the feedback! We'll update your profile.")
      
      router.push('/allset')
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
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
            We scanned your inbox for school names and common extracurricular activities. Let us know if we got it right.
          </p>
        </motion.div>

        <div className="space-y-6">
          {kidsData.map((kid) => (
            <KidCard key={kid.id} kid={kid} />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">Anything we missed or got wrong?</h3>
          </div>
          
          <Textarea 
            placeholder="e.g., Kid 1 actually goes to Kumon on Tuesdays..."
            className="min-h-[120px] mb-6 resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => handleSubmit(false)}
              disabled={!comment.trim() || submitting}
              variant="outline"
              className="flex-1 h-12 text-base font-medium"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Comments
            </Button>
            <Button 
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              It's All Good
            </Button>
          </div>
        </motion.div>

        <p className="text-center text-sm text-slate-400 mt-8">
          We've sent a copy of your family facts to your email. <br />
          Feel free to reply to that email with any changes.
        </p>
      </div>
    </div>
  )
}

