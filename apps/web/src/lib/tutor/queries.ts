import { createClient } from '@/lib/supabase/server'

export async function getTutorProfile(tutorId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('tutor_profiles')
    .select(`
      id,
      bio,
      years_experience,
      hourly_rate_qar,
      session_type,
      areas,
      subjects,
      languages_taught,
      verification_status,
      is_featured,
      profiles!inner (
        full_name,
        avatar_url
      )
    `)
    .eq('id', tutorId)
    .single()

  return data
}

export async function getTutorAvailability(tutorId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('day_of_week')
    .order('start_time')

  return data ?? []
}
