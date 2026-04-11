'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { signUpStudent } from '@/lib/auth/actions'
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
        color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
        fontWeight: 700, fontSize: '16px',
        cursor: pending ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
      }}
    >
      {pending ? 'Creating account…' : 'Create Student Account'}
    </button>
  )
}

const initialState = { error: '' }

export default function StudentSignUpPage() {
  const [state, formAction] = useFormState(signUpStudent, initialState)

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid var(--color-border)', borderRadius: '10px',
    padding: '12px 16px', fontSize: '15px', color: 'var(--color-text)',
    background: '#fff', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{
        flex: 1, position: 'relative',
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', overflow: 'hidden',
      }}>
        <GeometricPattern color="#f59e0b" opacity={0.08} />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>🎓</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Start Learning Today</h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Join 2,000+ students across Qatar improving their grades with TutorQatar.
          </p>
          <p style={{ marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/sign-in" style={{ color: 'var(--color-gold)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', background: '#fff',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '32px', fontSize: '20px', fontWeight: 800, color: '#92400e', textDecoration: 'none' }}>
            TutorQatar
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text)' }}>
            Create Student Account
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Find the perfect tutor and start learning
          </p>

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {state.error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', padding: '12px 16px', fontSize: '14px' }}>
                {state.error}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Full Name</label>
              <input name="fullName" type="text" required style={inputStyle} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Email</label>
              <input name="email" type="email" required autoComplete="email" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Password</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Preferred Language</label>
              <select name="preferredLanguage" style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <SubmitButton />
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Want to teach?{' '}
            <Link href="/sign-up/tutor" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign up as Tutor
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
