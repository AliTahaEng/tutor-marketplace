import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isRateLimited, RATE_LIMITS } from '@/lib/security/rate-limiter'

const PROTECTED_ROUTES = ['/dashboard', '/bookings', '/profile', '/messages', '/tutor/onboarding', '/tutor/payout-setup']
const AUTH_ROUTES = ['/sign-in', '/sign-up']

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'unknown'
  const path = request.nextUrl.pathname

  // Rate limit sign-in attempts: 5 per minute per IP (Upstash Redis if configured)
  if (path === '/sign-in' || path.startsWith('/api/auth')) {
    if (await isRateLimited(`auth:${ip}`, RATE_LIMITS.auth.max, RATE_LIMITS.auth.windowMs)) {
      return new NextResponse('Too many requests. Please try again later.', {
        status: 429,
        headers: { 'Retry-After': '60' },
      })
    }
  }

  // Rate limit payment API: 10 per minute per IP
  if (path.startsWith('/api/payments')) {
    if (await isRateLimited(`payment:${ip}`, RATE_LIMITS.payment.max, RATE_LIMITS.payment.windowMs)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_ROUTES.some(r => path.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some(r => path.startsWith(r))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
