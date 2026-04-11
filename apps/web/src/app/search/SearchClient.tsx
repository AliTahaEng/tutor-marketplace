'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { TutorCard, TutorCardData } from '@/components/ui/TutorCard'
import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

const AREAS = ['Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor', 'Lusail', 'Al Daayen', 'Al Shamal', 'Al Shahaniya']

interface SearchClientProps {
  tutors: TutorCardData[]
  total: number
  page: number
  pageSize: number
  filters: {
    q?: string
    area?: string
    sessionType?: string
    maxPriceQar?: number
    sortBy?: string
  }
}

export function SearchClient({ tutors, total, page, pageSize, filters }: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') p.delete(k)
      else p.set(k, v)
    }
    return `/search?${p.toString()}`
  }, [searchParams])

  function handleSearch(value: string) {
    router.push(buildUrl({ q: value, page: '1' }))
  }

  const totalPages = Math.ceil(total / pageSize)

  const selectStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    background: '#fff',
    color: 'var(--color-text)',
    cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Filter bar */}
      <div style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <SearchAutocomplete
                defaultValue={filters.q ?? ''}
                onSearch={handleSearch}
                placeholder="Search subject or tutor name…"
                size="lg"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <select
              defaultValue={filters.area ?? ''}
              onChange={e => router.push(buildUrl({ area: e.target.value, page: '1' }))}
              style={selectStyle}
            >
              <option value="">All Qatar</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              defaultValue={filters.sessionType ?? ''}
              onChange={e => router.push(buildUrl({ sessionType: e.target.value, page: '1' }))}
              style={selectStyle}
            >
              <option value="">Any type</option>
              <option value="in_person">In-person</option>
              <option value="online">Online</option>
            </select>

            <select
              defaultValue={filters.maxPriceQar ? String(filters.maxPriceQar) : ''}
              onChange={e => router.push(buildUrl({ maxPriceQar: e.target.value, page: '1' }))}
              style={selectStyle}
            >
              <option value="">Any price</option>
              <option value="100">Under 100 QAR</option>
              <option value="200">Under 200 QAR</option>
              <option value="500">Under 500 QAR</option>
            </select>

            <select
              defaultValue={filters.sortBy ?? 'relevance'}
              onChange={e => router.push(buildUrl({ sortBy: e.target.value, page: '1' }))}
              style={selectStyle}
            >
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>

            {(filters.q || filters.area || filters.sessionType || filters.maxPriceQar) && (
              <Link href="/search" style={{
                color: '#dc2626', fontSize: '13px', padding: '8px 14px',
                border: '1px solid #fca5a5', borderRadius: '10px',
                textDecoration: 'none', background: '#fff', fontWeight: 600,
              }}>
                ✕ Clear
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px', fontWeight: 600 }}>
          {total} tutor{total !== 1 ? 's' : ''} found
          {filters.q ? ` for "${filters.q}"` : ''}
        </p>

        {tutors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              No tutors found
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Try different filters or search terms
            </p>
            <GoldButton href="/search">Browse All Tutors</GoldButton>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {tutors.map((tutor, i) => <TutorCard key={tutor.id} tutor={tutor} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '48px' }}>
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} style={{
                padding: '10px 20px', border: '1px solid var(--color-border)',
                borderRadius: '10px', textDecoration: 'none',
                color: 'var(--color-text)', fontWeight: 600, fontSize: '14px', background: '#fff',
              }}>← Previous</Link>
            )}
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} style={{
                padding: '10px 20px', background: 'var(--color-primary)',
                borderRadius: '10px', textDecoration: 'none',
                color: '#fff', fontWeight: 700, fontSize: '14px',
              }}>Next →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
