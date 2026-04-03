import { getBooking } from '@/lib/booking/queries'
import { requireRole } from '@/lib/auth/guards'
import { notFound } from 'next/navigation'
import { PaymentForm } from './PaymentForm'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

export default async function PayPage({ params }: PageProps) {
  const { user } = await requireRole('student')
  const booking = await getBooking(params.id)

  if (!booking || booking.student_id !== user.id) notFound()

  if (booking.status !== 'pending_payment') {
    return (
      <div className="max-w-md mx-auto p-4 text-center py-12">
        <p className="text-muted-foreground mb-4">
          This booking is already <strong>{booking.status.replace(/_/g, ' ')}</strong>.
        </p>
        <Link href={`/bookings/${params.id}`} className="text-blue-600 hover:underline">
          View booking
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/bookings/${params.id}`} className="text-blue-600 hover:underline text-sm">
          Booking
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">Payment</span>
      </div>

      <h1 className="text-xl font-bold mb-6">Complete Payment</h1>

      <div className="border rounded-xl p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Session duration</span>
          <span>{booking.duration_minutes} minutes</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Session fee</span>
          <span>{booking.hourly_rate_qar} QAR/hr</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform fee (15%)</span>
          <span>{booking.platform_fee_qar} QAR</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Total</span>
          <span>{booking.total_amount_qar} QAR</span>
        </div>
      </div>

      <PaymentForm bookingId={params.id} amountQar={Number(booking.total_amount_qar)} />
    </div>
  )
}
