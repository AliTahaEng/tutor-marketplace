import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

serve(async () => {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  // Find bookings due in ~24 hours
  const { data: upcoming24h } = await supabase
    .from('bookings')
    .select(`
      id, scheduled_at,
      student:profiles!student_id (expo_push_token, full_name),
      tutor:tutor_profiles!tutor_id (profiles!inner (full_name))
    `)
    .eq('status', 'confirmed')
    .gte('scheduled_at', in24h.toISOString())
    .lt('scheduled_at', in25h.toISOString())

  // Find bookings due in ~1 hour
  const { data: upcoming1h } = await supabase
    .from('bookings')
    .select(`
      id, scheduled_at,
      student:profiles!student_id (expo_push_token, full_name),
      tutor:tutor_profiles!tutor_id (profiles!inner (full_name))
    `)
    .eq('status', 'confirmed')
    .gte('scheduled_at', in1h.toISOString())
    .lt('scheduled_at', in2h.toISOString())

  const notifications: object[] = []

  for (const booking of upcoming24h ?? []) {
    const student = (booking.student as any)
    const tutorName = (booking.tutor as any)?.profiles?.full_name ?? 'your tutor'
    if (student?.expo_push_token) {
      notifications.push({
        to: student.expo_push_token,
        title: 'Session reminder — tomorrow',
        body: `Your session with ${tutorName} is tomorrow. Get ready!`,
        data: { bookingId: booking.id, type: 'reminder_24h' },
        sound: 'default',
      })
    }
  }

  for (const booking of upcoming1h ?? []) {
    const student = (booking.student as any)
    const tutorName = (booking.tutor as any)?.profiles?.full_name ?? 'your tutor'
    if (student?.expo_push_token) {
      notifications.push({
        to: student.expo_push_token,
        title: 'Session starts in 1 hour!',
        body: `Your session with ${tutorName} starts in 1 hour. Get ready!`,
        data: { bookingId: booking.id, type: 'reminder_1h' },
        sound: 'default',
      })
    }
  }

  if (notifications.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications),
    })
  }

  return new Response(JSON.stringify({ sent: notifications.length }), { status: 200 })
})
