export interface CreatePaymentIntentParams {
  amountQar: number
  bookingId: string
  studentId: string
  tutorId: string
  description: string
}

export interface PaymentIntent {
  id: string
  clientSecret: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled'
}

export interface PayoutParams {
  tutorStripeAccountId: string
  amountQar: number
  bookingId: string
}

export interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due'
  currentPeriodEnd: Date
}

export interface SubscriptionParams {
  tutorStripeCustomerId: string
  priceId: string
}

export interface RefundParams {
  paymentIntentId: string
  amountQar?: number
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'cancelled_by_tutor'
}

export interface IPaymentProvider {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>
  capturePayment(paymentIntentId: string): Promise<void>
  releaseToTutor(params: PayoutParams): Promise<void>
  refund(params: RefundParams): Promise<void>
  createSubscription(params: SubscriptionParams): Promise<Subscription>
  cancelSubscription(subscriptionId: string): Promise<void>
  createConnectedAccount(tutorId: string, email: string): Promise<string>
}
