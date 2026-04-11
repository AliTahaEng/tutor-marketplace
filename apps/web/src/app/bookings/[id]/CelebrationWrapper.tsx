'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { BookingCelebration } from '@/components/ui/BookingCelebration'

function CelebrationInner() {
  const params = useSearchParams()
  const success = params.get('success') === 'true'
  return <BookingCelebration show={success} />
}

export function CelebrationWrapper() {
  return (
    <Suspense fallback={null}>
      <CelebrationInner />
    </Suspense>
  )
}
