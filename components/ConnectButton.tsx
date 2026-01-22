"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
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

  const handleConnect = () => {
    setLoading(true)
    
    // Redirect to Unipile OAuth flow via our API route
    // Use window.location for external redirects (OAuth flow)
    // This will navigate away from the page, so loading state will reset
    window.location.href = '/api/auth/unipile/connect'
    
    // If redirect doesn't happen, reset loading after a timeout
    setTimeout(() => {
      setLoading(false)
    }, 2000)
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

