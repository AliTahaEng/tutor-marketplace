import { CircuitBreaker } from '../circuit-breaker/CircuitBreaker'
import type { INotificationProvider, PushNotification, EmailTemplate } from '../interfaces/INotificationProvider'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export class ExpoNotificationsAdapter implements INotificationProvider {
  private readonly cb: CircuitBreaker

  constructor() {
    this.cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 60_000 })
  }

  async sendPush(expoPushToken: string, notification: PushNotification): Promise<void> {
    await this.cb.execute(async () => {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to: expoPushToken,
          title: notification.title,
          body: notification.body,
          data: notification.data ?? {},
          sound: 'default',
          priority: 'high',
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Expo push failed: ${text}`)
      }
    })
  }

  async sendEmail(_toEmail: string, _template: EmailTemplate): Promise<void> {
    throw new Error('ExpoNotificationsAdapter does not handle email. Use SendGridAdapter.')
  }
}
