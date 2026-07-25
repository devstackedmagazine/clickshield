import type {
  RiskSignal,
  ScanResult,
  ScanVerdict,
  SupportedLanguage,
} from '../../src/types/analysis.ts'
import { getMessages } from '../../src/services/analysis/i18n.ts'
import { createTrace } from '../../src/services/analysis/progress.ts'
import { verdictForScore } from '../../src/services/analysis/localAnalyzer.ts'
import type { AiRunResult } from './aiProviders.ts'
import type {
  VirusTotalResult,
  WebRiskResult,
} from './reputation.ts'

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function severityWeight(signal: RiskSignal): number {
  switch (signal.severity) {
    case 'high':
      return 25
    case 'medium':
      return 15
    case 'low':
      return 8
  }
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function uniqueSignals(signals: RiskSignal[]): RiskSignal[] {
  const seen = new Set<string>()
  return signals.filter((signal) => {
    const key = `${signal.type}:${signal.reason}:${signal.evidence ?? ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function categoryFor(
  signals: RiskSignal[],
  verdict: ScanVerdict,
  language: SupportedLanguage,
): string {
  const categories = getMessages(language).category
  if (verdict === 'noKnownRisk') {
    return categories.safe
  }
  if (
    signals.some((signal) =>
      [
        'credential_theft',
        'impersonation',
        'lookalike_domain',
        'blacklisted_domain',
        'suspicious_link',
      ].includes(signal.type),
    )
  ) {
    return categories.phishing
  }
  if (
    signals.some((signal) =>
      ['payment_pressure', 'prize_scam', 'romance_scam'].includes(signal.type),
    )
  ) {
    return categories.scam
  }
  return categories.suspicious
}

export function combineServerResult(
  local: ScanResult,
  ai: AiRunResult,
  webRisk: WebRiskResult[],
  virusTotal: VirusTotalResult[],
): ScanResult {
  if (local.verdict === 'blocked') {
    return local
  }

  const localized = getMessages(local.language)
  const aiSignals = ai.analysis?.signals ?? []
  const signals = [...local.signals, ...aiSignals]
  let score =
    local.riskScore + aiSignals.reduce((sum, signal) => sum + severityWeight(signal), 0)
  let forcedVerdict: ScanVerdict | null = null

  for (const result of webRisk) {
    if (result.verdict === 'malicious') {
      signals.push({
        type: 'suspicious_link',
        severity: 'high',
        reason: localized.reason.suspiciousLink,
        evidence: result.url,
      })
      score = Math.max(score, 85)
      forcedVerdict = 'highRisk'
    }
  }

  for (const result of virusTotal) {
    if (result.verdict === 'malicious') {
      signals.push({
        type: 'blacklisted_domain',
        severity: 'high',
        reason: localized.reason.blacklisted,
        evidence: result.url,
      })
      score = Math.max(score, 95)
      forcedVerdict = 'blocked'
    } else if (result.verdict === 'suspicious') {
      signals.push({
        type: 'suspicious_link',
        severity: 'high',
        reason: localized.reason.suspiciousLink,
        evidence: result.url,
      })
      score = Math.max(score, 75)
      forcedVerdict ??= 'highRisk'
    }
  }

  const hasOnlyAiEvidence =
    local.signals.length === 0 &&
    !webRisk.some((result) => result.verdict === 'malicious') &&
    !virusTotal.some(
      (result) =>
        result.verdict === 'malicious' || result.verdict === 'suspicious',
    ) &&
    aiSignals.length > 0
  if (hasOnlyAiEvidence) {
    score = Math.min(69, Math.max(35, score))
  }

  const riskScore = clamp(score)
  const verdict = forcedVerdict ?? verdictForScore(riskScore)
  const partialReputation = [...webRisk, ...virusTotal].some((result) =>
    ['unavailable', 'error', 'quota'].includes(result.verdict),
  )
  const isPartialResult = ai.partial || partialReputation
  const normalizedSignals = uniqueSignals(signals)

  return {
    verdict,
    riskScore,
    summary: ai.analysis?.messageSummary ?? localized.summary[verdict],
    signals: normalizedSignals,
    extractedUrls: unique([
      ...local.extractedUrls,
      ...(ai.analysis?.extractedUrls ?? []),
    ]),
    detectedPhones: unique([
      ...local.detectedPhones,
      ...(ai.analysis?.extractedPhones ?? []),
    ]),
    category: categoryFor(normalizedSignals, verdict, local.language),
    confidence: clamp(
      forcedVerdict === 'blocked'
        ? 98
        : 60 + normalizedSignals.length * 6 - (isPartialResult ? 15 : 0),
    ),
    recommendedAction: localized.action[verdict],
    language: local.language,
    isOfflineResult: false,
    isPartialResult,
    trace: createTrace(local.language, {
      local: 'done',
      ai: ai.analysis ? 'done' : ai.attempted ? 'failed' : 'skipped',
      reputation: partialReputation ? 'failed' : 'done',
      combining: 'done',
    }),
    scannedAt: new Date().toISOString(),
  }
}
