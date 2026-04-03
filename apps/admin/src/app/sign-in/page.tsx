'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Admin sign-in is client-side only — middleware re-checks role on every request
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors">
      {pending ? 'Signing in…' : 'Sign In to Admin'}
    </button>
  )
}

export default function AdminSignInPage() {
  const router = useRouter()

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const errorEl = document.getElementById('sign-in-error')
      if (errorEl) {
        errorEl.textContent = 'Invalid email or password.'
        errorEl.classList.remove('hidden')
      }
      return
    }

    // Middleware will reject if user is not admin
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <h1 className="text-xl font-bold">TutorQatar Admin</h1>
          <p className="text-gray-500 mt-1 text-sm">Restricted access — admins only</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div
            id="sign-in-error"
            className="hidden bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
          />

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <SubmitButton />
        </form>
      </div>
    </main>
  )
}
