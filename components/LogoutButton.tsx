'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LogoutButton({ className }: { className?: string }) {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`text-slate-500 hover:text-slate-900 ${className}`}
        >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
        </Button>
    )
}
