import { getBooking } from '@/lib/booking/queries'
import { requireRole } from '@/lib/auth/guards'
import { notFound } from 'next/navigation'
import { PaymentForm } from './PaymentForm'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default async function PayPage({ params }: PageProps) {
  const { user } = await requireRole('student')
  const booking = await getBooking(params.id)

  if (!booking || booking.student_id !== user.id) notFound()

  if (booking.status !== 'pending_payment') {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            This booking is already <strong style={{ color: 'var(--color-text)' }}>{booking.status.replace(/_/g, ' ')}</strong>.
          </p>
          <Link href={`/bookings/${params.id}`} style={{
            color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '15px',
          }}>
            View booking →
          </Link>
        </div>
      </div>
    )
  }

  const tutorProfile = (booking as any).tutor_profiles as any
  const tutorName = tutorProfile?.profiles?.full_name ?? 'Tutor'
  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-QA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', fontSize: '14px' }}>
          <Link href={`/bookings/${params.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to booking
          </Link>
        </div>

        {/* Session summary card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary-light), #fff)',
          border: '1px solid var(--color-gold-bright)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0,
            }}>
              🎓
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-text)', margin: 0 }}>{tutorName}</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>{scheduledDate}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Duration', value: `${booking.duration_minutes} minutes` },
              { label: 'Rate', value: `${booking.hourly_rate_qar} QAR/hr` },
              { label: 'Platform fee (15%)', value: `${booking.platform_fee_qar} QAR` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--color-gold-bright)', paddingTop: '12px', marginTop: '4px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>Total</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {booking.total_amount_qar} QAR
              </span>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 24px' }}>
            Complete Payment
          </h1>
          <PaymentForm bookingId={params.id} amountQar={Number(booking.total_amount_qar)} />
        </div>
      </div>
    </div>
  )
}
