import { getTutorProfile, getTutorAvailability } from '@/lib/tutor/queries'
import { getTutorReviews, type TutorReview } from '@/lib/reviews/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GoldButton } from '@/components/ui/GoldButton'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

interface PageProps { params: { id: string } }
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function TutorProfilePage({ params }: PageProps) {
  const [profile, availability, reviews] = await Promise.all([
    getTutorProfile(params.id),
    getTutorAvailability(params.id),
    getTutorReviews(params.id),
  ])

  if (!profile || profile.verification_status !== 'approved') notFound()

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const profileData = profile.profiles as any

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt) 0%, var(--color-primary-light) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: '48px 32px',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
            overflow: 'hidden',
            border: '4px solid var(--color-gold-bright)',
            boxShadow: '0 8px 32px rgba(217,119,6,0.3)',
          }}>
            {profileData?.avatar_url
              ? <img src={profileData.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                {profileData?.full_name}
              </h1>
              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
                ✓ Verified
              </span>
              {profile.is_featured && (
                <span style={{
                  background: 'var(--color-primary-light)', color: '#92400e',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
                  border: '1px solid var(--color-gold-bright)',
                }}>⭐ Featured</span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {profile.subjects?.slice(0, 5).map((s: string) => (
                <span key={s} style={{
                  background: 'var(--color-primary-light)', color: '#92400e',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
                  border: '1px solid var(--color-gold-bright)',
                }}>{s}</span>
              ))}
            </div>

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-gold)', fontSize: '18px' }}>
                  {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
                </span>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>{avgRating}</span>
                <span style={{ color: 'var(--color-text-faint)', fontSize: '14px' }}>({reviews.length} reviews)</span>
              </div>
            )}
          </div>

          {/* Booking card */}
          <div style={{
            background: '#fff', border: '1px solid var(--color-border)',
            borderRadius: '20px', padding: '28px',
            boxShadow: 'var(--shadow-float)', minWidth: '240px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>
              {profile.hourly_rate_qar}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-faint)', marginBottom: '20px' }}>QAR per hour</div>
            <GoldButton href={`/tutor/${params.id}/book`} size="lg" fullWidth>
              Book Session
            </GoldButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: availability.length > 0 ? '1fr 280px' : '1fr', gap: '40px' }}>
          <div>
            {/* About */}
            {profile.bio && (
              <AnimatedSection style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>About</h2>
                <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{profile.bio}</p>
              </AnimatedSection>
            )}

            {/* Details grid */}
            <AnimatedSection style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Session Type', value: profile.session_type === 'both' ? 'In-person & Online' : profile.session_type === 'in_person' ? 'In-person' : 'Online' },
                  { label: 'Experience', value: `${profile.years_experience} years` },
                  { label: 'Areas', value: profile.areas?.join(', ') },
                  { label: 'Languages', value: profile.languages_taught?.join(', ') },
                ].map(item => (
                  <div key={item.label} style={{
                    background: '#fff', border: '1px solid var(--color-border)',
                    borderRadius: '14px', padding: '16px 20px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Reviews */}
            {reviews.length > 0 && (
              <AnimatedSection>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text)' }}>
                  Reviews ({reviews.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviews.map((review: TutorReview) => (
                    <div key={review.id} style={{
                      background: '#fff', border: '1px solid var(--color-border)',
                      borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-card)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--color-gold)' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-faint)', fontWeight: 600 }}>
                          {review.studentName}
                        </span>
                      </div>
                      {review.comment && (
                        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Right: availability */}
          {availability.length > 0 && (
            <div>
              <div style={{
                background: '#fff', border: '1px solid var(--color-border)',
                borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)',
                position: 'sticky', top: '80px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
                  Availability
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availability.map((slot: { id: string; day_of_week: number; start_time: string; end_time: string }) => (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', background: 'var(--color-bg)',
                      borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px',
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', width: '36px' }}>
                        {DAY_NAMES[slot.day_of_week]}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {slot.start_time} – {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact notice */}
        <div style={{
          background: 'var(--color-primary-light)', border: '1px solid var(--color-gold-bright)',
          borderRadius: '16px', padding: '18px 24px',
          fontSize: '14px', color: '#92400e', marginTop: '40px', fontWeight: 500,
        }}>
          📱 Phone & WhatsApp contact details are shared after your booking is confirmed.
        </div>
      </div>
    </div>
  )
}
