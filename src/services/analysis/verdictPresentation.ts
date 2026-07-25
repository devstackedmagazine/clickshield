import type { ScanVerdict } from '../../types/analysis.ts'

export type VerdictUiState = {
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  color: '#E02424' | '#D97706' | '#057A55'
  header: 'Threat Identified' | 'Risk Detected' | 'Scan Complete'
  canOpen: boolean
  requiresConfirmation: boolean
}

const VERDICT_UI_STATES: Record<ScanVerdict, VerdictUiState> = {
  blocked: {
    riskLevel: 'HIGH',
    color: '#E02424',
    header: 'Threat Identified',
    canOpen: false,
    requiresConfirmation: false,
  },
  highRisk: {
    riskLevel: 'HIGH',
    color: '#E02424',
    header: 'Threat Identified',
    canOpen: false,
    requiresConfirmation: false,
  },
  caution: {
    riskLevel: 'MEDIUM',
    color: '#D97706',
    header: 'Risk Detected',
    canOpen: true,
    requiresConfirmation: true,
  },
  noKnownRisk: {
    riskLevel: 'LOW',
    color: '#057A55',
    header: 'Scan Complete',
    canOpen: true,
    requiresConfirmation: true,
  },
}

export function getVerdictUiState(verdict: ScanVerdict): VerdictUiState {
  return VERDICT_UI_STATES[verdict]
}
