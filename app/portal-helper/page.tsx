'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface PortalCredential {
  id: string
  portal_name: string
  portal_url: string | null
  login_username: string
  login_password: string
  notes: string | null
}

export default function PortalHelperPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<PortalCredential[]>([])
  const [selectedCredential, setSelectedCredential] = useState<PortalCredential | null>(null)
  const [capturedContent, setCapturedContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // New credential form state
  const [newCredential, setNewCredential] = useState({
    portalName: '',
    portalUrl: '',
    loginUsername: '',
    loginPassword: '',
    notes: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/missing-permissions')
      return
    }
    
    setUserId(user.id)
    await fetchCredentials(user.id)
  }

  const fetchCredentials = async (uid: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/portal-credentials?userId=${uid}`)
      const data = await response.json()
      
      if (data.credentials) {
        setCredentials(data.credentials)
        if (data.credentials.length > 0 && !selectedCredential) {
          setSelectedCredential(data.credentials[0])
        }
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveContent = async () => {
    if (!userId || !selectedCredential || !capturedContent.trim()) {
      alert('Please select a portal and enter content')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/captured-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portalCredentialId: selectedCredential.id,
          content: capturedContent
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccessMessage('Content saved successfully!')
        setCapturedContent('')
        
        // Move to next credential if available
        const currentIndex = credentials.findIndex(c => c.id === selectedCredential.id)
        if (currentIndex < credentials.length - 1) {
          setSelectedCredential(credentials[currentIndex + 1])
        }
        
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        alert('Failed to save content')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Error saving content')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCredential = async () => {
    if (!userId || !newCredential.portalName || !newCredential.loginUsername || !newCredential.loginPassword) {
      alert('Please fill in required fields')
      return
    }

    try {
      const response = await fetch('/api/portal-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portalName: newCredential.portalName,
          portalUrl: newCredential.portalUrl,
          loginUsername: newCredential.loginUsername,
          loginPassword: newCredential.loginPassword,
          notes: newCredential.notes
        })
      })

      const data = await response.json()
      
      if (data.credential) {
        await fetchCredentials(userId)
        setShowAddForm(false)
        setNewCredential({
          portalName: '',
          portalUrl: '',
          loginUsername: '',
          loginPassword: '',
          notes: ''
        })
      } else {
        alert('Failed to add credential')
      }
    } catch (error) {
      console.error('Error adding credential:', error)
      alert('Error adding credential')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage(`${label} copied to clipboard!`)
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Portal Helper</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add Portal'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Add Credential Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Add New Portal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Portal Name *
                </label>
                <input
                  type="text"
                  value={newCredential.portalName}
                  onChange={(e) => setNewCredential({ ...newCredential, portalName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ParentSquare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Portal URL
                </label>
                <input
                  type="url"
                  value={newCredential.portalUrl}
                  onChange={(e) => setNewCredential({ ...newCredential, portalUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Login Username *
                </label>
                <input
                  type="text"
                  value={newCredential.loginUsername}
                  onChange={(e) => setNewCredential({ ...newCredential, loginUsername: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Login Password *
                </label>
                <input
                  type="text"
                  value={newCredential.loginPassword}
                  onChange={(e) => setNewCredential({ ...newCredential, loginPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newCredential.notes}
                  onChange={(e) => setNewCredential({ ...newCredential, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddCredential}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Portal
              </button>
            </div>
          </div>
        )}

        {credentials.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-600 mb-4">No portal credentials found.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Portal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Portal List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 sticky top-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Portals ({credentials.length})</h2>
                <div className="space-y-2">
                  {credentials.map((credential) => (
                    <button
                      key={credential.id}
                      onClick={() => setSelectedCredential(credential)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedCredential?.id === credential.id
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                          : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="font-medium">{credential.portal_name}</div>
                      {credential.portal_url && (
                        <div className="text-xs text-slate-500 truncate mt-1">
                          {credential.portal_url}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Area - Credentials & Content Capture */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCredential && (
                <>
                  {/* Credentials Display */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                      {selectedCredential.portal_name}
                    </h2>
                    
                    {selectedCredential.portal_url && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Portal URL</label>
                        <div className="flex gap-2">
                          <a
                            href={selectedCredential.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-blue-600 hover:text-blue-800 truncate"
                          >
                            {selectedCredential.portal_url}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Login Username</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedCredential.login_username}
                            readOnly
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                          />
                          <button
                            onClick={() => copyToClipboard(selectedCredential.login_username, 'Username')}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Login Password</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={selectedCredential.login_password}
                            readOnly
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                          />
                          <button
                            onClick={() => copyToClipboard(selectedCredential.login_password, 'Password')}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    {selectedCredential.notes && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <p className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-sm">
                          {selectedCredential.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Content Capture Area */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Capture Content</h2>
                    <p className="text-slate-600 text-sm mb-4">
                      Paste content you've copied from the portal here. It will be saved and sent to your agent for processing.
                    </p>
                    
                    <textarea
                      value={capturedContent}
                      onChange={(e) => setCapturedContent(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[300px] font-mono text-sm"
                      placeholder="Paste content from the portal here..."
                    />

                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-slate-500">
                        {capturedContent.length} characters
                      </span>
                      <button
                        onClick={handleSaveContent}
                        disabled={isSaving || !capturedContent.trim()}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {isSaving ? 'Saving...' : 'Save & Process'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
