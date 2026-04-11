import { requireAuth } from '@/lib/auth/guards'
import { getBooking, getBookingEvents } from '@/lib/booking/queries'
import { confirmBooking, declineBooking, markSessionComplete, cancelBooking, cancelBookingAsStudent } from '@/lib/booking/actions'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DisputeForm } from './DisputeForm'
import { CelebrationWrapper } from './CelebrationWrapper'

// Server actions that return ActionResult need to be cast to the form action signature.
// Next.js accepts these at runtime; the cast silences the TS type mismatch.
type FormAction = (formData: FormData) => void | Promise<void>
function toFormAction(fn: (...args: unknown[]) => unknown): FormAction {
  return fn as unknown as FormAction
}

interface PageProps {
  params: { id: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment:       'Pending Payment',
  awaiting_confirmation: 'Awaiting Confirmation',
  confirmed:             'Confirmed',
  completed:             'Completed',
  paid:                  'Paid',
  declined:              'Declined',
  cancelled:             'Cancelled',
  refunded:              'Refunded',
  disputed:              'Disputed',
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment:       'bg-yellow-100 text-yellow-800',
  awaiting_confirmation: 'bg-blue-100 text-blue-800',
  confirmed:             'bg-green-100 text-green-800',
  completed:             'bg-green-100 text-green-800',
  paid:                  'bg-gray-100 text-gray-800',
  declined:              'bg-red-100 text-red-800',
  cancelled:             'bg-red-100 text-red-800',
  refunded:              'bg-gray-100 text-gray-800',
  disputed:              'bg-orange-100 text-orange-800',
}

export default async function BookingDetailPage({ params }: PageProps) {
  const user = await requireAuth()
  const [booking, events] = await Promise.all([
    getBooking(params.id),
    getBookingEvents(params.id),
  ])

  if (!booking) notFound()

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const isTutor = role === 'tutor' && booking.tutor_id === user.id
  const isStudent = role === 'student' && booking.student_id === user.id

  if (!isTutor && !isStudent) notFound()

  const tutorProfile = booking.tutor_profiles as any
  const tutorName = tutorProfile?.profiles?.full_name ?? 'Unknown'
  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-QA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <CelebrationWrapper />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/bookings" className="text-blue-600 hover:underline">My Bookings</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500">Booking Detail</span>
      </div>

      {/* Main card */}
      <div className="border rounded-xl p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{tutorName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{scheduledDate}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Duration</p>
            <p className="font-medium mt-0.5">{booking.duration_minutes} minutes</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Mode</p>
            <p className="font-medium mt-0.5">{booking.session_mode === 'in_person' ? 'In-person' : 'Online'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Total</p>
            <p className="font-medium mt-0.5">{booking.total_amount_qar} QAR</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Rate</p>
            <p className="font-medium mt-0.5">{booking.hourly_rate_qar} QAR/hr</p>
          </div>
        </div>

        {/* Tutor contact — only after confirmed */}
        {booking.status === 'confirmed' && (booking.tutor_phone || booking.tutor_whatsapp) && (
          <div className="border border-green-200 rounded-xl p-4 bg-green-50">
            <p className="text-sm font-semibold text-green-800 mb-2">Tutor Contact Info</p>
            {booking.tutor_phone && (
              <p className="text-sm text-green-700">
                📞 Phone:{' '}
                <a href={`tel:${booking.tutor_phone}`} className="font-medium hover:underline">
                  {booking.tutor_phone}
                </a>
              </p>
            )}
            {booking.tutor_whatsapp && (
              <p className="text-sm text-green-700 mt-1">
                💬 WhatsApp:{' '}
                <a
                  href={`https://wa.me/${booking.tutor_whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {booking.tutor_whatsapp}
                </a>
              </p>
            )}
          </div>
        )}

        {/* ── Student actions ── */}

        {/* PAY NOW — pending_payment */}
        {isStudent && booking.status === 'pending_payment' && (
          <Link
            href={`/bookings/${booking.id}/pay`}
            className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Pay Now — {booking.total_amount_qar} QAR
          </Link>
        )}

        {/* Mark complete — confirmed */}
        {isStudent && booking.status === 'confirmed' && (
          <form action={toFormAction(markSessionComplete.bind(null, booking.id))}>
            <button type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Mark Session Complete
            </button>
          </form>
        )}

        {/* Leave review — completed or paid */}
        {isStudent && ['completed', 'paid'].includes(booking.status) && (
          <Link
            href={`/bookings/${booking.id}/review`}
            className="block w-full text-center border border-amber-400 text-amber-700 py-2.5 rounded-xl font-medium hover:bg-amber-50 transition-colors text-sm"
          >
            Leave a Review ★
          </Link>
        )}

        {/* Chat — confirmed bookings */}
        {['confirmed', 'completed'].includes(booking.status) && (
          <Link
            href={`/messages/${booking.id}`}
            className="block w-full text-center border py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Open Chat
          </Link>
        )}

        {/* ── Tutor actions ── */}

        {/* Confirm / Decline — awaiting_confirmation */}
        {isTutor && booking.status === 'awaiting_confirmation' && (
          <div className="flex gap-3 pt-1">
            <form action={toFormAction(confirmBooking.bind(null, booking.id))} className="flex-1">
              <button type="submit"
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors">
                Confirm
              </button>
            </form>
            <form action={toFormAction(declineBooking.bind(null, booking.id))} className="flex-1">
              <button type="submit"
                className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors">
                Decline
              </button>
            </form>
          </div>
        )}

        {/* Tutor cancel — awaiting or confirmed */}
        {isTutor && ['awaiting_confirmation', 'confirmed'].includes(booking.status) && (
          <form action={toFormAction(cancelBooking.bind(null, booking.id))}>
            <button type="submit"
              className="w-full border border-red-300 text-red-600 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              Cancel This Booking
            </button>
          </form>
        )}

        {/* Student cancel — pending_payment or awaiting_confirmation only */}
        {isStudent && ['pending_payment', 'awaiting_confirmation'].includes(booking.status) && (
          <form action={toFormAction(cancelBookingAsStudent.bind(null, booking.id))}>
            <button type="submit"
              className="w-full border border-red-300 text-red-600 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              Cancel This Booking
            </button>
          </form>
        )}

        {/* ── Dispute — student on confirmed or completed ── */}
        {isStudent && ['confirmed', 'completed'].includes(booking.status) && (
          <DisputeForm bookingId={booking.id} />
        )}

        {/* Already disputed */}
        {booking.status === 'disputed' && (
          <div className="border border-orange-200 rounded-xl p-4 bg-orange-50 text-sm text-orange-800">
            <p className="font-semibold mb-1">Dispute in progress</p>
            <p className="text-xs">{(booking as any).dispute_reason}</p>
            <p className="text-xs text-orange-600 mt-1">Our team will review this within 24 hours.</p>
          </div>
        )}
      </div>

      {/* Event history */}
      {events.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
          <div className="space-y-2">
            {events.map((event: any) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <div>
                  <span className="text-gray-400 mr-2">
                    {new Date(event.created_at).toLocaleDateString('en-QA', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="font-medium">
                    {event.from_status
                      ? `${STATUS_LABELS[event.from_status]} → ${STATUS_LABELS[event.to_status]}`
                      : STATUS_LABELS[event.to_status]}
                  </span>
                  {event.reason && (
                    <span className="text-gray-400 ml-1 text-xs">({event.reason})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
