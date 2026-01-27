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
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/portal-helper"
                className="block p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🔑</div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Portal Helper</h3>
                    <p className="text-sm text-blue-700">Manually capture content from family portals</p>
                  </div>
                </div>
              </a>
              
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl opacity-50">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📊</div>
                  <div>
                    <h3 className="font-semibold text-slate-700">Family Dashboard</h3>
                    <p className="text-sm text-slate-600">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-slate-600">
              Dashboard content will be implemented here. This will display family_facts, calendar events, and tasks from Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}











