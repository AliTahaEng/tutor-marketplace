import { requireAuth } from '@/lib/auth/guards'
import { getStudentBookings, getTutorBookings } from '@/lib/booking/queries'
import { createClient } from '@/lib/supabase/server'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  awaiting_confirmation: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  paid: 'Paid',
  declined: 'Declined',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  disputed: 'Disputed',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_payment:       { bg: '#fef9c3', text: '#a16207' },
  awaiting_confirmation: { bg: '#dbeafe', text: '#1d4ed8' },
  confirmed:             { bg: '#dcfce7', text: '#16a34a' },
  completed:             { bg: '#f0fdf4', text: '#15803d' },
  paid:                  { bg: '#f3f4f6', text: '#374151' },
  declined:              { bg: '#fee2e2', text: '#dc2626' },
  cancelled:             { bg: '#fee2e2', text: '#dc2626' },
  refunded:              { bg: '#f3f4f6', text: '#374151' },
  disputed:              { bg: '#fff7ed', text: '#c2410c' },
}

export default async function BookingsPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const bookings = profile?.role === 'tutor'
    ? await getTutorBookings(user.id)
    : await getStudentBookings(user.id)

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt), var(--color-primary-light))',
        borderBottom: '1px solid var(--color-border)',
        padding: '40px 32px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
            My Bookings
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: 0 }}>
            {bookings.length} session{bookings.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        {bookings.length === 0 ? (
          <AnimatedSection style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>📅</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              No bookings yet
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
              {profile?.role === 'student'
                ? 'Find a tutor and book your first session!'
                : 'Bookings will appear here once students book with you.'}
            </p>
            {profile?.role === 'student' && <GoldButton href="/search" size="lg">Find a Tutor</GoldButton>}
          </AnimatedSection>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((booking: any) => {
              const tutorName = booking.tutor_profiles?.profiles?.full_name
                ?? booking.profiles?.full_name
                ?? 'Unknown'
              const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-QA', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
              const colors = STATUS_COLORS[booking.status] ?? { bg: '#f3f4f6', text: '#374151' }

              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '20px 24px', background: '#fff',
                  border: '1px solid var(--color-border)', borderRadius: '16px',
                  textDecoration: 'none', boxShadow: 'var(--shadow-card)',
                }}>
                  {/* Date indicator */}
                  <div style={{
                    width: '52px', height: '52px',
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-gold-bright)',
                    borderRadius: '12px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                      {new Date(booking.scheduled_at).getDate()}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
                      {new Date(booking.scheduled_at).toLocaleDateString('en', { month: 'short' })}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 4px' }}>
                      {tutorName}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      {scheduledDate} · {booking.duration_minutes}min · {booking.session_mode === 'in_person' ? 'In-person' : 'Online'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      display: 'block', background: colors.bg, color: colors.text,
                      padding: '4px 12px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: 700, marginBottom: '6px',
                    }}>
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {booking.total_amount_qar} QAR
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
