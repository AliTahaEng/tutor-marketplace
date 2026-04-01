import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOut } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.full_name ?? 'User'}</h1>
          <p className="text-gray-500 capitalize">{profile?.role} account</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">Sign Out</button>
        </form>
      </div>

      <div className="grid gap-4">
        <Link href="/search" className="border rounded-xl p-4 hover:bg-gray-50">
          <div className="font-semibold">Find a Tutor</div>
          <div className="text-sm text-gray-500">Search tutors across Qatar</div>
        </Link>

        {profile?.role === 'student' && (
          <Link href="/bookings" className="border rounded-xl p-4 hover:bg-gray-50">
            <div className="font-semibold">My Bookings</div>
            <div className="text-sm text-gray-500">View and manage your sessions</div>
          </Link>
        )}

        {profile?.role === 'tutor' && (
          <>
            <Link href="/tutor/onboarding" className="border rounded-xl p-4 hover:bg-gray-50">
              <div className="font-semibold">My Profile</div>
              <div className="text-sm text-gray-500">Update your tutor profile and availability</div>
            </Link>
            <Link href="/bookings" className="border rounded-xl p-4 hover:bg-gray-50">
              <div className="font-semibold">Booking Requests</div>
              <div className="text-sm text-gray-500">View and respond to booking requests</div>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
