import Stripe from 'stripe'
import { CircuitBreaker } from '../circuit-breaker/CircuitBreaker'
import type {
  IPaymentProvider,
  CreatePaymentIntentParams,
  PaymentIntent,
  PayoutParams,
  Subscription,
  SubscriptionParams,
  RefundParams,
} from '../interfaces/IPaymentProvider'

interface StripeAdapterConfig {
  secretKey: string
  webhookSecret: string
}

// QAR uses 2 decimal places; Stripe uses smallest unit (halalas = QAR * 100)
function qarToHalalas(qar: number): number {
  return Math.round(qar * 100)
}

export class StripeAdapter implements IPaymentProvider {
  private readonly stripe: Stripe
  private readonly cb: CircuitBreaker

  constructor(config: StripeAdapterConfig) {
    this.stripe = new Stripe(config.secretKey, { apiVersion: '2024-04-10' })
    this.cb = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 60_000 })
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    return this.cb.execute(async () => {
      const intent = await this.stripe.paymentIntents.create({
        amount: qarToHalalas(params.amountQar),
        currency: 'qar',
        capture_method: 'manual',
        metadata: {
          bookingId: params.bookingId,
          studentId: params.studentId,
          tutorId: params.tutorId,
        },
        description: params.description,
        payment_method_types: ['card'],
      })

      return {
        id: intent.id,
        clientSecret: intent.client_secret!,
        status: intent.status as PaymentIntent['status'],
      }
    })
  }

  async capturePayment(paymentIntentId: string): Promise<void> {
    await this.cb.execute(() =>
      this.stripe.paymentIntents.capture(paymentIntentId)
    )
  }

  async releaseToTutor(params: PayoutParams): Promise<void> {
    await this.cb.execute(() =>
      this.stripe.transfers.create({
        amount: qarToHalalas(params.amountQar),
        currency: 'qar',
        destination: params.tutorStripeAccountId,
        metadata: { bookingId: params.bookingId },
      })
    )
  }

  async refund(params: RefundParams): Promise<void> {
    await this.cb.execute(async () => {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
        reason: params.reason === 'cancelled_by_tutor' ? 'requested_by_customer' : params.reason,
      }
      if (params.amountQar !== undefined) {
        refundParams.amount = qarToHalalas(params.amountQar)
      }
      await this.stripe.refunds.create(refundParams)
    })
  }

  async createSubscription(params: SubscriptionParams): Promise<Subscription> {
    return this.cb.execute(async () => {
      const subscription = await this.stripe.subscriptions.create({
        customer: params.tutorStripeCustomerId,
        items: [{ price: params.priceId }],
        payment_behavior: 'default_incomplete',
      })

      return {
        id: subscription.id,
        status: subscription.status as Subscription['status'],
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    })
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.cb.execute(() =>
      this.stripe.subscriptions.cancel(subscriptionId)
    )
  }

  async createConnectedAccount(tutorId: string, email: string): Promise<string> {
    return this.cb.execute(async () => {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        metadata: { tutorId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      return account.id
    })
  }
}
