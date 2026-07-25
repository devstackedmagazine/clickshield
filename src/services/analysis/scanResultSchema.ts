import type {
  RiskSignal,
  RiskSignalType,
  ScanResult,
  ScanStep,
  ScanVerdict,
  SupportedLanguage,
} from '../../types/analysis.ts'
import {
  isSupportedLanguage,
} from '../../types/analysis.ts'

const VERDICTS = new Set<ScanVerdict>([
  'blocked',
  'highRisk',
  'caution',
  'noKnownRisk',
])
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isRiskSignal(value: unknown): value is RiskSignal {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.type === 'string' &&
    SIGNAL_TYPES.has(value.type as RiskSignalType) &&
    typeof value.severity === 'string' &&
    ['low', 'medium', 'high'].includes(value.severity) &&
    typeof value.reason === 'string' &&
    (value.evidence === undefined || typeof value.evidence === 'string')
  )
}

function isScanStep(value: unknown): value is ScanStep {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.id === 'string' &&
    ['local', 'ai', 'reputation', 'combining'].includes(value.id) &&
    typeof value.label === 'string' &&
    typeof value.status === 'string' &&
    ['pending', 'running', 'done', 'failed', 'skipped'].includes(value.status)
  )
}

function isBoundedNumber(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  )
}

export function parseScanResult(
  value: unknown,
  requestedLanguage?: SupportedLanguage,
): ScanResult {
  if (!isRecord(value)) {
    throw new Error('Scan response must be a JSON object.')
  }
  if (
    typeof value.verdict !== 'string' ||
    !VERDICTS.has(value.verdict as ScanVerdict) ||
    !isBoundedNumber(value.riskScore) ||
    typeof value.summary !== 'string' ||
    !Array.isArray(value.signals) ||
    !value.signals.every(isRiskSignal) ||
    !isStringArray(value.extractedUrls) ||
    !isStringArray(value.detectedPhones) ||
    typeof value.category !== 'string' ||
    !isBoundedNumber(value.confidence) ||
    typeof value.recommendedAction !== 'string' ||
    !isSupportedLanguage(value.language) ||
    typeof value.isOfflineResult !== 'boolean' ||
    typeof value.isPartialResult !== 'boolean' ||
    !Array.isArray(value.trace) ||
    !value.trace.every(isScanStep) ||
    typeof value.scannedAt !== 'string' ||
    Number.isNaN(Date.parse(value.scannedAt))
  ) {
    throw new Error('Scan response did not match the required schema.')
  }
  if (requestedLanguage && value.language !== requestedLanguage) {
    throw new Error('Scan response used the wrong language.')
  }
  return value as ScanResult
}
