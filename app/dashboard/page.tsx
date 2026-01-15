'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to home page after successful logout
        router.push('/')
        router.refresh()
      } else {
        console.error('Logout failed')
        alert('Failed to log out. Please try again.')
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('An error occurred during logout.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <p className="text-slate-600">
            Dashboard content will be implemented here. This will display family_facts, calendar events, and tasks from Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}











