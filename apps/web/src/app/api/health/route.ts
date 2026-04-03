import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const checks: Record<string, boolean> = {}

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks['database'] = !error
  } catch {
    checks['database'] = false
  }

  const allHealthy = Object.values(checks).every(v => v === true)

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    },
    { status: allHealthy ? 200 : 503 }
  )
}
