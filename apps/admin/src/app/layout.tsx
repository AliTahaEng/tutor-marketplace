import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TutorQatar Admin',
  description: 'Admin dashboard for TutorQatar',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <nav className="w-56 border-r bg-slate-50 flex-shrink-0 p-4 space-y-1">
            <div className="font-bold text-blue-600 text-lg mb-6 px-2">TutorQatar Admin</div>
            <a href="/admin" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium">
              Dashboard
            </a>
            <a href="/admin/tutors" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium">
              Tutor Approvals
            </a>
            <a href="/admin/disputes" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium">
              Disputes
            </a>
            <a href="/admin/bookings" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium">
              Bookings
            </a>
            <a href="/admin/users" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium">
              Users
            </a>
          </nav>
          <main className="flex-1 overflow-auto bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
