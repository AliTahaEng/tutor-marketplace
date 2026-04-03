import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

type Booking = {
  id: string
  status: string
  scheduled_at: string
  duration_minutes: number
  total_amount_qar: number
  session_mode: string
  tutor: { full_name: string | null } | null
  student: { full_name: string | null } | null
}

const STATUS_COLOR: Record<string, string> = {
  pending_payment: '#f59e0b',
  awaiting_confirmation: '#3b82f6',
  confirmed: '#10b981',
  completed: '#6C63FF',
  paid: '#6C63FF',
  cancelled: '#ef4444',
  declined: '#ef4444',
  refunded: '#94a3b8',
  disputed: '#f97316',
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  awaiting_confirmation: 'Pending Confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  paid: 'Paid',
  cancelled: 'Cancelled',
  declined: 'Declined',
  refunded: 'Refunded',
  disputed: 'In Dispute',
}

export default function BookingsScreen() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  async function loadBookings(uid: string, role: string) {
    const col = role === 'tutor' ? 'tutor_id' : 'student_id'
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, scheduled_at, duration_minutes, total_amount_qar, session_mode,
        tutor:tutor_id(full_name),
        student:student_id(full_name)
      `)
      .eq(col, uid)
      .order('scheduled_at', { ascending: false })
      .limit(50)
    setBookings((data as Booking[]) ?? [])
  }

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role ?? 'student'
    setUserRole(role)
    await loadBookings(user.id, role)
    setLoading(false)
  }

  useFocusEffect(useCallback(() => {
    init()
  }, []))

  async function handleRefresh() {
    if (!userId || !userRole) return
    setRefreshing(true)
    await loadBookings(userId, userRole)
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={bookings}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      renderItem={({ item }) => {
        const date = new Date(item.scheduled_at)
        const color = STATUS_COLOR[item.status] ?? '#94a3b8'
        const otherPerson = userRole === 'tutor'
          ? (item.student as any)?.full_name
          : (item.tutor as any)?.full_name

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/bookings/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.person}>{otherPerson ?? '—'}</Text>
              <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
                <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                <Text style={styles.infoText}>
                  {date.toLocaleDateString('en-QA', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={14} color="#94a3b8" />
                <Text style={styles.infoText}>
                  {date.toLocaleTimeString('en-QA', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{item.duration_minutes} min
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name={item.session_mode === 'online' ? 'videocam-outline' : 'location-outline'} size={14} color="#94a3b8" />
                <Text style={styles.infoText} style={{ textTransform: 'capitalize' }}>
                  {item.session_mode?.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.amount}>{item.total_amount_qar} QAR</Text>
          </TouchableOpacity>
        )
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Book a session with a tutor to get started</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  person: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { gap: 5, marginBottom: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: '#64748b' },
  amount: { fontSize: 15, fontWeight: '700', color: '#6C63FF', textAlign: 'right' },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
})
