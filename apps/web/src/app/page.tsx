import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Find the Perfect Tutor in Qatar</h1>
      <p className="text-gray-500 text-lg mb-8">
        Connect with verified tutors for Math, Science, Languages and more.
        In-person or online. All across Qatar.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/search"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700">
          Find a Tutor
        </Link>
        <Link href="/sign-up/tutor"
          className="border border-blue-600 text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50">
          Become a Tutor
        </Link>
      </div>
    </main>
  )
}
