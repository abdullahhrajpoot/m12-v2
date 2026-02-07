
"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function DebugContent() {
    const searchParams = useSearchParams()
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
        params[key] = value
    })

    return (
        <div className="p-8 bg-white min-h-screen font-mono text-sm overflow-auto">
            <h1 className="text-xl font-bold mb-4">Callback Debugger</h1>
            <pre className="bg-slate-100 p-4 rounded mb-4">
                {JSON.stringify(params, null, 2)}
            </pre>
            <div className="mb-4">
                <strong>Session ID:</strong> {params.session_id || 'MISSING'} <br />
                <strong>Account ID:</strong> {params.account_id || 'MISSING'} <br />
                <strong>Status:</strong> {params.status || 'MISSING'}
            </div>
            <p>Please copy the info above and paste it to the chat.</p>
        </div>
    )
}

export default function DebugCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DebugContent />
        </Suspense>
    )
}
