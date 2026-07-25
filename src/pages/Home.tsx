import { useHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from '@ionic/react';
import { analyticsOutline, scanOutline, shieldCheckmarkOutline, shieldOutline, sparklesOutline } from 'ionicons/icons';
import './Home.css';

function Home() {
  const history = useHistory();

  const handleStartScan = () => {
    history.push('/tabs/scan');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="home-header">
          <div className="home-header-brand">
            <IonIcon icon={shieldCheckmarkOutline} />
            <span>ClickShield</span>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="home-content">
        <div className="home-cyber-card">
          <div className="home-cyber-square">
            <IonIcon icon={analyticsOutline} />
          </div>
          <p className="home-cyber-label">CYBER ASSIST</p>
        </div>

        <h1 className="home-headline">Ready to Protect</h1>
        <p className="home-subtitle">
          Your digital environment is currently unmonitored. Scan a message, link, or QR code to
          begin.
        </p>

        <button className="home-scan-button" onClick={handleStartScan}>
          <IonIcon icon={scanOutline} />
          <span>Start First Scan</span>
        </button>
        <p className="home-scan-supporting-text">
          Scan for phishing, malware, and social engineering risks.
        </p>

        <div className="home-feature-grid">
          <div className="home-feature-card">
            <IonIcon icon={shieldOutline} />
            <p className="home-feature-title">Privacy First</p>
            <p className="home-feature-description">Data is processed</p>
          </div>
          <div className="home-feature-card">
            <IonIcon icon={sparklesOutline} />
            <p className="home-feature-title">AI Guard</p>
            <p className="home-feature-description">Real-time threat</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Home;
