import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function TutorApprovalsPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: tutors } = await supabase
    .from('tutor_profiles')
    .select(`
      id, verification_status, subjects, years_experience, hourly_rate_qar, created_at,
      profiles!inner (full_name)
    `)
    .eq('verification_status', 'pending')
    .order('created_at')

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Pending Tutor Approvals ({tutors?.length ?? 0})</h1>

      {!tutors?.length ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          No pending approvals.
        </div>
      ) : (
        <div className="space-y-3">
          {tutors.map(t => (
            <div key={t.id} className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{(t.profiles as any)?.full_name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t.subjects?.join(', ')} · {t.years_experience} yrs · {t.hourly_rate_qar} QAR/hr
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Applied {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
              <Link
                href={`/tutors/${t.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
