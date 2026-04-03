import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  awaiting_confirmation: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-gray-100 text-gray-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  disputed: 'bg-orange-100 text-orange-800',
}

export default async function AdminBookingsPage({ searchParams }: {
  searchParams: { status?: string; page?: string }
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const page = Number(searchParams.page ?? 1)
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('bookings')
    .select(`
      id, status, scheduled_at, total_amount_qar, session_mode, created_at,
      profiles!student_id (full_name),
      tutor_profiles!tutor_id (profiles!inner (full_name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: bookings, count } = await query

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Bookings</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending_payment', 'awaiting_confirmation', 'confirmed', 'completed', 'paid', 'disputed', 'cancelled'].map(s => (
          <a
            key={s}
            href={s ? `?status=${s}` : '?'}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              (searchParams.status ?? '') === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {s || 'All'}
          </a>
        ))}
      </div>

      <div className="text-sm text-muted-foreground mb-3">{count ?? 0} bookings</div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Student</th>
              <th className="text-left px-4 py-3 font-medium">Tutor</th>
              <th className="text-left px-4 py-3 font-medium">Scheduled</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map(b => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">{(b.profiles as any)?.full_name ?? '—'}</td>
                <td className="px-4 py-3">{(b.tutor_profiles as any)?.profiles?.full_name ?? '—'}</td>
                <td className="px-4 py-3">{new Date(b.scheduled_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{b.total_amount_qar} QAR</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-4">
        {page > 1 && (
          <a href={`?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
            className="px-3 py-1 border rounded text-sm hover:bg-slate-50">
            Previous
          </a>
        )}
        {(count ?? 0) > offset + pageSize && (
          <a href={`?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ''}`}
            className="px-3 py-1 border rounded text-sm hover:bg-slate-50">
            Next
          </a>
        )}
      </div>
    </div>
  )
}
