import { getTutorProfile, getTutorAvailability } from '@/lib/tutor/queries'
import { getTutorReviews } from '@/lib/reviews/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

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

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl flex-shrink-0">
          {(profile.profiles as any)?.avatar_url
            ? <img src={(profile.profiles as any).avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
            : '👤'
          }
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{(profile.profiles as any)?.full_name}</h1>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
            {profile.is_featured && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">⭐ Featured</span>
            )}
          </div>
          <div className="text-gray-500 text-sm mt-1">
            {profile.subjects?.slice(0, 3).join(' · ')}
          </div>
          {avgRating && (
            <div className="text-sm mt-1">
              <span className="text-amber-500">★ {avgRating}</span>
              <span className="text-gray-400 ml-1">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-blue-600">{profile.hourly_rate_qar} QAR/hr</div>
          <Link href={`/tutor/${params.id}/book`}
            className="mt-2 block bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700 text-sm">
            Book Session
          </Link>
        </div>
      </div>

      {/* About */}
      {profile.bio && (
        <div>
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="border rounded-xl p-3">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Session Type</div>
          <div>{profile.session_type === 'both' ? 'In-person & Online' : profile.session_type === 'in_person' ? 'In-person' : 'Online'}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Experience</div>
          <div>{profile.years_experience} years</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Areas</div>
          <div>{profile.areas?.join(', ')}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Languages</div>
          <div>{profile.languages_taught?.join(', ')}</div>
        </div>
      </div>

      {/* Availability */}
      {availability.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Availability</h2>
          <div className="space-y-2">
            {availability.map(slot => (
              <div key={slot.id} className="flex items-center gap-3 text-sm border rounded-lg px-3 py-2">
                <span className="font-medium w-10">{DAY_NAMES[slot.day_of_week]}</span>
                <span className="text-gray-500">{slot.start_time} – {slot.end_time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Reviews ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="text-sm text-gray-400">{review.studentName}</span>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        📱 Phone & WhatsApp contact revealed after your booking is confirmed.
      </div>
    </div>
  )
}
