import { signIn } from '@/lib/auth/actions'

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sign in to TutorQatar</h1>
          <p className="text-gray-500 mt-1">Find the right tutor in Qatar</p>
        </div>

        <form action={signIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input id="password" name="password" type="password" required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
            Sign In
          </button>
        </form>

        <div className="text-center text-sm">
          New here?{' '}
          <a href="/sign-up/student" className="text-blue-600 hover:underline">Sign up as Student</a>
          {' '}or{' '}
          <a href="/sign-up/tutor" className="text-blue-600 hover:underline">Sign up as Tutor</a>
        </div>
      </div>
    </main>
  )
}
