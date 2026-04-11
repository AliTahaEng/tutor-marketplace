import { getBooking } from '@/lib/booking/queries'
import { submitReview } from '@/lib/reviews/actions'
import { requireRole } from '@/lib/auth/guards'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default async function ReviewPage({ params }: PageProps) {
  const { user } = await requireRole('student')
  const booking = await getBooking(params.id)

  if (!booking || booking.student_id !== user.id) notFound()

  if (!['completed', 'paid'].includes(booking.status)) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            You can only leave a review after the session is completed.
          </p>
          <Link href={`/bookings/${params.id}`} style={{
            color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '15px',
          }}>
            Back to booking →
          </Link>
        </div>
      </div>
    )
  }

  const tutorName = (booking.tutor_profiles as any)?.profiles?.full_name ?? 'your tutor'

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '28px' }}>
          <Link href={`/bookings/${params.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
            ← Back to booking
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: 'var(--shadow-card)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
              Rate Your Session
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: 0 }}>
              How was your session with <strong style={{ color: 'var(--color-text)' }}>{tutorName}</strong>?
            </p>
          </div>

          <form action={submitReview as unknown as (formData: FormData) => void} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <input type="hidden" name="bookingId" value={params.id} />
            <input type="hidden" name="tutorId" value={booking.tutor_id} />

            {/* Star rating */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px' }}>
                Rating *
              </label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <label key={star} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <input type="radio" name="rating" value={star} required style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      fontSize: '36px',
                      display: 'block',
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                    onMouseEnter={e => { (e.target as HTMLSpanElement).style.transform = 'scale(1.2)' }}
                    onMouseLeave={e => { (e.target as HTMLSpanElement).style.transform = 'scale(1)' }}
                    >
                      ★
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', fontWeight: 600 }}>{star}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
                Review <span style={{ fontWeight: 400, color: 'var(--color-text-faint)' }}>(optional)</span>
              </label>
              <textarea
                id="comment"
                name="comment"
                maxLength={1000}
                rows={4}
                placeholder="Share your experience with this tutor..."
                style={{
                  width: '100%',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  background: '#fff',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '6px' }}>Max 1000 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{
                width: '100%',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              Submit Review ★
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
