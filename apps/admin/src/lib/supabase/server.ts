import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin always uses service role — bypasses RLS
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
