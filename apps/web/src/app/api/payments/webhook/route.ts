import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { BookingStateMachine } from '@tutor/core'

// Service role: webhook bypasses RLS (only Stripe calls this endpoint)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Idempotency guard ─────────────────────────────────────────────────────
  // Stripe can retry failed webhook deliveries; inserting on the unique PK
  // will fail if we already processed this event — we skip gracefully.
  const { error: idempotencyError } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: event.id, type: event.type })

  if (idempotencyError) {
    // Duplicate event (code 23505 = unique_violation) — already processed
    if (idempotencyError.code === '23505') {
      return NextResponse.json({ received: true, skipped: true })
    }
    // Unexpected error — still try to process but log it
    console.error('[webhook] idempotency insert error:', idempotencyError.message)
  }
  // ─────────────────────────────────────────────────────────────────────────

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      const bookingId = intent.metadata['bookingId']
      if (!bookingId) break

      const { data: booking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single()

      if (booking && BookingStateMachine.canTransition(booking.status as any, 'awaiting_confirmation')) {
        await supabase
          .from('bookings')
          .update({ status: 'awaiting_confirmation' })
          .eq('id', bookingId)

        await supabase.from('booking_events').insert({
          booking_id: bookingId,
          from_status: booking.status,
          to_status: 'awaiting_confirmation',
          reason: 'Payment succeeded',
        })
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      const bookingId = intent.metadata['bookingId']
      if (!bookingId) break

      // Only cancel if still in pending_payment — avoid overwriting later states
      const { data: booking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single()

      if (booking?.status === 'pending_payment') {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled', cancellation_reason: 'Payment failed' })
          .eq('id', bookingId)

        await supabase.from('booking_events').insert({
          booking_id: bookingId,
          from_status: 'pending_payment',
          to_status: 'cancelled',
          reason: 'Payment failed',
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Remove featured status when subscription ends
      await supabase
        .from('tutor_profiles')
        .update({ is_featured: false, featured_until: null })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      if (subscription.status === 'active') {
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
        await supabase
          .from('tutor_profiles')
          .update({ is_featured: true, featured_until: periodEnd })
          .eq('stripe_customer_id', customerId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
