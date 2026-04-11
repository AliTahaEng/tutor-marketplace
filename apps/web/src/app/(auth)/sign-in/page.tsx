'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { signIn } from '@/lib/auth/actions'
import Link from 'next/link'
import { GeometricPattern } from '@/components/ui/GeometricPattern'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        background: pending ? '#d97706aa' : 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        padding: '14px',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '16px',
        cursor: pending ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
        transition: 'all 0.2s ease',
      }}
    >
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  )
}

const initialState = { error: '' }

export default function SignInPage() {
  const [state, formAction] = useFormState(signIn, initialState)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '15px',
    color: 'var(--color-text)',
    background: '#fff',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left dark panel */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        overflow: 'hidden',
      }}>
        <GeometricPattern color="#f59e0b" opacity={0.08} />
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%,-50%)', width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.2), transparent 70%)',
        }} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '16px' }}>
            TutorQatar
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.25, marginBottom: '16px' }}>
            Welcome Back to<br />Qatar&apos;s #1 Tutor Platform
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Connect with 500+ verified tutors across Qatar. In-person &amp; online sessions.
          </p>
          <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Math', 'Physics', 'English', 'Arabic', 'Chemistry'].map(s => (
              <span key={s} style={{
                background: 'rgba(217,119,6,0.2)',
                border: '1px solid rgba(245,158,11,0.4)',
                color: 'var(--color-gold)',
                padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
              }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', background: '#fff',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '32px', fontSize: '20px', fontWeight: 800, color: '#92400e', textDecoration: 'none' }}>
            TutorQatar
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>Sign In</h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Find the right tutor in Qatar
          </p>

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {state.error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', padding: '12px 16px', fontSize: '14px' }}>
                {state.error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                Email
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                Password
              </label>
              <input id="password" name="password" type="password" required autoComplete="current-password" style={inputStyle} />
            </div>

            <SubmitButton />
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            New here?{' '}
            <Link href="/sign-up/student" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up as Student
            </Link>
            {' '}or{' '}
            <Link href="/sign-up/tutor" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up as Tutor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
