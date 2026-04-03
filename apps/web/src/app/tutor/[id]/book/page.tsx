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
  const slots = availability.map(slot => {
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

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-1">Book a Session</h1>
      <p className="text-gray-500 mb-6 text-sm">
        with {(profile.profiles as any).full_name}
      </p>

      <BookSessionForm
        tutorId={params.id}
        sessionType={profile.session_type}
        slots={slots}
        durations={durations}
        hourlyRateQar={hourlyRate}
      />
    </div>
  )
}
