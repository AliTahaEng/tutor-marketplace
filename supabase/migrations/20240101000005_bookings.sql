CREATE TYPE booking_status AS ENUM (
  'pending_payment',
  'awaiting_confirmation',
  'confirmed',
  'completed',
  'paid',
  'declined',
  'cancelled',
  'refunded',
  'disputed'
);

CREATE TYPE session_mode AS ENUM ('in_person', 'online');

CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID NOT NULL REFERENCES auth.users(id),
  tutor_id              UUID NOT NULL REFERENCES tutor_profiles(id),
  status                booking_status NOT NULL DEFAULT 'pending_payment',
  session_mode          session_mode NOT NULL,
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration_minutes      SMALLINT NOT NULL CHECK (duration_minutes IN (60, 90, 120)),
  hourly_rate_qar       NUMERIC(8,2) NOT NULL,
  total_amount_qar      NUMERIC(8,2) NOT NULL,
  platform_fee_qar      NUMERIC(8,2) NOT NULL,
  tutor_payout_qar      NUMERIC(8,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  tutor_phone           TEXT,
  tutor_whatsapp        TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  completed_at          TIMESTAMPTZ,
  auto_completed        BOOLEAN DEFAULT FALSE,
  dispute_opened_at     TIMESTAMPTZ,
  dispute_reason        TEXT,
  dispute_resolved_at   TIMESTAMPTZ,
  dispute_resolved_by   UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_double_booking UNIQUE (tutor_id, scheduled_at)
);

CREATE TABLE booking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status   booking_status NOT NULL,
  actor_id    UUID REFERENCES auth.users(id),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX bookings_student_idx ON bookings (student_id, created_at DESC);
CREATE INDEX bookings_tutor_idx ON bookings (tutor_id, scheduled_at);
CREATE INDEX bookings_status_idx ON bookings (status) WHERE status IN ('awaiting_confirmation', 'confirmed', 'disputed');

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_student_select"
  ON bookings FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "bookings_tutor_select"
  ON bookings FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "bookings_student_insert"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id AND get_user_role() = 'student');

CREATE POLICY "bookings_admin_select"
  ON bookings FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "events_own_select"
  ON booking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
    )
  );
