import type {
  RiskSignal,
  ScanInput,
  ScanResult,
  SupportedLanguage,
} from '../../types/analysis.ts'
import { getMessages } from './i18n.ts'
import { createTrace } from './progress.ts'

export type DemoFixtureName = 'scam' | 'caution' | 'safe'

export type DemoFixture = {
  input: ScanInput
  result: ScanResult
}

function signalsFor(
  name: DemoFixtureName,
  language: SupportedLanguage,
): RiskSignal[] {
  const reason = getMessages(language).reason
  if (name === 'scam') {
    return [
      {
        type: 'urgency_manipulation',
        severity: 'high',
        reason: reason.urgency,
        evidence: 'URGJENT',
      },
      {
        type: 'impersonation',
        severity: 'high',
        reason: reason.lookalike,
        evidence: 'BKT',
      },
      {
        type: 'credential_theft',
        severity: 'high',
        reason: reason.credential,
        evidence: 'PIN-in tuaj',
      },
      {
        type: 'suspicious_link',
        severity: 'high',
        reason: reason.suspiciousLink,
        evidence: 'bkt-albania-secure.com',
      },
    ]
  }
  if (name === 'caution') {
    return [
      {
        type: 'prize_scam',
        severity: 'medium',
        reason: reason.prize,
        evidence: 'claim your reward',
      },
    ]
  }
  return []
}

export function getDemoFixture(
  name: DemoFixtureName,
  language: SupportedLanguage,
): DemoFixture {
  const localized = getMessages(language)
  const trace = createTrace(language, {
    local: 'done',
    ai: 'skipped',
    reputation: 'skipped',
    combining: 'done',
  })
  const scannedAt = new Date().toISOString()

  if (name === 'scam') {
    return {
      input: {
        type: 'text',
        value:
          'URGJENT: Llogaria juaj BKT është pezulluar. Verifikoni PIN-in tuaj menjëherë në: bkt-albania-secure.com ose llogaria juaj do të mbyllet brenda 24 orësh.',
      },
      result: {
        verdict: 'blocked',
        riskScore: 96,
        category: localized.category.phishing,
        confidence: 98,
        summary: localized.summary.blocked,
        signals: signalsFor(name, language),
        extractedUrls: ['https://bkt-albania-secure.com/'],
        detectedPhones: [],
        recommendedAction: localized.action.blocked,
        language,
        isOfflineResult: false,
        isPartialResult: false,
        trace,
        scannedAt,
      },
    }
  }

  if (name === 'caution') {
    return {
      input: {
        type: 'text',
        value:
          'Congratulations! You have been selected for a special offer. Call us back at +355 69 123 4567 to claim your reward.',
      },
      result: {
        verdict: 'caution',
        riskScore: 52,
        category: localized.category.scam,
        confidence: 65,
        summary: localized.summary.caution,
        signals: signalsFor(name, language),
        extractedUrls: [],
        detectedPhones: ['+355691234567'],
        recommendedAction: localized.action.caution,
        language,
        isOfflineResult: false,
        isPartialResult: false,
        trace,
        scannedAt,
      },
    }
  }

  return {
    input: {
      type: 'text',
      value:
        'Porosia juaj nga Zara është dërguar. Gjurmoni porosinë tuaj në: zara.com/order/123456. Koha e parashikuar: 3-5 ditë pune.',
    },
    result: {
      verdict: 'noKnownRisk',
      riskScore: 8,
      category: localized.category.safe,
      confidence: 92,
      summary: localized.summary.noKnownRisk,
      signals: signalsFor(name, language),
      extractedUrls: ['https://zara.com/order/123456'],
      detectedPhones: [],
      recommendedAction: localized.action.noKnownRisk,
      language,
      isOfflineResult: false,
      isPartialResult: false,
      trace,
      scannedAt,
    },
  }
}

export function getDemoFixtureNameFromLocation(): DemoFixtureName | null {
  if (typeof window === 'undefined') {
    return null
  }
  const name = new URLSearchParams(window.location.search).get('demo')
  return name === 'scam' || name === 'caution' || name === 'safe' ? name : null
}
