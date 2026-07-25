import patternsJson from '../../offline/scam-patterns.json'
import type {
  RiskSignal,
  ScanInput,
  ScanResult,
  ScanVerdict,
  SupportedLanguage,
} from '../../types/analysis.ts'
import { getMessages } from './i18n.ts'
import { createTrace } from './progress.ts'
import {
  extractPhoneNumbers,
  findImitatedBrand,
  hasSuspiciousTld,
  hasSuspiciousUrlStructure,
  inputAsText,
  isSameOrSubdomain,
  isUrlShortener,
  normalizeHostname,
  normalizeUrl,
  urlsFromInput,
  urlsMatch,
} from './urlUtils.ts'

type LanguagePatterns = {
  urgencyPhrases: string[]
  paymentPhrases: string[]
  credentialPhrases: string[]
  prizePhrases: string[]
  weights: {
    urgency: number
    payment: number
    credential: number
    prize: number
  }
}

type ScamPatterns = {
  version: string
  blacklist: {
    domains: string[]
    urls: string[]
  }
  languages: Record<SupportedLanguage, LanguagePatterns>
}

export type LocalAnalysisOptions = {
  isOffline?: boolean
  blockedDomains?: string[]
  blockedUrls?: string[]
  blockedReason?: string
}

const patterns = patternsJson as ScamPatterns

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function verdictForScore(
  score: number,
  isBlocked = false,
): ScanVerdict {
  if (isBlocked) {
    return 'blocked'
  }
  if (score >= 75) {
    return 'highRisk'
  }
  if (score >= 30) {
    return 'caution'
  }
  return 'noKnownRisk'
}

function findPhrase(
  text: string,
  phrases: string[],
  language: SupportedLanguage,
): string | undefined {
  return phrases.find((phrase) =>
    text.includes(phrase.normalize('NFKC').toLocaleLowerCase(language)),
  )
}

function findBlockedUrl(
  urls: string[],
  blockedDomains: string[],
  blockedUrls: string[],
): string | undefined {
  for (const url of urls) {
    if (blockedUrls.some((blockedUrl) => urlsMatch(url, blockedUrl))) {
      return url
    }
    const hostname = normalizeHostname(url)
    if (
      hostname &&
      blockedDomains.some((domain) => isSameOrSubdomain(hostname, domain))
    ) {
      return url
    }
  }
  return undefined
}

function uniqueSignals(signals: RiskSignal[]): RiskSignal[] {
  const seen = new Set<string>()
  return signals.filter((signal) => {
    const key = `${signal.type}:${signal.evidence ?? ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function analyzeLocally(
  input: ScanInput,
  language: SupportedLanguage,
  options: LocalAnalysisOptions = {},
): ScanResult {
  const localized = getMessages(language)
  const languagePatterns = patterns.languages[language]
  const text = inputAsText(input)
    .normalize('NFKC')
    .toLocaleLowerCase(language)
  const urls = urlsFromInput(input)
  const phones = extractPhoneNumbers(inputAsText(input))
  const signals: RiskSignal[] = []
  let score = 0

  const blockedMatch = findBlockedUrl(
    urls,
    [
      ...patterns.blacklist.domains,
      ...(options.blockedDomains ?? []),
    ],
    [...patterns.blacklist.urls, ...(options.blockedUrls ?? [])],
  )

  if (blockedMatch) {
    const isCustomBlock =
      (options.blockedDomains?.length ?? 0) > 0 ||
      (options.blockedUrls?.length ?? 0) > 0
    signals.push({
      type: 'blacklisted_domain',
      severity: 'high',
      reason:
        options.blockedReason ??
        (isCustomBlock
          ? localized.reason.guardian
          : localized.reason.blacklisted),
      evidence: blockedMatch,
    })
    score = 100
  } else {
    const urgency = findPhrase(text, languagePatterns.urgencyPhrases, language)
    if (urgency) {
      signals.push({
        type: 'urgency_manipulation',
        severity: 'high',
        reason: localized.reason.urgency,
        evidence: urgency,
      })
      score += languagePatterns.weights.urgency
    }

    const payment = findPhrase(text, languagePatterns.paymentPhrases, language)
    if (payment) {
      signals.push({
        type: 'payment_pressure',
        severity: 'high',
        reason: localized.reason.payment,
        evidence: payment,
      })
      score += languagePatterns.weights.payment
    }

    const credential = findPhrase(
      text,
      languagePatterns.credentialPhrases,
      language,
    )
    if (credential) {
      signals.push({
        type: 'credential_theft',
        severity: 'high',
        reason: localized.reason.credential,
        evidence: credential,
      })
      score += languagePatterns.weights.credential
    }

    const prize = findPhrase(text, languagePatterns.prizePhrases, language)
    if (prize) {
      signals.push({
        type: 'prize_scam',
        severity: 'medium',
        reason: localized.reason.prize,
        evidence: prize,
      })
      score += languagePatterns.weights.prize
    }

    for (const url of urls) {
      const hostname = normalizeHostname(url)
      if (!hostname) {
        continue
      }

      if (isUrlShortener(hostname)) {
        signals.push({
          type: 'url_shortener',
          severity: 'medium',
          reason: localized.reason.shortener,
          evidence: url,
        })
        score += 15
      }
      if (hasSuspiciousTld(hostname)) {
        signals.push({
          type: 'suspicious_tld',
          severity: 'medium',
          reason: localized.reason.suspiciousTld,
          evidence: url,
        })
        score += 25
      }
      if (findImitatedBrand(hostname)) {
        signals.push({
          type: 'lookalike_domain',
          severity: 'high',
          reason: localized.reason.lookalike,
          evidence: url,
        })
        score += 40
      }
      if (hasSuspiciousUrlStructure(url)) {
        signals.push({
          type: 'suspicious_link',
          severity: 'medium',
          reason: localized.reason.suspiciousLink,
          evidence: url,
        })
        score += 20
      }
    }
  }

  const riskScore = clampScore(score)
  const verdict = verdictForScore(riskScore, blockedMatch !== undefined)
  const hasCredentialRisk = signals.some(
    (signal) =>
      signal.type === 'credential_theft' ||
      signal.type === 'lookalike_domain' ||
      signal.type === 'blacklisted_domain',
  )
  const hasScamRisk = signals.some(
    (signal) =>
      signal.type === 'payment_pressure' || signal.type === 'prize_scam',
  )

  return {
    verdict,
    riskScore,
    summary: localized.summary[verdict],
    signals: uniqueSignals(signals),
    extractedUrls: urls
      .map((url) => normalizeUrl(url))
      .filter((url): url is string => url !== null),
    detectedPhones: phones,
    category: hasCredentialRisk
      ? localized.category.phishing
      : hasScamRisk
        ? localized.category.scam
        : signals.length > 0
          ? localized.category.suspicious
          : localized.category.safe,
    confidence:
      verdict === 'blocked'
        ? 100
        : signals.length > 0
          ? clampScore(55 + signals.length * 9)
          : options.isOffline
            ? 45
            : 65,
    recommendedAction: localized.action[verdict],
    language,
    isOfflineResult: options.isOffline ?? false,
    isPartialResult: options.isOffline ?? false,
    trace: createTrace(language, {
      local: 'done',
      ai: 'skipped',
      reputation: 'skipped',
      combining: 'done',
    }),
    scannedAt: new Date().toISOString(),
  }
}

export function getScamPatternVersion(): string {
  return patterns.version
}
