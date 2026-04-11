import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { SessionCountdown } from '@/components/ui/SessionCountdown'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isTutor = profile?.role === 'tutor'

  const [{ data: nextSession }, { data: recentBookings }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, scheduled_at')
      .eq(isTutor ? 'tutor_id' : 'student_id', user.id)
      .eq('status', 'confirmed')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1),
    supabase
      .from('bookings')
      .select('id, status, scheduled_at, total_amount_qar')
      .eq(isTutor ? 'tutor_id' : 'student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const quickLinks = isTutor
    ? [
        { label: 'My Profile', icon: '👤', href: '/tutor/onboarding', desc: 'Update profile and availability' },
        { label: 'Booking Requests', icon: '📅', href: '/bookings', desc: 'Manage your sessions' },
        { label: 'Messages', icon: '💬', href: '/messages', desc: 'Chat with students' },
        { label: 'Payout Setup', icon: '💳', href: '/tutor/payout-setup', desc: 'Manage your earnings' },
      ]
    : [
        { label: 'Find a Tutor', icon: '🔍', href: '/search', desc: 'Browse 500+ verified tutors' },
        { label: 'My Bookings', icon: '📅', href: '/bookings', desc: 'View and manage sessions' },
        { label: 'Messages', icon: '💬', href: '/messages', desc: 'Chat with your tutors' },
      ]

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    confirmed:             { bg: '#dcfce7', text: '#16a34a' },
    pending_payment:       { bg: '#fef9c3', text: '#a16207' },
    awaiting_confirmation: { bg: '#dbeafe', text: '#1d4ed8' },
    completed:             { bg: '#f0fdf4', text: '#15803d' },
    cancelled:             { bg: '#fee2e2', text: '#dc2626' },
  }

  const upcomingSession = nextSession?.[0] ?? null

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Dark hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        padding: '48px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          background: 'repeating-conic-gradient(rgba(217,119,6,1) 0deg, transparent 1deg, transparent 29deg, rgba(217,119,6,1) 30deg) 0/50px 50px',
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-QA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                {greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', margin: 0, textTransform: 'capitalize' }}>
                {profile?.role} account
              </p>
            </div>

            {upcomingSession && (
              <SessionCountdown
                sessionAt={upcomingSession.scheduled_at}
                bookingId={upcomingSession.id}
              />
            )}

            <form action={signOut}>
              <button type="submit" style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)', padding: '8px 18px',
                borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
        {/* Quick actions */}
        <AnimatedSection style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '20px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '20px', background: '#fff',
                border: '1px solid var(--color-border)', borderRadius: '16px',
                textDecoration: 'none', boxShadow: 'var(--shadow-card)',
              }}>
                <span style={{ fontSize: '24px' }}>{link.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', marginBottom: '4px' }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>

        {/* Recent bookings */}
        {recentBookings && recentBookings.length > 0 && (
          <AnimatedSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Recent Bookings</h2>
              <Link href="/bookings" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
                View all →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentBookings.map((b: any) => {
                const colors = STATUS_COLORS[b.status] ?? { bg: '#f3f4f6', text: '#374151' }
                return (
                  <Link key={b.id} href={`/bookings/${b.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: '#fff',
                    border: '1px solid var(--color-border)', borderRadius: '14px',
                    textDecoration: 'none', boxShadow: 'var(--shadow-card)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
                        {new Date(b.scheduled_at).toLocaleDateString('en-QA', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {b.total_amount_qar} QAR
                      </div>
                    </div>
                    <span style={{
                      background: colors.bg, color: colors.text,
                      padding: '4px 12px', borderRadius: '9999px',
                      fontSize: '12px', fontWeight: 700,
                    }}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                )
              })}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  )
}
