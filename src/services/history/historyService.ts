import { Capacitor } from '@capacitor/core'
import type {
  HistoryEntry,
  HistoryRepository,
  SaveHistoryInput,
} from '../../types/history.ts'
import { historyLock } from './historyLock.ts'
import { WebHistoryRepository } from './webHistoryRepository.ts'

let repositoryPromise: Promise<HistoryRepository> | undefined

async function createRepository(): Promise<HistoryRepository> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { SqliteHistoryRepository } = await import(
        './sqliteHistoryRepository.ts'
      )
      return new SqliteHistoryRepository()
    } catch {
      // The local WebView store keeps scans available if the native plugin
      // has not been synced yet. No scan content is sent anywhere.
    }
  }
  return new WebHistoryRepository()
}

export function getHistoryRepository(): Promise<HistoryRepository> {
  repositoryPromise ??= createRepository()
  return repositoryPromise
}

export async function saveScanToHistory(
  value: SaveHistoryInput,
): Promise<HistoryEntry> {
  const repository = await getHistoryRepository()
  try {
    return await repository.save(value)
  } catch {
    const fallback = new WebHistoryRepository()
    repositoryPromise = Promise.resolve(fallback)
    return fallback.save(value)
  }
}

export async function listHistory(limit?: number): Promise<HistoryEntry[]> {
  historyLock.assertUnlocked()
  const repository = await getHistoryRepository()
  return repository.list(limit)
}

export async function getHistoryEntry(
  id: number,
): Promise<HistoryEntry | null> {
  historyLock.assertUnlocked()
  const repository = await getHistoryRepository()
  return repository.getById(id)
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  historyLock.assertUnlocked()
  const repository = await getHistoryRepository()
  return repository.delete(id)
}

export async function clearHistory(): Promise<void> {
  historyLock.assertUnlocked()
  const repository = await getHistoryRepository()
  return repository.clear()
}
