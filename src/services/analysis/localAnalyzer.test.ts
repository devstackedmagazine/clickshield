import { describe, expect, it } from 'vitest'
import { combineServerResult } from '../../../api/_lib/combineResult.ts'
import { analyzeLocally } from './localAnalyzer.ts'

describe('deterministic local analysis', () => {
  it('blocks a local blacklist match before considering AI', () => {
    const local = analyzeLocally(
      { type: 'url', value: 'https://scam-demo.clickshield.test/login' },
      'en',
    )
    const combined = combineServerResult(
      local,
      {
        attempted: true,
        partial: false,
        analysis: {
          messageSummary: 'Looks safe.',
          extractedUrls: [],
          extractedPhones: [],
          language: 'en',
          signals: [],
        },
      },
      [],
      [],
    )

    expect(combined.verdict).toBe('blocked')
    expect(combined.riskScore).toBe(100)
  })

  it.each([
    ['sq', 'URGJENT, verifikoni PIN-in tuaj dhe paguani menjëherë'],
    ['en', 'URGENT: verify your account password and pay immediately'],
    ['tr', 'ACİL: hesabınızı doğrulayın ve hemen ödeyin'],
    ['sr', 'HITNO: potvrdite nalog i platite odmah'],
    ['mk', 'ИТНО: потврдете ја сметката и платете веднаш'],
    ['de', 'DRINGEND: Konto bestätigen und sofort bezahlen'],
    ['it', 'URGENTE: verifica il tuo account e paga immediatamente'],
    ['fr', 'URGENT: vérifiez votre compte et payez immédiatement'],
    ['ar', 'عاجل: تحقق من حسابك وادفع فوراً'],
    ['ro', 'URGENT: verificați contul și plătiți imediat'],
  ] as const)('scores deterministic phrases for %s', (language, value) => {
    const result = analyzeLocally(
      { type: 'text', value },
      language,
      { isOffline: true },
    )
    expect(result.riskScore).toBeGreaterThanOrEqual(75)
    expect(result.verdict).toBe('highRisk')
    expect(result.isOfflineResult).toBe(true)
  })

  it('detects lookalike domains and misleading brand subdomains', () => {
    const result = analyzeLocally(
      {
        type: 'text',
        value:
          'Sign in at raiffeisen-al.com or bkt.albania-secure.com immediately.',
      },
      'en',
    )
    expect(result.signals.filter((signal) => signal.type === 'lookalike_domain'))
      .toHaveLength(2)
    expect(result.verdict).toBe('highRisk')
  })
})
