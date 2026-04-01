import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Role = 'student' | 'tutor' | 'admin'

export async function requireAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  return user
}

export async function requireRole(role: Role) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== role) {
    redirect('/dashboard')
  }

  return { user, profile }
}

export async function requireAdmin() {
  return requireRole('admin')
}
