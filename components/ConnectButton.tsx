"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    // Listen for messages from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'NANGO_OAUTH_SUCCESS') {
        setLoading(false)
        toast.success("Successfully connected to Google!")
        setTimeout(() => {
          router.push('/onboarding') // Navigate to onboarding after successful connection
        }, 1000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  const handleConnect = async () => {
    setLoading(true)
    const popup = window.open('', 'google-login', 'width=600,height=700')
    
    if (popup) {
      popup.document.title = "Connecting..."
      popup.document.body.innerHTML = '<div style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh;">Loading secure login...</div>'
    }

    try {
      // Call our Next.js API route to create Nango session (server-side)
      const response = await fetch('/api/nango-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'user-' + Date.now() // In production, use Supabase user ID
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (popup) popup.close()
        throw new Error(data.error || 'Failed to create session')
      }

      const connectUrl = data.connectUrl

      if (popup && connectUrl) {
        popup.location.href = connectUrl
      } else {
        window.open(connectUrl, '_blank', 'width=600,height=700')
      }

    } catch (error) {
      console.error('Nango Connection Error:', error)
      if (popup) popup.close()
      toast.error("Connection failed. Check console for details.")
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

