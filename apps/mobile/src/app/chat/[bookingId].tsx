import { useEffect, useRef, useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export default function ChatScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherPersonName, setOtherPersonName] = useState<string | null>(null)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    let channelRef: ReturnType<typeof supabase.channel> | null = null
    initChat().then(ch => { channelRef = ch })
    return () => { channelRef?.unsubscribe() }
  }, [bookingId])

  async function initChat(): Promise<ReturnType<typeof supabase.channel>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Load booking to find the other participant
    const { data: booking } = await supabase
      .from('bookings')
      .select('student_id, tutor_id, tutor:tutor_id(full_name), student:student_id(full_name)')
      .eq('id', bookingId)
      .single()

    if (booking) {
      const isStudent = booking.student_id === user.id
      const other = isStudent ? (booking.tutor as any) : (booking.student as any)
      setOtherPersonName(other?.full_name ?? null)
    }

    // Load existing messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    setMessages(msgs ?? [])
    setLoading(false)

    // Subscribe to new messages via realtime — return channel so caller can unsubscribe
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            // Avoid duplicate if we already added it optimistically
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
        }
      )
      .subscribe()

    return channel
  }

  async function handleSend() {
    const content = newMessage.trim()
    if (!content || !currentUserId) return

    setNewMessage('')
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content,
    })

    setSending(false)
    if (error) setNewMessage(content) // restore on error
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  }

  return (
    <>
      <Stack.Screen options={{ title: otherPersonName ?? 'Chat' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const isMine = item.sender_id === currentUserId
            const prevMsg = index > 0 ? messages[index - 1] : null
            const showTime = !prevMsg || new Date(item.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300_000

            return (
              <View>
                {showTime && (
                  <Text style={styles.timeLabel}>
                    {new Date(item.created_at).toLocaleTimeString('en-QA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message…"
            multiline
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  timeLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginVertical: 8,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  bubbleMine: {
    backgroundColor: '#6C63FF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 15, color: '#1a1a2e', lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a2e',
    maxHeight: 120,
    backgroundColor: '#f8fafc',
  },
  sendBtn: {
    backgroundColor: '#6C63FF',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c4b5fd' },
})
