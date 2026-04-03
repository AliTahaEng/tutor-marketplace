import * as Sentry from '@sentry/nextjs'

export function captureError(error: Error, context?: Record<string, unknown>): void {
  console.error('[Error]', error.message, context)
  Sentry.captureException(error, { extra: context })
}

export function captureEvent(message: string, context?: Record<string, unknown>): void {
  Sentry.captureMessage(message, { extra: context, level: 'info' })
}
