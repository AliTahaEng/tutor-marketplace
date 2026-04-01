import { searchTutors } from '@/lib/search/queries'
import { SearchFiltersSchema } from '@tutor/core'
import Link from 'next/link'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const parsed = SearchFiltersSchema.safeParse({
    q: searchParams['q'],
    area: searchParams['area'],
    sessionType: searchParams['sessionType'],
    maxPriceQar: searchParams['maxPriceQar'] ? Number(searchParams['maxPriceQar']) : undefined,
    minRating: searchParams['minRating'] ? Number(searchParams['minRating']) : undefined,
    language: searchParams['language'],
    sortBy: searchParams['sortBy'],
    page: searchParams['page'] ? Number(searchParams['page']) : 1,
  })

  const filters = parsed.success ? parsed.data : {}
  let results = { tutors: [] as any[], total: 0, page: 1, pageSize: 12 }

  try {
    results = await searchTutors(filters)
  } catch {
    // Show empty results on error (e.g. DB not connected yet)
  }

  const { tutors, total, page, pageSize } = results

  return (
    <div className="max-w-6xl mx-auto p-4">
      <form className="flex gap-2 mb-6">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder='Search "Math", "Guitar", "English"...'
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">
          Search
        </button>
      </form>

      <form className="flex gap-3 flex-wrap mb-6">
        <input type="hidden" name="q" value={filters.q ?? ''} />
        <select name="area" defaultValue={filters.area ?? ''}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Qatar</option>
          {['Doha','Al Rayyan','Al Wakra','Al Khor','Lusail','Al Daayen'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select name="sessionType" defaultValue={filters.sessionType ?? ''}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Any type</option>
          <option value="in_person">In-person</option>
          <option value="online">Online</option>
        </select>
        <select name="maxPriceQar"
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Any price</option>
          <option value="100">Under 100 QAR</option>
          <option value="200">Under 200 QAR</option>
          <option value="500">Under 500 QAR</option>
        </select>
        <button type="submit"
          className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold">
          Apply Filters
        </button>
      </form>

      <p className="text-sm text-gray-500 mb-4">
        {total} tutor{total !== 1 ? 's' : ''} found
        {filters.q ? ` for "${filters.q}"` : ''}
      </p>

      <div className="space-y-3">
        {tutors.map((tutor: any) => (
          <div key={tutor.id}
            className="border rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-2xl">
              {tutor.avatarUrl
                ? <img src={tutor.avatarUrl} alt={tutor.fullName} className="w-full h-full rounded-full object-cover" />
                : '👤'
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{tutor.fullName}</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                {tutor.isFeatured && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">⭐ Featured</span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {tutor.subjects.slice(0, 3).join(', ')} · {tutor.areas[0]} · {tutor.yearsExperience} yrs
              </div>
              <div className="text-sm mt-1">
                <span className="text-amber-500">★ {tutor.avgRating.toFixed(1)}</span>
                <span className="text-gray-400 ml-1">({tutor.reviewCount})</span>
                <span className="ml-3 text-gray-400">
                  {tutor.sessionType === 'in_person' ? 'In-person' :
                   tutor.sessionType === 'online' ? 'Online' : 'In-person & Online'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-blue-600">{tutor.hourlyRateQar} QAR/hr</div>
              <Link href={`/tutor/${tutor.id}`}
                className="mt-2 block bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-700">
                View Profile
              </Link>
            </div>
          </div>
        ))}

        {tutors.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No tutors found. Try different filters or{' '}
            <Link href="/search" className="text-blue-600 hover:underline">clear all filters</Link>.
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={`?page=${page - 1}&q=${filters.q ?? ''}`}
              className="px-4 py-2 border rounded-lg text-sm">
              Previous
            </Link>
          )}
          {page * pageSize < total && (
            <Link href={`?page=${page + 1}&q=${filters.q ?? ''}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
