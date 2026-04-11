'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/payments/stripe-client'

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}?success=true`,
      },
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Payments secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  )
}

interface PaymentFormProps {
  bookingId: string
  amountQar: number
}

export function PaymentForm({ bookingId, amountQar }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function initPayment() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to initialize payment')
        return
      }
      if (data.clientSecret) setClientSecret(data.clientSecret)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!clientSecret) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Ready to pay {amountQar} QAR</p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={initPayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700"
        >
          {loading ? 'Loading...' : 'Proceed to Payment'}
        </button>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <CheckoutForm bookingId={bookingId} />
    </Elements>
  )
}
