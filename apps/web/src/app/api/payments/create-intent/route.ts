import { NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { StripeAdapter } from '@tutor/core'

// Direct Stripe client for retrieve (StripeAdapter only wraps create/capture/refund)
const stripeRaw = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const RequestSchema = z.object({
  bookingId: z.string().uuid(),
})

const stripe = new StripeAdapter({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
})

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, student_id, tutor_id, total_amount_qar, stripe_payment_intent_id')
    .eq('id', parsed.data.bookingId)
    .eq('student_id', user.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 409 })
  }

  // Idempotent: retrieve client_secret from Stripe (needed by PaymentForm to init Elements)
  if (booking.stripe_payment_intent_id) {
    const existing = await stripeRaw.paymentIntents.retrieve(booking.stripe_payment_intent_id)
    return NextResponse.json({
      clientSecret: existing.client_secret,
      paymentIntentId: existing.id,
    })
  }

  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('subjects')
    .eq('id', booking.tutor_id)
    .single()

  const intent = await stripe.createPaymentIntent({
    amountQar: Number(booking.total_amount_qar),
    bookingId: booking.id,
    studentId: booking.student_id,
    tutorId: booking.tutor_id,
    description: `TutorQatar session: ${tutorProfile?.subjects?.[0] ?? 'Tutoring'}`,
  })

  await supabase
    .from('bookings')
    .update({ stripe_payment_intent_id: intent.id })
    .eq('id', booking.id)

  return NextResponse.json({ clientSecret: intent.clientSecret, paymentIntentId: intent.id })
}
