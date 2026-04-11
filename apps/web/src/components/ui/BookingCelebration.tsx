'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export function BookingCelebration({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)

    const fire = (origin: { x: number; y: number }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin,
        startVelocity: 45,
        gravity: 1.2,
        scalar: 1.1,
        colors: ['#d97706', '#f59e0b', '#fcd34d', '#fef3c7', '#1c1917'],
      })
    }

    fire({ x: 0.3, y: 0.6 })
    setTimeout(() => fire({ x: 0.7, y: 0.6 }), 150)

    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [show])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '48px 56px',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}
          >
            <motion.svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: '24px' }}>
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-gold-bright)" strokeWidth="4" />
              <motion.path
                d="M24 40 L35 52 L56 30"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              />
            </motion.svg>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
              Session Booked!
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', margin: 0 }}>
              Your session has been confirmed. Good luck!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
