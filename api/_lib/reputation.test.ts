import { describe, expect, it, vi } from 'vitest'
import type { fetchWithTimeout } from './fetchWithTimeout.ts'
import { checkGoogleWebRisk, checkVirusTotal } from './reputation.ts'

function fetcherReturning(response: Response): typeof fetchWithTimeout {
  return vi.fn(async () => response) as unknown as typeof fetchWithTimeout
}

describe('reputation providers', () => {
  it('maps a VirusTotal quota response without throwing', async () => {
    const results = await checkVirusTotal(
      ['https://example.test/'],
      'test-key',
      fetcherReturning(new Response(null, { status: 429 })),
    )
    expect(results[0]?.verdict).toBe('quota')
  })

  it('maps a missing VirusTotal report to unknown', async () => {
    const results = await checkVirusTotal(
      ['https://example.test/'],
      'test-key',
      fetcherReturning(new Response(null, { status: 404 })),
    )
    expect(results[0]?.verdict).toBe('unknown')
  })

  it('turns Web Risk timeouts into partial error results', async () => {
    const timeoutFetcher = vi.fn(async () => {
      throw new DOMException('Timed out', 'AbortError')
    }) as unknown as typeof fetchWithTimeout
    const results = await checkGoogleWebRisk(
      ['https://example.test/'],
      'test-key',
      timeoutFetcher,
    )
    expect(results[0]?.verdict).toBe('error')
  })
})
