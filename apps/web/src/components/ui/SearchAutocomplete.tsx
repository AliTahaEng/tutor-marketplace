'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useClickOutside } from '@/hooks/useClickOutside'

const SUBJECTS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Arabic',
  'French', 'History', 'Computer Science', 'Economics', 'Geography',
  'Islamic Studies', 'Science', 'Literature', 'Music',
]

interface Suggestion {
  type: 'subject' | 'tutor'
  label: string
  value: string
}

interface SearchAutocompleteProps {
  defaultValue?: string
  onSearch: (value: string) => void
  placeholder?: string
  size?: 'md' | 'lg'
}

export function SearchAutocomplete({
  defaultValue = '',
  onSearch,
  placeholder = 'Search subject or tutor…',
  size = 'md',
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useClickOutside(containerRef, () => setOpen(false))

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 1) { setSuggestions([]); setOpen(false); return }

    const subjectMatches: Suggestion[] = SUBJECTS
      .filter(s => s.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map(s => ({ type: 'subject', label: s, value: s }))

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tutor')
      .ilike('full_name', `%${q}%`)
      .limit(4)

    const tutorMatches: Suggestion[] = (data ?? []).map((t: any) => ({
      type: 'tutor' as const,
      label: t.full_name,
      value: t.full_name,
    }))

    const all = [...subjectMatches, ...tutorMatches].slice(0, 8)
    setSuggestions(all)
    setOpen(all.length > 0)
    setActiveIdx(-1)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  function selectSuggestion(value: string) {
    setQuery(value)
    setOpen(false)
    onSearch(value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter') {
      if (activeIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIdx].value) }
      else { setOpen(false); onSearch(query) }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: size === 'lg' ? '16px 20px' : '12px 16px',
    fontSize: size === 'lg' ? '16px' : '14px',
    background: '#fff',
    color: 'var(--color-text)',
    outline: 'none',
    boxShadow: 'var(--shadow-card)',
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        style={inputStyle}
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lift)',
              zIndex: 200,
              overflow: 'hidden',
            }}
          >
            {suggestions.map((s, i) => (
              <motion.div
                key={s.value + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => selectSuggestion(s.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: activeIdx === i ? 'var(--color-primary-light)' : 'transparent',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-bg-alt)' : 'none',
                }}
              >
                <span style={{ fontSize: '16px' }}>{s.type === 'subject' ? '📚' : '👤'}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-faint)' }}>
                  {s.type === 'subject' ? 'Subject' : 'Tutor'}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
