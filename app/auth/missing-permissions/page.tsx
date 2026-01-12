"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Mail, Calendar, CheckSquare, ArrowRight, Info } from 'lucide-react'
import ConnectButton from "@/components/ConnectButton"

const Header = () => (
  <header className="relative z-50 bg-transparent">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="bippity.boo" 
            className="w-auto h-[100px] object-contain"
          />
          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">bippity.boo</span>
        </div>
      </div>
    </div>
  </header>
)

interface Permission {
  scope: string
  name: string
  description: string
  icon: React.ReactNode
  why: string
}

const PERMISSIONS: Permission[] = [
  {
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    name: 'Gmail (Read)',
    description: 'Read your emails',
    icon: <Mail className="w-5 h-5" />,
    why: 'We need to read your emails to find information about your family, schools, and activities.'
  },
  {
    scope: 'https://www.googleapis.com/auth/gmail.labels',
    name: 'Gmail (Labels)',
    description: 'Organize your emails',
    icon: <CheckSquare className="w-5 h-5" />,
    why: 'We organize emails to help you find important messages quickly.'
  },
  {
    scope: 'https://www.googleapis.com/auth/calendar',
    name: 'Google Calendar',
    description: 'Access your calendar',
    icon: <Calendar className="w-5 h-5" />,
    why: 'We check your calendar to identify events, schedules, and important dates.'
  },
  {
    scope: 'https://www.googleapis.com/auth/tasks',
    name: 'Google Tasks',
    description: 'Access your tasks',
    icon: <CheckSquare className="w-5 h-5" />,
    why: 'We help you manage action items and tasks from your emails.'
  }
]

function MissingPermissionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [missingScopes, setMissingScopes] = useState<string[]>([])

  useEffect(() => {
    const missingParam = searchParams.get('missing')
    if (missingParam) {
      const scopes = decodeURIComponent(missingParam).split(',').filter(Boolean)
      setMissingScopes(scopes)
    }
  }, [searchParams])

  // Determine which permissions are missing
  const missingPermissions = PERMISSIONS.filter(perm => 
    missingScopes.some(scope => scope.includes(perm.scope.split('/').pop() || '') || scope === perm.scope)
  )

  // If no missing scopes detected, show all permissions as potentially missing
  const permissionsToShow = missingPermissions.length > 0 ? missingPermissions : PERMISSIONS

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            We Need a Few More Permissions
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            To help you manage your family's schedule, we need access to a few Google services. 
            Don't worry — we only read what's necessary and never share your data.
          </p>
        </motion.div>

        {/* Visual Guide Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-indigo-600" />
            How to Grant Permissions
          </h2>
          
          <div className="mb-6">
            <p className="text-slate-600 mb-4">
              When you sign in with Google, you'll see a screen asking for permission. 
              Please make sure to check <strong>all</strong> the boxes shown below:
            </p>
            
            {/* Visual Guide Image/GIF */}
            <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 mb-4">
              <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                {/* Placeholder for animated GIF or image */}
                <div className="text-center">
                  <img 
                    src="/auth-guide/oauth-consent-screen.gif" 
                    alt="Google OAuth consent screen with checkboxes highlighted"
                    className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                    onError={(e) => {
                      // Fallback if GIF doesn't exist yet
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="text-center p-8">
                            <div class="text-4xl mb-4">📋</div>
                            <p class="text-slate-600 mb-2"><strong>Visual guide coming soon!</strong></p>
                            <p class="text-sm text-slate-500">Make sure to check all permission boxes when signing in with Google.</p>
                          </div>
                        `
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500 text-center">
                <strong>Tip:</strong> Look for checkboxes next to Gmail, Calendar, and Tasks permissions. 
                Make sure they're all checked before clicking "Allow".
              </p>
            </div>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Click "Try Again" below</p>
                <p className="text-sm text-slate-600">This will open the Google sign-in screen again.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900">Review the permission checkboxes</p>
                <p className="text-sm text-slate-600">You'll see several checkboxes for different Google services.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">Check ALL the boxes</p>
                <p className="text-sm text-slate-600">Make sure every permission checkbox is checked before clicking "Allow".</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                4
              </div>
              <div>
                <p className="font-semibold text-slate-900">Click "Allow"</p>
                <p className="text-sm text-slate-600">Once all boxes are checked, click "Allow" to continue.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Required Permissions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Why We Need These Permissions
          </h2>
          
          <div className="space-y-4">
            {permissionsToShow.map((permission, index) => {
              const isMissing = missingScopes.some(scope => 
                scope.includes(permission.scope.split('/').pop() || '') || scope === permission.scope
              )
              
              return (
                <motion.div
                  key={permission.scope}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`p-6 rounded-xl border-2 ${
                    isMissing 
                      ? 'border-amber-200 bg-amber-50' 
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isMissing ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {permission.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{permission.name}</h3>
                        {isMissing ? (
                          <span className="px-2 py-1 text-xs font-semibold bg-amber-200 text-amber-800 rounded">
                            Missing
                          </span>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{permission.description}</p>
                      <p className="text-sm text-slate-500">{permission.why}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-indigo-50 rounded-xl p-6 border border-indigo-200 mb-8"
        >
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">Your Privacy Matters</h3>
              <p className="text-sm text-indigo-800">
                We only access the data we need to help you manage your family's schedule. 
                We never share your information with third parties, and you can revoke access at any time 
                through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Account settings</a>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Try Again Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <ConnectButton 
            text="Try Again - Sign In With Google" 
            className="mx-auto"
          />
          <p className="text-sm text-slate-500 mt-4">
            This will open the Google sign-in screen again. Please make sure to check all permission boxes.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function MissingPermissionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Loading...</h1>
          <p className="text-lg text-slate-600">Checking permissions...</p>
        </div>
      </div>
    }>
      <MissingPermissionsContent />
    </Suspense>
  )
}
