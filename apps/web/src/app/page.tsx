import { Suspense } from 'react'
import Link from 'next/link'
import { searchTutors } from '@/lib/search/queries'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { StatCounter } from '@/components/ui/StatCounter'
import { FloatingCard } from '@/components/ui/FloatingCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GoldButton } from '@/components/ui/GoldButton'
import { TutorCard } from '@/components/ui/TutorCard'
import { GeometricPattern } from '@/components/ui/GeometricPattern'
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard'

const SUBJECTS = [
  { icon: '📐', label: 'Math' }, { icon: '🔬', label: 'Physics' },
  { icon: '🧪', label: 'Chemistry' }, { icon: '🧬', label: 'Biology' },
  { icon: '🌍', label: 'English' }, { icon: '📖', label: 'Arabic' },
  { icon: '🇫🇷', label: 'French' }, { icon: '📜', label: 'History' },
  { icon: '💻', label: 'Computer Science' }, { icon: '📈', label: 'Economics' },
  { icon: '🗺️', label: 'Geography' }, { icon: '☪️', label: 'Islamic Studies' },
]

const TESTIMONIALS = [
  { name: 'Fatima A.', subject: 'Math', rating: 5, text: 'My grade went from a C to an A in one month. The tutor explained everything so clearly!' },
  { name: 'Omar K.', subject: 'Physics', rating: 5, text: 'Found an amazing physics tutor in Lusail. The booking process was instant and easy.' },
  { name: 'Sara M.', subject: 'English', rating: 5, text: 'My IELTS improved by 1.5 bands. Absolutely recommend TutorQatar to all students.' },
]

async function FeaturedTutors() {
  let tutors: any[] = []
  try {
    const results = await searchTutors({ page: 1, sortBy: 'rating' } as any)
    tutors = results.tutors.slice(0, 6)
  } catch { /* DB may not be connected */ }

  if (tutors.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {tutors.map((tutor, i) => <TutorCard key={tutor.id} tutor={tutor} index={i} />)}
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      {/* ── SPLIT HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg)',
        overflow: 'hidden',
        padding: '60px 0',
      }}>
        <GeometricPattern opacity={0.035} />
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: '60px' }}>
          {/* Left: copy + search */}
          <div style={{ flex: 1, maxWidth: '580px' }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-gold-bright)',
              borderRadius: '9999px',
              padding: '5px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#92400e',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}>
              🇶🇦 Qatar's #1 Tutor Platform
            </div>

            <h1 style={{
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--color-text)',
              margin: '0 0 20px',
              letterSpacing: '-1px',
            }}>
              Find Your<br />
              Perfect <span style={{ color: 'var(--color-primary)' }}>Tutor</span><br />
              in Qatar
            </h1>

            <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              500+ verified experts across all subjects.<br />In-person & online sessions all over Qatar.
            </p>

            {/* Search bar */}
            <form action="/search" method="GET" style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                background: '#fff',
                border: '2px solid var(--color-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}>
                <input
                  name="q"
                  placeholder="Math, Physics, Arabic, English…"
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    background: 'transparent',
                    color: 'var(--color-text)',
                  }}
                />
                <button type="submit" style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '16px 28px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                }}>
                  Search
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <GoldButton href="/search" size="lg">Find a Tutor</GoldButton>
              <GoldButton href="/sign-up/tutor" variant="outline" size="lg">Become a Tutor</GoldButton>
            </div>
          </div>

          {/* Right: floating tutor cards (desktop only) */}
          <div className="hero-cards" style={{ flex: '0 0 380px', position: 'relative', height: '420px', display: 'none' }}>
            <FloatingCard delay={0} rotate={-4} style={{ position: 'absolute', top: '20px', left: '20px', width: '160px', padding: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#d97706,#f59e0b)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Ahmed K.</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0' }}>Math · ★ 4.9</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>150 QAR/hr</div>
            </FloatingCard>

            <FloatingCard delay={0.5} rotate={3} style={{ position: 'absolute', top: '60px', right: '0', width: '160px', padding: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#34d399)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Sara M.</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0' }}>English · ★ 5.0</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>120 QAR/hr</div>
            </FloatingCard>

            <FloatingCard delay={1} rotate={-2} style={{ position: 'absolute', bottom: '60px', left: '40px', width: '180px', padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Khalid A.</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0' }}>Physics · ★ 4.8</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>180 QAR/hr</div>
            </FloatingCard>

            <FloatingCard delay={1.5} style={{
              position: 'absolute', bottom: '20px', right: '10px', width: '190px', padding: '12px 16px',
              background: 'var(--color-primary-light)', border: '1px solid var(--color-gold-bright)',
            }}>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 700 }}>✅ Just booked</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>Physics · Tomorrow 4pm</div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: 'var(--color-primary-light)',
        borderTop: '1px solid var(--color-gold-bright)',
        borderBottom: '1px solid var(--color-gold-bright)',
        padding: '48px 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          <StatCounter value={500} suffix="+" label="Verified Tutors" />
          <StatCounter value={4.9} suffix="★" label="Average Rating" />
          <StatCounter value={15} suffix="+" label="Subjects" />
          <StatCounter value={2000} suffix="+" label="Sessions Completed" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <AnimatedSection style={{ padding: '100px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeading
          title="How It Works"
          subtitle="Get matched with a tutor and start learning — in three simple steps."
          centered
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginTop: '60px' }}>
          {[
            { step: '01', icon: '🔍', title: 'Search & Filter', desc: 'Browse 500+ verified tutors by subject, area, price, and rating. Find the perfect match.' },
            { step: '02', icon: '📅', title: 'Book Instantly', desc: 'Choose your time slot, book in seconds, and pay securely through the platform.' },
            { step: '03', icon: '🎓', title: 'Start Learning', desc: 'Meet your tutor online or in person. Build skills, ace exams, reach your goals.' },
          ].map(item => (
            <div key={item.step} style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '28px',
                boxShadow: '0 8px 24px rgba(217,119,6,0.3)',
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '2px', marginBottom: '8px' }}>
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── FEATURED TUTORS ── */}
      <section style={{ background: 'var(--color-bg-alt)', padding: '100px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <SectionHeading title="Top Tutors This Week" subtitle="Highly rated and ready to help" />
              <Link href="/search" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                Browse All Tutors →
              </Link>
            </div>
          </AnimatedSection>
          <Suspense fallback={<SkeletonCardGrid count={6} />}>
            <FeaturedTutors />
          </Suspense>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <AnimatedSection style={{ padding: '100px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeading title="Browse by Subject" subtitle="Expert tutors across every discipline" centered />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginTop: '48px' }}>
          {SUBJECTS.map(s => (
            <Link key={s.label} href={`/search?q=${s.label}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              padding: '24px 16px', background: '#fff',
              border: '1px solid var(--color-border)', borderRadius: '16px',
              textDecoration: 'none', boxShadow: 'var(--shadow-card)',
            }}>
              <span style={{ fontSize: '28px' }}>{s.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{s.label}</span>
            </Link>
          ))}
        </div>
      </AnimatedSection>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'var(--color-bg-alt)', padding: '100px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection>
            <SectionHeading title="What Students Say" centered />
          </AnimatedSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '48px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid var(--color-border)',
                borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ color: 'var(--color-gold)', fontSize: '20px', marginBottom: '12px' }}>
                  {'★'.repeat(t.rating)}
                </div>
                <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{t.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>{t.subject} Student</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TUTOR CTA ── */}
      <section style={{
        position: 'relative', background: 'var(--color-bg-dark)',
        padding: '100px 32px', overflow: 'hidden',
      }}>
        <GeometricPattern color="#f59e0b" opacity={0.06} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.15), transparent 60%)',
          pointerEvents: 'none',
        }} />
        <AnimatedSection style={{ position: 'relative', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
            Share Your Knowledge.<br />
            <span style={{ color: 'var(--color-gold)' }}>Earn in Qatar.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '40px', lineHeight: 1.6 }}>
            Join 500+ tutors earning up to 300 QAR/hr. Set your own schedule, teach your subject, grow your impact.
          </p>
          <GoldButton href="/sign-up/tutor" size="lg">Apply as a Tutor →</GoldButton>
        </AnimatedSection>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--color-bg-dark)', borderTop: '1px solid rgba(245,158,11,0.2)', padding: '48px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginBottom: '8px' }}>TutorQatar</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Qatar's Premier Tutor Marketplace</div>
          </div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            {[
              { label: 'Find Tutors', href: '/search' },
              { label: 'Sign Up', href: '/sign-up/student' },
              { label: 'For Tutors', href: '/sign-up/tutor' },
              { label: 'Sign In', href: '/sign-in' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '32px auto 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          © 2026 TutorQatar. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
