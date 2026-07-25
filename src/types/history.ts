import type {
  InputType,
  ScanInput,
  ScanResult,
  ScanVerdict,
  SupportedLanguage,
} from './analysis.ts'

export type HistoryEntry = {
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
  save(value: SaveHistoryInput): Promise<HistoryEntry>
  list(limit?: number): Promise<HistoryEntry[]>
  getById(id: number): Promise<HistoryEntry | null>
  delete(id: number): Promise<void>
  clear(): Promise<void>
}
