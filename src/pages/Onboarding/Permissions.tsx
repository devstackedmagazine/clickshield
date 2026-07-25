import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import {
  accessibilityOutline,
  checkmarkOutline,
  informationCircleOutline,
  notificationsOutline,
  phonePortraitOutline,
  shieldOutline,
} from 'ionicons/icons';
import './Permissions.css';

function Permissions() {
  const history = useHistory();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);

  const handleContinue = () => {
    history.push('/tabs/home');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div className="permissions-header-left">
              <IonIcon icon={phonePortraitOutline} />
              <span>Permissions Setup</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="permissions-content">
        <div className="permissions-hero">
          <IonIcon className="permissions-hero-decoration left" icon={shieldOutline} />
          <div className="permissions-hero-card">
            <IonIcon icon={phonePortraitOutline} />
            <div className="permissions-hero-badge">
              <IonIcon icon={checkmarkOutline} />
            </div>
          </div>
          <IonIcon className="permissions-hero-decoration right" icon={shieldOutline} />
        </div>

        <h1 className="permissions-heading">Permission Setup</h1>
        <p className="permissions-subtitle">
          To keep you protected, ClickShield needs access to these system features.
        </p>

        <IonList lines="none">
          <div className="permissions-row">
            <div className="permissions-row-icon blue">
              <IonIcon icon={notificationsOutline} />
            </div>
            <div className="permissions-row-text">
              <p className="permissions-row-title">Notifications</p>
              <p className="permissions-row-description">
                Receive instant alerts when we detect a suspicious link or message.
              </p>
            </div>
            <IonToggle
              checked={notificationsEnabled}
              onIonChange={(e) => setNotificationsEnabled(e.detail.checked)}
              color="primary"
            />
          </div>

          <div className="permissions-row">
            <div className="permissions-row-icon grey">
              <IonIcon icon={accessibilityOutline} />
            </div>
            <div className="permissions-row-text">
              <p className="permissions-row-title">Accessibility</p>
              <p className="permissions-row-description">
                Allows ClickShield to scan messages in real-time to identify potential scams
                before you open them.
              </p>
            </div>
            <IonToggle
              checked={accessibilityEnabled}
              onIonChange={(e) => setAccessibilityEnabled(e.detail.checked)}
              color="primary"
            />
          </div>
        </IonList>

        <div className="permissions-privacy-note">
          <IonIcon icon={informationCircleOutline} />
          <span>Your data is encrypted and never shared.</span>
        </div>
      </IonContent>

      <div className="permissions-continue-wrapper">
        <button className="permissions-continue-button" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </IonPage>
  );
}

export default Permissions;
