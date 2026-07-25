export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface LastScanSummary {
  riskLevel: RiskLevel;
  summary: string;
  time: string;
}
