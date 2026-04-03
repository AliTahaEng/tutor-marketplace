'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createBooking, type BookingFormState } from '@/lib/booking/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tutorId" value={tutorId} />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Session Type</label>
        <div className="flex gap-3">
          {sessionOptions.map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="radio" name="sessionMode" value={t} required className="accent-blue-600" />
              <span className="text-sm">{t === 'in_person' ? 'In-person' : 'Online'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Duration</label>
        <div className="flex gap-3 flex-wrap">
          {durations.map(({ minutes, amountQar }) => (
            <label key={minutes} className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="radio" name="durationMinutes" value={minutes} required className="accent-blue-600" />
              <span className="text-sm">{minutes} min — <strong>{amountQar} QAR</strong></span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Available Slots</label>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-500 border rounded-lg p-4 text-center">
            No availability set yet. Contact the tutor directly.
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => (
              <label key={slot.id} className="flex items-center gap-3 cursor-pointer border rounded-lg px-4 py-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="scheduledAt"
                  value={slot.isoDateTime}
                  required
                  className="accent-blue-600"
                />
                <span className="text-sm">{slot.displayLabel}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-xl p-4 bg-slate-50 text-sm space-y-1">
        <div className="font-semibold mb-2">Order Summary</div>
        <div className="flex justify-between text-gray-600">
          <span>Rate</span>
          <span>{hourlyRateQar} QAR/hr</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Platform fee (15%)</span>
          <span>Included in total</span>
        </div>
        <div className="flex justify-between text-gray-600 text-xs pt-1 border-t">
          <span>Payment held until session complete</span>
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}
