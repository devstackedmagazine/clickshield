import type { ScanError } from '../src/types/analysis.ts'
import { ScanServiceError } from '../src/types/analysis.ts'
import { analyzeLocally } from '../src/services/analysis/localAnalyzer.ts'
import { normalizeUrl } from '../src/services/analysis/urlUtils.ts'
import { analyzeWithAi } from './_lib/aiProviders.ts'
import { combineServerResult } from './_lib/combineResult.ts'
import {
  checkGoogleWebRisk,
  checkVirusTotal,
} from './_lib/reputation.ts'
import { validateScanRequest } from './_lib/validation.ts'

export const config = {
  runtime: 'edge',
}

const MAX_REQUEST_BYTES = 2_900_000
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000
const rateWindows = new Map<string, { count: number; resetsAt: number }>()

function configuredOrigins(): Set<string> {
  const origins = [
    process.env.APP_ORIGIN,
    ...(process.env.CLICKSHIELD_ALLOWED_ORIGINS?.split(',') ?? []),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
  ]
  return new Set(
    origins
      .filter((origin): origin is string => Boolean(origin?.trim()))
      .map((origin) => origin.trim().replace(/\/$/, '')),
  )
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return true
  }
  const normalized = origin.replace(/\/$/, '')
  if (configuredOrigins().has(normalized)) {
    return true
  }
  return (
    process.env.VERCEL_ENV !== 'production' &&
    /^https?:\/\/localhost(?::\d+)?$/.test(normalized)
  )
}

function responseHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(origin && isAllowedOrigin(origin)
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
      : {}),
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }
}

function jsonResponse(
  value: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: responseHeaders(origin),
  })
}

function clientId(request: Request): string {
  return (
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  )
}

function exceedsRateLimit(request: Request): boolean {
  const now = Date.now()
  if (rateWindows.size > 1_000) {
    for (const [key, window] of rateWindows) {
      if (window.resetsAt <= now) {
        rateWindows.delete(key)
      }
    }
  }
  const id = clientId(request)
  const existing = rateWindows.get(id)
  if (!existing || existing.resetsAt <= now) {
    rateWindows.set(id, { count: 1, resetsAt: now + RATE_WINDOW_MS })
    return false
  }
  existing.count += 1
  return existing.count > RATE_LIMIT
}

function errorStatus(error: ScanError): number {
  switch (error.code) {
    case 'IMAGE_TOO_LARGE':
      return 413
    case 'INVALID_INPUT':
    case 'UNSUPPORTED_FORMAT':
      return 400
    case 'QUOTA_EXHAUSTED':
      return 429
    case 'TIMEOUT':
      return 504
    case 'AI_FAILURE':
    case 'OFFLINE_NO_MODEL':
    case 'VIRUSTOTAL_FAILURE':
      return 502
  }
}

function suspiciousUrls(
  urls: string[],
  localSignals: ReturnType<typeof analyzeLocally>['signals'],
  aiSignals: Awaited<ReturnType<typeof analyzeWithAi>>['analysis'],
  webRisk: Awaited<ReturnType<typeof checkGoogleWebRisk>>,
): string[] {
  const reputationMatches = new Set(
    webRisk
      .filter((result) => result.verdict === 'malicious')
      .map((result) => result.url),
  )
  const hasSuspiciousAnalysis = [
    ...localSignals,
    ...(aiSignals?.signals ?? []),
  ].some((signal) =>
    [
      'blacklisted_domain',
      'lookalike_domain',
      'suspicious_link',
      'suspicious_tld',
      'url_shortener',
    ].includes(signal.type),
  )
  return urls.filter(
    (url) => reputationMatches.has(url) || hasSuspiciousAnalysis,
  )
}

export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get('origin')
  if (!isAllowedOrigin(origin)) {
    return jsonResponse(
      { error: { code: 'INVALID_INPUT', message: 'Origin is not allowed.' } },
      403,
      origin,
    )
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders(origin) })
  }
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Only POST requests are supported.',
        },
      },
      405,
      origin,
    )
  }
  if (exceedsRateLimit(request)) {
    return jsonResponse(
      {
        error: {
          code: 'QUOTA_EXHAUSTED',
          message: 'Too many scan requests. Please try again shortly.',
        },
      },
      429,
      origin,
    )
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(
      {
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'The scan request is too large.',
        },
      },
      413,
      origin,
    )
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new ScanServiceError({
        code: 'INVALID_INPUT',
        message: 'The request body must contain valid JSON.',
      })
    }
    const scanRequest = validateScanRequest(body)
    const local = analyzeLocally(scanRequest.input, scanRequest.language)
    if (local.verdict === 'blocked') {
      return jsonResponse(local, 200, origin)
    }

    const ai = await analyzeWithAi(scanRequest.input, scanRequest.language)
    const urls = [
      ...new Set(
        [...local.extractedUrls, ...(ai.analysis?.extractedUrls ?? [])]
          .map(normalizeUrl)
          .filter((url): url is string => url !== null),
      ),
    ]
    const webRisk = await checkGoogleWebRisk(urls)
    const urlsForDeepScan = suspiciousUrls(
      urls,
      local.signals,
      ai.analysis,
      webRisk,
    )
    const virusTotal = await checkVirusTotal(urlsForDeepScan)
    return jsonResponse(
      combineServerResult(local, ai, webRisk, virusTotal),
      200,
      origin,
    )
  } catch (error) {
    if (error instanceof ScanServiceError) {
      return jsonResponse(
        { error: error.details },
        errorStatus(error.details),
        origin,
      )
    }
    return jsonResponse(
      {
        error: {
          code: 'AI_FAILURE',
          message: 'The scan could not be completed.',
        },
      },
      500,
      origin,
    )
  }
}
