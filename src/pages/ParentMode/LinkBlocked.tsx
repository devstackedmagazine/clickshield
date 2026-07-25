import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { chevronBack, homeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import './LinkBlocked.css';

export interface LinkBlockedLocationState {
  blockedUrl: string;
  domain: string;
}

function LinkBlocked() {
  const history = useHistory();
  const location = useLocation<LinkBlockedLocationState | undefined>();
  const domain = location.state?.domain;

  return (
    <IonPage>
      <IonContent className="link-blocked-content" scrollY={false}>
        <div className="link-blocked-wrapper">
          <div className="link-blocked-logo-card">
            <IonIcon icon={shieldCheckmarkOutline} />
            <p className="link-blocked-logo-card-name">ClickShield</p>
            <p className="link-blocked-logo-card-tagline">Trusted AI Protection</p>
          </div>

          <h1 className="link-blocked-title">This link has been blocked</h1>
          <p className="link-blocked-subtitle">This website isn't available on this device.</p>

          {domain && (
            <div className="link-blocked-domain-pill">
              <span>{domain}</span>
            </div>
          )}

          <div className="link-blocked-buttons">
            <button
              className="link-blocked-button link-blocked-button-primary"
              onClick={() => history.push('/tabs/home')}
            >
              <IonIcon icon={homeOutline} />
              Return Home
            </button>
            <button
              className="link-blocked-button link-blocked-button-secondary"
              onClick={() => history.goBack()}
            >
              <IonIcon icon={chevronBack} />
              Go Back
            </button>
          </div>
        </div>

        <div className="link-blocked-footer">
          <span className="link-blocked-footer-dot" />
          <span>CLICKSHIELD PROTECTION</span>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default LinkBlocked;
