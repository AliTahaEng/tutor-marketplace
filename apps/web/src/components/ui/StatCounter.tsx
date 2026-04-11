'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface StatCounterProps {
  value: number
  suffix?: string
  label: string
}

export function StatCounter({ value, suffix = '', label }: StatCounterProps) {
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = numRef.current
    if (!el) return

    const obj = { val: 0 }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: value,
        duration: 2,
        ease: 'power2.out',
        snap: { val: 1 },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate() {
          if (el) el.textContent = Math.round(obj.val) + suffix
        },
      })
    })

    return () => ctx.revert()
  }, [value, suffix])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
        <span ref={numRef}>0{suffix}</span>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  )
}
