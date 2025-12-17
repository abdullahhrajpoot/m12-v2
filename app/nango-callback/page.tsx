"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function NangoCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we're in a popup (opened by ConnectButton)
    if (typeof window !== 'undefined' && window.opener) {
      // Send success message to parent window
      window.opener.postMessage({ 
        type: 'NANGO_OAUTH_SUCCESS',
        connectionId: searchParams.get('connection_id') || searchParams.get('connectionId')
      }, window.location.origin)
      
      // Close the popup
      setTimeout(() => {
        window.close()
      }, 500)
    } else if (typeof window !== 'undefined') {
      // If not in a popup, redirect to onboarding
      router.push('/onboarding')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing connection...</p>
      </div>
    </div>
  )
}

export default function NangoCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <NangoCallbackContent />
    </Suspense>
  )
}

