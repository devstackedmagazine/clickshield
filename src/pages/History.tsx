import { useMemo, useState } from 'react';
import { useHistory as useRouterHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonToolbar } from '@ionic/react';
import {
  alertCircleOutline,
  alertOutline,
  checkmarkOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  shieldOutline,
  timeOutline,
  warningOutline,
} from 'ionicons/icons';
import VerdictBadge from '../components/shared/VerdictBadge';
import type { HistoryEntry, HistoryVerdict } from '../types/history';
import './History.css';

const mockHistory: HistoryEntry[] = [
  { id: 1, name: 'Phishing Link', verdict: 'blocked', scannedAt: 'Today, 2:45 PM', category: 'Phishing' },
  { id: 2, name: 'Smishing Attempt', verdict: 'highRisk', scannedAt: 'Oct 24, 10:12 AM', category: 'SMS Scam' },
  { id: 3, name: 'Risk Warning', verdict: 'caution', scannedAt: 'Oct 22, 6:30 PM', category: 'Suspicious Link' },
  { id: 4, name: 'Safe Message', verdict: 'noKnownRisk', scannedAt: 'Oct 20, 9:00 AM', category: 'Message' },
];

const VERDICT_ICON: Record<HistoryVerdict, string> = {
  blocked: alertCircleOutline,
  highRisk: warningOutline,
  caution: alertOutline,
  noKnownRisk: checkmarkOutline,
};

function History() {
  const routerHistory = useRouterHistory();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mockHistory;
    return mockHistory.filter((entry) => entry.name.toLowerCase().includes(term));
  }, [searchTerm]);

  const handleCardTap = (entry: HistoryEntry) => {
    routerHistory.push('/result', entry);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="history-header-dark">
          <div className="history-header-left">
            <IonIcon icon={timeOutline} />
            <span>Security History</span>
          </div>
          <button
            slot="end"
            className="history-header-settings-button"
            onClick={() => routerHistory.push('/tabs/settings')}
          >
            <IonIcon icon={settingsOutline} />
          </button>
        </IonToolbar>
      </IonHeader>
      <IonContent className="history-content">
        <h1 className="history-page-title">History</h1>
        <p className="history-page-subtitle">
          Review all past threats identified and neutralized by ClickShield AI.
        </p>

        <IonSearchbar
          className="history-searchbar"
          placeholder="Search threats..."
          value={searchTerm}
          onIonInput={(e) => setSearchTerm(e.detail.value ?? '')}
        />

        {filteredHistory.length > 0 ? (
          <div className="history-list">
            {filteredHistory.map((entry) => (
              <div className="history-card" key={entry.id} onClick={() => handleCardTap(entry)}>
                <div className={`history-icon-circle ${entry.verdict}`}>
                  <IonIcon icon={VERDICT_ICON[entry.verdict]} />
                </div>
                <div className="history-card-content">
                  <p className="history-card-name">{entry.name}</p>
                  <p className="history-card-date">{entry.scannedAt}</p>
                </div>
                <VerdictBadge verdict={entry.verdict} />
              </div>
            ))}
          </div>
        ) : (
          <div className="history-empty-state">
            <IonIcon icon={shieldOutline} />
            <p className="history-empty-title">No scans yet</p>
            <p className="history-empty-subtitle">Your scan history will appear here.</p>
          </div>
        )}

        <div className="history-footer">
          <IonIcon icon={shieldCheckmarkOutline} />
          <p className="history-footer-title">Protected by ClickShield AI</p>
          <p className="history-footer-subtitle">ALL DATA ENCRYPTED AND STORED LOCALLY</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default History;
