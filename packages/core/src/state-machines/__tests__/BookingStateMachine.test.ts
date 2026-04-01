import { describe, it, expect } from 'vitest'
import { BookingStateMachine } from '../BookingStateMachine'

describe('BookingStateMachine', () => {
  it('allows pending_payment → awaiting_confirmation', () => {
    expect(BookingStateMachine.canTransition('pending_payment', 'awaiting_confirmation')).toBe(true)
  })

  it('allows awaiting_confirmation → confirmed', () => {
    expect(BookingStateMachine.canTransition('awaiting_confirmation', 'confirmed')).toBe(true)
  })

  it('allows awaiting_confirmation → declined', () => {
    expect(BookingStateMachine.canTransition('awaiting_confirmation', 'declined')).toBe(true)
  })

  it('blocks skipping from pending_payment to confirmed', () => {
    expect(BookingStateMachine.canTransition('pending_payment', 'confirmed')).toBe(false)
  })

  it('blocks transition from terminal state paid', () => {
    expect(BookingStateMachine.canTransition('paid', 'confirmed')).toBe(false)
    expect(BookingStateMachine.canTransition('paid', 'cancelled')).toBe(false)
  })

  it('throws on invalid transition', () => {
    expect(() =>
      BookingStateMachine.assertTransition('completed', 'awaiting_confirmation')
    ).toThrow('Invalid transition: completed → awaiting_confirmation')
  })

  it('calculates amounts correctly for 150 QAR/hr 60min session', () => {
    const amounts = BookingStateMachine.calculateAmounts(150, 60)
    expect(amounts.totalAmountQar).toBe(150)
    expect(amounts.platformFeeQar).toBe(22.50)
    expect(amounts.tutorPayoutQar).toBe(127.50)
  })

  it('calculates late cancellation refund correctly', () => {
    const refund = BookingStateMachine.calculateLateCancellationRefund(150)
    expect(refund.studentRefundQar).toBeCloseTo(52.5)
    expect(refund.tutorCompensationQar).toBeCloseTo(75)
    expect(refund.platformFeeQar).toBeCloseTo(22.5)
  })
})
