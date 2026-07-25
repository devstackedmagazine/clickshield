import type {
  InputType,
  ScanInput,
  ScanResult,
  ScanVerdict,
  SupportedLanguage,
} from './analysis.ts'

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface LastScanSummary {
  riskLevel: RiskLevel
  summary: string
  time: string
}

export type HistoryVerdict = ScanVerdict

/**
 * UI-facing history card contract. This remains separate from the complete
 * persisted scan so the current UI can be connected through an explicit mapper.
 */
export interface HistoryEntry {
  id: number
  name: string
  verdict: HistoryVerdict
  scannedAt: string
  category: string
}

export interface RecentActivityEntry {
  name: string
  verdict: HistoryVerdict
  date: string
  source: string
}

export type StoredHistoryEntry = {
  id: number
  scannedAt: string
  screenshotPath: string | null
  inputType: InputType
  inputPreview: string
  verdict: ScanVerdict
  riskScore: number
  summary: string
  fullReport: ScanResult
  language: SupportedLanguage
}

export type SaveHistoryInput = {
  input: ScanInput
  result: ScanResult
  screenshotPath?: string
}

export interface HistoryRepository {
  save(value: SaveHistoryInput): Promise<StoredHistoryEntry>
  list(limit?: number): Promise<StoredHistoryEntry[]>
  getById(id: number): Promise<StoredHistoryEntry | null>
  delete(id: number): Promise<void>
  clear(): Promise<void>
}
