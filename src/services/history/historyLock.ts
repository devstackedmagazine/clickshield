import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import type { StorageLike } from '../guardian/guardianService.ts'

const STORAGE_KEY = 'setting_history_lock'
const UNLOCK_DURATION_MS = 5 * 60_000

type HistoryLockSettings = {
  enabled: boolean
  pinHash: string | null
  biometricEnabled: boolean
}

export type BiometricPrompt = {
  reason: string
  title: string
  subtitle?: string
  cancelText?: string
}

type BiometricAdapter = {
  isAvailable: typeof NativeBiometric.isAvailable
  verifyIdentity: typeof NativeBiometric.verifyIdentity
}

const memoryValues = new Map<string, string>()
const memoryStorage: StorageLike = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => {
    memoryValues.set(key, value)
  },
}

function defaultStorage(): StorageLike {
  try {
    return typeof window === 'undefined' ? memoryStorage : window.localStorage
  } catch {
    return memoryStorage
  }
}

function parseSettings(raw: string | null): HistoryLockSettings {
  if (!raw) {
    return { enabled: false, pinHash: null, biometricEnabled: false }
  }
  try {
    const value = JSON.parse(raw) as Partial<HistoryLockSettings>
    return {
      enabled: value.enabled === true,
      pinHash: typeof value.pinHash === 'string' ? value.pinHash : null,
      biometricEnabled: value.biometricEnabled === true,
    }
  } catch {
    return { enabled: false, pinHash: null, biometricEnabled: false }
  }
}

async function pinHash(pin: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(pin),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function validatePin(pin: string): void {
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error('History PIN must contain 4 to 8 digits.')
  }
}

export class HistoryLock {
  readonly #storage: StorageLike
  readonly #biometric: BiometricAdapter
  readonly #isNative: () => boolean
  #unlockedUntil = 0

  constructor(
    storage: StorageLike = defaultStorage(),
    biometric: BiometricAdapter = NativeBiometric,
    isNative: () => boolean = () => Capacitor.isNativePlatform(),
  ) {
    this.#storage = storage
    this.#biometric = biometric
    this.#isNative = isNative
  }

  getSettings(): Readonly<HistoryLockSettings> {
    return parseSettings(this.#storage.getItem(STORAGE_KEY))
  }

  #save(settings: HistoryLockSettings): void {
    this.#storage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  async setPin(newPin: string, currentPin?: string): Promise<void> {
    validatePin(newPin)
    const settings = this.getSettings()
    if (
      settings.pinHash &&
      (!currentPin || !(await this.verifyPin(currentPin)))
    ) {
      throw new Error('Current history PIN is incorrect.')
    }
    this.#save({
      ...settings,
      enabled: true,
      pinHash: await pinHash(newPin),
    })
    this.#unlockedUntil = Date.now() + UNLOCK_DURATION_MS
  }

  async verifyPin(pin: string): Promise<boolean> {
    const settings = this.getSettings()
    return settings.pinHash !== null && (await pinHash(pin)) === settings.pinHash
  }

  async setEnabled(enabled: boolean, pin: string): Promise<void> {
    if (!(await this.verifyPin(pin))) {
      throw new Error('History PIN is incorrect.')
    }
    this.#save({ ...this.getSettings(), enabled })
    this.#unlockedUntil = enabled ? Date.now() + UNLOCK_DURATION_MS : 0
  }

  async setBiometricEnabled(enabled: boolean, pin: string): Promise<void> {
    if (!(await this.verifyPin(pin))) {
      throw new Error('History PIN is incorrect.')
    }
    if (enabled) {
      if (!this.#isNative()) {
        throw new Error('Biometric history lock is available on device only.')
      }
      const availability = await this.#biometric.isAvailable({
        useFallback: false,
      })
      if (!availability.isAvailable) {
        throw new Error('Biometric authentication is not available.')
      }
    }
    this.#save({ ...this.getSettings(), biometricEnabled: enabled })
  }

  async unlock(
    pin?: string,
    prompt: BiometricPrompt = {
      reason: 'Unlock your private ClickShield scan history.',
      title: 'Unlock scan history',
      cancelText: 'Use PIN',
    },
  ): Promise<boolean> {
    const settings = this.getSettings()
    if (!settings.enabled) {
      return true
    }

    if (settings.biometricEnabled && this.#isNative()) {
      try {
        const availability = await this.#biometric.isAvailable({
          useFallback: false,
        })
        if (availability.isAvailable) {
          await this.#biometric.verifyIdentity({
            reason: prompt.reason,
            title: prompt.title,
            subtitle: prompt.subtitle,
            negativeButtonText: prompt.cancelText,
            maxAttempts: 3,
          })
          this.#unlockedUntil = Date.now() + UNLOCK_DURATION_MS
          return true
        }
      } catch {
        // The caller can present its PIN fallback after cancellation/failure.
      }
    }

    if (pin && (await this.verifyPin(pin))) {
      this.#unlockedUntil = Date.now() + UNLOCK_DURATION_MS
      return true
    }
    return false
  }

  lockNow(): void {
    this.#unlockedUntil = 0
  }

  isUnlocked(): boolean {
    const settings = this.getSettings()
    return !settings.enabled || this.#unlockedUntil > Date.now()
  }

  assertUnlocked(): void {
    if (!this.isUnlocked()) {
      throw new Error('Scan history is locked.')
    }
  }
}

export const historyLock = new HistoryLock()
