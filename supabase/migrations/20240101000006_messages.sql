CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id),
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_booking_idx ON messages (booking_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only participants of confirmed (or later) bookings can message
CREATE POLICY "messages_participants_select"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.status NOT IN ('pending_payment', 'awaiting_confirmation', 'declined', 'cancelled')
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
    )
  );

CREATE POLICY "messages_participants_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.status NOT IN ('pending_payment', 'awaiting_confirmation', 'declined', 'cancelled')
        AND (b.student_id = auth.uid() OR b.tutor_id = auth.uid())
    )
  );

-- Admins can read all messages (for dispute resolution)
CREATE POLICY "messages_admin_select"
  ON messages FOR SELECT
  USING (get_user_role() = 'admin');

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
