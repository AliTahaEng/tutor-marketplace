import { createClient } from '@/lib/supabase/server'

// Explicit return shapes for join queries — the flat Database type doesn't encode
// FK relationships, so we cast the query results to avoid `never` inference.
export interface BookingDetail {
  id: string
  student_id: string
  tutor_id: string
  status: string
  session_mode: 'in_person' | 'online'
  scheduled_at: string
  duration_minutes: number
  hourly_rate_qar: number
  total_amount_qar: number
  platform_fee_qar: number
  tutor_payout_qar: number
  stripe_payment_intent_id: string | null
  tutor_phone: string | null
  tutor_whatsapp: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  completed_at: string | null
  auto_completed: boolean
  dispute_opened_at: string | null
  dispute_reason: string | null
  dispute_resolved_at: string | null
  dispute_resolved_by: string | null
  created_at: string
  updated_at: string
  tutor_profiles: unknown
}

export interface BookingListItem {
  id: string
  status: string
  scheduled_at: string
  duration_minutes: number
  total_amount_qar: number
  session_mode: 'in_person' | 'online'
  tutor_profiles?: unknown
  profiles?: unknown
}

export interface BookingEvent {
  id: string
  booking_id: string
  from_status: string | null
  to_status: string
  actor_id: string | null
  reason: string | null
  created_at: string
}

export async function getBooking(bookingId: string): Promise<BookingDetail | null> {
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
  return data as unknown as BookingDetail | null
}

export async function getStudentBookings(studentId: string): Promise<BookingListItem[]> {
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
  return (data ?? []) as unknown as BookingListItem[]
}

export async function getTutorBookings(tutorId: string): Promise<BookingListItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, status, scheduled_at, duration_minutes, total_amount_qar, session_mode,
      profiles!student_id (full_name)
    `)
    .eq('tutor_id', tutorId)
    .order('scheduled_at', { ascending: false })
  return (data ?? []) as unknown as BookingListItem[]
}

export async function getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('booking_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  return (data ?? []) as unknown as BookingEvent[]
}
