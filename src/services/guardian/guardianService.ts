import type { ScanInput } from '../../types/analysis.ts'
import type {
  BlockedEntry,
  GuardianMatch,
  GuardianSettings,
} from '../../types/guardian.ts'
import {
  isSameOrSubdomain,
  normalizeHostname,
  normalizeUrl,
  urlsFromInput,
  urlsMatch,
} from '../analysis/urlUtils.ts'

const STORAGE_KEY = 'setting_guardian'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

const memoryValues = new Map<string, string>()
const memoryStorage: StorageLike = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => {
    memoryValues.set(key, value)
  },
}

function defaultStorage(): StorageLike {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage
    }
  } catch {
    // Some privacy modes expose localStorage but throw when it is accessed.
  }
  return memoryStorage
}

function emptySettings(): GuardianSettings {
  return {
    enabled: false,
    parentPinHash: null,
    blockedDomains: [],
    blockedUrls: [],
    wildcardEnabled: true,
  }
}

function isBlockedEntry(value: unknown): value is BlockedEntry {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<BlockedEntry>
  return (
    typeof candidate.value === 'string' &&
    typeof candidate.addedAt === 'string' &&
    (candidate.label === undefined || typeof candidate.label === 'string')
  )
}

function parseSettings(raw: string | null): GuardianSettings {
  if (!raw) {
    return emptySettings()
  }
  try {
    const value = JSON.parse(raw) as Partial<GuardianSettings>
    return {
      enabled: value.enabled === true,
      parentPinHash:
        typeof value.parentPinHash === 'string' ? value.parentPinHash : null,
      blockedDomains: Array.isArray(value.blockedDomains)
        ? value.blockedDomains.filter(isBlockedEntry)
        : [],
      blockedUrls: Array.isArray(value.blockedUrls)
        ? value.blockedUrls.filter(isBlockedEntry)
        : [],
      wildcardEnabled: value.wildcardEnabled !== false,
    }
  } catch {
    return emptySettings()
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return bytesToHex(new Uint8Array(digest))
}

function validatePin(pin: string): void {
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error('Guardian PIN must contain 4 to 8 digits.')
  }
}

function normalizeEntryValue(
  kind: 'domain' | 'url',
  value: string,
): string {
  const normalized =
    kind === 'domain' ? normalizeHostname(value) : normalizeUrl(value)
  if (!normalized) {
    throw new Error(`Invalid blocked ${kind}.`)
  }
  return normalized
}

export class GuardianService {
  readonly #storage: StorageLike

  constructor(storage: StorageLike = defaultStorage()) {
    this.#storage = storage
  }

  getSettings(): GuardianSettings {
    return parseSettings(this.#storage.getItem(STORAGE_KEY))
  }

  #save(settings: GuardianSettings): void {
    this.#storage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  async hasPin(): Promise<boolean> {
    return this.getSettings().parentPinHash !== null
  }

  async setPin(newPin: string, currentPin?: string): Promise<void> {
    validatePin(newPin)
    const settings = this.getSettings()
    if (settings.parentPinHash) {
      if (!currentPin || !(await this.verifyPin(currentPin))) {
        throw new Error('Current Guardian PIN is incorrect.')
      }
    }
    settings.parentPinHash = await sha256(newPin)
    this.#save(settings)
  }

  async verifyPin(pin: string): Promise<boolean> {
    const storedHash = this.getSettings().parentPinHash
    if (!storedHash) {
      return false
    }
    return (await sha256(pin)) === storedHash
  }

  async #requirePin(pin: string): Promise<GuardianSettings> {
    const settings = this.getSettings()
    if (!settings.parentPinHash) {
      throw new Error('Set a Guardian PIN before changing controls.')
    }
    if (!(await this.verifyPin(pin))) {
      throw new Error('Guardian PIN is incorrect.')
    }
    return settings
  }

  async setEnabled(enabled: boolean, pin: string): Promise<void> {
    const settings = await this.#requirePin(pin)
    settings.enabled = enabled
    this.#save(settings)
  }

  async setWildcardEnabled(enabled: boolean, pin: string): Promise<void> {
    const settings = await this.#requirePin(pin)
    settings.wildcardEnabled = enabled
    this.#save(settings)
  }

  async addBlockedEntry(
    kind: 'domain' | 'url',
    value: string,
    pin: string,
    label?: string,
  ): Promise<BlockedEntry> {
    const settings = await this.#requirePin(pin)
    const normalized = normalizeEntryValue(kind, value)
    const target =
      kind === 'domain' ? settings.blockedDomains : settings.blockedUrls
    const existing = target.find((entry) => entry.value === normalized)
    if (existing) {
      return existing
    }

    const entry: BlockedEntry = {
      value: normalized,
      addedAt: new Date().toISOString(),
      ...(label?.trim() ? { label: label.trim() } : {}),
    }
    target.push(entry)
    this.#save(settings)
    return entry
  }

  async removeBlockedEntry(
    kind: 'domain' | 'url',
    value: string,
    pin: string,
  ): Promise<void> {
    const settings = await this.#requirePin(pin)
    const normalized = normalizeEntryValue(kind, value)
    if (kind === 'domain') {
      settings.blockedDomains = settings.blockedDomains.filter(
        (entry) => entry.value !== normalized,
      )
    } else {
      settings.blockedUrls = settings.blockedUrls.filter(
        (entry) => entry.value !== normalized,
      )
    }
    this.#save(settings)
  }

  match(input: ScanInput): GuardianMatch | null {
    const settings = this.getSettings()
    if (!settings.enabled) {
      return null
    }

    for (const url of urlsFromInput(input)) {
      const urlEntry = settings.blockedUrls.find((entry) =>
        urlsMatch(url, entry.value),
      )
      if (urlEntry) {
        return { entry: urlEntry, kind: 'url', matchedUrl: url }
      }

      const hostname = normalizeHostname(url)
      if (!hostname) {
        continue
      }
      const domainEntry = settings.blockedDomains.find((entry) => {
        const blockedHostname = normalizeHostname(entry.value)
        if (!blockedHostname) {
          return false
        }
        return settings.wildcardEnabled
          ? isSameOrSubdomain(hostname, blockedHostname)
          : hostname === blockedHostname
      })
      if (domainEntry) {
        return { entry: domainEntry, kind: 'domain', matchedUrl: url }
      }
    }
    return null
  }

  exportBlocklist(): string {
    const settings = this.getSettings()
    const serialize = (kind: 'domain' | 'url', entry: BlockedEntry) =>
      `${kind}:${entry.value}${entry.label ? ` # ${entry.label}` : ''}`
    return [
      '# ClickShield Guardian blocklist v1',
      ...settings.blockedDomains.map((entry) => serialize('domain', entry)),
      ...settings.blockedUrls.map((entry) => serialize('url', entry)),
    ].join('\n')
  }

  async importBlocklist(value: string, pin: string): Promise<number> {
    const settings = await this.#requirePin(pin)
    let imported = 0

    for (const rawLine of value.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) {
        continue
      }
      const content = line.split(/\s+#\s+/, 1)[0] ?? ''
      const explicitKind = content.match(/^(domain|url):(.+)$/i)
      const kind: 'domain' | 'url' = explicitKind
        ? explicitKind[1]?.toLowerCase() === 'url'
          ? 'url'
          : 'domain'
        : normalizeUrl(content)
          ? 'url'
          : 'domain'
      const rawValue = explicitKind?.[2] ?? content

      try {
        const normalized = normalizeEntryValue(kind, rawValue)
        const target =
          kind === 'domain' ? settings.blockedDomains : settings.blockedUrls
        if (!target.some((entry) => entry.value === normalized)) {
          target.push({
            value: normalized,
            addedAt: new Date().toISOString(),
          })
          imported += 1
        }
      } catch {
        // Invalid lines are deliberately ignored during bulk import.
      }
    }

    this.#save(settings)
    return imported
  }
}

export const guardianService = new GuardianService()
