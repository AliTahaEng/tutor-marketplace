import { describe, it, expect } from 'vitest'
import { CircuitBreaker } from '../CircuitBreaker'

describe('CircuitBreaker', () => {
  it('executes function in CLOSED state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 })
    const result = await cb.execute(async () => 'ok')
    expect(result).toBe('ok')
  })

  it('opens after failureThreshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 10000 })
    const fail = async () => { throw new Error('fail') }

    for (let i = 0; i < 2; i++) {
      try { await cb.execute(fail) } catch {}
    }

    expect(cb.getState()).toBe('OPEN')
    await expect(cb.execute(async () => 'ok')).rejects.toThrow('Circuit breaker is OPEN')
  })
})
