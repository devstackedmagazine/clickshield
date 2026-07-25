import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScanResult } from '../src/types/analysis.ts'
import handler from './scan.ts'

const PROVIDER_KEYS = [
  'AI_OPENROUTER_API_KEY',
  'AI_GROQ_API_KEY',
  'AI_GEMINI_API_KEY',
  'VIRUSTOTAL_API_KEY',
  'GOOGLE_WEB_RISK_API_KEY',
] as const

async function post(body: unknown): Promise<Response> {
  return handler(
    new Request('https://clickshield.test/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

describe('POST /api/scan', () => {
  beforeEach(() => {
    for (const key of PROVIDER_KEYS) {
      vi.stubEnv(key, '')
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns immediately for a locally blocked URL', async () => {
    const response = await post({
      input: {
        type: 'url',
        value: 'https://scam-demo.clickshield.test/login',
      },
      language: 'en',
    })
    const result = (await response.json()) as ScanResult
    expect(response.status).toBe(200)
    expect(result.verdict).toBe('blocked')
    expect(result.isPartialResult).toBe(false)
  })

  it('returns a partial benign result when providers are not configured', async () => {
    const response = await post({
      input: { type: 'url', value: 'https://example.test' },
      language: 'en',
    })
    const result = (await response.json()) as ScanResult
    expect(response.status).toBe(200)
    expect(result.verdict).toBe('noKnownRisk')
    expect(result.isPartialResult).toBe(true)
  })

  it('handles a screenshot safely when vision providers are unavailable', async () => {
    const response = await post({
      input: {
        type: 'screenshot',
        mimeType: 'image/png',
        base64: 'aGVsbG8=',
      },
      language: 'en',
    })
    const result = (await response.json()) as ScanResult
    expect(response.status).toBe(200)
    expect(result.isPartialResult).toBe(true)
    expect(result.trace.find((step) => step.id === 'ai')?.status).toBe(
      'skipped',
    )
  })

  it('rejects screenshots larger than 2 MB before provider calls', async () => {
    const response = await post({
      input: {
        type: 'screenshot',
        mimeType: 'image/png',
        base64: 'a'.repeat(2_800_000),
      },
      language: 'en',
    })
    const body = (await response.json()) as {
      error: { code: string }
    }
    expect(response.status).toBe(413)
    expect(body.error.code).toBe('IMAGE_TOO_LARGE')
  })
})
