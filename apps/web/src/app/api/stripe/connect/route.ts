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
    .select('stripe_account_id, verification_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.verification_status !== 'approved') {
    return NextResponse.json({ error: 'Tutor not approved' }, { status: 403 })
  }

  let accountId = profile.stripe_account_id

  if (!accountId) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    accountId = await stripeAdapter.createConnectedAccount(user.id, userProfile?.email ?? '')

    await supabase
      .from('tutor_profiles')
      .update({ stripe_account_id: accountId })
      .eq('id', user.id)
  }

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/tutor/payout-setup?reauth=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/tutor/payout-setup?success=true`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
