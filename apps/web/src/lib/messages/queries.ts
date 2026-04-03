import { createClient } from '@/lib/supabase/server'

export interface Message {
  id: string
  bookingId: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

export async function getMessages(bookingId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select(`
      id,
      booking_id,
      sender_id,
      content,
      created_at,
      profiles!sender_id (full_name)
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  return (data ?? []).map((m: any) => ({
    id: m.id,
    bookingId: m.booking_id,
    senderId: m.sender_id,
    senderName: m.profiles?.full_name ?? 'Unknown',
    content: m.content,
    createdAt: m.created_at,
  }))
}
