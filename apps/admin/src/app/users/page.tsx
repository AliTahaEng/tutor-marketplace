import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'

export default async function UsersPage({ searchParams }: { searchParams: { role?: string } }) {
  await requireAdmin()
  const supabase = createAdminClient()

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (searchParams.role) {
    query = query.eq('role', searchParams.role)
  }

  const { data: users, count } = await query

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Users</h1>

      <div className="flex gap-2 mb-4">
        {['', 'student', 'tutor', 'admin'].map(r => (
          <a
            key={r}
            href={r ? `?role=${r}` : '?'}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              (searchParams.role ?? '') === r
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {r || 'All'}
          </a>
        ))}
      </div>

      <div className="text-sm text-muted-foreground mb-3">{count ?? 0} users</div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'tutor' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
