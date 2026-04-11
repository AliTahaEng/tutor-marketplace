// Sentry is optional — only active when @sentry/nextjs is installed and configured.
// Import lazily to avoid build errors when the package is absent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null
try {
  // Dynamic require so the build doesn't fail when @sentry/nextjs is not installed.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require('@sentry/nextjs')
} catch {
  // package not installed — silently no-op
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  console.error('[Error]', error.message, context)
  Sentry?.captureException(error, { extra: context })
}

export function captureEvent(message: string, context?: Record<string, unknown>): void {
  Sentry?.captureMessage(message, { extra: context, level: 'info' })
}
