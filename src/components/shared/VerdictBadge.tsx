import type { HistoryVerdict } from '../../types/history';
import './VerdictBadge.css';

export interface VerdictBadgeProps {
  verdict: HistoryVerdict;
}

const VERDICT_LABEL: Record<HistoryVerdict, string> = {
  blocked: 'BLOCKED',
  highRisk: 'HIGH RISK',
  caution: 'CAUTION',
  noKnownRisk: 'SAFE',
};

function VerdictBadge({ verdict }: VerdictBadgeProps) {
  return <span className={`verdict-badge ${verdict}`}>{VERDICT_LABEL[verdict]}</span>;
}

export default VerdictBadge;
