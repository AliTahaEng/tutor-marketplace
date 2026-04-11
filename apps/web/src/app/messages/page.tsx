import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

export default async function MessagesPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStudent = profile?.role === 'student'

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`id, status, scheduled_at, tutor:tutor_id(full_name), student:student_id(full_name)`)
    .in('status', ['confirmed', 'completed', 'paid', 'disputed'])
    .eq(isStudent ? 'student_id' : 'tutor_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt), var(--color-primary-light))',
        borderBottom: '1px solid var(--color-border)',
        padding: '40px 32px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Messages</h1>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        {!bookings || bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>💬</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              No conversations yet
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
              Chat becomes available once a booking is confirmed.
            </p>
            <GoldButton href="/search">Find a Tutor</GoldButton>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {bookings.map((b: any, i: number) => {
              const other = isStudent ? (b.tutor as any)?.full_name : (b.student as any)?.full_name
              const date = new Date(b.scheduled_at).toLocaleDateString('en-QA', { month: 'short', day: 'numeric' })
              const initial = (other ?? 'U')[0].toUpperCase()
              return (
                <Link key={b.id} href={`/messages/${b.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 24px',
                  textDecoration: 'none',
                  borderBottom: i < bookings.length - 1 ? '1px solid var(--color-bg-alt)' : 'none',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '18px',
                  }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {other ?? 'Unknown'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Session on {date}
                    </p>
                  </div>
                  <span style={{
                    background: b.status === 'confirmed' ? '#dcfce7' : b.status === 'disputed' ? '#fff7ed' : 'var(--color-bg-alt)',
                    color: b.status === 'confirmed' ? '#16a34a' : b.status === 'disputed' ? '#c2410c' : 'var(--color-text-muted)',
                    padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
                  }}>
                    {b.status}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
