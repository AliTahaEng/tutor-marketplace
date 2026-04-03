-- supabase/migrations/20240101000002_tutor_profiles.sql

CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE session_type AS ENUM ('in_person', 'online', 'both');
CREATE TYPE qatar_area AS ENUM (
  'Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor', 'Lusail',
  'Al Daayen', 'Al Shamal', 'Al Shahaniya'
);

CREATE TABLE tutor_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio                   TEXT,
  years_experience      SMALLINT CHECK (years_experience >= 0 AND years_experience <= 60),
  hourly_rate_qar       NUMERIC(8,2) CHECK (hourly_rate_qar > 0),
  session_type          session_type NOT NULL DEFAULT 'both',
  areas                 qatar_area[] NOT NULL DEFAULT '{}',
  subjects              TEXT[] NOT NULL DEFAULT '{}',
  languages_taught      TEXT[] NOT NULL DEFAULT '{}'
                          CHECK (cardinality(languages_taught) > 0),
  verification_status   verification_status NOT NULL DEFAULT 'pending',
  rejection_reason      TEXT,
  stripe_account_id     TEXT,
  stripe_customer_id    TEXT,
  is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tutor_profiles_updated_at
  BEFORE UPDATE ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Documents table (references to files in Supabase Storage)
CREATE TABLE tutor_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id', 'qualification', 'certificate')),
  storage_path  TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS on tutor_profiles
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;

-- Approved tutor profiles are publicly readable
CREATE POLICY "tutor_profiles_public_read"
  ON tutor_profiles FOR SELECT
  USING (verification_status = 'approved');

-- Tutors can read their own profile
CREATE POLICY "tutor_profiles_own_read"
  ON tutor_profiles FOR SELECT
  USING (auth.uid() = id);

-- Tutors can update their own profile (cannot change verification_status)
CREATE POLICY "tutor_profiles_own_update"
  ON tutor_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    verification_status = (SELECT verification_status FROM tutor_profiles WHERE id = auth.uid())
  );

-- Tutors insert their own profile
CREATE POLICY "tutor_profiles_own_insert"
  ON tutor_profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND get_user_role() = 'tutor');

-- Admins can read all and update verification status
CREATE POLICY "tutor_profiles_admin_all"
  ON tutor_profiles FOR ALL
  USING (get_user_role() = 'admin');

-- RLS on tutor_documents
ALTER TABLE tutor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_documents_own"
  ON tutor_documents FOR ALL
  USING (auth.uid() = tutor_id);

CREATE POLICY "tutor_documents_admin"
  ON tutor_documents FOR SELECT
  USING (get_user_role() = 'admin');
