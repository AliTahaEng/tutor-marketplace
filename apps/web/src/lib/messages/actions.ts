'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/guards'

const SendMessageSchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

export type MessageResult = { error: string } | { success: true }

export async function sendMessage(formData: FormData): Promise<MessageResult> {
  const user = await requireAuth()

  const parsed = SendMessageSchema.safeParse({
    bookingId: formData.get('bookingId'),
    content: (formData.get('content') as string)?.trim(),
  })

  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid message' }

  const supabase = createClient()

  // RLS on insert ensures booking is confirmed and user is a participant
  const { error } = await supabase.from('messages').insert({
    booking_id: parsed.data.bookingId,
    sender_id: user.id,
    content: parsed.data.content,
  })

  if (error) {
    if (error.code === '42501') return { error: 'You cannot message in this booking' }
    return { error: error.message }
  }

  return { success: true }
}
