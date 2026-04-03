import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

type Conversation = {
  bookingId: string
  otherPersonName: string | null
  otherPersonAvatar: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  status: string
}

export default function MessagesScreen() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    loadConversations()
  }, []))

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isStudent = profile?.role === 'student'

    // Get bookings in chat-eligible statuses
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id, status,
        tutor:tutor_id(full_name, avatar_url),
        student:student_id(full_name, avatar_url)
      `)
      .in('status', ['confirmed', 'completed', 'paid', 'disputed'])
      .eq(isStudent ? 'student_id' : 'tutor_id', user.id)
      .order('updated_at', { ascending: false })

    if (!bookings) {
      setLoading(false)
      return
    }

    // For each booking, fetch the latest message
    const convos: Conversation[] = await Promise.all(
      bookings.map(async (b) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('booking_id', b.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const other = isStudent ? (b.tutor as any) : (b.student as any)
        return {
          bookingId: b.id,
          otherPersonName: other?.full_name ?? null,
          otherPersonAvatar: other?.avatar_url ?? null,
          lastMessage: msgs?.[0]?.content ?? 'No messages yet',
          lastMessageAt: msgs?.[0]?.created_at ?? null,
          status: b.status,
        }
      })
    )

    setConversations(convos)
    setLoading(false)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  }

  return (
    <FlatList
      style={styles.container}
      data={conversations}
      keyExtractor={item => item.bookingId}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const time = item.lastMessageAt
          ? new Date(item.lastMessageAt).toLocaleTimeString('en-QA', { hour: '2-digit', minute: '2-digit' })
          : ''
        return (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/chat/${item.bookingId}`)}
          >
            <Image
              source={{ uri: item.otherPersonAvatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherPersonName ?? 'U')}` }}
              style={styles.avatar}
            />
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.otherPersonName ?? 'Unknown'}</Text>
                <Text style={styles.time}>{time}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
          </TouchableOpacity>
        )
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting after a booking is confirmed</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#e2e8f0' },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  time: { fontSize: 12, color: '#94a3b8' },
  preview: { fontSize: 14, color: '#64748b' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 78 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
})
