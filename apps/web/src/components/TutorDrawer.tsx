'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useDrawerCtx } from '@/components/DrawerProvider'
import { createClient } from '@/lib/supabase/client'

interface DrawerTutor {
  id: string
  fullName: string
  avatarUrl: string | null
  subjects: string[]
  areas: string[]
  hourlyRateQar: number
  avgRating: number
  reviewCount: number
  bio: string | null
  sessionType: string
  reviews: Array<{ rating: number; comment: string | null; studentName: string }>
}

export function TutorDrawer() {
  const { tutorId, closeDrawer } = useDrawerCtx()
  const [tutor, setTutor] = useState<DrawerTutor | null>(null)
  const [loading, setLoading] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    if (!tutorId) { setTutor(null); return }

    setLoading(true)
    const supabase = createClient()

    Promise.all([
      supabase
        .from('tutor_search_results')
        .select('*')
        .eq('id', tutorId)
        .single(),
      supabase
        .from('reviews')
        .select('rating, comment, reviewer:reviewer_id(full_name)')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
        .limit(3),
    ]).then(([{ data: t }, { data: reviews }]) => {
      if (!t) { setLoading(false); return }
      setTutor({
        id: t.id,
        fullName: t.full_name,
        avatarUrl: t.avatar_url,
        subjects: t.subjects ?? [],
        areas: t.areas ?? [],
        hourlyRateQar: Number(t.hourly_rate_qar),
        avgRating: Number(t.avg_rating),
        reviewCount: Number(t.review_count),
        bio: t.bio,
        sessionType: t.session_type,
        reviews: (reviews ?? []).map((r: any) => ({
          rating: r.rating,
          comment: r.comment,
          studentName: r.reviewer?.full_name ?? 'Student',
        })),
      })
      setLoading(false)
    })
  }, [tutorId])

  return (
    <AnimatePresence>
      {tutorId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 500,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
            onTouchEnd={e => {
              const diff = e.changedTouches[0].clientY - touchStartY.current
              if (diff > 80) closeDrawer()
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              borderRadius: '24px 24px 0 0',
              zIndex: 501,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
            </div>

            <div style={{ padding: '20px 24px 32px' }}>
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                  Loading…
                </div>
              ) : tutor ? (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                      overflow: 'hidden', flexShrink: 0,
                      border: '3px solid var(--color-gold-bright)',
                    }}>
                      {tutor.avatarUrl
                        ? <img src={tutor.avatarUrl} alt={tutor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--color-text)' }}>
                        {tutor.fullName}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-gold)' }}>★</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                          {Number(tutor.avgRating).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>
                          ({tutor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {tutor.hourlyRateQar}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>QAR/hr</div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {tutor.subjects.slice(0, 5).map(s => (
                      <span key={s} style={{
                        background: 'var(--color-primary-light)',
                        color: '#92400e',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid var(--color-gold-bright)',
                      }}>{s}</span>
                    ))}
                  </div>

                  {/* Areas + mode */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {tutor.areas.slice(0, 3).map(a => (
                      <span key={a} style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        color: 'var(--color-text-muted)',
                      }}>📍 {a}</span>
                    ))}
                    <span style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      color: 'var(--color-text-muted)',
                    }}>
                      {tutor.sessionType === 'in_person' ? '🏫 In-person' : tutor.sessionType === 'online' ? '💻 Online' : '🏫💻 Both'}
                    </span>
                  </div>

                  {/* Top reviews */}
                  {tutor.reviews.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                        Recent Reviews
                      </p>
                      {tutor.reviews.map((r, i) => (
                        <div key={i} style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          marginBottom: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                            <span style={{ color: 'var(--color-gold)', fontSize: '13px' }}>
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>{r.studentName}</span>
                          </div>
                          {r.comment && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                              {r.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTAs */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Link
                      href={`/tutor/${tutor.id}`}
                      onClick={closeDrawer}
                      style={{
                        flex: 1,
                        display: 'block',
                        textAlign: 'center',
                        padding: '12px',
                        border: '2px solid var(--color-primary)',
                        borderRadius: '12px',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '15px',
                      }}
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/tutor/${tutor.id}/book`}
                      onClick={closeDrawer}
                      style={{
                        flex: 1,
                        display: 'block',
                        textAlign: 'center',
                        padding: '12px',
                        background: 'var(--color-primary)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
