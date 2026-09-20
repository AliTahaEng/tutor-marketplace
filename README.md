# TutorQatar — Tutor Marketplace (Web, Admin & Mobile)

A two-sided marketplace where students in Qatar find, book and pay tutors. One **Turborepo** monorepo ships a **Next.js** web app, a **Next.js** admin app and an **Expo / React Native** mobile app on top of **Supabase** (PostgreSQL, Auth, Realtime, Edge Functions, Storage) with a **Stripe** payment flow.

> **Status:** personal portfolio project (April 2026). Not launched to users. Payments run in **Stripe test mode** behind a provider-agnostic adapter; Stripe does not currently onboard Qatar-registered platforms, so a real launch would swap in a local PSP through the same adapter.

## What it does

- **Students** search tutors (PostgreSQL full-text search), view availability, book sessions, chat in real time and pay in-app (web and mobile).
- **Tutors** onboard, manage availability, accept or decline bookings and receive payouts.
- **Admins** review bookings, disputes, tutors and users, and see analytics computed in SQL (no in-memory aggregation).

## Architecture

```
apps/web  (Next.js)  ─┐                       ┌─ supabase/functions
apps/admin (Next.js) ─┼─ packages/core ───────┤    booking-transition      (state machine + row locking)
apps/mobile (Expo)   ─┘   adapters, state     │    auto-complete-sessions
                          machine, schemas    │    auto-payout-sessions
                                              │    notify-booking-change
        packages/db (types, queries)          │    session-reminders
        packages/ui (shared components)       └─ supabase/migrations (12 migrations, RLS, partial unique indexes)
                                                          │
                              Stripe (test mode) ◄── StripeAdapter + CircuitBreaker
                              SendGrid, Expo Notifications, Google Maps, Supabase Storage adapters
```

**Booking state machine** (`packages/core/src/state-machines/BookingStateMachine.ts`): `pending_payment → paid → awaiting_confirmation → confirmed → completed`, with `declined`, `cancelled`, `refunded` and `disputed` branches. Transitions are enforced **server-side** in the `booking-transition` Edge Function (Deno) with JWT auth, a role–permission matrix and `SELECT ... FOR UPDATE` row locking; **partial unique indexes** prevent double-booking while allowing re-booking after cancellation. Every transition is appended to an immutable `booking_events` table.

**Payments** (`packages/core` → `StripeAdapter`): manual-capture PaymentIntents, Connect transfers with a platform/tutor split, and policy-based cancellation refunds (full or partial around a 24-hour threshold), driven by webhooks. The adapter sits behind a **circuit breaker** so payment-provider outages degrade gracefully.

**Mobile** (`apps/mobile`): Expo Router app with feature parity — tutor search, booking, Realtime chat, availability management, push notifications (Expo Notifications) and an in-app browser payment flow.

**Reliability and observability:** Sentry error monitoring, Upstash Redis rate limiting, Zod schemas shared across all apps, Vitest unit tests for the state machine, circuit breaker and schemas.

## Tech stack

TypeScript, Next.js (App Router, Server Actions, RSC), Expo / React Native (Expo Router), Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage, RLS), Deno, Stripe, SendGrid, Tailwind CSS, next-intl, Turborepo, pnpm workspaces, Vitest, Sentry, Upstash Redis.

## Running locally

Requirements: Node.js ≥ 20, pnpm, Supabase CLI, a Stripe test account.

```bash
git clone https://github.com/AliTahaEng/tutor-marketplace
cd tutor-marketplace
pnpm install

# Supabase: start the local stack and apply migrations + functions
supabase start
supabase db reset            # applies supabase/migrations
supabase functions serve     # booking-transition and the scheduled functions

# Environment: create .env.local in apps/web and apps/admin, and .env in apps/mobile with
#   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
#   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_CONNECT_CLIENT_ID (test mode)
#   SENDGRID_API_KEY, UPSTASH_REDIS_REST_URL / TOKEN, SENTRY_DSN, EXPO_PUBLIC_* equivalents

# Web + admin
./start-web.sh        # or: pnpm dev
# Mobile
./start-mobile.sh     # Expo dev server
```

Tests: `pnpm test` (Turbo runs the Vitest suites in `packages/core`).

## Project structure

```
apps/web        student / tutor web app (auth, search, bookings, messages, dashboard, tutor onboarding & payouts, Stripe API routes)
apps/admin      admin console (bookings, disputes, tutors, users, analytics)
apps/mobile     Expo app ((auth), (tabs), book/[tutorId], bookings/[id], chat/[bookingId], tutor/availability)
packages/core   adapters (Stripe, SendGrid, Supabase Storage, Expo Notifications, Google Maps), CircuitBreaker, BookingStateMachine, Zod schemas, tests
packages/db     database types and queries
packages/ui     shared UI components
supabase/       functions/ (5 Edge Functions) and migrations/ (12)
```

## Known limitations

- Not launched; no real users or transactions.
- Stripe runs in test mode only; production in Qatar needs a local PSP (the adapter boundary exists for that).
- The mobile app has not been through a store release build.
- No end-to-end test suite yet (unit tests only).

## Roadmap

- [ ] Load test the booking transition under concurrent attempts and publish the numbers
- [ ] Add screenshots / demo video (web, admin, mobile)
- [ ] E2E tests (Playwright) for the booking and payment flows
- [ ] PSP adapter implementation for a Qatar-supported provider

## Screenshots

_Coming soon._

## License

MIT — see `LICENSE`.
