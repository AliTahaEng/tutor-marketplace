'use client'
import { motion } from 'framer-motion'

interface FloatingCardProps {
  children: React.ReactNode
  delay?: number
  rotate?: number
  style?: React.CSSProperties
}

export function FloatingCard({ children, delay = 0, rotate = 0, style }: FloatingCardProps) {
  return (
    <motion.div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-float)',
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 3.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}
