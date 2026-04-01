'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/guards'
import { TutorProfileSchema, AvailabilitySlotSchema } from '@tutor/core'

export type ActionResult = { error: string } | { success: true }

export async function saveTutorProfile(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole('tutor')

  const raw = {
    bio: formData.get('bio'),
    yearsExperience: Number(formData.get('yearsExperience')),
    hourlyRateQar: Number(formData.get('hourlyRateQar')),
    sessionType: formData.get('sessionType'),
    areas: formData.getAll('areas'),
    subjects: (formData.get('subjects') as string)?.split(',').map(s => s.trim()).filter(Boolean),
    languagesTaught: formData.getAll('languagesTaught'),
  }

  const parsed = TutorProfileSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }

  const supabase = createClient()
  const { error } = await supabase.from('tutor_profiles').upsert({
    id: user.id,
    bio: parsed.data.bio,
    years_experience: parsed.data.yearsExperience,
    hourly_rate_qar: parsed.data.hourlyRateQar,
    session_type: parsed.data.sessionType,
    areas: parsed.data.areas,
    subjects: parsed.data.subjects,
    languages_taught: parsed.data.languagesTaught,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function uploadTutorDocument(
  documentType: 'national_id' | 'qualification' | 'certificate',
  formData: FormData
): Promise<ActionResult> {
  const { user } = await requireRole('tutor')

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }
  if (file.size > 10 * 1024 * 1024) return { error: 'File must be under 10MB' }

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) return { error: 'Only JPG, PNG, or PDF files allowed' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${documentType}-${Date.now()}.${ext}`

  const supabase = createClient()
  const { error: uploadError } = await supabase.storage
    .from('tutor-documents')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { error: dbError } = await supabase.from('tutor_documents').insert({
    tutor_id: user.id,
    document_type: documentType,
    storage_path: path,
  })

  if (dbError) return { error: dbError.message }
  return { success: true }
}

export async function setAvailabilitySlots(slots: unknown[]): Promise<ActionResult> {
  const { user } = await requireRole('tutor')

  const parsedSlots = slots.map(s => AvailabilitySlotSchema.safeParse(s))
  const invalid = parsedSlots.find(r => !r.success)
  if (invalid && !invalid.success) {
    return { error: invalid.error.errors[0]?.message ?? 'Invalid slot data' }
  }

  const supabase = createClient()

  await supabase.from('tutor_availability').delete().eq('tutor_id', user.id)

  const validSlots = parsedSlots
    .filter((r): r is { success: true; data: { dayOfWeek: number; startTime: string; endTime: string } } => r.success)
    .map(r => ({
      tutor_id: user.id,
      day_of_week: r.data.dayOfWeek,
      start_time: r.data.startTime,
      end_time: r.data.endTime,
    }))

  if (validSlots.length > 0) {
    const { error } = await supabase.from('tutor_availability').insert(validSlots)
    if (error) return { error: error.message }
  }

  return { success: true }
}
