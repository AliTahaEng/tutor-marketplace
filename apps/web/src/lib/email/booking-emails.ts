/**
 * Thin wrapper around SendGridAdapter for booking lifecycle emails.
 * Silently no-ops when SENDGRID_API_KEY is not configured (dev convenience).
 */
import { createClient } from '@supabase/supabase-js'
import { SendGridAdapter } from '@tutor/core'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let emailAdapter: SendGridAdapter | null = null

function getEmailAdapter(): SendGridAdapter | null {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return null
  if (!emailAdapter) {
    emailAdapter = new SendGridAdapter({
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
    })
  }
  return emailAdapter
}

type EmailEvent =
  | 'booking_confirmed'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'session_completed'
  | 'tutor_approved'
  | 'tutor_rejected'

interface EmailParams {
  bookingId: string
  recipientUserId: string
  scheduledAt: string
  durationMinutes: number
  tutorName?: string
  extraVars?: Record<string, string>
}

const EVENT_TEMPLATE: Record<EmailEvent, string> = {
  booking_confirmed: 'booking-confirmed',
  booking_declined:  'booking-declined',
  booking_cancelled: 'booking-declined',  // reuse "declined" template
  session_completed: 'session-complete-review',
  tutor_approved:    'tutor-approved',
  tutor_rejected:    'tutor-rejected',
}

export async function sendBookingEmail(
  event: EmailEvent,
  params: EmailParams
): Promise<void> {
  const adapter = getEmailAdapter()
  if (!adapter) return  // SendGrid not configured — skip silently

  try {
    // Fetch recipient email from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', params.recipientUserId)
      .single()

    if (!profile?.email) return

    const scheduledDisplay = new Date(params.scheduledAt).toLocaleString('en-QA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tutorqatar.com'

    await adapter.sendEmail(profile.email, {
      templateId: EVENT_TEMPLATE[event],
      variables: {
        recipientName: profile.full_name ?? 'there',
        tutorName: params.tutorName ?? 'your tutor',
        scheduledAt: scheduledDisplay,
        durationMinutes: String(params.durationMinutes),
        bookingUrl: `${appUrl}/bookings/${params.bookingId}`,
        reviewUrl: `${appUrl}/bookings/${params.bookingId}/review`,
        ...params.extraVars,
      },
    })
  } catch {
    // Email failures must never break the booking flow
    console.error(`[email] Failed to send ${event} email to ${params.recipientUserId}`)
  }
}

export async function sendTutorStatusEmail(
  tutorId: string,
  event: 'tutor_approved' | 'tutor_rejected',
  reason?: string
): Promise<void> {
  const adapter = getEmailAdapter()
  if (!adapter) return

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', tutorId)
      .single()

    if (!profile?.email) return

    await adapter.sendEmail(profile.email, {
      templateId: EVENT_TEMPLATE[event],
      variables: {
        recipientName: profile.full_name ?? 'there',
        reason: reason ?? 'not specified',
      },
    })
  } catch {
    console.error(`[email] Failed to send ${event} email to tutor ${tutorId}`)
  }
}
