'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SessionCountdownProps {
  sessionAt: string
  bookingId: string
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours   = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { hours, minutes, seconds }
}

export function SessionCountdown({ sessionAt, bookingId }: SessionCountdownProps) {
  const sessionTime = new Date(sessionAt).getTime()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const msLeft = sessionTime - now
  const timeLeft = formatCountdown(msLeft)

  if (!timeLeft) {
    return (
      <Link href={`/messages/${bookingId}`} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(217,119,6,0.15)',
        border: '1px solid var(--color-gold-bright)',
        borderRadius: '12px',
        padding: '12px 20px',
        color: 'var(--color-primary)',
        fontWeight: 700,
        textDecoration: 'none',
        fontSize: '15px',
      }}>
        🎓 Session in progress →
      </Link>
    )
  }

  const totalWindow = 24 * 60 * 60 * 1000
  const fraction = Math.min(1, Math.max(0, msLeft / totalWindow))
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - fraction)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-bg-alt)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary)">
          NEXT
        </text>
      </svg>

      <div>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px', fontWeight: 600 }}>
          Your next session starts in
        </p>
        <p style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>
          <span style={{ color: 'var(--color-gold)' }}>{timeLeft.hours}h</span>
          {' '}
          <span style={{ color: 'var(--color-gold)' }}>{String(timeLeft.minutes).padStart(2, '0')}m</span>
          {' '}
          <span style={{ color: 'var(--color-gold)' }}>{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </p>
      </div>
    </div>
  )
}
