/**
 * auto-payout-sessions
 *
 * Runs every hour via pg_cron.
 * Finds bookings that are `completed` for > 48 hours with no open dispute,
 * then calls the Stripe capture + transfer flow to move them to `paid`.
 *
 * Cron: SELECT cron.schedule('auto-payout-sessions', '0 * * * *',
 *   $$SELECT net.http_post(
 *     url:='https://<project>.supabase.co/functions/v1/auto-payout-sessions',
 *     headers:='{"Authorization":"Bearer <service_role_key>"}'::jsonb
 *   )$$);
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@15?target=deno'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

const PAYOUT_DELAY_HOURS = 48

serve(async (_req) => {
  const cutoff = new Date(Date.now() - PAYOUT_DELAY_HOURS * 60 * 60 * 1000).toISOString()

  // Find completed bookings older than 48h with no open dispute
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, tutor_id, tutor_payout_qar, stripe_payment_intent_id')
    .eq('status', 'completed')
    .lt('completed_at', cutoff)
    .not('stripe_payment_intent_id', 'is', null)

  if (error) {
    console.error('[auto-payout] fetch error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results: { bookingId: string; status: 'paid' | 'error'; reason?: string }[] = []

  for (const booking of bookings ?? []) {
    try {
      // Get tutor's Stripe Connect account
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('stripe_account_id')
        .eq('id', booking.tutor_id)
        .single()

      if (!tutorProfile?.stripe_account_id) {
        results.push({ bookingId: booking.id, status: 'error', reason: 'No Stripe account' })
        continue
      }

      const amountHalalas = Math.round(Number(booking.tutor_payout_qar) * 100)

      // Capture the held payment (may already be captured — Stripe is idempotent)
      try {
        await stripe.paymentIntents.capture(booking.stripe_payment_intent_id!)
      } catch (e: any) {
        // Already captured is fine
        if (!e?.message?.includes('already been captured')) throw e
      }

      // Transfer 85% to tutor's Connected account
      await stripe.transfers.create({
        amount:      amountHalalas,
        currency:    'qar',
        destination: tutorProfile.stripe_account_id,
        metadata:    { bookingId: booking.id, source: 'auto-payout' },
      })

      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', booking.id)

      await supabase.from('booking_events').insert({
        booking_id:  booking.id,
        from_status: 'completed',
        to_status:   'paid',
        reason:      `Auto-payout after ${PAYOUT_DELAY_HOURS}h`,
      })

      // Append to audit log
      await supabase.rpc('log_audit_event', {
        p_table_name:  'bookings',
        p_record_id:   booking.id,
        p_action:      'auto_payout',
        p_actor_id:    null,
        p_old_data:    { status: 'completed' },
        p_new_data:    { status: 'paid' },
      }).maybeSingle()

      results.push({ bookingId: booking.id, status: 'paid' })
    } catch (err: any) {
      console.error(`[auto-payout] booking ${booking.id} failed:`, err.message)
      results.push({ bookingId: booking.id, status: 'error', reason: err.message })
    }
  }

  const paid  = results.filter(r => r.status === 'paid').length
  const errors = results.filter(r => r.status === 'error').length

  console.log(`[auto-payout] processed ${results.length} bookings — ${paid} paid, ${errors} errors`)

  return new Response(
    JSON.stringify({ processed: results.length, paid, errors, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
