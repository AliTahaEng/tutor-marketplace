-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 000012: Server-side analytics aggregation
--
-- Moves the top-subjects GROUP BY into Postgres so the admin dashboard
-- never pulls unbounded rows into Node.js memory.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_top_subjects(limit_n int DEFAULT 10)
RETURNS TABLE(subject text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    subject,
    COUNT(*)::bigint AS count
  FROM bookings_subjects
  GROUP BY subject
  ORDER BY count DESC
  LIMIT limit_n;
$$;

-- Grant execute to authenticated users (admin dashboard uses service-role
-- which bypasses RLS, but granting to authenticated is fine)
GRANT EXECUTE ON FUNCTION get_top_subjects(int) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Also: a function the booking-transition edge function uses to validate and
-- apply state transitions atomically, avoiding race conditions.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION apply_booking_transition(
  p_booking_id   uuid,
  p_actor_id     uuid,
  p_to_status    text,
  p_reason       text DEFAULT NULL,
  p_extra        jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking      bookings%ROWTYPE;
  v_allowed      text[];
  v_updates      jsonb := '{}'::jsonb;
BEGIN
  -- Lock the row to prevent concurrent transitions
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;

  -- Valid transitions (mirrors BookingStateMachine)
  v_allowed := CASE v_booking.status
    WHEN 'pending_payment'        THEN ARRAY['awaiting_confirmation','cancelled']
    WHEN 'awaiting_confirmation'  THEN ARRAY['confirmed','declined','cancelled']
    WHEN 'confirmed'              THEN ARRAY['completed','cancelled','disputed']
    WHEN 'completed'              THEN ARRAY['paid','disputed']
    WHEN 'cancelled'              THEN ARRAY['refunded']
    WHEN 'disputed'               THEN ARRAY['paid','refunded']
    ELSE                               ARRAY[]::text[]
  END;

  IF NOT (p_to_status = ANY(v_allowed)) THEN
    RETURN jsonb_build_object(
      'error',
      format('Cannot transition from %s to %s', v_booking.status, p_to_status)
    );
  END IF;

  -- Build update payload
  v_updates := jsonb_build_object('status', p_to_status);

  IF p_to_status = 'cancelled' THEN
    v_updates := v_updates || jsonb_build_object(
      'cancelled_at',         now(),
      'cancellation_reason',  COALESCE(p_reason, 'Cancelled')
    );
  ELSIF p_to_status = 'completed' THEN
    v_updates := v_updates || jsonb_build_object('completed_at', now());
  ELSIF p_to_status = 'disputed' THEN
    v_updates := v_updates || jsonb_build_object(
      'dispute_opened_at', now(),
      'dispute_reason',    p_reason
    );
  ELSIF p_to_status = 'confirmed' THEN
    -- Optionally store tutor phone/whatsapp passed via p_extra
    v_updates := v_updates || jsonb_build_object(
      'tutor_phone',     p_extra->>'tutor_phone',
      'tutor_whatsapp',  p_extra->>'tutor_whatsapp'
    );
  END IF;

  -- Apply update
  UPDATE bookings
  SET status              = (v_updates->>'status'),
      cancelled_at        = CASE WHEN v_updates ? 'cancelled_at'
                              THEN (v_updates->>'cancelled_at')::timestamptz
                              ELSE cancelled_at END,
      cancellation_reason = COALESCE(v_updates->>'cancellation_reason', cancellation_reason),
      completed_at        = CASE WHEN v_updates ? 'completed_at'
                              THEN (v_updates->>'completed_at')::timestamptz
                              ELSE completed_at END,
      dispute_opened_at   = CASE WHEN v_updates ? 'dispute_opened_at'
                              THEN (v_updates->>'dispute_opened_at')::timestamptz
                              ELSE dispute_opened_at END,
      dispute_reason      = COALESCE(v_updates->>'dispute_reason', dispute_reason),
      tutor_phone         = COALESCE(v_updates->>'tutor_phone', tutor_phone),
      tutor_whatsapp      = COALESCE(v_updates->>'tutor_whatsapp', tutor_whatsapp),
      updated_at          = now()
  WHERE id = p_booking_id;

  -- Audit event
  INSERT INTO booking_events (booking_id, from_status, to_status, actor_id, reason)
  VALUES (p_booking_id, v_booking.status, p_to_status, p_actor_id, p_reason);

  RETURN jsonb_build_object('success', true, 'from_status', v_booking.status);
END;
$$;

GRANT EXECUTE ON FUNCTION apply_booking_transition(uuid, uuid, text, text, jsonb)
  TO authenticated;
