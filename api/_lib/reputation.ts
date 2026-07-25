import { fetchWithTimeout, readJsonResponse } from './fetchWithTimeout.ts'

export type WebRiskVerdict =
  | 'malicious'
  | 'clear'
  | 'unavailable'
  | 'error'

export type WebRiskResult = {
  url: string
  verdict: WebRiskVerdict
  threatTypes: string[]
}

export type VirusTotalVerdict =
  | 'malicious'
  | 'suspicious'
  | 'clean'
  | 'unknown'
  | 'quota'
  | 'unavailable'
  | 'error'

export type VirusTotalResult = {
  url: string
  verdict: VirusTotalVerdict
  malicious: number
  suspicious: number
}

type Fetcher = typeof fetchWithTimeout

function nestedRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  const nested = (value as Record<string, unknown>)[key]
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : null
}

export async function checkGoogleWebRisk(
  urls: string[],
  apiKey = process.env.GOOGLE_WEB_RISK_API_KEY,
  fetcher: Fetcher = fetchWithTimeout,
): Promise<WebRiskResult[]> {
  if (!apiKey) {
    return urls.map((url) => ({
      url,
      verdict: 'unavailable',
      threatTypes: [],
    }))
  }

  return Promise.all(
    urls.slice(0, 10).map(async (url): Promise<WebRiskResult> => {
      const query = new URLSearchParams()
      query.append('threatTypes', 'MALWARE')
      query.append('threatTypes', 'SOCIAL_ENGINEERING')
      query.append('threatTypes', 'UNWANTED_SOFTWARE')
      query.set('uri', url)
      query.set('key', apiKey)
      try {
        const response = await fetcher(
          `https://webrisk.googleapis.com/v1/uris:search?${query.toString()}`,
          { method: 'GET' },
          8_000,
        )
        if (!response.ok) {
          return { url, verdict: 'error', threatTypes: [] }
        }
        const value = await readJsonResponse(response)
        const threat = nestedRecord(value, 'threat')
        const threatTypes = Array.isArray(threat?.threatTypes)
          ? threat.threatTypes.filter(
              (item): item is string => typeof item === 'string',
            )
          : []
        return {
          url,
          verdict: threatTypes.length > 0 ? 'malicious' : 'clear',
          threatTypes,
        }
      } catch {
        return { url, verdict: 'error', threatTypes: [] }
      }
    }),
  )
}

function virusTotalUrlId(url: string): string {
  const bytes = new TextEncoder().encode(url)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function numericValue(
  value: Record<string, unknown> | null,
  key: string,
): number {
  const candidate = value?.[key]
  return typeof candidate === 'number' && Number.isFinite(candidate)
    ? candidate
    : 0
}

export async function checkVirusTotal(
  urls: string[],
  apiKey = process.env.VIRUSTOTAL_API_KEY,
  fetcher: Fetcher = fetchWithTimeout,
): Promise<VirusTotalResult[]> {
  if (!apiKey) {
    return urls.map((url) => ({
      url,
      verdict: 'unavailable',
      malicious: 0,
      suspicious: 0,
    }))
  }

  const results: VirusTotalResult[] = []
  for (const url of urls.slice(0, 3)) {
    try {
      const response = await fetcher(
        `https://www.virustotal.com/api/v3/urls/${virusTotalUrlId(url)}`,
        {
          method: 'GET',
          headers: { 'x-apikey': apiKey },
        },
        8_000,
      )
      if (response.status === 404) {
        results.push({
          url,
          verdict: 'unknown',
          malicious: 0,
          suspicious: 0,
        })
        continue
      }
      if (response.status === 429) {
        results.push({
          url,
          verdict: 'quota',
          malicious: 0,
          suspicious: 0,
        })
        continue
      }
      if (!response.ok) {
        results.push({
          url,
          verdict: 'error',
          malicious: 0,
          suspicious: 0,
        })
        continue
      }

      const value = await readJsonResponse(response)
      const data = nestedRecord(value, 'data')
      const attributes = nestedRecord(data, 'attributes')
      const stats = nestedRecord(attributes, 'last_analysis_stats')
      const malicious = numericValue(stats, 'malicious')
      const suspicious = numericValue(stats, 'suspicious')
      results.push({
        url,
        verdict:
          malicious >= 2
            ? 'malicious'
            : malicious > 0 || suspicious > 0
              ? 'suspicious'
              : 'clean',
        malicious,
        suspicious,
      })
    } catch {
      results.push({
        url,
        verdict: 'error',
        malicious: 0,
        suspicious: 0,
      })
    }
  }
  return results
}
