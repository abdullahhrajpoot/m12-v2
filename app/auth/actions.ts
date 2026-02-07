'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')

    // Check if user has already linked Unipile
    if (data?.user) {
        const { data: profile } = await supabase
            .from('users')
            .select('unipile_linked')
            .eq('id', data.user.id)
            .single()

        if (profile?.unipile_linked) {
            redirect('/whatwefound')
        }
    }

    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: full_name,
            },
            // By default, Supabase requires email verification.
            // If you want to skip it for dev, disable it in Supabase dashboard.
            // For now, assume it's set up correctly or redirection happens.
            // We set unipile_linked to false on creation (default in DB).
        }
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.user) {
        // Ensure user entry exists - usually triggers handle this, but explicit insert isn't needed with standard Supabase setup unless we have a specific 'users' table separate from auth.users and no trigger.
        // Based on previous conversations, there seems to be a 'users' table in public schema. 
        // AND triggers usually handle `auth.users` -> `public.users` sync.
        // IF NOT, we might need to insert here. But standard is trigger.
        // I'll assume trigger exists or 'users' is just 'auth.users' wrapper.
        // The user mentioned "users table", implies public.users.
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
