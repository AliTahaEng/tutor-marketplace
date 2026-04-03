'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/messages/actions'
import type { Message } from '@/lib/messages/queries'
import Link from 'next/link'

interface Props {
  params: { bookingId: string }
}

export default function ChatPage({ params }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    let ignore = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!ignore) setCurrentUserId(user?.id ?? null)

      const { data } = await supabase
        .from('messages')
        .select(`id, booking_id, sender_id, content, created_at, profiles!sender_id (full_name)`)
        .eq('booking_id', params.bookingId)
        .order('created_at', { ascending: true })

      if (!ignore && data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          bookingId: m.booking_id,
          senderId: m.sender_id,
          senderName: m.profiles?.full_name ?? 'Unknown',
          content: m.content,
          createdAt: m.created_at,
        })))
      }
      setLoading(false)
    }

    init()

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`messages:${params.bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${params.bookingId}`,
        },
        async (payload) => {
          const msg = payload.new as any
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single()

          const newMsg: Message = {
            id: msg.id,
            bookingId: msg.booking_id,
            senderId: msg.sender_id,
            senderName: profile?.full_name ?? 'Unknown',
            content: msg.content,
            createdAt: msg.created_at,
          }

          if (!ignore) setMessages(prev => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [params.bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const content = formData.get('content')?.toString().trim()
    if (!content) return

    setSending(true)
    setError(null)
    const result = await sendMessage(formData)
    if ('success' in result) {
      form.reset()
    } else {
      setError(result.error)
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/bookings/${params.bookingId}`} className="text-blue-600 hover:underline text-sm">
          ← Back to booking
        </Link>
        <span className="text-sm text-muted-foreground">Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isOwn = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="text-xs text-muted-foreground mb-1">{msg.senderName}</span>
                )}
                <div className={`rounded-2xl px-4 py-2 text-sm ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}

        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No messages yet. Start the conversation!
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t p-4 space-y-2">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <input type="hidden" name="bookingId" value={params.bookingId} />
          <input
            name="content"
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
