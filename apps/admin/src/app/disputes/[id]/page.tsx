import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { resolveDispute } from '@/lib/disputes/actions'
import { notFound } from 'next/navigation'

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createAdminClient()

  const [bookingResult, messagesResult, eventsResult] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        *,
        profiles!student_id (full_name),
        tutor_profiles!tutor_id (profiles!inner (full_name))
      `)
      .eq('id', params.id)
      .single(),
    supabase
      .from('messages')
      .select(`id, content, created_at, profiles!sender_id (full_name)`)
      .eq('booking_id', params.id)
      .order('created_at'),
    supabase
      .from('booking_events')
      .select('*')
      .eq('booking_id', params.id)
      .order('created_at'),
  ])

  if (!bookingResult.data) notFound()
  const booking = bookingResult.data

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">Dispute — Booking {params.id.slice(0, 8)}...</h1>

      <div className="border rounded-xl p-4 space-y-2 text-sm">
        <div><strong>Student:</strong> {(booking.profiles as any)?.full_name ?? 'Unknown'}</div>
        <div><strong>Tutor:</strong> {(booking.tutor_profiles as any)?.profiles?.full_name ?? 'Unknown'}</div>
        <div><strong>Scheduled:</strong> {new Date(booking.scheduled_at).toLocaleString()}</div>
        <div><strong>Amount:</strong> {booking.total_amount_qar} QAR</div>
        <div><strong>Dispute reason:</strong> {booking.dispute_reason ?? 'Not specified'}</div>
        <div><strong>Status:</strong> {booking.status}</div>
      </div>

      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-3">In-App Chat History (Evidence)</div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(messagesResult.data ?? []).map(m => (
            <div key={m.id} className="text-sm border-b pb-2 last:border-0">
              <span className="font-medium">{(m.profiles as any)?.full_name ?? 'User'}:</span>{' '}
              <span className="text-muted-foreground">{m.content}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {!messagesResult.data?.length && (
            <p className="text-muted-foreground text-sm">No messages in this booking.</p>
          )}
        </div>
      </div>

      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-3">Booking History</div>
        <div className="space-y-2">
          {(eventsResult.data ?? []).map(e => (
            <div key={e.id} className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-muted-foreground text-xs">
                {new Date(e.created_at).toLocaleString()}
              </span>
              <span>
                {e.from_status ? `${e.from_status} → ${e.to_status}` : e.to_status}
              </span>
              {e.reason && <span className="text-muted-foreground text-xs">({e.reason})</span>}
            </div>
          ))}
        </div>
      </div>

      {booking.status === 'disputed' && (
        <div className="border rounded-xl p-4">
          <div className="font-semibold mb-3">Resolve Dispute</div>
          <form
            action={async (formData: FormData) => {
              'use server'
              const resolution = formData.get('resolution') as 'favor_student' | 'favor_tutor'
              const note = formData.get('note') as string
              await resolveDispute(params.id, resolution, note)
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <label className="border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="resolution" value="favor_student" className="mr-2" required />
                <span className="font-medium text-sm">Refund Student</span>
                <p className="text-xs text-muted-foreground mt-1">Tutor no-show or misconduct</p>
              </label>
              <label className="border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <input type="radio" name="resolution" value="favor_tutor" className="mr-2" />
                <span className="font-medium text-sm">Pay Tutor</span>
                <p className="text-xs text-muted-foreground mt-1">Session completed, student disputing</p>
              </label>
            </div>
            <textarea
              name="note"
              rows={3}
              placeholder="Admin note (required — will be logged)"
              className="w-full border rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Resolve Dispute
            </button>
          </form>
        </div>
      )}

      {booking.status !== 'disputed' && booking.dispute_resolved_at && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-medium text-sm">
            Dispute resolved on {new Date(booking.dispute_resolved_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
