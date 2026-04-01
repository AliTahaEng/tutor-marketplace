import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TutorQatar — Find Tutors in Qatar',
  description: 'Connect with verified tutors across Qatar for in-person and online sessions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b px-4 py-3 flex items-center justify-between bg-white">
          <a href="/" className="font-bold text-lg text-blue-600">TutorQatar</a>
          <div className="flex gap-4 text-sm">
            <a href="/search" className="hover:text-blue-600">Find a Tutor</a>
            <a href="/dashboard" className="hover:text-blue-600">Dashboard</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
