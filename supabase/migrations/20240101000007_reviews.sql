CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES auth.users(id),
  tutor_id    UUID NOT NULL REFERENCES tutor_profiles(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT CHECK (char_length(comment) <= 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reviews_tutor_idx ON reviews (tutor_id, created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (appear on public tutor profiles)
CREATE POLICY "reviews_public_select"
  ON reviews FOR SELECT
  USING (true);

-- Only the student of a completed booking can insert a review
CREATE POLICY "reviews_student_insert"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND get_user_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.student_id = auth.uid()
        AND b.status = 'completed'
        AND b.tutor_id = tutor_id
    )
  );

-- Students can update their review within 7 days
CREATE POLICY "reviews_student_update"
  ON reviews FOR UPDATE
  USING (
    auth.uid() = student_id
    AND created_at > NOW() - INTERVAL '7 days'
  );

-- Admins can delete abusive reviews
CREATE POLICY "reviews_admin_delete"
  ON reviews FOR DELETE
  USING (get_user_role() = 'admin');
