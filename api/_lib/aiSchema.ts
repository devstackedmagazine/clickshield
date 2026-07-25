import type {
  AiAnalysis,
  RiskSeverity,
  RiskSignal,
  RiskSignalType,
  SupportedLanguage,
} from '../../src/types/analysis.ts'
import {
  isSupportedLanguage,
} from '../../src/types/analysis.ts'
import { normalizeUrl } from '../../src/services/analysis/urlUtils.ts'

const SIGNAL_TYPES = new Set<RiskSignalType>([
  'urgency_manipulation',
  'impersonation',
  'payment_pressure',
  'credential_theft',
  'suspicious_link',
  'unusual_wording',
  'prize_scam',
  'fake_delivery',
  'romance_scam',
  'tech_support_scam',
  'blacklisted_domain',
  'lookalike_domain',
  'url_shortener',
  'suspicious_tld',
])

const SEVERITIES = new Set<RiskSeverity>(['low', 'medium', 'high'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stringArray(value: unknown, maximumItems: number): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length > maximumItems ||
    value.some((item) => typeof item !== 'string')
  ) {
    return null
  }
  return value.map((item) => (item as string).slice(0, 2_048))
}

function parseSignal(value: unknown): RiskSignal | null {
  if (!isRecord(value)) {
    return null
  }
  if (
    typeof value.type !== 'string' ||
    !SIGNAL_TYPES.has(value.type as RiskSignalType) ||
    typeof value.severity !== 'string' ||
    !SEVERITIES.has(value.severity as RiskSeverity) ||
    typeof value.reason !== 'string' ||
    value.reason.trim().length === 0 ||
    (value.evidence !== undefined && typeof value.evidence !== 'string')
  ) {
    return null
  }
  return {
    type: value.type as RiskSignalType,
    severity: value.severity as RiskSeverity,
    reason: value.reason.slice(0, 500),
    ...(typeof value.evidence === 'string'
      ? { evidence: value.evidence.slice(0, 500) }
      : {}),
  }
}

export function parseAiAnalysis(
  rawValue: string,
  requestedLanguage?: SupportedLanguage,
): AiAnalysis {
  let value: unknown
  try {
    value = JSON.parse(rawValue.trim())
  } catch {
    throw new Error('AI response was not valid JSON.')
  }
  if (!isRecord(value)) {
    throw new Error('AI response must be a JSON object.')
  }

  const urls = stringArray(value.extractedUrls, 20)
  const phones = stringArray(value.extractedPhones, 20)
  if (
    typeof value.messageSummary !== 'string' ||
    value.messageSummary.trim().length === 0 ||
    !urls ||
    !phones ||
    !isSupportedLanguage(value.language) ||
    !Array.isArray(value.signals) ||
    value.signals.length > 30 ||
    (value.detectedSender !== undefined &&
      typeof value.detectedSender !== 'string')
  ) {
    throw new Error('AI response did not match the required schema.')
  }
  if (requestedLanguage && value.language !== requestedLanguage) {
    throw new Error('AI response used the wrong language.')
  }

  const signals = value.signals.map(parseSignal)
  if (signals.some((signal) => signal === null)) {
    throw new Error('AI response contained an invalid risk signal.')
  }

  return {
    messageSummary: value.messageSummary.slice(0, 500),
    extractedUrls: [
      ...new Set(
        urls
          .map(normalizeUrl)
          .filter((url): url is string => url !== null),
      ),
    ],
    extractedPhones: [...new Set(phones)],
    ...(typeof value.detectedSender === 'string'
      ? { detectedSender: value.detectedSender.slice(0, 200) }
      : {}),
    language: value.language,
    signals: signals as RiskSignal[],
  }
}
