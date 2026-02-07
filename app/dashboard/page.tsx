import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = cookies()

  // Create Supabase client for Server Component (Read-only cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // 1. Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    redirect('/login')
  }

  // 2. Check unipile_linked status using Service Role (to bypass RLS)
  let userData = null

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    )

    const { data } = await adminClient
      .from('users')
      .select('unipile_linked')
      .eq('id', user.id)
      .maybeSingle()

    userData = data
  } else {
    const { data } = await supabase
      .from('users')
      .select('unipile_linked')
      .eq('id', user.id)
      .maybeSingle()
    userData = data
  }

  // 3. If linked, redirect to /whatwefound
  if (userData?.unipile_linked) {
    redirect('/whatwefound')
  }

  // 4. If not linked, show the Link Account UI
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <LogoutButton className="absolute top-4 right-4" />
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Connect Your Account</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Almost there! Connect your Google account to let us find what matters to you.
        </p>

        <a
          href="/api/auth/unipile/connect"
          className="inline-flex items-center justify-center w-full px-6 py-4 bg-indigo-600 text-white font-semibold text-lg rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png"
            alt="Google"
            className="w-5 h-5 mr-3 bg-white rounded-full"
          />
          Link Account
        </a>
        <p className="mt-6 text-xs text-slate-400">
          We only access relevant emails and calendar events.
        </p>
      </div>
    </div>
  )
}
