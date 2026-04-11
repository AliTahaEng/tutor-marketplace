'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createBooking, type BookingFormState } from '@/lib/booking/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        background: 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '14px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? 'Creating booking…' : 'Continue to Payment'}
    </button>
  )
}

interface Slot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isoDateTime: string
  displayLabel: string
}

interface DurationOption {
  minutes: number
  amountQar: number
}

interface BookSessionFormProps {
  tutorId: string
  sessionType: string
  slots: Slot[]
  durations: DurationOption[]
  hourlyRateQar: number
}

const initialState: BookingFormState = { error: '' }

const radioOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  border: '1.5px solid var(--color-border)',
  borderRadius: '10px',
  padding: '10px 16px',
  fontSize: '14px',
  color: 'var(--color-text)',
  background: '#fff',
}

export function BookSessionForm({
  tutorId,
  sessionType,
  slots,
  durations,
  hourlyRateQar,
}: BookSessionFormProps) {
  const [state, formAction] = useFormState(createBooking, initialState)

  const sessionOptions = ['in_person', 'online'].filter(t =>
    sessionType === 'both' || sessionType === t
  )

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <input type="hidden" name="tutorId" value={tutorId} />

      {state.error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '14px',
        }}>
          {state.error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>
          Session Type
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {sessionOptions.map(t => (
            <label key={t} style={radioOptionStyle}>
              <input
                type="radio"
                name="sessionMode"
                value={t}
                required
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
              />
              <span>{t === 'in_person' ? 'In-person' : 'Online'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>
          Duration
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {durations.map(({ minutes, amountQar }) => (
            <label key={minutes} style={radioOptionStyle}>
              <input
                type="radio"
                name="durationMinutes"
                value={minutes}
                required
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
              />
              <span>{minutes} min — <strong>{amountQar} QAR</strong></span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>
          Available Slots
        </label>
        {slots.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            No availability set yet. Contact the tutor directly.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {slots.map(slot => (
              <label key={slot.id} style={{ ...radioOptionStyle, padding: '12px 16px' }}>
                <input
                  type="radio"
                  name="scheduledAt"
                  value={slot.isoDateTime}
                  required
                  style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                />
                <span>{slot.displayLabel}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div style={{
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-gold-bright)',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Order Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#78350f' }}>
          <span>Rate</span>
          <span>{hourlyRateQar} QAR/hr</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#78350f' }}>
          <span>Platform fee (15%)</span>
          <span>Included in total</span>
        </div>
        <div style={{ borderTop: '1px solid var(--color-gold-bright)', paddingTop: '6px', marginTop: '2px', color: '#92400e', fontSize: '12px' }}>
          Payment held until session complete
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}
