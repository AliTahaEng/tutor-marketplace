import { createClient } from '@/lib/supabase/server'

export async function getBooking(bookingId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      tutor_profiles!tutor_id (
        id,
        subjects,
        profiles!inner (full_name, avatar_url)
      )
    `)
    .eq('id', bookingId)
    .single()
  return data
}

export async function getStudentBookings(studentId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, status, scheduled_at, duration_minutes, total_amount_qar, session_mode,
      tutor_profiles!tutor_id (
        profiles!inner (full_name)
      )
    `)
    .eq('student_id', studentId)
    .order('scheduled_at', { ascending: false })
  return data ?? []
}

export async function getTutorBookings(tutorId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, status, scheduled_at, duration_minutes, total_amount_qar, session_mode,
      profiles!student_id (full_name)
    `)
    .eq('tutor_id', tutorId)
    .order('scheduled_at', { ascending: false })
  return data ?? []
}

export async function getBookingEvents(bookingId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('booking_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  return data ?? []
}
