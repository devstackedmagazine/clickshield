export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ThreatType =
  | 'urgent_tone'
  | 'suspicious_url'
  | 'impersonation'
  | 'payment_pressure'
  | 'credential_theft'
  | 'unusual_wording';

export interface Threat {
  type: ThreatType;
  name: string;
  description: string;
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  category: string;
  summary: string;
  threats: Threat[];
  findings: string[];
  confidence: number;
}
