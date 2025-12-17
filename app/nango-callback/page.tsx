"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function NangoCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log('Nango callback page loaded')
    console.log('Search params:', Object.fromEntries(searchParams.entries()))
    console.log('Has opener:', typeof window !== 'undefined' && !!window.opener)
    console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'N/A')
    
    // Check if we're in a popup (opened by ConnectButton)
    if (typeof window !== 'undefined' && window.opener) {
      const connectionId = searchParams.get('connection_id') || searchParams.get('connectionId')
      console.log('Sending message to parent, connectionId:', connectionId)
      
      // Send success message to parent window
      window.opener.postMessage({ 
        type: 'NANGO_OAUTH_SUCCESS',
        connectionId: connectionId
      }, window.location.origin)
      
      // Close the popup
      setTimeout(() => {
        console.log('Closing popup')
        window.close()
      }, 500)
    } else if (typeof window !== 'undefined') {
      // If not in a popup, redirect to onboarding
      console.log('Not in popup, redirecting to onboarding')
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

