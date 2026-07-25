export const SUPPORTED_LANGUAGES = [
  'sq',
  'en',
  'tr',
  'sr',
  'mk',
  'de',
  'it',
  'fr',
  'ar',
  'ro',
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export type ScanInput =
  | { type: 'url'; value: string }
  | { type: 'text'; value: string }
  | {
      type: 'screenshot'
      base64: string
      mimeType: 'image/jpeg' | 'image/png'
    }
  | { type: 'qr'; rawValue: string }

export type RiskSignalType =
  | 'urgency_manipulation'
  | 'impersonation'
  | 'payment_pressure'
  | 'credential_theft'
  | 'suspicious_link'
  | 'unusual_wording'
  | 'prize_scam'
  | 'fake_delivery'
  | 'romance_scam'
  | 'tech_support_scam'
  | 'blacklisted_domain'
  | 'lookalike_domain'
  | 'url_shortener'
  | 'suspicious_tld'

export type RiskSeverity = 'low' | 'medium' | 'high'

export type RiskSignal = {
  type: RiskSignalType
  severity: RiskSeverity
  reason: string
  evidence?: string
}

export type ScanStepId = 'local' | 'ai' | 'reputation' | 'combining'
export type ScanStepStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'failed'
  | 'skipped'

export type ScanStep = {
  id: ScanStepId
  label: string
  status: ScanStepStatus
}

export type ScanVerdict =
  | 'blocked'
  | 'highRisk'
  | 'caution'
  | 'noKnownRisk'

export type ScanResult = {
  verdict: ScanVerdict
  riskScore: number
  summary: string
  signals: RiskSignal[]
  extractedUrls: string[]
  detectedPhones: string[]
  category: string
  confidence: number
  recommendedAction: string
  language: SupportedLanguage
  isOfflineResult: boolean
  isPartialResult: boolean
  trace: ScanStep[]
  scannedAt: string
}

export type ScanError =
  | { code: 'INVALID_INPUT'; message: string }
  | { code: 'OFFLINE_NO_MODEL'; message: string }
  | { code: 'AI_FAILURE'; message: string }
  | { code: 'VIRUSTOTAL_FAILURE'; message: string }
  | { code: 'QUOTA_EXHAUSTED'; message: string }
  | { code: 'IMAGE_TOO_LARGE'; message: string }
  | { code: 'UNSUPPORTED_FORMAT'; message: string }
  | { code: 'TIMEOUT'; message: string }

export type ScanRequest = {
  input: ScanInput
  language: SupportedLanguage
}

export type AiAnalysis = {
  messageSummary: string
  extractedUrls: string[]
  extractedPhones: string[]
  detectedSender?: string
  language: SupportedLanguage
  signals: RiskSignal[]
}

export type InputType = ScanInput['type']

export function isSupportedLanguage(
  value: unknown,
): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  )
}

export class ScanServiceError extends Error {
  readonly details: ScanError

  constructor(details: ScanError) {
    super(details.message)
    this.name = 'ScanServiceError'
    this.details = details
  }
}
