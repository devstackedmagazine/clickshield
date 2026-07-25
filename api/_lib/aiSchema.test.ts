import { describe, expect, it } from 'vitest'
import { parseAiAnalysis } from './aiSchema.ts'

const validResponse = JSON.stringify({
  messageSummary: 'A suspicious bank message.',
  extractedUrls: ['example.test/login'],
  extractedPhones: ['+355691234567'],
  detectedSender: 'Example Bank',
  language: 'en',
  signals: [
    {
      type: 'credential_theft',
      severity: 'high',
      reason: 'It requests a password.',
      evidence: 'enter your password',
    },
  ],
})

describe('AI response schema', () => {
  it('normalizes a valid structured response', () => {
    expect(parseAiAnalysis(validResponse, 'en').extractedUrls).toEqual([
      'https://example.test/login',
    ])
  })

  it('rejects markdown, malformed signals, and the wrong language', () => {
    expect(() =>
      parseAiAnalysis(`\`\`\`json\n${validResponse}\n\`\`\``, 'en'),
    ).toThrow('valid JSON')
    expect(() =>
      parseAiAnalysis(
        validResponse.replace('"credential_theft"', '"not_a_signal"'),
        'en',
      ),
    ).toThrow('invalid risk signal')
    expect(() => parseAiAnalysis(validResponse, 'sq')).toThrow('wrong language')
  })
})
