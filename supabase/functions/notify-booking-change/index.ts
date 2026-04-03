import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface BookingRecord {
  id: string
  student_id: string
  tutor_id: string
  status: string
  scheduled_at: string
}

serve(async (req) => {
  const { record, old_record } = await req.json() as {
    record: BookingRecord
    old_record: BookingRecord
  }

  // Only act on status changes
  if (record.status === old_record.status) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, expo_push_token')
    .in('id', [record.student_id, record.tutor_id])

  const student = profiles?.find(p => p.id === record.student_id)
  const tutor = profiles?.find(p => p.id === record.tutor_id)

  const notifications: { token: string; title: string; body: string; data?: object }[] = []

  switch (record.status) {
    case 'awaiting_confirmation':
      if (tutor?.expo_push_token) {
        notifications.push({
          token: tutor.expo_push_token,
          title: 'New booking request!',
          body: `${student?.full_name ?? 'A student'} wants to book a session with you.`,
          data: { bookingId: record.id, type: 'new_booking' },
        })
      }
      break

    case 'confirmed':
      if (student?.expo_push_token) {
        notifications.push({
          token: student.expo_push_token,
          title: 'Booking confirmed!',
          body: `Your session with ${tutor?.full_name ?? 'your tutor'} is confirmed.`,
          data: { bookingId: record.id, type: 'booking_confirmed' },
        })
      }
      break

    case 'declined':
      if (student?.expo_push_token) {
        notifications.push({
          token: student.expo_push_token,
          title: 'Booking declined',
          body: `${tutor?.full_name ?? 'The tutor'} could not accept your booking. You have been fully refunded.`,
          data: { bookingId: record.id, type: 'booking_declined' },
        })
      }
      break

    case 'completed':
      if (student?.expo_push_token) {
        notifications.push({
          token: student.expo_push_token,
          title: 'How was your session?',
          body: `Please leave a review for ${tutor?.full_name ?? 'your tutor'}.`,
          data: { bookingId: record.id, type: 'session_completed' },
        })
      }
      break

    case 'cancelled':
      if (record.student_id !== old_record.student_id) break // sanity check
      if (tutor?.expo_push_token) {
        notifications.push({
          token: tutor.expo_push_token,
          title: 'Booking cancelled',
          body: `A booking with ${student?.full_name ?? 'a student'} has been cancelled.`,
          data: { bookingId: record.id, type: 'booking_cancelled' },
        })
      }
      break
  }

  if (notifications.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications.length === 1 ? notifications[0] : notifications),
    })
  }

  return new Response(JSON.stringify({ sent: notifications.length }), { status: 200 })
})
