'use client'

import Link from 'next/link'
import { useState } from 'react'
import { login } from '@/app/auth/actions'
import { toast } from 'sonner' // Assuming sonner is available based on previous context, or use simple alert/text

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const result = await login(formData)

        if (result?.error) {
            setError(result.error)
            toast.error(result.error)
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md border p-8 rounded-xl shadow-lg bg-white">
                <h1 className="text-2xl font-bold mb-4 text-center text-slate-900">Log In</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input name="email" type="email" placeholder="Email" required className="border p-2 rounded w-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <input type="password" name="password" placeholder="Password" required className="border p-2 rounded w-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <button
                    disabled={loading}
                    className="mt-4 bg-indigo-600 text-white p-3 rounded font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
                <p className="mt-4 text-center text-sm text-slate-600">
                    Don't have an account? <Link href="/signup" className="text-indigo-600 underline font-medium hover:text-indigo-800">Sign up</Link>
                </p>
            </form>
        </div>
    )
}
