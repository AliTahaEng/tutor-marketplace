'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signIn } from '@/lib/auth/actions'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
    >
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  )
}

const initialState = { error: '' }

export default function SignInPage() {
  const [state, formAction] = useFormState(signIn, initialState)

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sign in to TutorQatar</h1>
          <p className="text-gray-500 mt-1 text-sm">Find the right tutor in Qatar</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email address
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

        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            New here?{' '}
            <Link href="/sign-up/student" className="text-blue-600 font-medium hover:underline">
              Sign up as Student
            </Link>
            {' '}or{' '}
            <Link href="/sign-up/tutor" className="text-blue-600 font-medium hover:underline">
              Sign up as Tutor
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
