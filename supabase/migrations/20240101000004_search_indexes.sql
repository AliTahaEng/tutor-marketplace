-- supabase/migrations/20240101000004_search_indexes.sql

-- Add tsvector column for full-text search
ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(bio, '') || ' ' || array_to_string(subjects, ' '))
    ) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS tutor_profiles_search_idx
  ON tutor_profiles USING GIN (search_vector);

-- Index for area filtering (GIN on arrays)
CREATE INDEX IF NOT EXISTS tutor_profiles_areas_idx
  ON tutor_profiles USING GIN (areas);

-- Index for hourly_rate_qar range queries
CREATE INDEX IF NOT EXISTS tutor_profiles_rate_idx
  ON tutor_profiles (hourly_rate_qar);

-- Index for featured tutors (sort priority)
CREATE INDEX IF NOT EXISTS tutor_profiles_featured_idx
  ON tutor_profiles (is_featured DESC, created_at DESC)
  WHERE verification_status = 'approved';

-- Composite view for search results (joins profile name and aggregates reviews)
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
    tp.is_featured,
    tp.search_vector,
    COALESCE(r.avg_rating, 0) AS avg_rating,
    COALESCE(r.review_count, 0) AS review_count
  FROM tutor_profiles tp
  JOIN profiles p ON p.id = tp.id
  LEFT JOIN (
    SELECT tutor_id, AVG(rating)::NUMERIC(3,2) AS avg_rating, COUNT(*) AS review_count
    FROM reviews
    GROUP BY tutor_id
  ) r ON r.tutor_id = tp.id
  WHERE tp.verification_status = 'approved';
