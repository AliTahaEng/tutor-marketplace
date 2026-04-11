# TutorQatar UI Redesign — Design Spec
**Date:** 2026-04-07  
**Status:** Approved for implementation

---

## Decisions Made

| Decision | Choice |
|----------|--------|
| Visual direction | Desert Gold — warm cream `#fdf6ec` + amber gold `#d97706` |
| Animation style | Dynamic & Impactful — GSAP ScrollTrigger + Framer Motion |
| Homepage layout | Split Hero — text/search left, floating tutor cards right |
| Pages scope | All pages |

---

## 1. Design System

### Color Tokens
```css
--color-bg:          #fdf6ec   /* warm cream — page background */
--color-bg-alt:      #fdebd0   /* slightly warmer — section alternating */
--color-bg-dark:     #1c1008   /* deep brown — CTA sections */
--color-primary:     #d97706   /* amber-600 — buttons, accents */
--color-primary-hover: #b45309 /* amber-700 — hover state */
--color-primary-light: #fef3c7 /* amber-50 — pill backgrounds */
--color-gold:        #f59e0b   /* amber-500 — highlights */
--color-gold-bright: #fcd34d   /* amber-300 — badges, stars */
--color-border:      #e5c99a   /* warm border */
--color-border-dark: #f0d9b5   /* section dividers */
--color-text:        #1c1917   /* stone-900 — headings */
--color-text-muted:  #78350f   /* amber-900 — body text */
--color-text-faint:  #a16207   /* amber-700 — placeholders */
```

### Typography
- **Font**: `Plus Jakarta Sans` (Google Font) — weights 400, 600, 700, 800
- **Arabic font**: `Noto Sans Arabic` (already configured)
- **Headings**: 800 weight, tight line-height (1.15–1.25)
- **Body**: 400/600 weight, 1.6 line-height
- **Scale**: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 60px

### Shadows
```css
--shadow-card:  0 4px 20px rgba(180, 140, 70, 0.12)
--shadow-lift:  0 12px 40px rgba(180, 140, 70, 0.22)   /* hover */
--shadow-float: 0 8px 32px rgba(180, 140, 70, 0.18)    /* hero cards */
--shadow-glow:  0 0 40px rgba(217, 119, 6, 0.15)       /* CTA sections */
```

### Border Radius
- Cards: `16px`
- Buttons: `12px`
- Pills/badges: `9999px`
- Inputs: `12px`
- Avatar: `50%`

---

## 2. Animation System

### Libraries
- **GSAP + ScrollTrigger** — scroll-driven animations, counting stats, stagger reveals
- **Framer Motion** — React component animations, hover states, page transitions, floating cards

### Animation Patterns

| Pattern | Usage | Config |
|---------|-------|--------|
| **Fade-up reveal** | Every section on scroll | `y: 40 → 0, opacity: 0 → 1, duration: 0.7, ease: "power2.out"` |
| **Stagger reveal** | Card grids, pill lists | `stagger: 0.08s` between children |
| **Count-up** | Stats numbers | GSAP `snap: 1`, duration 2s, ScrollTrigger once |
| **Float** | Hero tutor cards | Framer Motion `y: [0, -10, 0]`, repeat, duration 3–4s |
| **Hover lift** | All cards | Framer Motion `whileHover: { y: -6, boxShadow: shadow-lift }` |
| **Page transition** | Route changes | Framer Motion `AnimatePresence`, fade 0.3s |
| **Sticky nav blur** | Nav on scroll | CSS `backdrop-filter: blur(12px)` + GSAP opacity |

---

## 3. Shared Components (new)

All go in `apps/web/src/components/ui/`.

| Component | Description |
|-----------|-------------|
| `AnimatedSection` | Wrapper that triggers fade-up on scroll (GSAP) |
| `TutorCard` | Animated tutor card with hover lift, avatar, rating, subjects, price |
| `SubjectPill` | Animated pill badge for subject categories |
| `StatCounter` | GSAP count-up number with label |
| `SectionHeading` | Consistent heading + subtitle component |
| `GoldButton` | Primary CTA button with hover animation |
| `GoldOutlineButton` | Secondary bordered button |
| `PageWrapper` | Framer Motion page transition wrapper |
| `GeometricPattern` | Subtle SVG Islamic geometric pattern (decorative) |
| `FloatingCard` | Framer Motion bobbing card (used in hero) |

---

## 4. Page-by-Page Design

### 4.1 Navigation (shared `layout.tsx`)
- **Sticky** with `backdrop-filter: blur(12px)` + `background: rgba(253,246,236,0.85)` on scroll
- **Logo**: "TutorQatar" in amber-900, bold
- **Links**: Find Tutors · Messages (if logged in) · My Bookings (if logged in)
- **Auth area**: Sign In (outline) + Sign Up (solid amber) when logged out; Avatar + dropdown when logged in
- **Language switcher**: EN | ع pill

### 4.2 Homepage (`/`)

**Sections (top to bottom):**

1. **Split Hero**
   - Left: badge ("Qatar's #1 Tutor Platform") → h1 → subtext → search bar with area dropdown → two CTAs
   - Right: 3 `FloatingCard` components (tutor cards at different rotations) + "Just booked" toast notification
   - Background: warm cream with subtle geometric pattern at 4% opacity
   - Animations: hero text staggers in on load (Framer Motion), cards float continuously

2. **Stats Bar** — full-width amber-50 band
   - 4 `StatCounter` components: `500+ Tutors` · `4.9★ Avg Rating` · `15+ Subjects` · `2,000+ Sessions`
   - Count up on scroll into view (GSAP ScrollTrigger)

3. **How It Works** — 3 steps, stagger on scroll
   - Step 1: Search & Filter → Step 2: Book Instantly → Step 3: Start Learning
   - Each step: icon circle (amber gradient) + heading + description
   - Connector lines animate between steps

4. **Featured Tutors** — `AnimatedSection` wrapper
   - Heading: "Top Tutors This Week"
   - 3-column `TutorCard` grid, stagger fly-in on scroll
   - "Browse All Tutors →" link below

5. **Subject Categories** — icon grid, 4 columns
   - Math · Physics · Chemistry · Biology · English · Arabic · French · History + more
   - Each category: icon + label card, hover lift
   - Stagger animate on scroll

6. **Testimonials** — horizontal scroll carousel
   - Student review cards with avatar, name, subject, star rating, quote
   - Auto-scrolls slowly, pauses on hover

7. **Become a Tutor CTA** — dark `#1c1008` band
   - Geometric SVG pattern at 6% opacity over dark background
   - Gold heading + subtext + "Apply as a Tutor" amber button
   - `AnimatedSection` fade-up

8. **Footer**
   - Logo + tagline left
   - Links: Find Tutors · How It Works · Pricing · Sign Up
   - Social icons
   - Copyright + language switcher

### 4.3 Search Page (`/search`)
- **Sticky filter sidebar** (left, 260px) with subject checkboxes, area dropdown, price range slider, rating filter, session type toggle
- **Results grid** (right): `TutorCard` 3-column grid, stagger animate on filter change
- **Search bar** at top, large, amber-styled
- **Subject pills** row below search bar (quick filters, animate on select)
- **Pagination** with amber active state
- Empty state: illustrated "no tutors found" with suggestion to broaden filters

### 4.4 Tutor Profile (`/tutor/[id]`)
- **Hero**: full-width warm gradient header, large avatar (ring amber border), name, rating stars, subject pills, area badges, session mode badges
- **Sticky "Book Session" sidebar** (right, 300px): price, next available slot, Book button (animated), reviews summary
- **About section**: bio text with `AnimatedSection`
- **Subjects & Areas**: pill grid, stagger animate
- **Weekly Availability**: visual schedule grid (days × time slots), green = available
- **Reviews section**: review cards with avatar, rating, date, text — stagger on scroll
- **Similar Tutors**: 3-card row at bottom

### 4.5 Book Session (`/tutor/[id]/book`)
- Two-column layout: left = session config form (date picker, duration, mode), right = price summary card
- Price summary updates live with amber highlight animation on change
- "Confirm & Pay" amber button at bottom

### 4.6 Sign In & Sign Up (`/(auth)/`)
- **Split screen**: left = amber gradient panel with floating tutor cards + testimonial quote, right = white form panel
- Form fields: clean, amber focus ring, animated label (floating label pattern)
- Role selector on sign-up: Student card / Tutor card — selected state: amber border + background
- Social proof: "Join 2,000+ students across Qatar" below form

### 4.7 Dashboard (`/dashboard`)
- **Greeting header**: "Good morning, [Name] 👋" + date
- **Quick stats row**: upcoming sessions · total sessions · average rating (tutors)
- **Upcoming Sessions**: timeline-style list, next session card highlighted in amber
- **Recent Bookings**: compact table with status badges (color-coded)
- **Quick actions**: Find a Tutor · My Profile · Messages

### 4.8 Bookings List (`/bookings`)
- Tab bar: All · Upcoming · Completed · Cancelled
- Each booking: card with tutor/student avatar, subject, date/time, status badge, action buttons
- Status badges: color-coded (amber = pending, green = confirmed, gray = completed)
- `AnimatedSection` stagger on load

### 4.9 Booking Detail (`/bookings/[id]`)
- Status banner at top with color + icon + label
- Two-column: session details left, action buttons right
- Action buttons: large, full-width, icon + label (amber for positive, red for cancel)
- Timeline of events at bottom (from `booking_events` table)

### 4.10 Payment Page (`/bookings/[id]/pay`)
- Centered card layout, max-width 480px
- Session summary at top (amber card)
- Stripe Elements embedded below
- "Pay [amount] QAR" amber button with lock icon

### 4.11 Review Page (`/bookings/[id]/review`)
- Centered, simple — tutor avatar + name, star rating selector (interactive, amber stars), text area, submit button
- Stars animate on hover/select (scale + glow)

### 4.12 Messages (`/messages` + `/messages/[bookingId]`)
- Two-column: conversation list left, chat area right
- Conversation list: avatar + name + last message + unread badge (amber)
- Chat bubbles: student = amber right-aligned, tutor = cream left-aligned
- Real-time indicator (green dot on avatar)

### 4.13 Tutor Onboarding (`/tutor/onboarding`)
- Multi-step wizard: Step indicator bar at top (amber active step)
- Steps: Profile Info → Subjects & Areas → Availability → Documents → Done
- Each step: centered form, max-width 560px, clean card
- Progress bar fills amber as steps complete

### 4.14 Payout Setup (`/tutor/payout-setup`)
- Centered card, Stripe Connect onboarding embed
- Amber-styled header with earnings explanation (15% platform fee)

---

## 5. Enhancement Features

### 5.1 Gold Shimmer Skeleton Loaders
Every data-fetching page (search, bookings, tutor profile) shows animated gold-shimmer placeholder cards while loading — instead of a blank flash.

- Warm shimmer using Desert Gold palette: base `#fdebd0`, shimmer highlight `#fef3c7`
- CSS keyframe animation: `shimmer` moves a gradient left→right over 1.5s, infinite
- `SkeletonCard` component matches `TutorCard` exact dimensions to prevent layout shift
- Used on: `/search` (result cards), `/tutor/[id]` (profile header + reviews), `/bookings` (booking cards), `/dashboard` (sessions)

### 5.2 Tutor Quick-Preview Drawer
Click any tutor card anywhere → an animated bottom sheet slides up showing avatar, subjects, price, rating, 2–3 top reviews, and a "Book Now" button.

- Framer Motion `AnimatePresence` + `motion.div` with `y: "100%" → 0` spring (stiffness 300, damping 30)
- Duration: 0.35s slide-up. Dark backdrop `rgba(0,0,0,0.4)` fades in simultaneously.
- Content: large avatar, name, rating stars, subject pills, area badges, price/hr, top 2 reviews, "View Full Profile" link + "Book Now" amber CTA
- Closes on backdrop click, Escape key, or swipe down
- Global state: `DrawerProvider` context, `useTutorDrawer()` hook — cards call `openDrawer(tutorId)`
- Data: single Supabase query on drawer open (not preloaded) with loading skeleton inside drawer

### 5.3 Booking Success Celebration
When payment completes or a tutor confirms a session: full-screen gold & amber confetti burst + animated checkmark + "Session Booked!" message.

- Library: `canvas-confetti` (2kb gzip). Install: `pnpm --filter @tutor/web add canvas-confetti`
- Colors: `['#d97706', '#f59e0b', '#fcd34d', '#fef3c7', '#1c1917']`
- Config: `particleCount: 120, spread: 80, startVelocity: 45, gravity: 1.2, scalar: 1.1`
- Two bursts: origin `{x:0.3,y:0.6}` and `{x:0.7,y:0.6}` with 150ms delay between
- Animated checkmark: Framer Motion SVG path draw animation (pathLength 0→1, 0.5s, ease "easeOut")
- Overlay: centered modal on top of page, `z-index: 9999`, fades out after 3s automatically
- Triggers: on `/bookings/[id]/pay` success redirect + on booking status change to `confirmed`

### 5.4 Live Search Autocomplete
As the user types in any search bar, a dropdown appears with subject suggestions and matching tutor names.

- Client-side subject list (static array, instant): Math, Physics, Chemistry, Biology, English, Arabic, French, History, Computer Science, Economics, Geography, Islamic Studies + 5 more
- Debounced Supabase query (300ms): `profiles?select=full_name&role=eq.tutor&full_name=ilike.*{query}*&limit=5`
- Dropdown: absolute positioned below input, `border-radius: 12px`, amber border, white bg, `box-shadow: var(--shadow-card)`
- Each row: 40px tall, icon (📚 for subject / 👤 for tutor), label, stagger-animates in (Framer Motion, stagger 0.04s)
- Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close
- Closes on outside click via `useClickOutside` hook
- `SearchAutocomplete` component wraps the `<input>` — drop-in replacement for existing search inputs

### 5.5 Live Session Countdown on Dashboard
If the student/tutor has a confirmed upcoming session, the dashboard hero shows a live countdown timer.

- Format: "Your next session starts in **2h 34m 12s**" — bold numbers in amber
- Animated amber ring (SVG circle): `stroke-dashoffset` depletes from full to 0 as time passes (based on time-until-session as fraction of 24h)
- Pure client-side: `setInterval` every 1s, no server calls
- When session starts (`timeLeft <= 0`): replace with "Session in progress →" link to `/messages/[bookingId]`
- Data: query `bookings?status=eq.confirmed&scheduled_at=gte.{now}&order=scheduled_at.asc&limit=1`
- Component: `SessionCountdown` — renders null if no upcoming confirmed session

---

## 6. Implementation Order

1. **Install dependencies** — `gsap`, `framer-motion`, `@gsap/react`, `canvas-confetti`, Plus Jakarta Sans font
2. **Design tokens** — update `globals.css` with CSS variables + font import
3. **Shared components** — build all UI components in `src/components/ui/`
4. **Homepage** — highest priority, full redesign
5. **Search page** — second highest traffic (includes autocomplete)
6. **Tutor profile** — conversion-critical (includes quick-preview drawer)
7. **Auth pages** — first impression for new users
8. **Dashboard + Bookings** — logged-in experience (includes countdown + celebration)
9. **Messages** — chat UI
10. **Tutor flow** — onboarding + payout

---

## 7. Dependencies to Install

```bash
pnpm --filter @tutor/web add framer-motion gsap @gsap/react canvas-confetti
pnpm --filter @tutor/web add -D @types/canvas-confetti
```

Google Font (Plus Jakarta Sans) via `next/font/google` — no npm install needed.

---

## 8. File Structure

```
apps/web/src/
├── components/
│   ├── ui/
│   │   ├── AnimatedSection.tsx
│   │   ├── TutorCard.tsx
│   │   ├── SubjectPill.tsx
│   │   ├── StatCounter.tsx
│   │   ├── SectionHeading.tsx
│   │   ├── GoldButton.tsx
│   │   ├── PageWrapper.tsx
│   │   ├── FloatingCard.tsx
│   │   ├── GeometricPattern.tsx
│   │   ├── SkeletonCard.tsx         (new — enhancement 5.1)
│   │   ├── SearchAutocomplete.tsx   (new — enhancement 5.4)
│   │   ├── BookingCelebration.tsx   (new — enhancement 5.3)
│   │   └── SessionCountdown.tsx     (new — enhancement 5.5)
│   ├── TutorDrawer.tsx              (new — enhancement 5.2)
│   ├── DrawerProvider.tsx           (new — enhancement 5.2 context)
│   └── LanguageSwitcher.tsx         (existing)
├── hooks/
│   ├── useTutorDrawer.ts            (new)
│   └── useClickOutside.ts           (new)
├── app/
│   ├── layout.tsx            (update: font, nav redesign, DrawerProvider)
│   ├── globals.css           (update: design tokens + shimmer keyframe)
│   ├── page.tsx              (full rewrite)
│   ├── search/page.tsx       (full rewrite)
│   ├── tutor/[id]/page.tsx   (full rewrite)
│   └── ... (all other pages)
```
