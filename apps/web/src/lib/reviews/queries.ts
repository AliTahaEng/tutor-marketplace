import { createClient } from '@/lib/supabase/server'

export interface TutorReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  studentName: string
}

export async function getTutorReviews(tutorId: string, limit = 10): Promise<TutorReview[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      profiles!student_id (full_name)
    `)
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    studentName: r.profiles?.full_name ?? 'Student',
  }))
}
