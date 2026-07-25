import { describe, expect, it } from 'vitest'
import { getVerdictUiState } from './verdictPresentation.ts'

describe('verdict UI mapping', () => {
  it('maps all verdicts to the implementation-plan states', () => {
    expect(getVerdictUiState('blocked')).toMatchObject({
      riskLevel: 'HIGH',
      color: '#E02424',
      header: 'Threat Identified',
      canOpen: false,
    })
    expect(getVerdictUiState('highRisk').riskLevel).toBe('HIGH')
    expect(getVerdictUiState('caution')).toMatchObject({
      riskLevel: 'MEDIUM',
      color: '#D97706',
      header: 'Risk Detected',
      requiresConfirmation: true,
    })
    expect(getVerdictUiState('noKnownRisk')).toMatchObject({
      riskLevel: 'LOW',
      color: '#057A55',
      header: 'Scan Complete',
      requiresConfirmation: true,
    })
  })
})
