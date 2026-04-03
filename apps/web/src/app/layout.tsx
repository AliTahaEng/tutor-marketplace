import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'TutorQatar — Find Tutors in Qatar',
  description: 'Connect with verified tutors across Qatar for in-person and online sessions.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={locale === 'ar' ? 'font-arabic' : ''}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <nav className="border-b px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-50">
            <Link href="/" className="font-bold text-lg text-blue-600">TutorQatar</Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/search" className="hover:text-blue-600 transition-colors">
                Find a Tutor
              </Link>
              {user ? (
                <>
                  <Link href="/bookings" className="hover:text-blue-600 transition-colors">
                    My Bookings
                  </Link>
                  <Link href="/messages" className="hover:text-blue-600 transition-colors">
                    Messages
                  </Link>
                  <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link href="/sign-in" className="hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
              )}
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </nav>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
