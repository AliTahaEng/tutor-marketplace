import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

const QATAR_AREAS = ['Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor', 'Lusail', 'Al Daayen']

type Tutor = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  hourly_rate_qar: number | null
  session_type: string | null
  subjects: string[] | null
  areas: string[] | null
  avg_rating: number | null
  review_count: number | null
  is_featured: boolean | null
}

export default function SearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState<string | null>(null)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('tutor_search_results')
      .select('id, full_name, avatar_url, bio, hourly_rate_qar, session_type, subjects, areas, avg_rating, review_count, is_featured')
      .eq('verification_status', 'approved')
      .order('is_featured', { ascending: false })
      .order('avg_rating', { ascending: false })
      .limit(30)

    if (query.trim()) {
      q = q.textSearch('search_vector', query.trim(), { type: 'websearch' })
    }
    if (area) {
      q = q.contains('areas', [area])
    }

    const { data } = await q
    setTutors(data ?? [])
    setLoading(false)
  }, [query, area])

  useEffect(() => { search() }, [area])

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or subject…"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); search() }}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Area filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.chip, !area && styles.chipActive]}
          onPress={() => setArea(null)}
        >
          <Text style={[styles.chipText, !area && styles.chipTextActive]}>All Areas</Text>
        </TouchableOpacity>
        {QATAR_AREAS.map(a => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, area === a && styles.chipActive]}
            onPress={() => setArea(a === area ? null : a)}
          >
            <Text style={[styles.chipText, area === a && styles.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6C63FF" />
      ) : (
        <FlatList
          data={tutors}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/tutor/${item.id}`)}
            >
              {item.is_featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>⭐ Featured</Text>
                </View>
              )}
              <View style={styles.cardRow}>
                <Image
                  source={{ uri: item.avatar_url ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.full_name ?? 'T') }}
                  style={styles.avatar}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.tutorName}>{item.full_name}</Text>
                  <Text style={styles.subjects} numberOfLines={1}>
                    {item.subjects?.slice(0, 3).join(' · ')}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.ratingText}>
                      {item.avg_rating ? item.avg_rating.toFixed(1) : 'New'}
                      {item.review_count ? ` (${item.review_count})` : ''}
                    </Text>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.sessionType}>{item.session_type?.replace('_', ' ')}</Text>
                  </View>
                </View>
                <Text style={styles.price}>
                  {item.hourly_rate_qar}{'\n'}
                  <Text style={styles.priceLabel}>QAR/hr</Text>
                </Text>
              </View>
              {item.bio && (
                <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No tutors found</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1a1a2e' },
  filtersRow: { paddingLeft: 16, marginBottom: 8, flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, backgroundColor: '#e2e8f0' },
  cardInfo: { flex: 1 },
  tutorName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  subjects: { fontSize: 13, color: '#6C63FF', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  dot: { color: '#cbd5e1', fontSize: 12 },
  sessionType: { fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' },
  price: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', textAlign: 'right' },
  priceLabel: { fontSize: 11, fontWeight: '400', color: '#94a3b8' },
  bio: { fontSize: 13, color: '#64748b', marginTop: 10, lineHeight: 18 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
})
