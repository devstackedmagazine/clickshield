import { IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonToolbar } from '@ionic/react';
import {
  chatbubbleOutline,
  chevronForward,
  cloudOfflineOutline,
  lockClosedOutline,
  peopleOutline,
  rocketOutline,
  search,
  shieldOutline,
  warningOutline,
} from 'ionicons/icons';
import './Learn.css';

interface CategoryCard {
  key: string;
  variant: 'primary' | 'danger' | 'safe';
  icon: string;
  label: string;
}

const CATEGORIES: CategoryCard[] = [
  { key: 'getting-started', variant: 'primary', icon: rocketOutline, label: 'Getting Started' },
  { key: 'common-scams', variant: 'danger', icon: warningOutline, label: 'Common Scams' },
  { key: 'privacy', variant: 'safe', icon: lockClosedOutline, label: 'Privacy' },
];

interface FaqRow {
  key: string;
  colorClass: 'orange' | 'blue' | 'grey' | 'purple';
  icon: string;
  question: string;
}

const FAQS: FaqRow[] = [
  {
    key: 'report-text',
    colorClass: 'orange',
    icon: chatbubbleOutline,
    question: 'How do I report a suspicious text message?',
  },
  {
    key: 'scam-types',
    colorClass: 'blue',
    icon: shieldOutline,
    question: 'What types of scams can ClickShield detect?',
  },
  {
    key: 'offline-mode',
    colorClass: 'grey',
    icon: cloudOfflineOutline,
    question: 'How does offline mode work?',
  },
  {
    key: 'parental-controls',
    colorClass: 'purple',
    icon: peopleOutline,
    question: 'How do I set up parental controls?',
  },
];

function Learn() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="learn-header-dark">
          <div className="learn-header-left">
            <IonIcon icon={shieldOutline} />
            <span>ClickShield</span>
          </div>
          <button
            slot="end"
            className="learn-header-search-button"
            onClick={() => console.log('Search icon tapped')}
          >
            <IonIcon icon={search} />
          </button>
        </IonToolbar>
      </IonHeader>
      <IonContent className="learn-content">
        <h1 className="learn-page-title">Support Center</h1>
        <p className="learn-page-subtitle">How can we protect your digital world today?</p>

        <IonSearchbar
          className="learn-searchbar"
          placeholder="Search for help articles, scams..."
          onIonInput={(e) => console.log('Search input:', e.detail.value)}
        />

        <div className="learn-category-grid">
          {CATEGORIES.map((category) => (
            <div
              key={category.key}
              className={`learn-category-card ${category.variant}`}
              onClick={() => console.log(`${category.label} category tapped`)}
            >
              <div className="learn-category-icon-circle">
                <IonIcon icon={category.icon} />
              </div>
              <p className="learn-category-label">{category.label}</p>
            </div>
          ))}
        </div>

        <h2 className="learn-faq-heading">Popular Questions</h2>
        {FAQS.map((faq) => (
          <div
            key={faq.key}
            className="learn-faq-row"
            onClick={() => console.log(`FAQ tapped: ${faq.question}`)}
          >
            <div className={`learn-faq-icon-circle ${faq.colorClass}`}>
              <IonIcon icon={faq.icon} />
            </div>
            <p className="learn-faq-question">{faq.question}</p>
            <IonIcon icon={chevronForward} />
          </div>
        ))}
      </IonContent>
    </IonPage>
  );
}

export default Learn;
