import { getTutorProfile, getTutorAvailability } from '@/lib/tutor/queries'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { BookingStateMachine } from '@tutor/core'
import { BookSessionForm } from './BookSessionForm'

interface PageProps {
  params: { id: string }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Returns the next occurrence of a given day_of_week (0=Sun…6=Sat) as a Date */
function nextOccurrence(dayOfWeek: number, startTime: string): Date {
  const [hours, minutes] = startTime.split(':').map(Number)
  const now = new Date()
  const result = new Date(now)
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7
  result.setDate(result.getDate() + (daysUntil === 0 && result <= now ? 7 : daysUntil))
  return result
}

export default async function BookSessionPage({ params }: PageProps) {
  await requireRole('student')
  const [profile, availability] = await Promise.all([
    getTutorProfile(params.id),
    getTutorAvailability(params.id),
  ])

  if (!profile || profile.verification_status !== 'approved') notFound()

  const hourlyRate = Number(profile.hourly_rate_qar)

  const durations = [60, 90, 120].map(minutes => ({
    minutes,
    amountQar: BookingStateMachine.calculateAmounts(hourlyRate, minutes).totalAmountQar,
  }))

  // Build next-occurrence slots with full ISO datetime values
  const slots = availability.map((slot: { id: string; day_of_week: number | null; start_time: string | null; end_time: string | null }) => {
    const dateTime = nextOccurrence(slot.day_of_week ?? 0, slot.start_time ?? '09:00')
    const displayDate = dateTime.toLocaleDateString('en-QA', { month: 'short', day: 'numeric' })
    return {
      id: slot.id,
      dayOfWeek: slot.day_of_week ?? 0,
      startTime: slot.start_time ?? '',
      endTime: slot.end_time ?? '',
      isoDateTime: dateTime.toISOString(),
      displayLabel: `${DAY_NAMES[slot.day_of_week ?? 0]} ${displayDate} · ${slot.start_time} – ${slot.end_time}`,
    }
  })

  const tutorName = (profile.profiles as any).full_name

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Amber gradient banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
        padding: '40px 32px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            Book a Session
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', margin: '0 0 8px' }}>
            with {tutorName}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: 0 }}>
            {hourlyRate} QAR / hr
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '36px',
          border: '1px solid var(--color-border)',
        }}>
          <BookSessionForm
            tutorId={params.id}
            sessionType={profile.session_type}
            slots={slots}
            durations={durations}
            hourlyRateQar={hourlyRate}
          />
        </div>
      </div>
    </div>
  )
}
