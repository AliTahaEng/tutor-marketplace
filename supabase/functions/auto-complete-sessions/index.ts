/**
 * auto-complete-sessions — Supabase Edge Function (Deno)
 *
 * Moves `confirmed` bookings to `completed` once their session end time
 * (scheduled_at + duration_minutes) has passed by more than 15 minutes.
 * The 15-minute grace period avoids race conditions with sessions ending now.
 *
 * Uses apply_booking_transition RPC for atomic, race-condition-safe updates.
 *
 * Deploy:  supabase functions deploy auto-complete-sessions
 * Cron:    */15 * * * *  (every 15 minutes via Supabase scheduled triggers)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Require a shared secret so only Supabase scheduler can invoke this
  const secret = req.headers.get('x-cron-secret')
  const expectedSecret = Deno.env.get('CRON_SECRET')
  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch confirmed bookings scheduled more than 15 min ago (generous look-back: 7 days)
  const lookbackCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const graceCutoff    = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('id, scheduled_at, duration_minutes')
    .eq('status', 'confirmed')
    .gte('scheduled_at', lookbackCutoff)   // don't go back more than 7 days
    .lt('scheduled_at',  graceCutoff)       // at least 15 min ago
    .limit(200)

  if (fetchError) {
    console.error('[auto-complete] fetch error:', fetchError.message)
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  const now = Date.now()
  let completed = 0
  let skipped = 0
  const errors: { id: string; error: string }[] = []

  for (const booking of bookings ?? []) {
    // Calculate actual session end time
    const sessionEnd = new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60_000
    const gracePeriodMs = 15 * 60_000

    if (sessionEnd + gracePeriodMs > now) {
      skipped++
      continue  // session hasn't fully ended yet
    }

    try {
      const { data, error } = await supabase.rpc('apply_booking_transition', {
        p_booking_id: booking.id,
        p_actor_id:   null,
        p_to_status:  'completed',
        p_reason:     'Auto-completed: session time elapsed',
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error as string)

      await supabase.rpc('log_audit_event', {
        p_event_type:  'booking.auto_completed',
        p_actor_id:    null,
        p_entity_type: 'booking',
        p_entity_id:   booking.id,
        p_metadata:    { reason: 'session_elapsed', duration_minutes: booking.duration_minutes },
      })

      completed++
      console.log(`[auto-complete] ${booking.id} → completed`)
    } catch (err) {
      const msg = (err as Error).message
      // "Cannot transition" means it was already moved (by student or another run) — ignore
      if (!msg.includes('Cannot transition')) {
        errors.push({ id: booking.id, error: msg })
        console.error(`[auto-complete] ${booking.id} failed:`, msg)
      } else {
        skipped++
      }
    }
  }

  const result = { completed, skipped, errors, total: bookings?.length ?? 0 }
  console.log('[auto-complete] done:', result)
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
