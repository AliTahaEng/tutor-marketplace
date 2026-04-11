# TutorQatar UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire TutorQatar web app UI with the Desert Gold design system, GSAP + Framer Motion animations, and 5 premium enhancement features (skeleton loaders, quick-preview drawer, booking celebration, live autocomplete, session countdown).

**Architecture:** Server Components handle data fetching; Client Components (marked `'use client'`) handle all animations and interactivity. Shared UI components live in `apps/web/src/components/ui/`. Animation libraries (GSAP, Framer Motion) only load in client components. The `DrawerProvider` context wraps `layout.tsx` to enable the quick-preview drawer from any tutor card on any page.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v4, Framer Motion, GSAP + ScrollTrigger, canvas-confetti, Plus Jakarta Sans (Google Font via next/font), Supabase

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `apps/web/src/app/globals.css` | Desert Gold tokens + shimmer keyframe |
| Modify | `apps/web/src/app/layout.tsx` | Font, nav redesign, DrawerProvider wrapper |
| Create | `apps/web/src/components/ui/GoldButton.tsx` | Amber CTA button |
| Create | `apps/web/src/components/ui/SectionHeading.tsx` | Consistent heading + subtitle |
| Create | `apps/web/src/components/ui/SubjectPill.tsx` | Amber pill badge |
| Create | `apps/web/src/components/ui/GeometricPattern.tsx` | SVG decorative pattern |
| Create | `apps/web/src/components/ui/AnimatedSection.tsx` | GSAP scroll-trigger fade-up wrapper |
| Create | `apps/web/src/components/ui/StatCounter.tsx` | GSAP count-up number |
| Create | `apps/web/src/components/ui/FloatingCard.tsx` | Framer Motion bobbing card |
| Create | `apps/web/src/components/ui/PageWrapper.tsx` | Framer Motion page transition |
| Create | `apps/web/src/components/ui/TutorCard.tsx` | Animated tutor card |
| Create | `apps/web/src/components/ui/SkeletonCard.tsx` | Gold shimmer skeleton |
| Create | `apps/web/src/components/ui/SearchAutocomplete.tsx` | Live search dropdown |
| Create | `apps/web/src/components/ui/BookingCelebration.tsx` | Confetti + checkmark overlay |
| Create | `apps/web/src/components/ui/SessionCountdown.tsx` | Live countdown timer |
| Create | `apps/web/src/hooks/useClickOutside.ts` | Outside-click hook |
| Create | `apps/web/src/hooks/useTutorDrawer.ts` | Drawer open/close hook |
| Create | `apps/web/src/components/DrawerProvider.tsx` | Context provider for tutor drawer |
| Create | `apps/web/src/components/TutorDrawer.tsx` | Bottom-sheet quick-preview |
| Rewrite | `apps/web/src/app/page.tsx` | Homepage (Split Hero + all sections) |
| Rewrite | `apps/web/src/app/search/page.tsx` | Search (server shell) |
| Create | `apps/web/src/app/search/SearchClient.tsx` | Search client component |
| Rewrite | `apps/web/src/app/tutor/[id]/page.tsx` | Tutor profile |
| Rewrite | `apps/web/src/app/(auth)/sign-in/page.tsx` | Sign in |
| Rewrite | `apps/web/src/app/(auth)/sign-up/student/page.tsx` | Student sign-up |
| Rewrite | `apps/web/src/app/(auth)/sign-up/tutor/page.tsx` | Tutor sign-up |
| Rewrite | `apps/web/src/app/dashboard/page.tsx` | Dashboard |
| Rewrite | `apps/web/src/app/bookings/page.tsx` | Bookings list |
| Rewrite | `apps/web/src/app/bookings/[id]/page.tsx` | Booking detail |
| Rewrite | `apps/web/src/app/messages/page.tsx` | Messages list |
| Rewrite | `apps/web/src/app/messages/[bookingId]/page.tsx` | Chat page |
| Rewrite | `apps/web/src/app/tutor/onboarding/page.tsx` | Tutor onboarding |
| Rewrite | `apps/web/src/app/tutor/payout-setup/page.tsx` | Payout setup |
| Rewrite | `apps/web/src/app/bookings/[id]/pay/page.tsx` | Payment page |
| Rewrite | `apps/web/src/app/bookings/[id]/review/page.tsx` | Review page |

---

## Task 1: Install Dependencies

**Files:** `apps/web/package.json`

- [ ] **Step 1: Install animation + confetti packages**

Run from the monorepo root:
```bash
cd /path/to/tutor-marketplace
pnpm --filter @tutor/web add framer-motion gsap @gsap/react canvas-confetti
pnpm --filter @tutor/web add -D @types/canvas-confetti
```

Expected output: packages added to `apps/web/package.json` dependencies.

- [ ] **Step 2: Verify installation**

```bash
pnpm --filter @tutor/web list framer-motion gsap canvas-confetti
```

Expected: version numbers printed for all three.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat: install framer-motion, gsap, canvas-confetti for UI redesign"
```

---

## Task 2: Design Tokens (globals.css)

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Replace globals.css**

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700&display=swap');

:root {
  --color-bg:            #fdf6ec;
  --color-bg-alt:        #fdebd0;
  --color-bg-dark:       #1c1008;
  --color-primary:       #d97706;
  --color-primary-hover: #b45309;
  --color-primary-light: #fef3c7;
  --color-gold:          #f59e0b;
  --color-gold-bright:   #fcd34d;
  --color-border:        #e5c99a;
  --color-border-dark:   #f0d9b5;
  --color-text:          #1c1917;
  --color-text-muted:    #78350f;
  --color-text-faint:    #a16207;
  --shadow-card:   0 4px 20px rgba(180, 140, 70, 0.12);
  --shadow-lift:   0 12px 40px rgba(180, 140, 70, 0.22);
  --shadow-float:  0 8px 32px rgba(180, 140, 70, 0.18);
  --shadow-glow:   0 0 40px rgba(217, 119, 6, 0.15);
}

*, *::before, *::after { box-sizing: border-box; }

html {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
  scroll-behavior: smooth;
}

html[lang="ar"] {
  font-family: 'Noto Sans Arabic', sans-serif;
}

/* Gold shimmer skeleton animation */
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #fdebd0 0px,
    #fef3c7 150px,
    #fdebd0 300px
  );
  background-size: 600px auto;
  animation: shimmer 1.5s linear infinite;
}
```

- [ ] **Step 2: Start dev server and verify the background is warm cream**

```bash
pnpm --filter @tutor/web dev
```

Open `http://localhost:3000` — page background should be `#fdf6ec` (warm cream), not white.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat: Desert Gold design tokens + shimmer animation in globals.css"
```

---

## Task 3: Layout — Nav + Font + DrawerProvider

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

The layout is a server component. We add `DrawerProvider` (client) as a wrapper so all child pages can open the tutor drawer. We also redesign the nav with the Desert Gold style and sticky blur effect.

- [ ] **Step 1: Rewrite layout.tsx**

```tsx
// apps/web/src/app/layout.tsx
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
```

> **Note:** `DrawerProvider` and `TutorDrawer` are created in Tasks 12–13. The build will fail until those files exist. Create them as empty stubs first in the next step.

- [ ] **Step 2: Create stub files so layout compiles**

Create `apps/web/src/components/DrawerProvider.tsx`:
```tsx
'use client'
import React, { createContext, useContext, useState } from 'react'

interface DrawerCtx { tutorId: string | null; openDrawer: (id: string) => void; closeDrawer: () => void }
const Ctx = createContext<DrawerCtx>({ tutorId: null, openDrawer: () => {}, closeDrawer: () => {} })
export const useDrawerCtx = () => useContext(Ctx)

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [tutorId, setTutorId] = useState<string | null>(null)
  return (
    <Ctx.Provider value={{ tutorId, openDrawer: setTutorId, closeDrawer: () => setTutorId(null) }}>
      {children}
    </Ctx.Provider>
  )
}
```

Create `apps/web/src/components/TutorDrawer.tsx`:
```tsx
'use client'
export function TutorDrawer() { return null }
```

- [ ] **Step 3: Verify nav renders in Desert Gold style**

```bash
pnpm --filter @tutor/web dev
```

Open `http://localhost:3000` — nav should have warm cream blurred background, "TutorQatar" in amber-900 bold, amber Sign Up button.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/components/DrawerProvider.tsx apps/web/src/components/TutorDrawer.tsx
git commit -m "feat: Desert Gold nav + DrawerProvider shell in layout"
```

---

## Task 4: Simple Shared Components

**Files:**
- Create: `apps/web/src/components/ui/GoldButton.tsx`
- Create: `apps/web/src/components/ui/SectionHeading.tsx`
- Create: `apps/web/src/components/ui/SubjectPill.tsx`
- Create: `apps/web/src/components/ui/GeometricPattern.tsx`

These are simple, no animation. Safe to use in any server or client component.

- [ ] **Step 1: Create GoldButton**

```tsx
// apps/web/src/components/ui/GoldButton.tsx
import Link from 'next/link'

interface GoldButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'solid' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
  fullWidth?: boolean
}

export function GoldButton({
  href, onClick, children, variant = 'solid', size = 'md',
  type = 'button', disabled, fullWidth
}: GoldButtonProps) {
  const padding = size === 'sm' ? '8px 18px' : size === 'lg' ? '16px 36px' : '12px 28px'
  const fontSize = size === 'sm' ? '13px' : size === 'lg' ? '17px' : '15px'
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding,
    fontSize,
    fontWeight: 700,
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    border: 'none',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.6 : 1,
    ...(variant === 'solid' ? {
      background: 'var(--color-primary)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
    } : {
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '2px solid var(--color-primary)',
    }),
  }

  if (href) {
    return <Link href={href} style={baseStyle}>{children}</Link>
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={baseStyle}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create SectionHeading**

```tsx
// apps/web/src/components/ui/SectionHeading.tsx
interface SectionHeadingProps {
  title: string
  subtitle?: string
  centered?: boolean
}

export function SectionHeading({ title, subtitle, centered }: SectionHeadingProps) {
  return (
    <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '36px',
        fontWeight: 800,
        color: 'var(--color-text)',
        lineHeight: 1.2,
        letterSpacing: '-0.5px',
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: '17px',
          color: 'var(--color-text-muted)',
          marginTop: '12px',
          lineHeight: 1.6,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create SubjectPill**

```tsx
// apps/web/src/components/ui/SubjectPill.tsx
interface SubjectPillProps {
  label: string
  active?: boolean
  onClick?: () => void
  icon?: string
}

export function SubjectPill({ label, active, onClick, icon }: SubjectPillProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 14px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        background: active ? 'var(--color-primary)' : 'var(--color-primary-light)',
        color: active ? '#fff' : '#92400e',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-gold-bright)'}`,
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Create GeometricPattern**

```tsx
// apps/web/src/components/ui/GeometricPattern.tsx
interface GeometricPatternProps {
  opacity?: number
  color?: string
}

export function GeometricPattern({ opacity = 0.04, color = '#d97706' }: GeometricPatternProps) {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,16 58,44 30,58 2,44 2,16" fill="none" stroke={color} strokeWidth="1" />
          <polygon points="30,14 46,22 46,38 30,46 14,38 14,22" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo)" />
    </svg>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat: GoldButton, SectionHeading, SubjectPill, GeometricPattern components"
```

---

## Task 5: Animated Components (GSAP + Framer Motion)

**Files:**
- Create: `apps/web/src/components/ui/AnimatedSection.tsx`
- Create: `apps/web/src/components/ui/StatCounter.tsx`
- Create: `apps/web/src/components/ui/FloatingCard.tsx`
- Create: `apps/web/src/components/ui/PageWrapper.tsx`

All `'use client'` — use Framer Motion or GSAP.

- [ ] **Step 1: Create AnimatedSection**

```tsx
// apps/web/src/components/ui/AnimatedSection.tsx
'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}

export function AnimatedSection({ children, className, style, delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [delay])

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create StatCounter**

```tsx
// apps/web/src/components/ui/StatCounter.tsx
'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface StatCounterProps {
  value: number
  suffix?: string
  label: string
}

export function StatCounter({ value, suffix = '', label }: StatCounterProps) {
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = numRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        { val: 0 },
        {
          val: value,
          duration: 2,
          ease: 'power2.out',
          snap: { val: 1 },
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate() {
            if (el) el.textContent = Math.round((this as any).targets()[0].val) + suffix
          },
        }
      )
    })

    return () => ctx.revert()
  }, [value, suffix])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
        <span ref={numRef}>0{suffix}</span>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create FloatingCard**

```tsx
// apps/web/src/components/ui/FloatingCard.tsx
'use client'
import { motion } from 'framer-motion'

interface FloatingCardProps {
  children: React.ReactNode
  delay?: number
  rotate?: number
  style?: React.CSSProperties
}

export function FloatingCard({ children, delay = 0, rotate = 0, style }: FloatingCardProps) {
  return (
    <motion.div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-float)',
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 3.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Create PageWrapper**

```tsx
// apps/web/src/components/ui/PageWrapper.tsx
'use client'
import { motion } from 'framer-motion'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/AnimatedSection.tsx apps/web/src/components/ui/StatCounter.tsx apps/web/src/components/ui/FloatingCard.tsx apps/web/src/components/ui/PageWrapper.tsx
git commit -m "feat: GSAP AnimatedSection + StatCounter, Framer Motion FloatingCard + PageWrapper"
```

---

## Task 6: TutorCard Component

**Files:**
- Create: `apps/web/src/components/ui/TutorCard.tsx`

The card is client-side (Framer Motion hover). It receives tutor data as props and optionally calls `openDrawer` from the drawer context.

- [ ] **Step 1: Create TutorCard**

```tsx
// apps/web/src/components/ui/TutorCard.tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useDrawerCtx } from '@/components/DrawerProvider'

export interface TutorCardData {
  id: string
  fullName: string
  avatarUrl: string | null
  subjects: string[]
  areas: string[]
  hourlyRateQar: number
  sessionType: string
  avgRating: number
  reviewCount: number
  isFeatured: boolean
  yearsExperience: number
}

interface TutorCardProps {
  tutor: TutorCardData
  index?: number
}

export function TutorCard({ tutor, index = 0 }: TutorCardProps) {
  const { openDrawer } = useDrawerCtx()

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: 'var(--shadow-lift)' }}
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease',
      }}
      onClick={() => openDrawer(tutor.id)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          border: '2px solid var(--color-gold-bright)',
        }}>
          {tutor.avatarUrl
            ? <img src={tutor.avatarUrl} alt={tutor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '22px' }}>👤</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>{tutor.fullName}</span>
            {tutor.isFeatured && (
              <span style={{
                background: 'var(--color-primary-light)',
                color: '#92400e',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
                border: '1px solid var(--color-gold-bright)',
              }}>⭐ Featured</span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-faint)', marginTop: '3px' }}>
            {tutor.subjects.slice(0, 3).join(' · ')}
          </div>
        </div>
      </div>

      {/* Rating + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: 'var(--color-gold)', fontSize: '14px' }}>★</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
            {Number(tutor.avgRating).toFixed(1)}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>
            ({tutor.reviewCount})
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }}>
            {tutor.hourlyRateQar}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginLeft: '3px' }}>QAR/hr</span>
        </div>
      </div>

      {/* Areas + mode */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {tutor.areas.slice(0, 2).map(area => (
          <span key={area} style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}>📍 {area}</span>
        ))}
        <span style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}>
          {tutor.sessionType === 'in_person' ? '🏫 In-person' : tutor.sessionType === 'online' ? '💻 Online' : '🏫💻 Both'}
        </span>
      </div>

      {/* CTA */}
      <Link
        href={`/tutor/${tutor.id}`}
        onClick={e => e.stopPropagation()}
        style={{
          display: 'block',
          textAlign: 'center',
          background: 'var(--color-primary)',
          color: '#fff',
          padding: '10px',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
        }}
      >
        View Profile
      </Link>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/TutorCard.tsx
git commit -m "feat: TutorCard component with Framer Motion hover and drawer integration"
```

---

## Task 7: Enhancement Hooks

**Files:**
- Create: `apps/web/src/hooks/useClickOutside.ts`
- Create: `apps/web/src/hooks/useTutorDrawer.ts`

- [ ] **Step 1: Create useClickOutside**

```ts
// apps/web/src/hooks/useClickOutside.ts
'use client'
import { useEffect, RefObject } from 'react'

export function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}
```

- [ ] **Step 2: Create useTutorDrawer**

```ts
// apps/web/src/hooks/useTutorDrawer.ts
'use client'
import { useDrawerCtx } from '@/components/DrawerProvider'

export function useTutorDrawer() {
  return useDrawerCtx()
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/
git commit -m "feat: useClickOutside and useTutorDrawer hooks"
```

---

## Task 8: SkeletonCard (Enhancement 5.1 — Gold Shimmer)

**Files:**
- Create: `apps/web/src/components/ui/SkeletonCard.tsx`

- [ ] **Step 1: Create SkeletonCard**

```tsx
// apps/web/src/components/ui/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Avatar + name row */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
        <div className="skeleton-shimmer" style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: '16px', borderRadius: '8px', marginBottom: '8px', width: '60%' }} />
          <div className="skeleton-shimmer" style={{ height: '12px', borderRadius: '8px', width: '80%' }} />
        </div>
      </div>
      {/* Rating + price row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div className="skeleton-shimmer" style={{ height: '14px', borderRadius: '8px', width: '80px' }} />
        <div className="skeleton-shimmer" style={{ height: '18px', borderRadius: '8px', width: '70px' }} />
      </div>
      {/* Pills row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div className="skeleton-shimmer" style={{ height: '24px', borderRadius: '9999px', width: '80px' }} />
        <div className="skeleton-shimmer" style={{ height: '24px', borderRadius: '9999px', width: '70px' }} />
      </div>
      {/* Button */}
      <div className="skeleton-shimmer" style={{ height: '38px', borderRadius: '10px' }} />
    </div>
  )
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/SkeletonCard.tsx
git commit -m "feat: SkeletonCard with gold shimmer animation"
```

---

## Task 9: SearchAutocomplete (Enhancement 5.4)

**Files:**
- Create: `apps/web/src/components/ui/SearchAutocomplete.tsx`

This is a client component that wraps a search input and shows a dropdown with subject suggestions + debounced tutor name matches from Supabase.

- [ ] **Step 1: Create SearchAutocomplete**

```tsx
// apps/web/src/components/ui/SearchAutocomplete.tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useClickOutside } from '@/hooks/useClickOutside'

const SUBJECTS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Arabic',
  'French', 'History', 'Computer Science', 'Economics', 'Geography',
  'Islamic Studies', 'Science', 'Literature', 'Music',
]

interface Suggestion {
  type: 'subject' | 'tutor'
  label: string
  value: string
}

interface SearchAutocompleteProps {
  defaultValue?: string
  onSearch: (value: string) => void
  placeholder?: string
  size?: 'md' | 'lg'
}

export function SearchAutocomplete({
  defaultValue = '',
  onSearch,
  placeholder = 'Search subject or tutor…',
  size = 'md',
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useClickOutside(containerRef, () => setOpen(false))

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 1) { setSuggestions([]); setOpen(false); return }

    const subjectMatches: Suggestion[] = SUBJECTS
      .filter(s => s.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map(s => ({ type: 'subject', label: s, value: s }))

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tutor')
      .ilike('full_name', `%${q}%`)
      .limit(4)

    const tutorMatches: Suggestion[] = (data ?? []).map((t: any) => ({
      type: 'tutor',
      label: t.full_name,
      value: t.full_name,
    }))

    const all = [...subjectMatches, ...tutorMatches].slice(0, 8)
    setSuggestions(all)
    setOpen(all.length > 0)
    setActiveIdx(-1)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  function selectSuggestion(value: string) {
    setQuery(value)
    setOpen(false)
    onSearch(value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter') {
      if (activeIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIdx].value) }
      else { setOpen(false); onSearch(query) }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: size === 'lg' ? '16px 20px' : '12px 16px',
    fontSize: size === 'lg' ? '16px' : '14px',
    background: '#fff',
    color: 'var(--color-text)',
    outline: 'none',
    boxShadow: 'var(--shadow-card)',
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        style={inputStyle}
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lift)',
              zIndex: 200,
              overflow: 'hidden',
            }}
          >
            {suggestions.map((s, i) => (
              <motion.div
                key={s.value + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => selectSuggestion(s.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: activeIdx === i ? 'var(--color-primary-light)' : 'transparent',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-bg-alt)' : 'none',
                }}
              >
                <span style={{ fontSize: '16px' }}>{s.type === 'subject' ? '📚' : '👤'}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-faint)' }}>
                  {s.type === 'subject' ? 'Subject' : 'Tutor'}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/SearchAutocomplete.tsx
git commit -m "feat: SearchAutocomplete with subject suggestions + debounced Supabase query"
```

---

## Task 10: BookingCelebration (Enhancement 5.3)

**Files:**
- Create: `apps/web/src/components/ui/BookingCelebration.tsx`

- [ ] **Step 1: Create BookingCelebration**

```tsx
// apps/web/src/components/ui/BookingCelebration.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export function BookingCelebration({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)

    const fire = (origin: { x: number; y: number }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin,
        startVelocity: 45,
        gravity: 1.2,
        scalar: 1.1,
        colors: ['#d97706', '#f59e0b', '#fcd34d', '#fef3c7', '#1c1917'],
      })
    }

    fire({ x: 0.3, y: 0.6 })
    setTimeout(() => fire({ x: 0.7, y: 0.6 }), 150)

    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [show])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '48px 56px',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}
          >
            {/* Animated checkmark */}
            <motion.svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: '24px' }}>
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-gold-bright)" strokeWidth="4" />
              <motion.path
                d="M24 40 L35 52 L56 30"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              />
            </motion.svg>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
              Session Booked!
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', margin: 0 }}>
              Your session has been confirmed. Good luck!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/BookingCelebration.tsx
git commit -m "feat: BookingCelebration with canvas-confetti + Framer Motion checkmark"
```

---

## Task 11: SessionCountdown (Enhancement 5.5)

**Files:**
- Create: `apps/web/src/components/ui/SessionCountdown.tsx`

- [ ] **Step 1: Create SessionCountdown**

```tsx
// apps/web/src/components/ui/SessionCountdown.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SessionCountdownProps {
  sessionAt: string   // ISO datetime string
  bookingId: string
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours   = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { hours, minutes, seconds }
}

export function SessionCountdown({ sessionAt, bookingId }: SessionCountdownProps) {
  const sessionTime = new Date(sessionAt).getTime()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const msLeft = sessionTime - now
  const timeLeft = formatCountdown(msLeft)

  if (!timeLeft) {
    return (
      <Link href={`/messages/${bookingId}`} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(217,119,6,0.15)',
        border: '1px solid var(--color-gold-bright)',
        borderRadius: '12px',
        padding: '12px 20px',
        color: 'var(--color-primary)',
        fontWeight: 700,
        textDecoration: 'none',
        fontSize: '15px',
      }}>
        🎓 Session in progress →
      </Link>
    )
  }

  // Ring: depletes over 24h before session
  const totalWindow = 24 * 60 * 60 * 1000
  const fraction = Math.min(1, Math.max(0, msLeft / totalWindow))
  const circumference = 2 * Math.PI * 44 // r=44
  const dashOffset = circumference * (1 - fraction)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      {/* SVG ring */}
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-bg-alt)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="44"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary)">
          NEXT
        </text>
      </svg>

      {/* Text countdown */}
      <div>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 6px', fontWeight: 600 }}>
          Your next session starts in
        </p>
        <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', margin: 0, lineHeight: 1 }}>
          <span style={{ color: 'var(--color-primary)' }}>{timeLeft.hours}h</span>
          {' '}
          <span style={{ color: 'var(--color-primary)' }}>{String(timeLeft.minutes).padStart(2, '0')}m</span>
          {' '}
          <span style={{ color: 'var(--color-primary)' }}>{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/SessionCountdown.tsx
git commit -m "feat: SessionCountdown with SVG ring + live 1s interval"
```

---

## Task 12: TutorDrawer — Full Implementation (Enhancement 5.2)

**Files:**
- Modify: `apps/web/src/components/TutorDrawer.tsx` (replace stub)

The drawer fetches tutor data on open and shows a bottom sheet with key info + Book Now button.

- [ ] **Step 1: Replace TutorDrawer stub**

```tsx
// apps/web/src/components/TutorDrawer.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useDrawerCtx } from '@/components/DrawerProvider'
import { createClient } from '@/lib/supabase/client'

interface DrawerTutor {
  id: string
  fullName: string
  avatarUrl: string | null
  subjects: string[]
  areas: string[]
  hourlyRateQar: number
  avgRating: number
  reviewCount: number
  bio: string | null
  sessionType: string
  reviews: Array<{ rating: number; comment: string | null; studentName: string }>
}

export function TutorDrawer() {
  const { tutorId, closeDrawer } = useDrawerCtx()
  const [tutor, setTutor] = useState<DrawerTutor | null>(null)
  const [loading, setLoading] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tutorId) { setTutor(null); return }

    setLoading(true)
    const supabase = createClient()

    Promise.all([
      supabase
        .from('tutor_search_results')
        .select('*')
        .eq('id', tutorId)
        .single(),
      supabase
        .from('reviews')
        .select('rating, comment, reviewer:reviewer_id(full_name)')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
        .limit(3),
    ]).then(([{ data: t }, { data: reviews }]) => {
      if (!t) { setLoading(false); return }
      setTutor({
        id: t.id,
        fullName: t.full_name,
        avatarUrl: t.avatar_url,
        subjects: t.subjects ?? [],
        areas: t.areas ?? [],
        hourlyRateQar: Number(t.hourly_rate_qar),
        avgRating: Number(t.avg_rating),
        reviewCount: Number(t.review_count),
        bio: t.bio,
        sessionType: t.session_type,
        reviews: (reviews ?? []).map((r: any) => ({
          rating: r.rating,
          comment: r.comment,
          studentName: r.reviewer?.full_name ?? 'Student',
        })),
      })
      setLoading(false)
    })
  }, [tutorId])

  // Swipe-to-close: track touch start Y
  const touchStartY = useRef(0)

  return (
    <AnimatePresence>
      {tutorId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 500,
            }}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
            onTouchEnd={e => {
              const diff = e.changedTouches[0].clientY - touchStartY.current
              if (diff > 80) closeDrawer()
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              borderRadius: '24px 24px 0 0',
              zIndex: 501,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
            </div>

            <div style={{ padding: '20px 24px 32px' }}>
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                  Loading…
                </div>
              ) : tutor ? (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                      overflow: 'hidden', flexShrink: 0,
                      border: '3px solid var(--color-gold-bright)',
                    }}>
                      {tutor.avatarUrl
                        ? <img src={tutor.avatarUrl} alt={tutor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--color-text)' }}>
                        {tutor.fullName}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-gold)' }}>★</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                          {Number(tutor.avgRating).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>
                          ({tutor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {tutor.hourlyRateQar}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>QAR/hr</div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {tutor.subjects.slice(0, 5).map(s => (
                      <span key={s} style={{
                        background: 'var(--color-primary-light)',
                        color: '#92400e',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid var(--color-gold-bright)',
                      }}>{s}</span>
                    ))}
                  </div>

                  {/* Areas + mode */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {tutor.areas.slice(0, 3).map(a => (
                      <span key={a} style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        color: 'var(--color-text-muted)',
                      }}>📍 {a}</span>
                    ))}
                    <span style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      color: 'var(--color-text-muted)',
                    }}>
                      {tutor.sessionType === 'in_person' ? '🏫 In-person' : tutor.sessionType === 'online' ? '💻 Online' : '🏫💻 Both'}
                    </span>
                  </div>

                  {/* Top reviews */}
                  {tutor.reviews.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                        Recent Reviews
                      </p>
                      {tutor.reviews.map((r, i) => (
                        <div key={i} style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          marginBottom: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                            <span style={{ color: 'var(--color-gold)', fontSize: '13px' }}>
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>{r.studentName}</span>
                          </div>
                          {r.comment && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                              {r.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTAs */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Link
                      href={`/tutor/${tutor.id}`}
                      onClick={closeDrawer}
                      style={{
                        flex: 1,
                        display: 'block',
                        textAlign: 'center',
                        padding: '12px',
                        border: '2px solid var(--color-primary)',
                        borderRadius: '12px',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '15px',
                      }}
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/tutor/${tutor.id}/book`}
                      onClick={closeDrawer}
                      style={{
                        flex: 1,
                        display: 'block',
                        textAlign: 'center',
                        padding: '12px',
                        background: 'var(--color-primary)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify drawer builds**

```bash
pnpm --filter @tutor/web build 2>&1 | tail -20
```

Expected: no TypeScript errors related to TutorDrawer or DrawerProvider.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/TutorDrawer.tsx
git commit -m "feat: TutorDrawer bottom sheet with Framer Motion spring animation"
```

---

## Task 13: Homepage Rewrite

**Files:**
- Rewrite: `apps/web/src/app/page.tsx`

The homepage is a **client component** for animations. Featured tutors are fetched via a `FeaturedTutors` server component using a sub-import pattern (inline async component).

- [ ] **Step 1: Rewrite page.tsx**

```tsx
// apps/web/src/app/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { searchTutors } from '@/lib/search/queries'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { StatCounter } from '@/components/ui/StatCounter'
import { FloatingCard } from '@/components/ui/FloatingCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GoldButton } from '@/components/ui/GoldButton'
import { SubjectPill } from '@/components/ui/SubjectPill'
import { TutorCard } from '@/components/ui/TutorCard'
import { GeometricPattern } from '@/components/ui/GeometricPattern'
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard'

const SUBJECTS = [
  { icon: '📐', label: 'Math' }, { icon: '🔬', label: 'Physics' },
  { icon: '🧪', label: 'Chemistry' }, { icon: '🧬', label: 'Biology' },
  { icon: '🌍', label: 'English' }, { icon: '📖', label: 'Arabic' },
  { icon: '🇫🇷', label: 'French' }, { icon: '📜', label: 'History' },
  { icon: '💻', label: 'Computer Science' }, { icon: '📈', label: 'Economics' },
  { icon: '🗺️', label: 'Geography' }, { icon: '☪️', label: 'Islamic Studies' },
]

const TESTIMONIALS = [
  { name: 'Fatima A.', subject: 'Math', rating: 5, text: 'My grade went from a C to an A in one month. The tutor explained everything so clearly!' },
  { name: 'Omar K.', subject: 'Physics', rating: 5, text: 'Found an amazing physics tutor in Lusail. The booking process was instant and easy.' },
  { name: 'Sara M.', subject: 'English', rating: 5, text: 'My IELTS improved by 1.5 bands. Absolutely recommend TutorQatar to all students.' },
]

async function FeaturedTutors() {
  let tutors: any[] = []
  try {
    const results = await searchTutors({ page: 1, sortBy: 'rating' } as any)
    tutors = results.tutors.slice(0, 6)
  } catch { /* DB may not be connected */ }

  if (tutors.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {tutors.map((tutor, i) => <TutorCard key={tutor.id} tutor={tutor} index={i} />)}
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      {/* ── SPLIT HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg)',
        overflow: 'hidden',
        padding: '60px 0',
      }}>
        <GeometricPattern opacity={0.035} />
        {/* Glow orb */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', gap: '60px' }}>
          {/* Left: copy + search */}
          <div style={{ flex: 1, maxWidth: '580px' }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-gold-bright)',
              borderRadius: '9999px',
              padding: '5px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#92400e',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}>
              🇶🇦 Qatar's #1 Tutor Platform
            </div>

            <h1 style={{
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--color-text)',
              margin: '0 0 20px',
              letterSpacing: '-1px',
            }}>
              Find Your<br />
              Perfect <span style={{ color: 'var(--color-primary)' }}>Tutor</span><br />
              in Qatar
            </h1>

            <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              500+ verified experts across all subjects.<br />In-person & online sessions all over Qatar.
            </p>

            {/* Search bar (static form for server-side search) */}
            <form action="/search" method="GET" style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                background: '#fff',
                border: '2px solid var(--color-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}>
                <input
                  name="q"
                  placeholder="Math, Physics, Arabic, English…"
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    background: 'transparent',
                    color: 'var(--color-text)',
                  }}
                />
                <button type="submit" style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '16px 28px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                }}>
                  Search
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <GoldButton href="/search" size="lg">Find a Tutor</GoldButton>
              <GoldButton href="/sign-up/tutor" variant="outline" size="lg">Become a Tutor</GoldButton>
            </div>
          </div>

          {/* Right: floating tutor cards */}
          <div style={{ flex: '0 0 380px', position: 'relative', height: '420px', display: 'none' }} className="hero-cards">
            <FloatingCard
              delay={0}
              rotate={-4}
              style={{ position: 'absolute', top: '20px', left: '20px', width: '160px', padding: '16px' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#d97706,#f59e0b)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Ahmed K.</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0' }}>Math · ★ 4.9</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>150 QAR/hr</div>
            </FloatingCard>

            <FloatingCard
              delay={0.5}
              rotate={3}
              style={{ position: 'absolute', top: '60px', right: '0', width: '160px', padding: '16px' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#34d399)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Sara M.</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0' }}>English · ★ 5.0</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>120 QAR/hr</div>
            </FloatingCard>

            <FloatingCard
              delay={1}
              rotate={-2}
              style={{ position: 'absolute', bottom: '60px', left: '40px', width: '180px', padding: '16px' }}
            >
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>Khalid A.</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '3px 0' }}>Physics · ★ 4.8</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>180 QAR/hr</div>
            </FloatingCard>

            {/* Just booked toast */}
            <FloatingCard
              delay={1.5}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '10px',
                width: '190px',
                padding: '12px 16px',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-gold-bright)',
              }}
            >
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 700 }}>✅ Just booked</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>Physics · Tomorrow 4pm</div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: 'var(--color-primary-light)',
        borderTop: '1px solid var(--color-gold-bright)',
        borderBottom: '1px solid var(--color-gold-bright)',
        padding: '48px 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          <StatCounter value={500} suffix="+" label="Verified Tutors" />
          <StatCounter value={4.9} suffix="★" label="Average Rating" />
          <StatCounter value={15} suffix="+" label="Subjects" />
          <StatCounter value={2000} suffix="+" label="Sessions Completed" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <AnimatedSection style={{ padding: '100px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeading
          title="How It Works"
          subtitle="Get matched with a tutor and start learning — in three simple steps."
          centered
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginTop: '60px' }}>
          {[
            { step: '01', icon: '🔍', title: 'Search & Filter', desc: 'Browse 500+ verified tutors by subject, area, price, and rating. Find the perfect match.' },
            { step: '02', icon: '📅', title: 'Book Instantly', desc: 'Choose your time slot, book in seconds, and pay securely through the platform.' },
            { step: '03', icon: '🎓', title: 'Start Learning', desc: 'Meet your tutor online or in person. Build skills, ace exams, reach your goals.' },
          ].map((item, i) => (
            <div key={item.step} style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '28px',
                boxShadow: '0 8px 24px rgba(217,119,6,0.3)',
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '2px', marginBottom: '8px' }}>
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── FEATURED TUTORS ── */}
      <section style={{ background: 'var(--color-bg-alt)', padding: '100px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <SectionHeading title="Top Tutors This Week" subtitle="Highly rated and ready to help" />
              <Link href="/search" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                Browse All Tutors →
              </Link>
            </div>
          </AnimatedSection>

          <Suspense fallback={<SkeletonCardGrid count={6} />}>
            <FeaturedTutors />
          </Suspense>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <AnimatedSection style={{ padding: '100px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeading title="Browse by Subject" subtitle="Expert tutors across every discipline" centered />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginTop: '48px' }}>
          {SUBJECTS.map(s => (
            <Link
              key={s.label}
              href={`/search?q=${s.label}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '24px 16px',
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span style={{ fontSize: '28px' }}>{s.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{s.label}</span>
            </Link>
          ))}
        </div>
      </AnimatedSection>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'var(--color-bg-alt)', padding: '100px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection>
            <SectionHeading title="What Students Say" centered />
          </AnimatedSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '48px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ color: 'var(--color-gold)', fontSize: '20px', marginBottom: '12px' }}>
                  {'★'.repeat(t.rating)}
                </div>
                <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{t.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>{t.subject} Student</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BECOME A TUTOR CTA ── */}
      <section style={{
        position: 'relative',
        background: 'var(--color-bg-dark)',
        padding: '100px 32px',
        overflow: 'hidden',
      }}>
        <GeometricPattern color="#f59e0b" opacity={0.06} />
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.15), transparent 60%)',
          pointerEvents: 'none',
        }} />
        <AnimatedSection style={{ position: 'relative', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
            Share Your Knowledge.<br />
            <span style={{ color: 'var(--color-gold)' }}>Earn in Qatar.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '40px', lineHeight: 1.6 }}>
            Join 500+ tutors earning up to 300 QAR/hr. Set your own schedule, teach your subject, grow your impact.
          </p>
          <GoldButton href="/sign-up/tutor" size="lg">Apply as a Tutor →</GoldButton>
        </AnimatedSection>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'var(--color-bg-dark)',
        borderTop: '1px solid rgba(245,158,11,0.2)',
        padding: '48px 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginBottom: '8px' }}>TutorQatar</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Qatar's Premier Tutor Marketplace</div>
          </div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            {[
              { label: 'Find Tutors', href: '/search' },
              { label: 'Sign Up', href: '/sign-up/student' },
              { label: 'For Tutors', href: '/sign-up/tutor' },
              { label: 'Sign In', href: '/sign-in' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '32px auto 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          © 2026 TutorQatar. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
```

> **CSS Note:** The `.hero-cards` div uses `display: none` by default (mobile). Add the following to globals.css to show it on large screens:
> ```css
> @media (min-width: 1024px) { .hero-cards { display: block !important; } }
> ```

- [ ] **Step 2: Add responsive hero-cards media query to globals.css**

Append to `apps/web/src/app/globals.css`:
```css
@media (min-width: 1024px) {
  .hero-cards { display: block !important; }
}
```

- [ ] **Step 3: Test homepage renders**

```bash
pnpm --filter @tutor/web dev
```

Open `http://localhost:3000` — should show: amber hero, search bar, warm cream background, stats bar, How It Works section, subject grid, dark CTA footer.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/globals.css
git commit -m "feat: homepage — Split Hero, Stats, How It Works, Featured Tutors, Subjects, CTA"
```

---

## Task 14: Search Page Rewrite

**Files:**
- Rewrite: `apps/web/src/app/search/page.tsx`
- Create: `apps/web/src/app/search/SearchClient.tsx`

Split: server component fetches results, client component handles the UI + autocomplete.

- [ ] **Step 1: Create SearchClient.tsx**

```tsx
// apps/web/src/app/search/SearchClient.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { TutorCard, TutorCardData } from '@/components/ui/TutorCard'
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

const AREAS = ['Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor', 'Lusail', 'Al Daayen', 'Al Shamal', 'Al Shahaniya']

interface SearchClientProps {
  tutors: TutorCardData[]
  total: number
  page: number
  pageSize: number
  filters: {
    q?: string
    area?: string
    sessionType?: string
    maxPriceQar?: number
    sortBy?: string
  }
}

export function SearchClient({ tutors, total, page, pageSize, filters }: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') p.delete(k)
      else p.set(k, v)
    }
    return `/search?${p.toString()}`
  }, [searchParams])

  function handleSearch(value: string) {
    router.push(buildUrl({ q: value, page: '1' }))
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top search bar */}
      <div style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <SearchAutocomplete
                defaultValue={filters.q ?? ''}
                onSearch={handleSearch}
                placeholder='Search subject or tutor name…'
                size="lg"
              />
            </div>
          </div>

          {/* Quick filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            {/* Area */}
            <select
              defaultValue={filters.area ?? ''}
              onChange={e => router.push(buildUrl({ area: e.target.value, page: '1' }))}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                background: '#fff',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="">All Qatar</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            {/* Session type */}
            <select
              defaultValue={filters.sessionType ?? ''}
              onChange={e => router.push(buildUrl({ sessionType: e.target.value, page: '1' }))}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                background: '#fff',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="">Any type</option>
              <option value="in_person">In-person</option>
              <option value="online">Online</option>
            </select>

            {/* Max price */}
            <select
              defaultValue={filters.maxPriceQar ? String(filters.maxPriceQar) : ''}
              onChange={e => router.push(buildUrl({ maxPriceQar: e.target.value, page: '1' }))}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                background: '#fff',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="">Any price</option>
              <option value="100">Under 100 QAR</option>
              <option value="200">Under 200 QAR</option>
              <option value="500">Under 500 QAR</option>
            </select>

            {/* Sort */}
            <select
              defaultValue={filters.sortBy ?? 'relevance'}
              onChange={e => router.push(buildUrl({ sortBy: e.target.value, page: '1' }))}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                background: '#fff',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>

            {(filters.q || filters.area || filters.sessionType || filters.maxPriceQar) && (
              <Link href="/search" style={{ color: '#dc2626', fontSize: '13px', padding: '8px 14px', border: '1px solid #fca5a5', borderRadius: '10px', textDecoration: 'none', background: '#fff', fontWeight: 600 }}>
                ✕ Clear
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px', fontWeight: 600 }}>
          {total} tutor{total !== 1 ? 's' : ''} found
          {filters.q ? ` for "${filters.q}"` : ''}
        </p>

        {tutors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              No tutors found
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Try different filters or search terms
            </p>
            <GoldButton href="/search">Browse All Tutors</GoldButton>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {tutors.map((tutor, i) => <TutorCard key={tutor.id} tutor={tutor} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '48px' }}>
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} style={{
                padding: '10px 20px',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: '14px',
                background: '#fff',
              }}>← Previous</Link>
            )}
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
              }}>Next →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite search/page.tsx**

```tsx
// apps/web/src/app/search/page.tsx
import { searchTutors } from '@/lib/search/queries'
import { SearchFiltersSchema } from '@tutor/core'
import { SearchClient } from './SearchClient'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function SearchPage({ searchParams }: PageProps) {
  const rawFilters = {
    q:           str(searchParams['q']),
    area:        str(searchParams['area']),
    sessionType: str(searchParams['sessionType']),
    maxPriceQar: searchParams['maxPriceQar'] ? Number(searchParams['maxPriceQar']) : undefined,
    minPriceQar: searchParams['minPriceQar'] ? Number(searchParams['minPriceQar']) : undefined,
    minRating:   searchParams['minRating']   ? Number(searchParams['minRating'])   : undefined,
    sortBy:      str(searchParams['sortBy']),
    page:        searchParams['page'] ? Number(searchParams['page']) : 1,
  }

  const parsed = SearchFiltersSchema.safeParse(rawFilters)
  const filters = parsed.success ? parsed.data : { page: 1 }

  let results = { tutors: [] as any[], total: 0, page: 1, pageSize: 12 }
  try {
    results = await searchTutors(filters as any)
  } catch { /* show empty on DB error */ }

  return (
    <SearchClient
      tutors={results.tutors}
      total={results.total}
      page={results.page}
      pageSize={results.pageSize}
      filters={{
        q: filters.q,
        area: (filters as any).area,
        sessionType: (filters as any).sessionType,
        maxPriceQar: (filters as any).maxPriceQar,
        sortBy: (filters as any).sortBy,
      }}
    />
  )
}
```

- [ ] **Step 3: Test search page**

Open `http://localhost:3000/search` — should show Desert Gold styled filters bar, autocomplete input, tutor cards in grid layout.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/search/
git commit -m "feat: search page redesign with autocomplete and tutor card grid"
```

---

## Task 15: Tutor Profile Page Rewrite

**Files:**
- Rewrite: `apps/web/src/app/tutor/[id]/page.tsx`

- [ ] **Step 1: Rewrite tutor/[id]/page.tsx**

```tsx
// apps/web/src/app/tutor/[id]/page.tsx
import { getTutorProfile, getTutorAvailability } from '@/lib/tutor/queries'
import { getTutorReviews } from '@/lib/reviews/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GoldButton } from '@/components/ui/GoldButton'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

interface PageProps { params: { id: string } }
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function TutorProfilePage({ params }: PageProps) {
  const [profile, availability, reviews] = await Promise.all([
    getTutorProfile(params.id),
    getTutorAvailability(params.id),
    getTutorReviews(params.id),
  ])

  if (!profile || profile.verification_status !== 'approved') notFound()

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const profileData = profile.profiles as any

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt) 0%, var(--color-primary-light) 100%)',
        borderBottom: '1px solid var(--color-border)',
        padding: '48px 32px',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
            overflow: 'hidden',
            border: '4px solid var(--color-gold-bright)',
            boxShadow: '0 8px 32px rgba(217,119,6,0.3)',
          }}>
            {profileData?.avatar_url
              ? <img src={profileData.avatar_url} className="w-full h-full object-cover" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                {profileData?.full_name}
              </h1>
              <span style={{
                background: '#dcfce7', color: '#16a34a',
                padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
              }}>✓ Verified</span>
              {profile.is_featured && (
                <span style={{
                  background: 'var(--color-primary-light)', color: '#92400e',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
                  border: '1px solid var(--color-gold-bright)',
                }}>⭐ Featured</span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {profile.subjects?.slice(0, 5).map((s: string) => (
                <span key={s} style={{
                  background: 'var(--color-primary-light)', color: '#92400e',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
                  border: '1px solid var(--color-gold-bright)',
                }}>{s}</span>
              ))}
            </div>

            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-gold)', fontSize: '18px' }}>
                  {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
                </span>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>{avgRating}</span>
                <span style={{ color: 'var(--color-text-faint)', fontSize: '14px' }}>({reviews.length} reviews)</span>
              </div>
            )}
          </div>

          {/* Sticky booking card */}
          <div style={{
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'var(--shadow-float)',
            minWidth: '240px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>
              {profile.hourly_rate_qar}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-faint)', marginBottom: '20px' }}>QAR per hour</div>
            <GoldButton href={`/tutor/${params.id}/book`} size="lg" fullWidth>
              Book Session
            </GoldButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
          <div>
            {/* About */}
            {profile.bio && (
              <AnimatedSection style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>About</h2>
                <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{profile.bio}</p>
              </AnimatedSection>
            )}

            {/* Details grid */}
            <AnimatedSection style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Session Type', value: profile.session_type === 'both' ? 'In-person & Online' : profile.session_type === 'in_person' ? 'In-person' : 'Online' },
                  { label: 'Experience', value: `${profile.years_experience} years` },
                  { label: 'Areas', value: profile.areas?.join(', ') },
                  { label: 'Languages', value: profile.languages_taught?.join(', ') },
                ].map(item => (
                  <div key={item.label} style={{
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Reviews */}
            {reviews.length > 0 && (
              <AnimatedSection>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text)' }}>
                  Reviews ({reviews.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{
                      background: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-card)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--color-gold)' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-faint)', fontWeight: 600 }}>
                          {review.studentName}
                        </span>
                      </div>
                      {review.comment && (
                        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Right: availability */}
          {availability.length > 0 && (
            <div>
              <div style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
                position: 'sticky',
                top: '80px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
                  Availability
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availability.map(slot => (
                    <div key={slot.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: 'var(--color-bg)',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', width: '36px' }}>
                        {DAY_NAMES[slot.day_of_week]}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {slot.start_time} – {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact notice */}
        <div style={{
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-gold-bright)',
          borderRadius: '16px',
          padding: '18px 24px',
          fontSize: '14px',
          color: '#92400e',
          marginTop: '40px',
          fontWeight: 500,
        }}>
          📱 Phone & WhatsApp contact details are shared after your booking is confirmed.
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test profile page**

Open any tutor profile via `http://localhost:3000/tutor/{id}` — amber hero gradient, avatar ring, subject pills, rating stars, gold Book Session button.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/tutor/
git commit -m "feat: tutor profile page redesign with Desert Gold hero and animated reviews"
```

---

## Task 16: Auth Pages Rewrite

**Files:**
- Rewrite: `apps/web/src/app/(auth)/sign-in/page.tsx`
- Rewrite: `apps/web/src/app/(auth)/sign-up/student/page.tsx`
- Rewrite: `apps/web/src/app/(auth)/sign-up/tutor/page.tsx`

- [ ] **Step 1: Rewrite sign-in/page.tsx**

```tsx
// apps/web/src/app/(auth)/sign-in/page.tsx
'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { signIn } from '@/lib/auth/actions'
import Link from 'next/link'
import { GoldButton } from '@/components/ui/GoldButton'
import { GeometricPattern } from '@/components/ui/GeometricPattern'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        background: pending ? '#d97706aa' : 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        padding: '14px',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '16px',
        cursor: pending ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
        transition: 'all 0.2s ease',
      }}
    >
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  )
}

const initialState = { error: '' }

export default function SignInPage() {
  const [state, formAction] = useFormState(signIn, initialState)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '15px',
    color: 'var(--color-text)',
    background: '#fff',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg)' }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        overflow: 'hidden',
      }}>
        <GeometricPattern color="#f59e0b" opacity={0.08} />
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.2), transparent 70%)',
        }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '16px' }}>
            TutorQatar
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.25, marginBottom: '16px' }}>
            Welcome Back to<br />Qatar's #1 Tutor Platform
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Connect with 500+ verified tutors across Qatar. In-person & online sessions.
          </p>
          <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Math', 'Physics', 'English', 'Arabic', 'Chemistry'].map(s => (
              <span key={s} style={{
                background: 'rgba(217,119,6,0.2)',
                border: '1px solid rgba(245,158,11,0.4)',
                color: 'var(--color-gold)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
              }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        background: '#fff',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '32px', fontSize: '20px', fontWeight: 800, color: '#92400e', textDecoration: 'none' }}>
            TutorQatar
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>Sign In</h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Find the right tutor in Qatar
          </p>

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {state.error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
              }}>
                {state.error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                Email
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                Password
              </label>
              <input id="password" name="password" type="password" required autoComplete="current-password" style={inputStyle} />
            </div>

            <SubmitButton />
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            New here?{' '}
            <Link href="/sign-up/student" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up as Student
            </Link>
            {' '}or{' '}
            <Link href="/sign-up/tutor" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up as Tutor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite sign-up/student/page.tsx**

Read the existing file to preserve the `signUpStudent` action import pattern, then replace UI:

```tsx
// apps/web/src/app/(auth)/sign-up/student/page.tsx
'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { signUpStudent } from '@/lib/auth/actions'
import Link from 'next/link'
import { GeometricPattern } from '@/components/ui/GeometricPattern'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        background: pending ? '#d97706aa' : 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        padding: '14px',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '16px',
        cursor: pending ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
      }}
    >
      {pending ? 'Creating account…' : 'Create Student Account'}
    </button>
  )
}

const initialState = { error: '' }

export default function StudentSignUpPage() {
  const [state, formAction] = useFormState(signUpStudent, initialState)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '15px',
    color: 'var(--color-text)',
    background: '#fff',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg)' }}>
      {/* Left dark panel */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        overflow: 'hidden',
      }}>
        <GeometricPattern color="#f59e0b" opacity={0.08} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>🎓</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
            Start Learning Today
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Join 2,000+ students across Qatar who are improving their grades with TutorQatar.
          </p>
          <p style={{ marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/sign-in" style={{ color: 'var(--color-gold)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        background: '#fff',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '32px', fontSize: '20px', fontWeight: 800, color: '#92400e', textDecoration: 'none' }}>
            TutorQatar
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text)' }}>
            Create Student Account
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Find the perfect tutor and start learning
          </p>

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {state.error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', padding: '12px 16px', fontSize: '14px' }}>
                {state.error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Full Name</label>
              <input name="fullName" type="text" required style={inputStyle} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Email</label>
              <input name="email" type="email" required autoComplete="email" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Password</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
            </div>

            <SubmitButton />
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Want to teach?{' '}
            <Link href="/sign-up/tutor" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up as Tutor
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Read sign-up/tutor/page.tsx to get existing action import**

```bash
head -5 apps/web/src/app/(auth)/sign-up/tutor/page.tsx
```

Expected: shows what server action is imported (likely `signUpTutor`). Then apply same split-screen pattern.

- [ ] **Step 4: Rewrite sign-up/tutor/page.tsx (apply same pattern)**

Apply the same split-screen structure as student sign-up, but change:
- Import `signUpTutor` from `@/lib/auth/actions`
- Left panel text: "Share Your Knowledge", tutor-focused copy
- Button text: "Create Tutor Account"
- formAction calls `signUpTutor`
- Bottom link: "Looking for a tutor? Sign up as Student"

- [ ] **Step 5: Test auth pages**

Open `http://localhost:3000/sign-in` — should show dark left panel with geometric pattern, clean right form panel with amber accent inputs.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(auth)/
git commit -m "feat: auth pages redesign — split-screen with Desert Gold dark panel"
```

---

## Task 17: Dashboard Rewrite

**Files:**
- Rewrite: `apps/web/src/app/dashboard/page.tsx`

The dashboard now includes `SessionCountdown` (enhancement 5.5) for the next confirmed session.

- [ ] **Step 1: Rewrite dashboard/page.tsx**

```tsx
// apps/web/src/app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { SessionCountdown } from '@/components/ui/SessionCountdown'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const [{ data: profile }, { data: nextSession }, { data: recentBookings }] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
    supabase
      .from('bookings')
      .select('id, scheduled_at, subject')
      .eq(profile?.role === 'tutor' ? 'tutor_id' : 'student_id', user.id)
      .eq('status', 'confirmed')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .then(res => res),  // parallel query — profile may be null, handled below
    supabase
      .from('bookings')
      .select('id, status, scheduled_at, total_amount_qar, tutor_id, student_id')
      .eq(profile?.role === 'tutor' ? 'tutor_id' : 'student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const quickLinks = profile?.role === 'student'
    ? [
        { label: 'Find a Tutor', icon: '🔍', href: '/search', desc: 'Browse 500+ verified tutors' },
        { label: 'My Bookings', icon: '📅', href: '/bookings', desc: 'View and manage sessions' },
        { label: 'Messages', icon: '💬', href: '/messages', desc: 'Chat with your tutors' },
      ]
    : [
        { label: 'My Profile', icon: '👤', href: '/tutor/onboarding', desc: 'Update profile and availability' },
        { label: 'Booking Requests', icon: '📅', href: '/bookings', desc: 'Manage your sessions' },
        { label: 'Messages', icon: '💬', href: '/messages', desc: 'Chat with students' },
        { label: 'Payout Setup', icon: '💳', href: '/tutor/payout-setup', desc: 'Manage your earnings' },
      ]

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: '#dcfce7', text: '#16a34a' },
    pending_payment: { bg: '#fef9c3', text: '#a16207' },
    awaiting_confirmation: { bg: '#dbeafe', text: '#1d4ed8' },
    completed: { bg: '#f0fdf4', text: '#15803d' },
    cancelled: { bg: '#fee2e2', text: '#dc2626' },
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        padding: '48px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          background: 'repeating-conic-gradient(rgba(217,119,6,1) 0deg, transparent 1deg, transparent 29deg, rgba(217,119,6,1) 30deg) 0/50px 50px',
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-QA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                {greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', margin: 0, textTransform: 'capitalize' }}>
                {profile?.role} account
              </p>
            </div>

            {/* Session countdown */}
            {nextSession && nextSession[0] && (
              <SessionCountdown
                sessionAt={nextSession[0].scheduled_at}
                bookingId={nextSession[0].id}
              />
            )}

            <form action={signOut}>
              <button type="submit" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
        {/* Quick actions */}
        <AnimatedSection style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '20px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {quickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '20px',
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <span style={{ fontSize: '24px' }}>{link.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', marginBottom: '4px' }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>

        {/* Recent bookings */}
        {recentBookings && recentBookings.length > 0 && (
          <AnimatedSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Recent Bookings</h2>
              <Link href="/bookings" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
                View all →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentBookings.map((b: any) => {
                const colors = STATUS_COLORS[b.status] ?? { bg: '#f3f4f6', text: '#374151' }
                return (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: '14px',
                      textDecoration: 'none',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
                        {new Date(b.scheduled_at).toLocaleDateString('en-QA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {b.total_amount_qar} QAR
                      </div>
                    </div>
                    <span style={{
                      background: colors.bg,
                      color: colors.text,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                )
              })}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  )
}
```

> **Note on parallel query issue:** The `nextSession` query uses `profile?.role` but `profile` itself is fetched in the same `Promise.all`. Fix by moving `nextSession`+`recentBookings` queries into a nested block after `profile` resolves. The simplest solution: fetch profile first, then fetch the rest.

Correct version using sequential fetching:
```tsx
// Correct async approach at the top of DashboardPage:
const user = await requireAuth()
const supabase = createClient()
const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
const isTutor = profile?.role === 'tutor'
const [{ data: nextSession }, { data: recentBookings }] = await Promise.all([
  supabase
    .from('bookings')
    .select('id, scheduled_at')
    .eq(isTutor ? 'tutor_id' : 'student_id', user.id)
    .eq('status', 'confirmed')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1),
  supabase
    .from('bookings')
    .select('id, status, scheduled_at, total_amount_qar')
    .eq(isTutor ? 'tutor_id' : 'student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5),
])
```

Use this version in the file — replace the three-way `Promise.all` with this sequential approach.

- [ ] **Step 2: Verify dashboard compiles and renders**

Navigate to `http://localhost:3000/dashboard` (sign in first) — should show dark hero header with greeting, session countdown if there's a confirmed upcoming session, quick action cards, recent bookings list.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat: dashboard redesign with dark hero, SessionCountdown, quick action cards"
```

---

## Task 18: Bookings Pages Rewrite

**Files:**
- Rewrite: `apps/web/src/app/bookings/page.tsx`
- Rewrite: `apps/web/src/app/bookings/[id]/page.tsx`
- Rewrite: `apps/web/src/app/bookings/[id]/pay/page.tsx`
- Rewrite: `apps/web/src/app/bookings/[id]/review/page.tsx`

- [ ] **Step 1: Rewrite bookings/page.tsx**

```tsx
// apps/web/src/app/bookings/page.tsx
import { requireAuth } from '@/lib/auth/guards'
import { getStudentBookings, getTutorBookings } from '@/lib/booking/queries'
import { createClient } from '@/lib/supabase/server'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  awaiting_confirmation: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  paid: 'Paid',
  declined: 'Declined',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  disputed: 'Disputed',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_payment:       { bg: '#fef9c3', text: '#a16207' },
  awaiting_confirmation: { bg: '#dbeafe', text: '#1d4ed8' },
  confirmed:             { bg: '#dcfce7', text: '#16a34a' },
  completed:             { bg: '#f0fdf4', text: '#15803d' },
  paid:                  { bg: '#f3f4f6', text: '#374151' },
  declined:              { bg: '#fee2e2', text: '#dc2626' },
  cancelled:             { bg: '#fee2e2', text: '#dc2626' },
  refunded:              { bg: '#f3f4f6', text: '#374151' },
  disputed:              { bg: '#fff7ed', text: '#c2410c' },
}

export default async function BookingsPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const bookings = profile?.role === 'tutor'
    ? await getTutorBookings(user.id)
    : await getStudentBookings(user.id)

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt), var(--color-primary-light))',
        borderBottom: '1px solid var(--color-border)',
        padding: '40px 32px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
            My Bookings
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: 0 }}>
            {bookings.length} session{bookings.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        {bookings.length === 0 ? (
          <AnimatedSection style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>📅</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              No bookings yet
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
              {profile?.role === 'student'
                ? 'Find a tutor and book your first session!'
                : 'Bookings will appear here once students book with you.'}
            </p>
            {profile?.role === 'student' && <GoldButton href="/search" size="lg">Find a Tutor</GoldButton>}
          </AnimatedSection>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((booking: any) => {
              const tutorName = booking.tutor_profiles?.profiles?.full_name
                ?? booking.profiles?.full_name
                ?? 'Unknown'
              const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-QA', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
              const colors = STATUS_COLORS[booking.status] ?? { bg: '#f3f4f6', text: '#374151' }

              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  {/* Date indicator */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-gold-bright)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                      {new Date(booking.scheduled_at).getDate()}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
                      {new Date(booking.scheduled_at).toLocaleDateString('en', { month: 'short' })}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 4px' }}>
                      {tutorName}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      {scheduledDate} · {booking.duration_minutes}min · {booking.session_mode === 'in_person' ? 'In-person' : 'Online'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      display: 'block',
                      background: colors.bg,
                      color: colors.text,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}>
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {booking.total_amount_qar} QAR
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite bookings/[id]/page.tsx**

Replace the outer container and status banner with Desert Gold styling. Keep all existing server actions (`confirmBooking`, `declineBooking`, `markSessionComplete`, `cancelBooking`, `cancelBookingAsStudent`). Key style changes:

```tsx
// apps/web/src/app/bookings/[id]/page.tsx
// (keep all imports and data-fetching logic identical to current file)
// Change only the return JSX:

// Outer wrapper:
<div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '40px 32px' }}>
  <div style={{ maxWidth: '700px', margin: '0 auto' }}>

// Breadcrumb — style the links amber
// Status banner — use STATUS_COLORS with the bg/text object pattern from Task 18 Step 1
// Main card — white bg, amber border-radius 20px, shadow-card
// Action buttons — use GoldButton component for positive actions, red outlined buttons for destructive
// Event timeline — amber dots instead of blue

// Import GoldButton from '@/components/ui/GoldButton'
```

Full replacement: copy the existing `bookings/[id]/page.tsx`, then replace the `return (...)` block. Replace `className="..."` Tailwind with inline styles using Desert Gold tokens. All server actions remain unchanged.

- [ ] **Step 3: Rewrite pay/page.tsx**

Keep `PaymentForm` import unchanged. Change outer wrapper:
```tsx
// apps/web/src/app/bookings/[id]/pay/page.tsx
// Change the container div to:
<div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
  <div style={{ width: '100%', maxWidth: '500px' }}>
    {/* Session summary card in amber */}
    <div style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-gold-bright)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
      {/* tutor name, date, amount */}
    </div>
    {/* Stripe PaymentForm below */}
```

- [ ] **Step 4: Rewrite review/page.tsx**

Keep form action unchanged. Apply amber star styling:
```tsx
// apps/web/src/app/bookings/[id]/review/page.tsx
// Stars: interactive amber ★ buttons, scale on hover
// Submit button: GoldButton with type="submit"
// Container: centered card, max-width 480px, white bg, shadow-card
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/bookings/
git commit -m "feat: bookings pages redesign with Desert Gold cards and status badges"
```

---

## Task 19: Booking Celebration Integration

**Files:**
- Modify: `apps/web/src/app/bookings/[id]/pay/page.tsx` OR `apps/web/src/app/bookings/[id]/page.tsx`

The celebration fires on the payment success page or on status change to `confirmed`. The simplest integration: detect `?success=true` query param on the booking detail page and show the celebration.

- [ ] **Step 1: Add BookingCelebration to booking detail page**

In `apps/web/src/app/bookings/[id]/page.tsx`, add a client component wrapper:

Create `apps/web/src/app/bookings/[id]/CelebrationWrapper.tsx`:
```tsx
// apps/web/src/app/bookings/[id]/CelebrationWrapper.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { BookingCelebration } from '@/components/ui/BookingCelebration'

export function CelebrationWrapper() {
  const params = useSearchParams()
  const success = params.get('success') === 'true'
  return <BookingCelebration show={success} />
}
```

Import and render `<CelebrationWrapper />` at the top of the booking detail page's JSX (it's a client component, but the page itself is a server component — add `<Suspense fallback={null}><CelebrationWrapper /></Suspense>`).

- [ ] **Step 2: Redirect to booking page with ?success=true after payment**

In `apps/web/src/app/api/payments/webhook/route.ts`, after confirming the booking, redirect includes `?success=true`. Check if the webhook already redirects — if the redirect happens in the payment form's success handler, add `?success=true` there instead.

Check `apps/web/src/app/bookings/[id]/pay/PaymentForm.tsx`:
```bash
grep -n "redirect\|router.push\|success" apps/web/src/app/bookings/[id]/pay/PaymentForm.tsx
```

Add `?success=true` to wherever the success redirect goes:
```ts
// If it redirects like:
router.push(`/bookings/${bookingId}`)
// Change to:
router.push(`/bookings/${bookingId}?success=true`)
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/bookings/[id]/CelebrationWrapper.tsx apps/web/src/app/bookings/[id]/pay/PaymentForm.tsx
git commit -m "feat: BookingCelebration integration on payment success"
```

---

## Task 20: Messages Pages Rewrite

**Files:**
- Rewrite: `apps/web/src/app/messages/page.tsx`
- Rewrite: `apps/web/src/app/messages/[bookingId]/page.tsx`

- [ ] **Step 1: Rewrite messages/page.tsx**

```tsx
// apps/web/src/app/messages/page.tsx
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

export default async function MessagesPage() {
  const user = await requireAuth()
  const supabase = createClient()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStudent = profile?.role === 'student'

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`id, status, scheduled_at, tutor:tutor_id(full_name), student:student_id(full_name)`)
    .in('status', ['confirmed', 'completed', 'paid', 'disputed'])
    .eq(isStudent ? 'student_id' : 'tutor_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt), var(--color-primary-light))',
        borderBottom: '1px solid var(--color-border)',
        padding: '40px 32px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Messages</h1>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        {!bookings || bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>💬</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              No conversations yet
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
              Chat becomes available once a booking is confirmed.
            </p>
            <GoldButton href="/search">Find a Tutor</GoldButton>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {bookings.map((b: any, i: number) => {
              const other = isStudent ? (b.tutor as any)?.full_name : (b.student as any)?.full_name
              const date = new Date(b.scheduled_at).toLocaleDateString('en-QA', { month: 'short', day: 'numeric' })
              const initial = (other ?? 'U')[0].toUpperCase()
              return (
                <Link
                  key={b.id}
                  href={`/messages/${b.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 24px',
                    textDecoration: 'none',
                    borderBottom: i < bookings.length - 1 ? '1px solid var(--color-bg-alt)' : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '18px',
                  }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {other ?? 'Unknown'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                      Session on {date}
                    </p>
                  </div>
                  <span style={{
                    background: b.status === 'confirmed' ? '#dcfce7' : b.status === 'disputed' ? '#fff7ed' : 'var(--color-bg-alt)',
                    color: b.status === 'confirmed' ? '#16a34a' : b.status === 'disputed' ? '#c2410c' : 'var(--color-text-muted)',
                    padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
                  }}>
                    {b.status}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Style messages/[bookingId]/page.tsx**

Read the existing chat page to understand its structure:
```bash
cat apps/web/src/app/messages/\[bookingId\]/page.tsx
```

Apply Desert Gold styling: amber chat bubbles for the user's messages, cream for the other party. Keep all existing realtime subscription logic unchanged — only change the visual styling.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/messages/
git commit -m "feat: messages pages redesign with Desert Gold chat bubbles"
```

---

## Task 21: Tutor Flow Rewrite

**Files:**
- Rewrite: `apps/web/src/app/tutor/onboarding/page.tsx`
- Style: `apps/web/src/app/tutor/payout-setup/page.tsx`

- [ ] **Step 1: Style tutor/onboarding/page.tsx**

Keep all form inputs and `saveTutorProfile` action unchanged. Wrap in Desert Gold container:

```tsx
// Outer wrapper:
<div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '60px 32px' }}>
  <div style={{ maxWidth: '640px', margin: '0 auto' }}>
    {/* Progress header */}
    <div style={{
      background: 'linear-gradient(135deg, var(--color-bg-dark), #3d1f00)',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* amber geometric pattern at 6% opacity */}
      <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '24px', margin: 0 }}>Set Up Your Tutor Profile</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontSize: '14px' }}>
        Complete your profile to get approved and start getting bookings.
      </p>
    </div>

    {/* Form card */}
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '36px', boxShadow: 'var(--shadow-card)' }}>
      <form action={saveTutorProfile} ...>
        {/* All existing inputs, styled with amber focus ring */}
        {/* Submit: GoldButton type="submit" fullWidth */}
      </form>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Style tutor/payout-setup/page.tsx**

Wrap in centered card layout with amber header explaining earnings (15% platform fee).

- [ ] **Step 3: Style tutor/[id]/book/page.tsx and BookSessionForm.tsx**

```bash
cat apps/web/src/app/tutor/\[id\]/book/page.tsx
```

Apply two-column layout: left = booking form (date picker, duration, mode), right = price summary card with amber highlight.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/tutor/
git commit -m "feat: tutor flow pages redesign — onboarding, payout, book session"
```

---

## Task 22: Final Polish — search/loading.tsx + Delete Old loading.tsx

**Files:**
- Rewrite: `apps/web/src/app/search/loading.tsx`

The existing `loading.tsx` should show the `SkeletonCardGrid` instead of nothing.

- [ ] **Step 1: Rewrite search/loading.tsx**

```tsx
// apps/web/src/app/search/loading.tsx
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard'

export default function SearchLoading() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', padding: '24px 32px', height: '130px' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <SkeletonCardGrid count={9} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
pnpm --filter @tutor/web build 2>&1 | grep -E "error|warning" | head -20
```

Expected: no errors. Warnings about missing image domains or similar non-critical issues are acceptable.

- [ ] **Step 3: Full visual smoke test**

Open each page in browser and confirm Desert Gold styling:
- `http://localhost:3000` — Homepage hero, stats, sections
- `http://localhost:3000/search` — Gold filter bar, tutor cards
- `http://localhost:3000/sign-in` — Split-screen dark/light
- `http://localhost:3000/dashboard` (after sign-in) — Dark hero, quick actions
- `http://localhost:3000/bookings` (after sign-in) — Calendar date indicator, status pills

- [ ] **Step 4: Final commit**

```bash
git add apps/web/src/app/search/loading.tsx
git commit -m "feat: gold shimmer loading state for search page"
```

---

## Self-Review Checklist

**Spec coverage check:**
- [x] Desert Gold color tokens → Task 2
- [x] Plus Jakarta Sans font → Task 2
- [x] GSAP AnimatedSection + StatCounter → Task 5
- [x] Framer Motion FloatingCard + PageWrapper → Task 5
- [x] TutorCard with hover lift + drawer integration → Task 6
- [x] All 9 shared UI components → Tasks 4–6
- [x] Gold Shimmer Skeleton Loaders (5.1) → Task 8 + Task 22
- [x] Tutor Quick-Preview Drawer (5.2) → Tasks 7, 10, 12
- [x] Booking Success Celebration (5.3) → Task 10 + Task 19
- [x] Live Search Autocomplete (5.4) → Task 9 + Task 14
- [x] Session Countdown (5.5) → Task 11 + Task 17
- [x] Homepage Split Hero → Task 13
- [x] Search page → Task 14
- [x] Tutor Profile → Task 15
- [x] Auth pages → Task 16
- [x] Dashboard → Task 17
- [x] Bookings → Task 18
- [x] Messages → Task 20
- [x] Tutor flow → Task 21

**Type consistency:**
- `TutorCardData` interface defined in `TutorCard.tsx`, used in `SearchClient.tsx` — matches `TutorSearchResult` from `lib/search/queries.ts`
- `DrawerProvider` exports `useDrawerCtx` — used in `TutorCard.tsx` and `TutorDrawer.tsx`
- `SessionCountdown` takes `sessionAt: string` and `bookingId: string` — used in `dashboard/page.tsx`
- `BookingCelebration` takes `show: boolean` — used in `CelebrationWrapper.tsx`
