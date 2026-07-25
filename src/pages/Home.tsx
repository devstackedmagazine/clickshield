import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { cameraOutline, settingsOutline } from 'ionicons/icons';
import type { LastScanSummary } from '../types/history';
import './Home.css';

const RISK_EMOJI: Record<LastScanSummary['riskLevel'], string> = {
  HIGH: '🔴',
  MEDIUM: '🟡',
  LOW: '🟢',
};

const RISK_LABEL: Record<LastScanSummary['riskLevel'], string> = {
  HIGH: 'High Risk',
  MEDIUM: 'Medium Risk',
  LOW: 'Low Risk',
};

function Home() {
  const history = useHistory();

  // Mock seed for now — will come from real scan history once storage/hooks land.
  // Set to null to verify the card correctly disappears when no scan exists.
  const [lastScan] = useState<LastScanSummary | null>({
    riskLevel: 'LOW',
    summary: 'Safe message',
    time: '2h ago',
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="home-title">🛡️ ClickShield</IonTitle>
          <IonButtons slot="end">
            <button
              aria-label="Settings"
              className="ion-activatable"
              onClick={() => history.push('/tabs/settings')}
              style={{ background: 'none', border: 'none', padding: '0 16px' }}
            >
              <IonIcon icon={settingsOutline} style={{ fontSize: '22px', color: 'var(--color-text-primary)' }} />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {lastScan && (
          <IonCard className="home-last-scan-card">
            <IonCardContent>
              <div className="home-last-scan-row">
                <span>{RISK_EMOJI[lastScan.riskLevel]}</span>
                <span className="home-last-scan-level">{RISK_LABEL[lastScan.riskLevel]}</span>
                <span className="home-last-scan-time">{lastScan.time}</span>
              </div>
              <p className="home-last-scan-summary">{lastScan.summary}</p>
            </IonCardContent>
          </IonCard>
        )}

        <div className="home-scan-area">
          <button
            className="home-scan-button"
            aria-label="Scan"
            onClick={() => history.push('/scan')}
          >
            <IonIcon icon={cameraOutline} />
          </button>
          <p className="home-scan-label">Tap to scan</p>
          <p className="home-scan-hint">Upload, photograph or paste anything suspicious</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Home;
