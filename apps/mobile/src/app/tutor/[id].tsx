import { useEffect, useState } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type TutorDetail = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  hourly_rate_qar: number | null
  session_type: string | null
  areas: string[] | null
  subjects: string[] | null
  languages_taught: string[] | null
  years_experience: number | null
  avg_rating: number | null
  review_count: number | null
  availability: { day_of_week: number; start_time: string; end_time: string }[]
  reviews: { rating: number; comment: string | null; created_at: string; reviewer_name: string | null }[]
}

export default function TutorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [tutor, setTutor] = useState<TutorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadTutor()
  }, [id])

  async function loadTutor() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    // Main tutor data from view
    const { data: tutorData } = await supabase
      .from('tutor_search_results')
      .select('id, full_name, avatar_url, bio, hourly_rate_qar, session_type, areas, subjects, languages_taught, avg_rating, review_count')
      .eq('id', id)
      .single()

    // Years experience from tutor_profiles
    const { data: tpData } = await supabase
      .from('tutor_profiles')
      .select('years_experience')
      .eq('id', id)
      .single()

    // Availability slots
    const { data: availability } = await supabase
      .from('tutor_availability')
      .select('day_of_week, start_time, end_time')
      .eq('tutor_id', id)
      .order('day_of_week')

    // Latest reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, comment, created_at, student:student_id(full_name)')
      .eq('tutor_id', id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (tutorData) {
      setTutor({
        ...tutorData,
        years_experience: tpData?.years_experience ?? null,
        availability: availability ?? [],
        reviews: (reviews ?? []).map((r: any) => ({
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_name: r.student?.full_name ?? null,
        })),
      })
    }
    setLoading(false)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  }
  if (!tutor) {
    return <View style={styles.center}><Text>Tutor not found</Text></View>
  }

  const isOwnProfile = currentUserId === tutor.id
  const avatarUrl = tutor.avatar_url
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.full_name ?? 'T')}&background=6C63FF&color=fff&size=128`

  return (
    <>
      <Stack.Screen options={{ title: tutor.full_name ?? 'Tutor Profile' }} />
      <ScrollView style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.name}>{tutor.full_name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.rating}>
              {tutor.avg_rating ? tutor.avg_rating.toFixed(1) : 'No reviews'}
              {tutor.review_count ? ` (${tutor.review_count} reviews)` : ''}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <StatPill icon="time-outline" value={`${tutor.years_experience ?? 0}y exp`} />
            <StatPill icon="cash-outline" value={`${tutor.hourly_rate_qar} QAR/hr`} />
            <StatPill
              icon={tutor.session_type === 'online' ? 'videocam-outline' : tutor.session_type === 'in_person' ? 'location-outline' : 'swap-horizontal-outline'}
              value={tutor.session_type?.replace('_', ' ') ?? ''}
            />
          </View>
        </View>

        {/* Bio */}
        {tutor.bio && (
          <Section title="About">
            <Text style={styles.bio}>{tutor.bio}</Text>
          </Section>
        )}

        {/* Subjects */}
        {tutor.subjects?.length ? (
          <Section title="Subjects">
            <View style={styles.tags}>
              {tutor.subjects.map(s => <Tag key={s} label={s} />)}
            </View>
          </Section>
        ) : null}

        {/* Areas */}
        {tutor.areas?.length ? (
          <Section title="Areas">
            <View style={styles.tags}>
              {tutor.areas.map(a => <Tag key={a} label={a} color="#10b981" />)}
            </View>
          </Section>
        ) : null}

        {/* Languages */}
        {tutor.languages_taught?.length ? (
          <Section title="Languages">
            <View style={styles.tags}>
              {tutor.languages_taught.map(l => <Tag key={l} label={l} color="#f59e0b" />)}
            </View>
          </Section>
        ) : null}

        {/* Availability */}
        {tutor.availability.length > 0 && (
          <Section title="Weekly Availability">
            {tutor.availability.map((slot, i) => (
              <View key={i} style={styles.slotRow}>
                <Text style={styles.slotDay}>{DAY_NAMES[slot.day_of_week]}</Text>
                <Text style={styles.slotTime}>{slot.start_time} – {slot.end_time}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Reviews */}
        {tutor.reviews.length > 0 && (
          <Section title="Recent Reviews">
            {tutor.reviews.map((r, i) => (
              <View key={i} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{r.reviewer_name ?? 'Student'}</Text>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Ionicons key={j} name="star" size={12} color={j < r.rating ? '#f59e0b' : '#e2e8f0'} />
                    ))}
                  </View>
                </View>
                {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              </View>
            ))}
          </Section>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book button — only show if not viewing own profile */}
      {!isOwnProfile && (
        <View style={styles.footer}>
          <View style={styles.priceBox}>
            <Text style={styles.priceAmount}>{tutor.hourly_rate_qar} QAR</Text>
            <Text style={styles.priceLabel}>per hour</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push(`/book/${tutor.id}`)}
          >
            <Text style={styles.bookBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function StatPill({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={14} color="#6C63FF" />
      <Text style={styles.statText}>{value}</Text>
    </View>
  )
}

function Tag({ label, color = '#6C63FF' }: { label: string; color?: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, backgroundColor: '#e2e8f0' },
  name: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  rating: { fontSize: 14, color: '#475569', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: { fontSize: 12, color: '#6C63FF', fontWeight: '600', textTransform: 'capitalize' },
  section: {
    backgroundColor: '#fff',
    margin: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  bio: { fontSize: 14, color: '#475569', lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontWeight: '600' },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  slotDay: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  slotTime: { fontSize: 14, color: '#64748b' },
  review: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: '#64748b', lineHeight: 20 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  priceBox: { flex: 1 },
  priceAmount: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  priceLabel: { fontSize: 12, color: '#94a3b8' },
  bookBtn: {
    flex: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
