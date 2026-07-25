export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface LastScanSummary {
  riskLevel: RiskLevel;
  summary: string;
  time: string;
}

export type HistoryVerdict = 'blocked' | 'highRisk' | 'caution' | 'noKnownRisk';

export interface HistoryEntry {
  id: number;
  name: string;
  verdict: HistoryVerdict;
  scannedAt: string;
  category: string;
}

export interface RecentActivityEntry {
  name: string;
  verdict: HistoryVerdict;
  date: string;
  source: string;
}
