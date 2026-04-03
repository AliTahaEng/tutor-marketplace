-- Add push token and contact fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add Stripe fields to tutor_profiles
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
