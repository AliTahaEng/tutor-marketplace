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
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-2">Payout Setup</h1>
      <p className="text-muted-foreground mb-6">
        Connect your bank account to receive payments from sessions.
      </p>

      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-800 font-medium">Bank account connected successfully!</p>
          <p className="text-green-700 text-sm mt-1">
            You will receive payouts automatically after sessions are completed.
          </p>
        </div>
      )}

      {searchParams.reauth && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 font-medium">Please complete your bank setup</p>
          <p className="text-amber-700 text-sm mt-1">
            Your previous session expired. Please click below to continue.
          </p>
        </div>
      )}

      <div className="border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${profile?.stripe_account_id ? 'bg-green-500' : 'bg-gray-300'}`} />
          <div>
            <p className="font-medium text-sm">Stripe Connect Account</p>
            <p className="text-muted-foreground text-xs">
              {profile?.stripe_account_id
                ? `Connected — ID: ${profile.stripe_account_id.slice(0, 12)}...`
                : 'Not connected'}
            </p>
          </div>
        </div>

        {profile?.verification_status !== 'approved' && (
          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
            Your profile must be approved before you can set up payouts.
          </div>
        )}

        <form action="/api/stripe/connect" method="POST">
          <button
            type="submit"
            disabled={profile?.verification_status !== 'approved'}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {profile?.stripe_account_id ? 'Update Payout Account' : 'Connect Bank Account'}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Powered by Stripe Connect. Platform fee: 15% per session.
        </p>
      </div>
    </div>
  )
}
