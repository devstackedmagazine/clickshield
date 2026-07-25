import { useHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from '@ionic/react';
import {
  alertOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  linkOutline,
  peopleOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  shieldOutline,
} from 'ionicons/icons';
import VerdictBadge from '../components/shared/VerdictBadge';
import { hasGuardianPin } from '../types/guardian';
import type { HistoryVerdict, RecentActivityEntry } from '../types/history';
import './Home.css';

const SECURITY_SCORE = 96;

const RECENT_ACTIVITY: RecentActivityEntry[] = [
  { name: 'Email Scan', verdict: 'noKnownRisk', date: 'Yesterday, 11:45 AM', source: 'inbox#452' },
  { name: 'Link Verified', verdict: 'blocked', date: 'Yesterday', source: 'bank-secure.io' },
  { name: 'Database Updated', verdict: 'noKnownRisk', date: '2 days ago', source: 'System' },
];

const ACTIVITY_ICON: Record<HistoryVerdict, string> = {
  blocked: shieldOutline,
  highRisk: shieldOutline,
  caution: alertOutline,
  noKnownRisk: checkmarkOutline,
};

function Home() {
  const history = useHistory();

  const goToScan = () => history.push('/tabs/scan');

  const handleGuardianControlsTap = () => {
    history.push(hasGuardianPin() ? '/parent-mode' : '/parent-pin-setup');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="home-header">
          <div className="home-header-brand">
            <IonIcon icon={shieldCheckmarkOutline} />
            <span>ClickShield</span>
          </div>
          <button
            slot="end"
            className="home-header-settings-button"
            onClick={() => history.push('/tabs/settings')}
          >
            <IonIcon icon={settingsOutline} />
          </button>
        </IonToolbar>
      </IonHeader>
      <IonContent className="home-content">
        <div className="home-score-card">
          <div className="home-score-ring">
            <span className="home-score-number">{SECURITY_SCORE}</span>
            <span className="home-score-label">SCORE</span>
          </div>
          <p className="home-score-title">Your digital life is secure</p>
          <p className="home-score-subtitle">No active threats detected in the last 24 hours.</p>
          <div className="home-active-protection-badge">
            <IonIcon icon={checkmarkCircleOutline} />
            <span>Active Protection</span>
          </div>
        </div>

        <div className="home-action-grid">
          <div className="home-action-card" onClick={goToScan}>
            <div className="home-action-icon-square">
              <IonIcon icon={chatbubbleOutline} />
            </div>
            <p className="home-action-title">Scan Message</p>
            <p className="home-action-description">Check texts or emails</p>
          </div>
          <div className="home-action-card" onClick={goToScan}>
            <div className="home-action-icon-square">
              <IonIcon icon={linkOutline} />
            </div>
            <p className="home-action-title">Check Link</p>
            <p className="home-action-description">Verify URLs instantly</p>
          </div>
        </div>

        <div className="home-guardian-card">
          <div className="home-guardian-header">
            <IonIcon icon={peopleOutline} />
            <span>GUARDIAN CONTROLS</span>
          </div>
          <p className="home-guardian-title">Protecting what matters most</p>
          <p className="home-guardian-description">
            Add blocked sites and keep your family safe from evolving digital threats.
          </p>
          <div className="home-guardian-illustration">
            <IonIcon icon={peopleOutline} />
          </div>
          <button className="home-guardian-button" onClick={handleGuardianControlsTap}>
            Manage Guardian Controls
          </button>
        </div>

        <div className="home-recent-activity-header">
          <p className="home-recent-activity-title">Recent Activity</p>
          <button
            className="home-recent-activity-view-all"
            onClick={() => history.push('/tabs/history')}
          >
            View History
          </button>
        </div>

        {RECENT_ACTIVITY.map((entry) => (
          <div
            className="home-activity-row"
            key={entry.name}
            onClick={() => history.push('/tabs/history')}
          >
            <div className={`home-activity-icon-circle ${entry.verdict}`}>
              <IonIcon icon={ACTIVITY_ICON[entry.verdict]} />
            </div>
            <div className="home-activity-content">
              <p className="home-activity-name">{entry.name}</p>
              <p className="home-activity-meta">
                {entry.date} · {entry.source}
              </p>
            </div>
            <VerdictBadge verdict={entry.verdict} />
          </div>
        ))}
      </IonContent>
    </IonPage>
  );
}

export default Home;
