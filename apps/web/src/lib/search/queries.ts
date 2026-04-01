import { createClient } from '@/lib/supabase/server'
import type { SearchFilters } from '@tutor/core'

const PAGE_SIZE = 12

export interface TutorSearchResult {
  id: string
  fullName: string
  avatarUrl: string | null
  subjects: string[]
  areas: string[]
  hourlyRateQar: number
  sessionType: string
  languagesTaught: string[]
  avgRating: number
  reviewCount: number
  isFeatured: boolean
  yearsExperience: number
}

export interface SearchResults {
  tutors: TutorSearchResult[]
  total: number
  page: number
  pageSize: number
}

export async function searchTutors(filters: SearchFilters): Promise<SearchResults> {
  const supabase = createClient()
  const page = filters.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('tutor_search_results')
    .select('*', { count: 'exact' })

  if (filters.q?.trim()) {
    query = query.textSearch('search_vector', filters.q.trim(), { type: 'websearch' })
  }

  if (filters.area) {
    query = query.contains('areas', [filters.area])
  }

  if (filters.sessionType && filters.sessionType !== 'both') {
    query = (query as any).in('session_type', [filters.sessionType, 'both'])
  }

  if (filters.maxPriceQar) {
    query = query.lte('hourly_rate_qar', filters.maxPriceQar)
  }

  if (filters.minPriceQar) {
    query = query.gte('hourly_rate_qar', filters.minPriceQar)
  }

  if (filters.minRating) {
    query = query.gte('avg_rating', filters.minRating)
  }

  if (filters.language) {
    query = query.contains('languages_taught', [filters.language])
  }

  query = query.order('is_featured', { ascending: false })

  switch (filters.sortBy) {
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'price_asc':
      query = query.order('hourly_rate_qar', { ascending: true })
      break
    case 'price_desc':
      query = query.order('hourly_rate_qar', { ascending: false })
      break
    default:
      query = query.order('review_count', { ascending: false })
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const tutors: TutorSearchResult[] = (data ?? []).map((row: any) => ({
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    subjects: row.subjects,
    areas: row.areas,
    hourlyRateQar: Number(row.hourly_rate_qar),
    sessionType: row.session_type,
    languagesTaught: row.languages_taught,
    avgRating: Number(row.avg_rating),
    reviewCount: Number(row.review_count),
    isFeatured: row.is_featured,
    yearsExperience: row.years_experience,
  }))

  return { tutors, total: count ?? 0, page, pageSize: PAGE_SIZE }
}
