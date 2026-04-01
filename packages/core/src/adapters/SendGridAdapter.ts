import sgMail from '@sendgrid/mail'
import { CircuitBreaker } from '../circuit-breaker/CircuitBreaker'
import type { INotificationProvider, PushNotification, EmailTemplate } from '../interfaces/INotificationProvider'

const EMAIL_TEMPLATES: Record<string, { subject: string; textBody: (vars: Record<string, string>) => string }> = {
  'booking-confirmed': {
    subject: 'Your booking is confirmed!',
    textBody: (v) => `Hi,\n\nYour session with ${v['tutorName'] ?? 'your tutor'} is confirmed for ${v['scheduledAt'] ?? ''}.\n\nTutorQatar`,
  },
  'booking-declined': {
    subject: 'Booking declined',
    textBody: (v) => `Hi,\n\n${v['tutorName'] ?? 'The tutor'} could not confirm your session. You have been fully refunded.\n\nTutorQatar`,
  },
  'booking-reminder-24h': {
    subject: 'Session reminder — tomorrow',
    textBody: (v) => `Hi,\n\nReminder: your session with ${v['tutorName'] ?? 'your tutor'} is tomorrow at ${v['scheduledAt'] ?? ''}.\n\nTutorQatar`,
  },
  'booking-reminder-1h': {
    subject: 'Session starting in 1 hour',
    textBody: (v) => `Hi,\n\nYour session with ${v['tutorName'] ?? 'your tutor'} starts in 1 hour.\n\nTutorQatar`,
  },
  'tutor-approved': {
    subject: 'Your tutor profile is approved!',
    textBody: () => `Congratulations! Your tutor profile has been approved and is now live on TutorQatar.\n\nTutorQatar`,
  },
  'tutor-rejected': {
    subject: 'Tutor application update',
    textBody: (v) => `Hi,\n\nYour tutor application was not approved. Reason: ${v['reason'] ?? 'not specified'}.\n\nTutorQatar`,
  },
  'session-complete-review': {
    subject: 'How was your session?',
    textBody: (v) => `Hi,\n\nYour session with ${v['tutorName'] ?? 'your tutor'} is complete. Please leave a review!\n\n${v['reviewUrl'] ?? ''}\n\nTutorQatar`,
  },
  'dispute-opened': {
    subject: 'Dispute opened on your booking',
    textBody: () => `Hi,\n\nA dispute has been opened on one of your bookings. Our team will review it within 24 hours.\n\nTutorQatar`,
  },
  'dispute-resolved': {
    subject: 'Your dispute has been resolved',
    textBody: (v) => `Hi,\n\nYour dispute has been resolved: ${v['resolution'] ?? ''}.\n\nTutorQatar`,
  },
}

interface SendGridConfig {
  apiKey: string
  fromEmail: string
}

export class SendGridAdapter implements INotificationProvider {
  private readonly fromEmail: string
  private readonly cb: CircuitBreaker

  constructor(config: SendGridConfig) {
    sgMail.setApiKey(config.apiKey)
    this.fromEmail = config.fromEmail
    this.cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 60_000 })
  }

  async sendPush(_expoPushToken: string, _notification: PushNotification): Promise<void> {
    throw new Error('SendGridAdapter does not handle push. Use ExpoNotificationsAdapter.')
  }

  async sendEmail(toEmail: string, template: EmailTemplate): Promise<void> {
    const tmpl = EMAIL_TEMPLATES[template.templateId]
    if (!tmpl) throw new Error(`Unknown email template: ${template.templateId}`)

    await this.cb.execute(() =>
      sgMail.send({
        to: toEmail,
        from: this.fromEmail,
        subject: tmpl.subject,
        text: tmpl.textBody(template.variables),
      })
    )
  }
}
