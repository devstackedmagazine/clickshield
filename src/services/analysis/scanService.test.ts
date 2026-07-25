import { describe, expect, it, vi } from 'vitest'
import type {
  SaveHistoryInput,
  StoredHistoryEntry,
} from '../../types/history.ts'
import { analyzeLocally } from './localAnalyzer.ts'
import { createScanService } from './scanService.ts'

function historyEntry(value: SaveHistoryInput): StoredHistoryEntry {
  return {
    id: 1,
    scannedAt: value.result.scannedAt,
    screenshotPath: null,
    inputType: value.input.type,
    inputPreview: '',
    verdict: value.result.verdict,
    riskScore: value.result.riskScore,
    summary: value.result.summary,
    fullReport: value.result,
    language: value.result.language,
  }
}

describe('scan service pipeline', () => {
  it('does not call the API for a Guardian-blocked URL', async () => {
    const fetcher = vi.fn()
    const scan = createScanService({
      guardian: {
        match: () => ({
          entry: {
            value: 'example.test',
            addedAt: new Date().toISOString(),
          },
          kind: 'domain',
          matchedUrl: 'https://example.test/',
        }),
      },
      fetcher,
      demoFixtureName: () => null,
      saveHistory: async (value) => historyEntry(value),
    })
    const result = await scan(
      { type: 'url', value: 'https://example.test' },
      'en',
    )
    expect(result.verdict).toBe('blocked')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns an offline deterministic result without calling the API', async () => {
    const fetcher = vi.fn()
    const scan = createScanService({
      guardian: { match: () => null },
      networkStatus: async () => ({
        connected: false,
        connectionType: 'none',
      }),
      fetcher,
      demoFixtureName: () => null,
      saveHistory: async (value) => historyEntry(value),
    })
    const result = await scan(
      { type: 'text', value: 'URGENT: send money immediately' },
      'en',
    )
    expect(result.isOfflineResult).toBe(true)
    expect(result.isPartialResult).toBe(true)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns a partial result when all remote providers are unavailable', async () => {
    const scan = createScanService({
      guardian: { match: () => null },
      networkStatus: async () => ({
        connected: true,
        connectionType: 'wifi',
      }),
      fetcher: vi.fn(async () => {
        throw new TypeError('Network unavailable')
      }),
      demoFixtureName: () => null,
      saveHistory: async (value) => historyEntry(value),
    })
    const result = await scan(
      {
        type: 'screenshot',
        mimeType: 'image/png',
        base64: 'aGVsbG8=',
      },
      'en',
    )
    expect(result.isPartialResult).toBe(true)
    expect(result.trace.find((step) => step.id === 'ai')?.status).toBe('failed')
  })

  it('accepts a normalized benign server result', async () => {
    const remote = analyzeLocally(
      { type: 'url', value: 'https://example.test' },
      'en',
    )
    remote.trace = remote.trace.map((step) => ({
      ...step,
      status: 'done',
    }))
    const scan = createScanService({
      guardian: { match: () => null },
      networkStatus: async () => ({
        connected: true,
        connectionType: 'wifi',
      }),
      fetcher: vi.fn(async () =>
        Response.json({ ...remote, isPartialResult: false }),
      ),
      demoFixtureName: () => null,
      saveHistory: async (value) => historyEntry(value),
    })
    const result = await scan(
      { type: 'url', value: 'https://example.test' },
      'en',
    )
    expect(result.verdict).toBe('noKnownRisk')
    expect(result.isPartialResult).toBe(false)
  })
})
