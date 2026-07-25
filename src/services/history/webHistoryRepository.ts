import type {
  HistoryRepository,
  SaveHistoryInput,
  StoredHistoryEntry,
} from '../../types/history.ts'
import type { StorageLike } from '../guardian/guardianService.ts'
import { inputAsText } from '../analysis/urlUtils.ts'

const HISTORY_STORAGE_KEY = 'clickshield_history_v1'

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
    // Fall through to process-local storage.
  }
  return memoryStorage
}

function previewFor(value: SaveHistoryInput): string {
  if (value.input.type === 'screenshot') {
    return '[Screenshot]'
  }
  return inputAsText(value.input).trim().slice(0, 100)
}

function parseEntries(raw: string | null): StoredHistoryEntry[] {
  if (!raw) {
    return []
  }
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? (value as StoredHistoryEntry[]) : []
  } catch {
    return []
  }
}

export class WebHistoryRepository implements HistoryRepository {
  readonly #storage: StorageLike

  constructor(storage: StorageLike = defaultStorage()) {
    this.#storage = storage
  }

  #read(): StoredHistoryEntry[] {
    return parseEntries(this.#storage.getItem(HISTORY_STORAGE_KEY))
  }

  #write(entries: StoredHistoryEntry[]): void {
    this.#storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  }

  async save(value: SaveHistoryInput): Promise<StoredHistoryEntry> {
    const entries = this.#read()
    const nextId =
      entries.reduce((maximum, entry) => Math.max(maximum, entry.id), 0) + 1
    const entry: StoredHistoryEntry = {
      id: nextId,
      scannedAt: value.result.scannedAt,
      screenshotPath: value.screenshotPath ?? null,
      inputType: value.input.type,
      inputPreview: previewFor(value),
      verdict: value.result.verdict,
      riskScore: value.result.riskScore,
      summary: value.result.summary,
      fullReport: value.result,
      language: value.result.language,
    }
    this.#write([entry, ...entries])
    return entry
  }

  async list(limit = 100): Promise<StoredHistoryEntry[]> {
    return this.#read()
      .sort((left, right) => right.scannedAt.localeCompare(left.scannedAt))
      .slice(0, Math.max(0, limit))
  }

  async getById(id: number): Promise<StoredHistoryEntry | null> {
    return this.#read().find((entry) => entry.id === id) ?? null
  }

  async delete(id: number): Promise<void> {
    this.#write(this.#read().filter((entry) => entry.id !== id))
  }

  async clear(): Promise<void> {
    this.#write([])
  }
}
