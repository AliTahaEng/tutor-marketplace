import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  searchParams: { success?: string; reauth?: string }
}

export default async function PayoutSetupPage({ searchParams }: PageProps) {
  await requireRole('tutor')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('tutor_profiles')
    .select('stripe_account_id, verification_status')
    .eq('id', user!.id)
    .single()

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Dark hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-bg-dark) 0%, #3d1f00 100%)',
        padding: '48px 32px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
            Payout Setup
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', margin: 0 }}>
            Connect your bank account to receive payments. A 15% platform fee applies per session.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 32px' }}>
        {/* Success / reauth banners */}
        {searchParams.success && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}>
            <p style={{ color: '#15803d', fontWeight: 700, margin: '0 0 4px' }}>Bank account connected successfully!</p>
            <p style={{ color: '#16a34a', fontSize: '14px', margin: 0 }}>
              You will receive payouts automatically after sessions are completed.
            </p>
          </div>
        )}

        {searchParams.reauth && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}>
            <p style={{ color: '#92400e', fontWeight: 700, margin: '0 0 4px' }}>Please complete your bank setup</p>
            <p style={{ color: '#b45309', fontSize: '14px', margin: 0 }}>
              Your previous session expired. Please click below to continue.
            </p>
          </div>
        )}

        {/* Main card */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '40px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Account status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: profile?.stripe_account_id ? '#22c55e' : '#d1d5db',
              flexShrink: 0,
            }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)', margin: '0 0 2px' }}>
                Stripe Connect Account
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                {profile?.stripe_account_id
                  ? `Connected — ID: ${profile.stripe_account_id.slice(0, 12)}...`
                  : 'Not connected'}
              </p>
            </div>
          </div>

          {profile?.verification_status !== 'approved' && (
            <div style={{
              background: '#fffbeb',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              color: '#92400e',
            }}>
              Your profile must be approved before you can set up payouts.
            </div>
          )}

          <form action="/api/stripe/connect" method="POST">
            <button
              type="submit"
              disabled={profile?.verification_status !== 'approved'}
              style={{
                width: '100%',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: profile?.verification_status !== 'approved' ? 'not-allowed' : 'pointer',
                opacity: profile?.verification_status !== 'approved' ? 0.5 : 1,
              }}
            >
              {profile?.stripe_account_id ? 'Update Payout Account' : 'Connect Bank Account'}
            </button>
          </form>

          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
            Powered by Stripe Connect. Platform fee: 15% per session.
          </p>
        </div>
      </div>
    </div>
  )
}
