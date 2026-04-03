-- supabase/migrations/20240101000003_tutor_availability.sql

-- Recurring weekly availability slots (tutor sets these)
CREATE TABLE tutor_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  CHECK (end_time > start_time),
  UNIQUE (tutor_id, day_of_week, start_time)   -- No duplicate slots
);

ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability of approved tutors
CREATE POLICY "availability_public_read"
  ON tutor_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_profiles
      WHERE id = tutor_id AND verification_status = 'approved'
    )
  );

-- Tutors manage their own availability
CREATE POLICY "availability_own_manage"
  ON tutor_availability FOR ALL
  USING (auth.uid() = tutor_id);
