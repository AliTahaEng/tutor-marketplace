import { searchTutors } from '@/lib/search/queries'
import { SearchFiltersSchema } from '@tutor/core'
import { SearchClient } from './SearchClient'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function SearchPage({ searchParams }: PageProps) {
  const rawFilters = {
    q:           str(searchParams['q']),
    area:        str(searchParams['area']),
    sessionType: str(searchParams['sessionType']),
    maxPriceQar: searchParams['maxPriceQar'] ? Number(searchParams['maxPriceQar']) : undefined,
    minPriceQar: searchParams['minPriceQar'] ? Number(searchParams['minPriceQar']) : undefined,
    minRating:   searchParams['minRating']   ? Number(searchParams['minRating'])   : undefined,
    sortBy:      str(searchParams['sortBy']),
    page:        searchParams['page'] ? Number(searchParams['page']) : 1,
  }

  const parsed = SearchFiltersSchema.safeParse(rawFilters)
  const filters = parsed.success ? parsed.data : { page: 1 }

  let results = { tutors: [] as any[], total: 0, page: 1, pageSize: 12 }
  try {
    results = await searchTutors(filters as any)
  } catch { /* show empty on DB error */ }

  return (
    <SearchClient
      tutors={results.tutors}
      total={results.total}
      page={results.page}
      pageSize={results.pageSize}
      filters={{
        q: (filters as any).q,
        area: (filters as any).area,
        sessionType: (filters as any).sessionType,
        maxPriceQar: (filters as any).maxPriceQar,
        sortBy: (filters as any).sortBy,
      }}
    />
  )
}
