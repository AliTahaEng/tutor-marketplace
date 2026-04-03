import { getDashboardStats, getTopSubjects } from '@/lib/analytics/queries'
import { requireAdmin } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function AdminDashboard() {
  await requireAdmin()
  const [stats, topSubjects] = await Promise.all([getDashboardStats(), getTopSubjects(5)])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Revenue This Month" value={`${stats.revenueThisMonthQar.toLocaleString()} QAR`} />
        <StatCard label="Active Tutors" value={stats.activeTutors.toString()} />
        <StatCard label="Sessions This Month" value={stats.sessionsThisMonth.toString()} />
        <StatCard label="Total Users" value={stats.totalUsers.toString()} />
        <StatCard label="Open Disputes" value={stats.openDisputes.toString()} highlight={stats.openDisputes > 0} />
      </div>

      <div className="flex gap-4">
        <Link href="/tutors" className="flex-1 border rounded-xl p-4 hover:bg-slate-50 transition-colors">
          <div className="text-sm text-muted-foreground">Pending Approvals</div>
          <div className="text-xl font-bold text-amber-600">{stats.pendingApprovals} waiting →</div>
        </Link>
        <Link href="/disputes" className="flex-1 border rounded-xl p-4 hover:bg-slate-50 transition-colors">
          <div className="text-sm text-muted-foreground">Open Disputes</div>
          <div className="text-xl font-bold text-red-600">{stats.openDisputes} open →</div>
        </Link>
      </div>

      {topSubjects.length > 0 && (
        <div className="border rounded-xl p-4">
          <div className="font-semibold mb-4">Top Subjects This Month</div>
          <div className="space-y-3">
            {topSubjects.map(({ subject, count }) => (
              <div key={subject} className="flex items-center gap-3">
                <div className="text-sm w-32 truncate font-medium">{subject}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${(count / (topSubjects[0]?.count ?? 1)) * 100}%` }}
                  />
                </div>
                <div className="text-sm font-medium w-8 text-right">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${highlight ? 'text-red-700' : ''}`}>{value}</div>
    </div>
  )
}
