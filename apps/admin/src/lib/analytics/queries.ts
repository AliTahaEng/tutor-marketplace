import { createAdminClient } from '@/lib/supabase/server'

const supabase = createAdminClient()

export async function getDashboardStats() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [revenueResult, tutorsResult, bookingsResult, usersResult, disputesResult, pendingResult] =
    await Promise.all([
      supabase
        .from('bookings')
        .select('platform_fee_qar')
        .eq('status', 'paid')
        .gte('completed_at', startOfMonth),
      supabase
        .from('tutor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'approved'),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'completed', 'paid'])
        .gte('created_at', startOfMonth),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'disputed'),
      supabase
        .from('tutor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending'),
    ])

  const revenue = (revenueResult.data ?? []).reduce(
    (sum, b) => sum + Number(b.platform_fee_qar), 0
  )

  return {
    revenueThisMonthQar: Number(revenue.toFixed(2)),
    activeTutors:        tutorsResult.count  ?? 0,
    sessionsThisMonth:   bookingsResult.count ?? 0,
    totalUsers:          usersResult.count    ?? 0,
    openDisputes:        disputesResult.count ?? 0,
    pendingApprovals:    pendingResult.count  ?? 0,
  }
}

/**
 * Returns top N subjects from completed/paid bookings.
 * Delegates GROUP BY to Postgres via the get_top_subjects RPC
 * (migration 000012) — zero rows pulled into Node.js memory.
 */
export async function getTopSubjects(limit = 10) {
  const { data, error } = await supabase.rpc('get_top_subjects', { limit_n: limit })

  if (error) {
    console.error('[analytics] get_top_subjects RPC error:', error.message)
    return []
  }

  return (data ?? []) as { subject: string; count: number }[]
}
