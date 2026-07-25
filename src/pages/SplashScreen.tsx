import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { shieldCheckmark } from 'ionicons/icons';
import './SplashScreen.css';

const LAUNCHED_KEY = 'clickshield_launched';
const SPLASH_DURATION_MS = 2000;

function SplashScreen() {
  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasLaunchedBefore = localStorage.getItem(LAUNCHED_KEY) === 'true';
      localStorage.setItem(LAUNCHED_KEY, 'true');
      history.replace(hasLaunchedBefore ? '/tabs/home' : '/onboarding');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [history]);

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div className="splash-screen">
          <div className="splash-logo-card">
            <IonIcon icon={shieldCheckmark} />
            <p className="splash-logo-card-name">ClickShield</p>
            <p className="splash-logo-card-tagline">Trusted AI Protection</p>
          </div>

          <div className="splash-brand">
            <p className="splash-brand-name">ClickShield</p>
            <p className="splash-brand-tagline">Trusted AI Protection</p>
          </div>

          <div className="splash-spacer" />

          <div className="splash-badge">
            <IonIcon icon={shieldCheckmark} />
            <span>PROTECTED BY AI</span>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default SplashScreen;
