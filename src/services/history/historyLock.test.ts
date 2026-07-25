import { describe, expect, it, vi } from 'vitest'
import type { StorageLike } from '../guardian/guardianService.ts'
import { HistoryLock } from './historyLock.ts'

function createStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('HistoryLock', () => {
  it('uses an independent hashed PIN and expires explicit locks', async () => {
    const storage = createStorage()
    const lock = new HistoryLock(storage)
    await lock.setPin('4567')
    expect(storage.getItem('setting_history_lock')).not.toContain('"4567"')

    lock.lockNow()
    expect(lock.isUnlocked()).toBe(false)
    expect(await lock.unlock('0000')).toBe(false)
    expect(await lock.unlock('4567')).toBe(true)
  })

  it('supports biometric unlock with PIN fallback', async () => {
    const biometric = {
      isAvailable: vi.fn(async () => ({
        isAvailable: true,
        authenticationStrength: 1,
        biometryType: 3,
        deviceIsSecure: true,
        strongBiometryIsAvailable: true,
      })),
      verifyIdentity: vi.fn(async () => undefined),
    }
    const lock = new HistoryLock(createStorage(), biometric, () => true)
    await lock.setPin('4567')
    await lock.setBiometricEnabled(true, '4567')
    lock.lockNow()

    expect(await lock.unlock()).toBe(true)
    expect(biometric.verifyIdentity).toHaveBeenCalledOnce()
  })
})
