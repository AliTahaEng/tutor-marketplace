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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '384px', background: 'var(--color-bg)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading messages...</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-alt), var(--color-primary-light))',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Link href={`/bookings/${params.bookingId}`} style={{
          color: 'var(--color-primary)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          ← Back to booking
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Chat</span>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map(msg => {
          const isOwn = msg.senderId === currentUserId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                {!isOwn && (
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    {msg.senderName}
                  </span>
                )}
                <div style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  background: isOwn ? 'var(--color-primary-light)' : '#fff',
                  color: isOwn ? '#92400e' : 'var(--color-text)',
                  border: isOwn ? '1px solid var(--color-gold-bright)' : '1px solid var(--color-border)',
                  borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '48px 0' }}>
            No messages yet. Start the conversation!
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} style={{
        background: '#fff',
        borderTop: '1px solid var(--color-border)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {error && <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="hidden" name="bookingId" value={params.bookingId} />
          <input
            name="content"
            placeholder="Type a message..."
            maxLength={2000}
            style={{
              flex: 1,
              border: '1.5px solid var(--color-border)',
              borderRadius: '9999px',
              padding: '10px 18px',
              fontSize: '14px',
              outline: 'none',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          <button
            type="submit"
            disabled={sending}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
