-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 000011: Prevent double-booking
--
-- A student must not be able to book the same tutor at the exact same datetime
-- more than once (in active statuses). Cancelled/declined/refunded bookings are
-- excluded so a student can rebook after a cancellation.
-- ─────────────────────────────────────────────────────────────────────────────

-- Partial unique index: one active booking per (tutor, scheduled_at)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_double_book
  ON bookings (tutor_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'declined', 'refunded');

-- Add a helpful constraint name for the error code check in app code
-- (23505 = unique_violation — already handled in createBooking action)

-- Also prevent a student from booking the same slot twice with the same tutor
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_student_no_duplicate
  ON bookings (student_id, tutor_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'declined', 'refunded');
