import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MessagesPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isStudent = profile?.role === 'student'

  // Fetch bookings that are in chat-eligible states
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, scheduled_at,
      tutor:tutor_id (full_name),
      student:student_id (full_name)
    `)
    .in('status', ['confirmed', 'completed', 'paid', 'disputed'])
    .eq(isStudent ? 'student_id' : 'tutor_id', user.id)
    .order('updated_at', { ascending: false })

  if (!bookings || bookings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No conversations yet</p>
          <p className="text-sm">
            Chat becomes available once a booking is confirmed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="divide-y border rounded-xl overflow-hidden">
        {bookings.map((b: any) => {
          const other = isStudent ? b.tutor?.full_name : b.student?.full_name
          const date = new Date(b.scheduled_at).toLocaleDateString('en-QA', {
            month: 'short', day: 'numeric',
          })
          return (
            <Link
              key={b.id}
              href={`/messages/${b.id}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                {(other ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{other ?? 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">Session on {date}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                b.status === 'confirmed'  ? 'bg-green-100 text-green-800' :
                b.status === 'disputed'   ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {b.status}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
