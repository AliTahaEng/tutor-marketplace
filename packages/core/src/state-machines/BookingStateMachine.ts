export type BookingStatus =
  | 'pending_payment'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'completed'
  | 'paid'
  | 'declined'
  | 'cancelled'
  | 'refunded'
  | 'disputed'

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_payment:        ['awaiting_confirmation', 'cancelled'],
  awaiting_confirmation:  ['confirmed', 'declined', 'cancelled'],
  confirmed:              ['completed', 'cancelled', 'disputed'],
  completed:              ['paid', 'disputed'],
  paid:                   [],
  declined:               [],
  cancelled:              ['refunded'],
  refunded:               [],
  disputed:               ['paid', 'refunded'],
}

export interface BookingAmounts {
  totalAmountQar: number
  platformFeeQar: number
  tutorPayoutQar: number
}

export interface CancellationRefund {
  studentRefundQar: number
  tutorCompensationQar: number
  platformFeeQar: number
}

export const BookingStateMachine = {
  canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  },

  assertTransition(from: BookingStatus, to: BookingStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`)
    }
  },

  calculateAmounts(hourlyRateQar: number, durationMinutes: number): BookingAmounts {
    const totalAmountQar = Number(((hourlyRateQar * durationMinutes) / 60).toFixed(2))
    const platformFeeQar = Number((totalAmountQar * 0.15).toFixed(2))
    const tutorPayoutQar = Number((totalAmountQar - platformFeeQar).toFixed(2))
    return { totalAmountQar, platformFeeQar, tutorPayoutQar }
  },

  calculateLateCancellationRefund(totalAmountQar: number): CancellationRefund {
    const platformFeeQar = Number((totalAmountQar * 0.15).toFixed(2))
    const tutorCompensationQar = Number((totalAmountQar * 0.50).toFixed(2))
    const studentRefundQar = Number((totalAmountQar - platformFeeQar - tutorCompensationQar).toFixed(2))
    return { studentRefundQar, tutorCompensationQar, platformFeeQar }
  },

  isTerminal(status: BookingStatus): boolean {
    return (VALID_TRANSITIONS[status]?.length ?? 0) === 0
  },

  isCancellationEligible(scheduledAt: Date, cancelledAt: Date = new Date()): 'full_refund' | 'late_cancellation' {
    const hoursUntilSession = (scheduledAt.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60)
    return hoursUntilSession >= 24 ? 'full_refund' : 'late_cancellation'
  },
}
