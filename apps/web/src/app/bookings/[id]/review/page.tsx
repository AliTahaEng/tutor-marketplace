import { getBooking } from '@/lib/booking/queries'
import { submitReview } from '@/lib/reviews/actions'
import { requireRole } from '@/lib/auth/guards'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default async function ReviewPage({ params }: PageProps) {
  const { user } = await requireRole('student')
  const booking = await getBooking(params.id)

  if (!booking || booking.student_id !== user.id) notFound()

  if (!['completed', 'paid'].includes(booking.status)) {
    return (
      <div className="max-w-md mx-auto p-4 text-center py-12">
        <p className="text-muted-foreground">
          You can only leave a review after the session is completed.
        </p>
        <Link href={`/bookings/${params.id}`} className="mt-4 inline-block text-blue-600 hover:underline">
          Back to booking
        </Link>
      </div>
    )
  }

  const tutorName = (booking.tutor_profiles as any)?.profiles?.full_name ?? 'your tutor'

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/bookings/${params.id}`} className="text-blue-600 hover:underline text-sm">
          Booking
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">Review</span>
      </div>

      <h1 className="text-xl font-bold mb-2">Rate Your Session</h1>
      <p className="text-muted-foreground mb-6">How was your session with {tutorName}?</p>

      <form action={submitReview} className="space-y-6">
        <input type="hidden" name="bookingId" value={params.id} />
        <input type="hidden" name="tutorId" value={booking.tutor_id} />

        <div>
          <label className="block text-sm font-medium mb-3">Rating *</label>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map(star => (
              <label key={star} className="cursor-pointer flex flex-col items-center">
                <input type="radio" name="rating" value={star} className="sr-only" required />
                <span className="text-3xl hover:scale-110 transition-transform">{'⭐'.repeat(1)}</span>
                <span className="text-xs text-center text-muted-foreground">{star}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Review (optional)
          </label>
          <textarea
            id="comment"
            name="comment"
            maxLength={1000}
            rows={4}
            placeholder="Share your experience with this tutor..."
            className="w-full border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-muted-foreground mt-1">Max 1000 characters</p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
        >
          Submit Review
        </button>
      </form>
    </div>
  )
}
