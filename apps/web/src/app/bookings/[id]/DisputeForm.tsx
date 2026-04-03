'use client'

import { useState } from 'react'
import { openDispute } from '@/lib/booking/actions'

interface DisputeFormProps {
  bookingId: string
}

export function DisputeForm({ bookingId }: DisputeFormProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="border border-orange-200 rounded-xl p-4 bg-orange-50 text-sm text-orange-800">
        <p className="font-semibold">Dispute submitted</p>
        <p className="text-xs mt-1">Our team will review within 24 hours.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-orange-300 text-orange-700 py-2 rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors"
      >
        Report an Issue
      </button>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please describe the issue.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await openDispute(bookingId, reason)
    if ('error' in result) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-orange-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-orange-800">Report an Issue</p>
      <p className="text-xs text-orange-700">
        Describe what went wrong. Our team will review and reach out within 24 hours.
      </p>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Describe the issue in detail…"
        maxLength={500}
        rows={3}
        required
        className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60 hover:bg-orange-700 transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Dispute'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setReason(''); setError(null) }}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
