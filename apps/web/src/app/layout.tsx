import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { DrawerProvider } from '@/components/DrawerProvider'
import { TutorDrawer } from '@/components/TutorDrawer'
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
    >
      <body style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <NextIntlClientProvider messages={messages}>
          <DrawerProvider>
            <NavBar user={user} locale={locale} />
            {children}
            <TutorDrawer />
          </DrawerProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

function NavBar({ user, locale }: { user: any; locale: string }) {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      background: 'rgba(253,246,236,0.85)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link href="/" style={{
        fontWeight: 800,
        fontSize: '20px',
        color: '#92400e',
        textDecoration: 'none',
        letterSpacing: '-0.5px',
      }}>
        TutorQatar
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' }}>
        <Link href="/search" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>
          Find Tutors
        </Link>
        {user ? (
          <>
            <Link href="/bookings" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>
              My Bookings
            </Link>
            <Link href="/messages" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>
              Messages
            </Link>
            <Link href="/dashboard" style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px',
            }}>
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/sign-in" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
            <Link href="/sign-up/student" style={{
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px',
            }}>
              Sign Up
            </Link>
          </>
        )}
        <LanguageSwitcher currentLocale={locale} />
      </div>
    </nav>
  )
}
