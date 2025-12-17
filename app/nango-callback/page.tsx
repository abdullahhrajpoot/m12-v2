"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function NangoCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log('Nango callback page loaded')
    console.log('Search params:', Object.fromEntries(searchParams.entries()))
    const connectionId = searchParams.get('connection_id') || searchParams.get('connectionId')
    console.log('Connection ID:', connectionId)
    
    // Redirect to whatwefound page after successful OAuth
    // Small delay to ensure connection is processed
    const timer = setTimeout(() => {
      router.push('/whatwefound')
    }, 1000)

    return () => clearTimeout(timer)
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

