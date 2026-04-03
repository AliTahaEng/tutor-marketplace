import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function DisputesPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: disputes } = await supabase
    .from('bookings')
    .select(`
      id, dispute_opened_at, dispute_reason, total_amount_qar, scheduled_at,
      profiles!student_id (full_name),
      tutor_profiles!tutor_id (profiles!inner (full_name))
    `)
    .eq('status', 'disputed')
    .order('dispute_opened_at')

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Open Disputes ({disputes?.length ?? 0})</h1>

      {!disputes?.length ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          No open disputes.
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">
                  {(d.profiles as any)?.full_name ?? 'Student'} vs{' '}
                  {(d.tutor_profiles as any)?.profiles?.full_name ?? 'Tutor'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {d.dispute_reason ?? 'No reason given'} ·{' '}
                  <strong>{d.total_amount_qar} QAR</strong> at stake
                </div>
                {d.dispute_opened_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Opened {new Date(d.dispute_opened_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Link
                href={`/disputes/${d.id}`}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600"
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
