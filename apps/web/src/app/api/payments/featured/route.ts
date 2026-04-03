import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StripeAdapter } from '@tutor/core'
import Stripe from 'stripe'

const stripeAdapter = new StripeAdapter({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('tutor_profiles')
    .select('stripe_customer_id, verification_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.verification_status !== 'approved') {
    return NextResponse.json({ error: 'Tutor not approved' }, { status: 403 })
  }

  let customerId = profile.stripe_customer_id

  if (!customerId) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const customer = await stripe.customers.create({ email: userProfile?.email ?? '' })
    customerId = customer.id

    await supabase
      .from('tutor_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const subscription = await stripeAdapter.createSubscription({
    tutorStripeCustomerId: customerId,
    priceId: process.env.STRIPE_FEATURED_PRICE_ID!,
  })

  if (subscription.status === 'active') {
    await supabase
      .from('tutor_profiles')
      .update({
        is_featured: true,
        featured_until: subscription.currentPeriodEnd.toISOString(),
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ subscriptionId: subscription.id, status: subscription.status })
}
