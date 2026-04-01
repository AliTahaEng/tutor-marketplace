export type NotificationChannel = 'push' | 'email' | 'both'

export interface PushNotification {
  title: string
  body: string
  data?: Record<string, string>
}

export type EmailTemplateId =
  | 'booking-confirmed'
  | 'booking-declined'
  | 'booking-reminder-24h'
  | 'booking-reminder-1h'
  | 'tutor-approved'
  | 'tutor-rejected'
  | 'session-complete-review'
  | 'dispute-opened'
  | 'dispute-resolved'

export interface EmailTemplate {
  templateId: EmailTemplateId
  variables: Record<string, string>
}

export interface INotificationProvider {
  sendPush(expoPushToken: string, notification: PushNotification): Promise<void>
  sendEmail(toEmail: string, template: EmailTemplate): Promise<void>
}
