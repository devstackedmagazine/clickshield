import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from '@ionic/react';
import {
  alertCircleOutline,
  cardOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  chevronBack,
  close,
  informationCircle,
  keyOutline,
  linkOutline,
  notificationsOutline,
  personOutline,
  shield,
  shieldCheckmark,
  warningOutline,
} from 'ionicons/icons';
import type { AnalysisResult, RiskLevel, ThreatType } from '../types/report';
import './Result.css';

type ResultView = 'simple' | 'detailed';

const mockResult: AnalysisResult = {
  riskScore: 98,
  riskLevel: 'HIGH',
  category: 'Phishing',
  summary:
    'This message uses urgent language typical of banking scams. The link leads to a non-official website designed to harvest your credentials.',
  threats: [
    {
      type: 'urgent_tone',
      name: 'Urgent Tone',
      description: 'The message uses high-pressure language to force an immediate decision.',
    },
    {
      type: 'suspicious_url',
      name: 'Suspicious URL',
      description: 'Link does not match the official domain.',
    },
  ],
  findings: ['Domain verification failed', 'Urgent call-to-action detected'],
  confidence: 98,
};

const SIMPLE_HEADER_LABEL: Record<RiskLevel, string> = {
  HIGH: 'Threat Identified',
  MEDIUM: 'Risk Detected',
  LOW: 'Scan Complete',
};

const RISK_TITLE: Record<RiskLevel, string> = {
  HIGH: 'High Risk Detected',
  MEDIUM: 'Medium Risk Detected',
  LOW: 'No Threats Found',
};

const RISK_BADGE_TEXT: Record<RiskLevel, string> = {
  HIGH: 'THREAT IDENTIFIED',
  MEDIUM: 'PROCEED WITH CAUTION',
  LOW: 'LOOKS SAFE',
};

const RISK_ICON: Record<RiskLevel, string> = {
  HIGH: warningOutline,
  MEDIUM: alertCircleOutline,
  LOW: checkmarkCircleOutline,
};

const RISK_CLASS: Record<RiskLevel, string> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const THREAT_ICON: Record<ThreatType, string> = {
  urgent_tone: notificationsOutline,
  suspicious_url: linkOutline,
  impersonation: personOutline,
  payment_pressure: cardOutline,
  credential_theft: keyOutline,
  unusual_wording: chatbubbleOutline,
};

const THREAT_COLOR: Record<ThreatType, 'amber' | 'red'> = {
  urgent_tone: 'amber',
  suspicious_url: 'red',
  impersonation: 'red',
  payment_pressure: 'red',
  credential_theft: 'red',
  unusual_wording: 'amber',
};

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ConfidenceRing({ confidence }: { confidence: number }) {
  const [animatedOffset, setAnimatedOffset] = useState(RING_CIRCUMFERENCE);

  useEffect(() => {
    const targetOffset = RING_CIRCUMFERENCE * (1 - confidence / 100);
    const frame = requestAnimationFrame(() => setAnimatedOffset(targetOffset));
    return () => cancelAnimationFrame(frame);
  }, [confidence]);

  return (
    <div className="result-confidence-ring-wrapper">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="var(--color-border)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--color-danger)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={animatedOffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="result-confidence-ring-text">
        <span className="result-confidence-percentage">{confidence}%</span>
        <span className="result-confidence-caption">CONFIDENCE</span>
      </div>
    </div>
  );
}

function Result() {
  const history = useHistory();
  const [view, setView] = useState<ResultView>('simple');
  const result = mockResult;
  const riskClass = RISK_CLASS[result.riskLevel];

  if (view === 'detailed') {
    return (
  <IonPage>
        <IonHeader>
          <IonToolbar>
            <div className="result-header-light-left">
              <button className="result-header-back-button" onClick={() => setView('simple')}>
                <IonIcon icon={chevronBack} />
              </button>
              <span>Analysis Detail</span>
            </div>
            <div className="result-header-avatar" slot="end" />
          </IonToolbar>
        </IonHeader>
        <IonContent className="result-page">
          <div className="result-detail-top">
            <div className="result-detail-icon-circle">
              <IonIcon icon={shieldCheckmark} />
            </div>
            <h1 className="result-detail-title">AI Insights</h1>
            <p className="result-detail-subtitle">
              Our advanced security engine has completed a deep-dive analysis of the threat.
            </p>

            <div className="result-confidence-meter">
              <ConfidenceRing confidence={result.confidence} />
              <div className="result-confidence-badge-wrapper">
                <span className={`result-risk-badge ${riskClass}`}>
                  {RISK_TITLE[result.riskLevel]}
                </span>
              </div>
            </div>
          </div>

          <h2 className="result-ai-breakdown-heading">AI Breakdown</h2>
          <div className="result-threat-list">
            {result.threats.map((threat) => (
              <div className="result-threat-row" key={threat.type}>
                <div className={`result-threat-icon-circle ${THREAT_COLOR[threat.type]}`}>
                  <IonIcon icon={THREAT_ICON[threat.type]} />
                </div>
                <div className="result-threat-content">
                  <div className="result-threat-top-row">
                    <p className="result-threat-name">{threat.name}</p>
                    <button
                      className="result-learn-why-button"
                      onClick={() => console.log(`Learn Why tapped: ${threat.name}`)}
                    >
                      Learn Why ⓘ
                    </button>
                  </div>
                  <p className="result-threat-description">{threat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="result-header-dark">
          <div className="result-header-dark-left">
            <IonIcon icon={shield} />
            <span>{SIMPLE_HEADER_LABEL[result.riskLevel]}</span>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="result-page">
        <div className="result-main-card">
          <div className="result-card-top-row">
            <div className="result-card-brand">
              <IonIcon icon={shieldCheckmark} />
              <span>ClickShield</span>
            </div>
            <button className="result-close-button" onClick={() => history.push('/tabs/home')}>
              <IonIcon icon={close} />
            </button>
          </div>

          <div className={`result-warning-circle ${riskClass}`}>
            <IonIcon icon={RISK_ICON[result.riskLevel]} />
          </div>

          <h1 className="result-risk-title">{RISK_TITLE[result.riskLevel]}</h1>

          <div className="result-risk-badge-wrapper">
            <span className={`result-risk-badge ${riskClass}`}>
              {RISK_BADGE_TEXT[result.riskLevel]}
            </span>
          </div>

          <div className="result-stat-grid">
            <div className="result-stat-card">
              <p className="result-stat-label">CONFIDENCE</p>
              <p className="result-stat-value danger">{result.confidence}%</p>
            </div>
            <div className="result-stat-card">
              <p className="result-stat-label">CATEGORY</p>
              <p className="result-stat-value category">{result.category}</p>
            </div>
          </div>

          <div className="result-breakdown-card">
            <div className="result-breakdown-header">
              <div className="result-breakdown-icon">
                <IonIcon icon={informationCircle} />
              </div>
              <div>
                <p className="result-breakdown-title">Analysis Breakdown</p>
                <p className="result-breakdown-subtitle">Powered by AI</p>
              </div>
            </div>
            <p className="result-breakdown-body">{result.summary}</p>
          </div>

          <div className="result-findings-list">
            {result.findings.map((finding) => (
              <div className={`result-finding-row ${riskClass === 'high' ? 'high' : 'medium'}`} key={finding}>
                <IonIcon icon={warningOutline} />
                <span>{finding}</span>
              </div>
            ))}
          </div>

          <button className="result-view-full-button" onClick={() => setView('detailed')}>
            View Full Analysis
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Result;
