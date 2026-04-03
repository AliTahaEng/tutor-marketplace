import { requireAuth } from '@/lib/auth/guards'
import { getStudentBookings, getTutorBookings } from '@/lib/booking/queries'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  awaiting_confirmation: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  paid: 'Paid',
  declined: 'Declined',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  disputed: 'Disputed',
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  awaiting_confirmation: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-gray-100 text-gray-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  disputed: 'bg-orange-100 text-orange-800',
}

export default async function BookingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const bookings = profile?.role === 'tutor'
    ? await getTutorBookings(user.id)
    : await getStudentBookings(user.id)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No bookings yet.</p>
          {profile?.role === 'student' && (
            <Link href="/search" className="mt-4 inline-block text-blue-600 hover:underline">
              Find a tutor
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any) => {
            const tutorName = booking.tutor_profiles?.profiles?.full_name
              ?? booking.profiles?.full_name
              ?? 'Unknown'
            const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-QA', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            return (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block border rounded-xl p-4 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tutorName}</p>
                    <p className="text-sm text-muted-foreground">{scheduledDate}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.duration_minutes} min · {booking.session_mode === 'in_person' ? 'In-person' : 'Online'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                    <p className="mt-1 text-sm font-semibold">{booking.total_amount_qar} QAR</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
