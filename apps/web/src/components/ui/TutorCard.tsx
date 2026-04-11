'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useDrawerCtx } from '@/components/DrawerProvider'

export interface TutorCardData {
  id: string
  fullName: string
  avatarUrl: string | null
  subjects: string[]
  areas: string[]
  hourlyRateQar: number
  sessionType: string
  avgRating: number
  reviewCount: number
  isFeatured: boolean
  yearsExperience: number
}

interface TutorCardProps {
  tutor: TutorCardData
  index?: number
}

export function TutorCard({ tutor, index = 0 }: TutorCardProps) {
  const { openDrawer } = useDrawerCtx()

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: 'var(--shadow-lift)' }}
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease',
      }}
      onClick={() => openDrawer(tutor.id)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          border: '2px solid var(--color-gold-bright)',
        }}>
          {tutor.avatarUrl
            ? <img src={tutor.avatarUrl} alt={tutor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '22px' }}>👤</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>{tutor.fullName}</span>
            {tutor.isFeatured && (
              <span style={{
                background: 'var(--color-primary-light)',
                color: '#92400e',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
                border: '1px solid var(--color-gold-bright)',
              }}>⭐ Featured</span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-faint)', marginTop: '3px' }}>
            {tutor.subjects.slice(0, 3).join(' · ')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: 'var(--color-gold)', fontSize: '14px' }}>★</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
            {Number(tutor.avgRating).toFixed(1)}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>
            ({tutor.reviewCount})
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }}>
            {tutor.hourlyRateQar}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginLeft: '3px' }}>QAR/hr</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {tutor.areas.slice(0, 2).map(area => (
          <span key={area} style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}>📍 {area}</span>
        ))}
        <span style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}>
          {tutor.sessionType === 'in_person' ? '🏫 In-person' : tutor.sessionType === 'online' ? '💻 Online' : '🏫💻 Both'}
        </span>
      </div>

      <Link
        href={`/tutor/${tutor.id}`}
        onClick={e => e.stopPropagation()}
        style={{
          display: 'block',
          textAlign: 'center',
          background: 'var(--color-primary)',
          color: '#fff',
          padding: '10px',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
        }}
      >
        View Profile
      </Link>
    </motion.div>
  )
}
