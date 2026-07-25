import { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { arrowForward, eyeOffOutline, peopleOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import heroImage from '../../assets/hero.png';
import './Welcome.css';

const FEATURES = [
  {
    icon: shieldCheckmarkOutline,
    title: 'AI Security',
    description: 'Real-time detection of suspicious links and messages.',
  },
  {
    icon: peopleOutline,
    title: 'Family Safety',
    description: 'Shared protection for parents, kids, and grandparents.',
  },
  {
    icon: eyeOffOutline,
    title: 'Privacy First',
    description: 'Your data remains encrypted and locally processed.',
  },
];

function Welcome() {
  const history = useHistory();
  const featuresRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    history.push('/onboarding/language');
  };

  const handleLearnMore = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFooterLink = (link: string) => {
    console.log(`${link} link tapped`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="welcome-title">🛡️ ClickShield</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="welcome-content">
        <div className="welcome-hero">
          <img src={heroImage} alt="ClickShield protection" />
          <div className="welcome-hero-badge">
            <span className="welcome-hero-badge-dot" />
            <span>ACTIVE PROTECTION</span>
          </div>
        </div>

        <h1 className="welcome-headline">Your Digital Guardian</h1>
        <p className="welcome-subtitle">
          Protecting you and your loved ones from scams with friendly AI that watches over every
          interaction.
        </p>

        <button className="welcome-button-primary" onClick={handleGetStarted}>
          Get Started
          <IonIcon icon={arrowForward} />
        </button>
        <button className="welcome-button-outline" onClick={handleLearnMore}>
          Learn More
        </button>

        <div ref={featuresRef}>
          {FEATURES.map((feature) => (
            <div className="welcome-feature-card" key={feature.title}>
              <IonIcon icon={feature.icon} />
              <div>
                <p className="welcome-feature-title">{feature.title}</p>
                <p className="welcome-feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="welcome-footer">
          <p className="welcome-footer-copyright">© 2025 ClickShield. All rights reserved.</p>
          <div className="welcome-footer-links">
            <button onClick={() => handleFooterLink('Privacy')}>Privacy</button>
            <button onClick={() => handleFooterLink('Terms')}>Terms</button>
            <button onClick={() => handleFooterLink('Support')}>Support</button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Welcome;
