import type {
  ScanStep,
  ScanStepId,
  ScanStepStatus,
  SupportedLanguage,
} from '../../types/analysis.ts'
import { getMessages } from './i18n.ts'

export function createTrace(
  language: SupportedLanguage,
  statuses: Partial<Record<ScanStepId, ScanStepStatus>> = {},
): ScanStep[] {
  const labels = getMessages(language).progress
  return [
    {
      id: 'local',
      label: labels.local,
      status: statuses.local ?? 'pending',
    },
    {
      id: 'ai',
      label: labels.ai,
      status: statuses.ai ?? 'pending',
    },
    {
      id: 'reputation',
      label: labels.reputation,
      status: statuses.reputation ?? 'pending',
    },
    {
      id: 'combining',
      label: labels.combining,
      status: statuses.combining ?? 'pending',
    },
  ]
}

export function updateTraceStep(
  trace: ScanStep[],
  id: ScanStepId,
  status: ScanStepStatus,
): ScanStep[] {
  return trace.map((step) => (step.id === id ? { ...step, status } : step))
}
