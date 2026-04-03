import { searchTutors } from '@/lib/search/queries'
import { SearchFiltersSchema } from '@tutor/core'
import Link from 'next/link'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function SearchPage({ searchParams }: PageProps) {
  const rawFilters = {
    q:            str(searchParams['q']),
    area:         str(searchParams['area']),
    sessionType:  str(searchParams['sessionType']),
    maxPriceQar:  searchParams['maxPriceQar'] ? Number(searchParams['maxPriceQar']) : undefined,
    minPriceQar:  searchParams['minPriceQar'] ? Number(searchParams['minPriceQar']) : undefined,
    minRating:    searchParams['minRating']    ? Number(searchParams['minRating'])   : undefined,
    language:     str(searchParams['language']),
    sortBy:       str(searchParams['sortBy']),
    page:         searchParams['page'] ? Number(searchParams['page']) : 1,
  }

  const parsed = SearchFiltersSchema.safeParse(rawFilters)
  const filters = parsed.success ? parsed.data : { page: 1 }
  let results = { tutors: [] as any[], total: 0, page: 1, pageSize: 12 }

  try {
    results = await searchTutors(filters as any)
  } catch {
    // Show empty results on error (e.g. DB not connected yet)
  }

  const { tutors, total, page, pageSize } = results

  // Build a query-string helper that preserves all current filters
  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams()
    if (filters.q)            params.set('q',           filters.q)
    if (filters.area)         params.set('area',        filters.area)
    if (filters.sessionType)  params.set('sessionType', filters.sessionType)
    if (filters.maxPriceQar)  params.set('maxPriceQar', String(filters.maxPriceQar))
    if (filters.minPriceQar)  params.set('minPriceQar', String(filters.minPriceQar))
    if (filters.minRating)    params.set('minRating',   String(filters.minRating))
    if (filters.language)     params.set('language',    filters.language)
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy)
    params.set('page', String(targetPage))
    return `/search?${params.toString()}`
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Search bar */}
      <form className="flex gap-2 mb-5">
        {/* Preserve all filters when re-searching */}
        {filters.area &&        <input type="hidden" name="area"        value={filters.area} />}
        {filters.sessionType && <input type="hidden" name="sessionType" value={filters.sessionType} />}
        {filters.maxPriceQar && <input type="hidden" name="maxPriceQar" value={filters.maxPriceQar} />}
        {filters.sortBy &&      <input type="hidden" name="sortBy"      value={filters.sortBy} />}

        <input
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder='Search "Math", "Guitar", "English"…'
          className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700">
          Search
        </button>
      </form>

      {/* Filters */}
      <form className="flex gap-3 flex-wrap mb-5">
        <input type="hidden" name="q" value={filters.q ?? ''} />

        <select name="area" defaultValue={filters.area ?? ''}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Qatar</option>
          {['Doha','Al Rayyan','Al Wakra','Al Khor','Lusail','Al Daayen','Al Shamal','Al Shahaniya'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select name="sessionType" defaultValue={filters.sessionType ?? ''}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Any type</option>
          <option value="in_person">In-person</option>
          <option value="online">Online</option>
        </select>

        <select name="maxPriceQar" defaultValue={filters.maxPriceQar ? String(filters.maxPriceQar) : ''}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Any price</option>
          <option value="100">Under 100 QAR</option>
          <option value="200">Under 200 QAR</option>
          <option value="500">Under 500 QAR</option>
        </select>

        <select name="sortBy" defaultValue={filters.sortBy ?? 'relevance'}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="relevance">Most Relevant</option>
          <option value="rating">Highest Rated</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <button type="submit"
          className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
          Apply Filters
        </button>

        {(filters.q || filters.area || filters.sessionType || filters.maxPriceQar) && (
          <Link href="/search"
            className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
            Clear
          </Link>
        )}
      </form>

      <p className="text-sm text-gray-500 mb-4">
        {total} tutor{total !== 1 ? 's' : ''} found
        {filters.q ? ` for "${filters.q}"` : ''}
      </p>

      {/* Results */}
      <div className="space-y-3">
        {tutors.map((tutor: any) => (
          <div key={tutor.id}
            className="border rounded-xl p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl">
              {tutor.avatarUrl
                ? <img src={tutor.avatarUrl} alt={tutor.fullName} className="w-full h-full object-cover" />
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
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                {tutor.subjects.slice(0, 3).join(' · ')} · {tutor.areas[0]} · {tutor.yearsExperience} yrs exp
              </p>
              <p className="text-sm mt-0.5">
                <span className="text-amber-500 font-medium">★ {Number(tutor.avgRating).toFixed(1)}</span>
                <span className="text-gray-400 ml-1">({tutor.reviewCount} reviews)</span>
                <span className="text-gray-400 ml-3 text-xs">
                  {tutor.sessionType === 'in_person' ? 'In-person' :
                   tutor.sessionType === 'online'    ? 'Online' : 'In-person & Online'}
                </span>
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold text-blue-600 text-lg">{tutor.hourlyRateQar} QAR</p>
              <p className="text-gray-400 text-xs mb-2">per hour</p>
              <Link href={`/tutor/${tutor.id}`}
                className="block bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                View Profile
              </Link>
            </div>
          </div>
        ))}

        {tutors.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No tutors found</p>
            <p className="text-sm">Try different filters or{' '}
              <Link href="/search" className="text-blue-600 hover:underline">clear all filters</Link>.
            </p>
          </div>
        )}
      </div>

      {/* Pagination — preserves ALL active filters */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
              ← Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page * pageSize < total && (
            <Link href={buildPageUrl(page + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
