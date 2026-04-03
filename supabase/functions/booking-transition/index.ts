/**
 * booking-transition — Supabase Edge Function (Deno)
 *
 * Server-side booking state machine for the mobile app.
 * Validates transitions, enforces role permissions, applies changes
 * atomically via the apply_booking_transition Postgres function,
 * and processes Stripe refunds when a booking is cancelled.
 *
 * POST /functions/v1/booking-transition
 * Authorization: Bearer <user JWT>
 *
 * Body: { bookingId: string, toStatus: string, reason?: string }
 *
 * Returns: { success: true } | { error: string }
 *
 * Deploy: supabase functions deploy booking-transition
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Role-permission matrix ───────────────────────────────────────────────────
const STUDENT_CAN: Record<string, boolean> = {
  cancelled:  true,
  completed:  true,
  disputed:   true,
}

const TUTOR_CAN: Record<string, boolean> = {
  confirmed:  true,
  declined:   true,
  cancelled:  true,
}
// ─────────────────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }
}

// ── Stripe helpers (Deno-compatible — plain fetch, no Node SDK) ──────────────

/** Post form-encoded data to Stripe REST API. Throws on non-2xx. */
async function stripePost(
  stripeKey: string,
  path: string,
  params: Record<string, string>
): Promise<void> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `Stripe HTTP ${res.status}`)
  }
}

/** QAR → smallest unit (halalas = QAR × 100) as a string for Stripe params */
function qarToHalalas(qar: number): string {
  return String(Math.round(qar * 100))
}

/**
 * Mirrors BookingStateMachine.isCancellationEligible():
 * >= 24 h before session → full refund, otherwise late cancellation.
 */
function isCancellationEligible(scheduledAt: string): 'full_refund' | 'late_cancellation' {
  const hoursUntil = (new Date(scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntil >= 24 ? 'full_refund' : 'late_cancellation'
}

/**
 * Mirrors BookingStateMachine.calculateLateCancellationRefund():
 * 15% platform keeps, 50% to tutor, 35% refunded to student.
 */
function calculateLateCancellationRefund(totalAmountQar: number) {
  const platformFeeQar      = Number((totalAmountQar * 0.15).toFixed(2))
  const tutorCompensationQar = Number((totalAmountQar * 0.50).toFixed(2))
  const studentRefundQar     = Number((totalAmountQar - platformFeeQar - tutorCompensationQar).toFixed(2))
  return { studentRefundQar, tutorCompensationQar }
}

/**
 * Process Stripe refund after a cancellation.
 * - Tutor cancellations → always full refund (not their fault).
 * - Student cancellations → 24h threshold determines full vs. late.
 *
 * If the booking has no stripe_payment_intent_id (student never paid),
 * this is a no-op.
 *
 * Any Stripe error is logged but does NOT fail the HTTP response — the
 * booking is already cancelled in the DB. A reconciliation job (or admin)
 * can catch and replay unprocessed refunds via the booking_events table.
 */
async function processRefundIfNeeded(opts: {
  stripeKey:          string
  supabaseAdmin:      ReturnType<typeof createClient>
  bookingId:          string
  scheduledAt:        string
  totalAmountQar:     number
  paymentIntentId:    string | null
  tutorId:            string
  actorIsStudent:     boolean
}): Promise<void> {
  const { stripeKey, supabaseAdmin, bookingId, scheduledAt, totalAmountQar,
          paymentIntentId, tutorId, actorIsStudent } = opts

  if (!paymentIntentId) return // not yet paid — nothing to refund

  try {
    const refundType = actorIsStudent
      ? isCancellationEligible(scheduledAt)
      : 'full_refund' // tutor cancellations always give full refund

    if (refundType === 'full_refund') {
      // PaymentIntent is in manual-capture mode: refunding an uncaptured PI
      // cancels the authorization automatically. No capture needed.
      await stripePost(stripeKey, '/refunds', {
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
      })
    } else {
      // Late cancellation: capture first, then partial refund + tutor transfer
      await stripePost(stripeKey, `/payment_intents/${paymentIntentId}/capture`, {})

      const { studentRefundQar, tutorCompensationQar } =
        calculateLateCancellationRefund(totalAmountQar)

      await stripePost(stripeKey, '/refunds', {
        payment_intent: paymentIntentId,
        amount: qarToHalalas(studentRefundQar),
        reason: 'requested_by_customer',
      })

      const { data: tutorProfile } = await supabaseAdmin
        .from('tutor_profiles')
        .select('stripe_account_id')
        .eq('id', tutorId)
        .single()

      if (tutorProfile?.stripe_account_id) {
        await stripePost(stripeKey, '/transfers', {
          amount: qarToHalalas(tutorCompensationQar),
          currency: 'qar',
          destination: tutorProfile.stripe_account_id,
          'metadata[bookingId]': bookingId,
        })
      }
    }

    // Update status → refunded and record in audit log
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'refunded' })
      .eq('id', bookingId)

    await supabaseAdmin.from('booking_events').insert({
      booking_id:  bookingId,
      from_status: 'cancelled',
      to_status:   'refunded',
      reason: refundType === 'full_refund'
        ? 'Full refund processed'
        : 'Late cancellation refund processed',
    })
  } catch (err) {
    // Log; do not re-throw — booking cancel succeeded, refund can be replayed
    console.error('[booking-transition] Stripe refund error:', (err as Error).message, {
      bookingId,
      paymentIntentId,
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: corsHeaders(),
    })
  }

  // ── Auth: verify JWT ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401, headers: corsHeaders(),
    })
  }

  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: corsHeaders(),
    })
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { bookingId?: string; toStatus?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: corsHeaders(),
    })
  }

  const { bookingId, toStatus, reason } = body

  if (!bookingId || typeof bookingId !== 'string') {
    return new Response(JSON.stringify({ error: 'bookingId is required' }), {
      status: 400, headers: corsHeaders(),
    })
  }
  if (!toStatus || typeof toStatus !== 'string') {
    return new Response(JSON.stringify({ error: 'toStatus is required' }), {
      status: 400, headers: corsHeaders(),
    })
  }
  if (toStatus === 'disputed' && (!reason || !reason.trim())) {
    return new Response(JSON.stringify({ error: 'reason is required when opening a dispute' }), {
      status: 400, headers: corsHeaders(),
    })
  }

  // ── Fetch booking + user role (service role — RLS bypass) ──────────────────
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const [bookingResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('id, status, student_id, tutor_id, scheduled_at, total_amount_qar, stripe_payment_intent_id')
      .eq('id', bookingId)
      .single(),
    supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(),
  ])

  if (!bookingResult.data) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404, headers: corsHeaders(),
    })
  }

  const booking = bookingResult.data
  const role = profileResult.data?.role ?? 'student'

  // ── Role + ownership checks ─────────────────────────────────────────────────
  const isStudent = role === 'student' && booking.student_id === user.id
  const isTutor   = role === 'tutor'   && booking.tutor_id   === user.id

  if (!isStudent && !isTutor) {
    return new Response(JSON.stringify({ error: 'You are not a participant in this booking' }), {
      status: 403, headers: corsHeaders(),
    })
  }

  const hasPermission = isStudent ? !!STUDENT_CAN[toStatus] : !!TUTOR_CAN[toStatus]
  if (!hasPermission) {
    return new Response(JSON.stringify({
      error: `${role} cannot transition a booking to '${toStatus}'`,
    }), { status: 403, headers: corsHeaders() })
  }

  // ── Apply transition via atomic Postgres function ───────────────────────────
  const { data: result, error: rpcError } = await supabaseAdmin.rpc('apply_booking_transition', {
    p_booking_id: bookingId,
    p_actor_id:   user.id,
    p_to_status:  toStatus,
    p_reason:     reason?.trim() ?? null,
    p_extra:      '{}',
  })

  if (rpcError) {
    console.error('[booking-transition] RPC error:', rpcError.message)
    return new Response(JSON.stringify({ error: rpcError.message }), {
      status: 500, headers: corsHeaders(),
    })
  }

  if (result?.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400, headers: corsHeaders(),
    })
  }

  // ── Process Stripe refund for cancellations ─────────────────────────────────
  if (toStatus === 'cancelled') {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (stripeKey) {
      await processRefundIfNeeded({
        stripeKey,
        supabaseAdmin,
        bookingId,
        scheduledAt:     booking.scheduled_at,
        totalAmountQar:  Number(booking.total_amount_qar),
        paymentIntentId: booking.stripe_payment_intent_id ?? null,
        tutorId:         booking.tutor_id,
        actorIsStudent:  isStudent,
      })
    }
  }

  return new Response(
    JSON.stringify({ success: true, fromStatus: result?.from_status }),
    { headers: corsHeaders() }
  )
})
