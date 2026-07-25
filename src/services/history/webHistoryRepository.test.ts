import { describe, expect, it } from 'vitest'
import { analyzeLocally } from '../analysis/localAnalyzer.ts'
import type { StorageLike } from '../guardian/guardianService.ts'
import { WebHistoryRepository } from './webHistoryRepository.ts'

function createStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('WebHistoryRepository', () => {
  it('saves, retrieves, deletes, and clears scans', async () => {
    const repository = new WebHistoryRepository(createStorage())
    const input = { type: 'url', value: 'https://example.test' } as const
    const result = analyzeLocally(input, 'en')
    const saved = await repository.save({ input, result })

    expect((await repository.getById(saved.id))?.verdict).toBe(
      'noKnownRisk',
    )
    expect(await repository.list()).toHaveLength(1)
    await repository.delete(saved.id)
    expect(await repository.list()).toHaveLength(0)
    await repository.save({ input, result })
    await repository.clear()
    expect(await repository.list()).toHaveLength(0)
  })
})
