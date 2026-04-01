import { signUpStudent } from '@/lib/auth/actions'

export default function StudentSignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Student Account</h1>
          <p className="text-gray-500 mt-1">Start finding tutors in Qatar</p>
        </div>

        <form action={signUpStudent} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name</label>
            <input id="fullName" name="fullName" type="text" required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password (min 8 chars)</label>
            <input id="password" name="password" type="password" required minLength={8}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Language</label>
            <select name="preferredLanguage" className="w-full border rounded-lg px-3 py-2">
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <button type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
            Create Account
          </button>
        </form>
      </div>
    </main>
  )
}
