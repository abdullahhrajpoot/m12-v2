"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase-client'

interface ConnectButtonProps {
  text?: string
  className?: string
}

export default function ConnectButton({ 
  text = "Sign Up With Google", 
  className = "" 
}: ConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleConnect = async () => {
    setLoading(true)

    try {
      // Get the app URL from environment variable or use window.location.origin
      // But avoid localhost URLs in production
      let appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      
      // If we're on bippity.boo, always use https://bippity.boo
      if (window.location.hostname === 'bippity.boo') {
        appUrl = 'https://bippity.boo'
      }
      
      console.log('ConnectButton - OAuth redirect URL:', appUrl)
      
      // Sign in with Google OAuth using Supabase Auth
      // Request scopes for Gmail, Calendar, and Tasks access
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${appUrl}/auth/callback`,
          scopes: [
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/tasks',
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        throw error
      }

      // Supabase will handle the redirect automatically
      // The user will be redirected to Google, then back to /auth/callback
      
    } catch (error: any) {
      console.error('Supabase Auth Error:', error)
      toast.error(error.message || "Connection failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      className={cn(
        "group relative inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-70",
        className
      )}
      size="lg"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          Connecting...
        </>
      ) : (
        <>
          <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png" alt="Gmail" className="w-5 h-5" />
          <span>{text}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </Button>
  )
}

