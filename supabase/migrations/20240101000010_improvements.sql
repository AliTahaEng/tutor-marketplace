-- supabase/migrations/20240101000010_improvements.sql
-- Fixes: featured_until enforcement, webhook idempotency, auto-payout tracking

-- ── 1. Fix tutor_search_results view to honour featured_until expiry ─────────
CREATE OR REPLACE VIEW tutor_search_results AS
  SELECT
    tp.id,
    p.full_name,
    p.avatar_url,
    tp.bio,
    tp.years_experience,
    tp.hourly_rate_qar,
    tp.session_type,
    tp.areas,
    tp.subjects,
    tp.languages_taught,
    -- is_featured is only true when the subscription is still active
    (tp.is_featured AND (tp.featured_until IS NULL OR tp.featured_until > NOW())) AS is_featured,
    tp.search_vector,
    COALESCE(r.avg_rating, 0)    AS avg_rating,
    COALESCE(r.review_count, 0)  AS review_count
  FROM tutor_profiles tp
  JOIN profiles p ON p.id = tp.id
  LEFT JOIN (
    SELECT tutor_id, AVG(rating)::NUMERIC(3,2) AS avg_rating, COUNT(*) AS review_count
    FROM reviews
    GROUP BY tutor_id
  ) r ON r.tutor_id = tp.id
  WHERE tp.verification_status = 'approved';

-- ── 2. Stripe webhook idempotency table ──────────────────────────────────────
-- Prevents double-processing when Stripe retries a webhook delivery
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id           TEXT        PRIMARY KEY,   -- Stripe event ID (e.g. evt_xxx)
  type         TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-purge records older than 30 days (run by pg_cron or manual cleanup)
CREATE INDEX IF NOT EXISTS stripe_webhook_events_time_idx
  ON stripe_webhook_events (processed_at);

-- RLS: only service-role can read/write (webhooks always use service role)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_service_only"
  ON stripe_webhook_events FOR ALL
  USING (false);   -- blocks anon/auth; service role bypasses RLS

-- ── 3. subjects_by_booking view for O(1) top-subjects aggregation ────────────
-- Replaces the 500-row in-memory scan in admin analytics
CREATE OR REPLACE VIEW bookings_subjects AS
  SELECT
    b.id            AS booking_id,
    UNNEST(tp.subjects) AS subject
  FROM bookings b
  JOIN tutor_profiles tp ON tp.id = b.tutor_id
  WHERE b.status IN ('completed', 'paid');

-- ── 4. Add auto_payout_eligible flag (set by auto-complete edge function) ────
-- Bookings that are completed > 48h ago with no open dispute are eligible
-- This is enforced in the auto-payout edge function; no schema change needed.
-- Placeholder comment so the migration is self-documenting.

-- ── 5. Add dispute_reason to booking form (student-initiated) ─────────────────
-- bookings.dispute_reason already exists from migration 000005.
-- Add a check that it's non-empty when status = 'disputed'
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_dispute_reason_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_dispute_reason_check
  CHECK (status != 'disputed' OR (dispute_reason IS NOT NULL AND length(dispute_reason) > 0));
