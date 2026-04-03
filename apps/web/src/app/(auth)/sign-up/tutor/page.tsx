'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signUpTutor } from '@/lib/auth/actions'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors">
      {pending ? 'Applying…' : 'Apply as Tutor'}
    </button>
  )
}

const initialState = { error: '' }

export default function TutorSignUpPage() {
  const [state, formAction] = useFormState(signUpTutor, initialState)

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Join as a Tutor</h1>
          <p className="text-gray-500 mt-1 text-sm">Start teaching students across Qatar</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name</label>
            <input id="fullName" name="fullName" type="text" required
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password (min 8 chars)</label>
            <input id="password" name="password" type="password" required minLength={8}
              autoComplete="new-password"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Language</label>
            <select name="preferredLanguage"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <SubmitButton />
        </form>

        <div className="space-y-2 text-center">
          <p className="text-xs text-gray-500">
            Your profile will be reviewed by our team before going live.
          </p>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
