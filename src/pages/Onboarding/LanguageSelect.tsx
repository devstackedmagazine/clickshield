import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from '@ionic/react';
import { checkmarkOutline, chevronBack, languageOutline } from 'ionicons/icons';
import heroImage from '../../assets/hero.png';
import './LanguageSelect.css';

interface LanguageSelectLocationState {
  fromSettings?: boolean;
}

interface LanguageOption {
  code: string;
  flag: string;
  name: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'sq', flag: '🇦🇱', name: 'Albanian' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'tr', flag: '🇹🇷', name: 'Turkish' },
  { code: 'sr', flag: '🇷🇸', name: 'Serbian' },
  { code: 'mk', flag: '🇲🇰', name: 'Macedonian' },
  { code: 'de', flag: '🇩🇪', name: 'German' },
  { code: 'it', flag: '🇮🇹', name: 'Italian' },
  { code: 'fr', flag: '🇫🇷', name: 'French' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
  { code: 'ro', flag: '🇷🇴', name: 'Romanian' },
];

const DEFAULT_LANGUAGE_CODE = 'sq';

function LanguageSelect() {
  const history = useHistory();
  const location = useLocation<LanguageSelectLocationState | undefined>();
  const fromSettings = location.state?.fromSettings ?? false;

  const [selectedCode, setSelectedCode] = useState(DEFAULT_LANGUAGE_CODE);

  const handleConfirm = () => {
    localStorage.setItem('setting_language', selectedCode);
    if (fromSettings) {
      history.push('/tabs/settings');
    } else {
      history.push('/onboarding/permissions');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="language-select-header-dark">
          <div className="language-select-header-left">
            {fromSettings && (
              <button className="language-select-back-button" onClick={() => history.goBack()}>
                <IonIcon icon={chevronBack} />
              </button>
            )}
            <IonIcon icon={languageOutline} />
            <span>Select Language</span>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="language-select-content">
        <div className="language-select-hero">
          <img src={heroImage} alt="" />
        </div>

        <div className="language-select-heading-block">
          <h1 className="language-select-heading">Select Language</h1>
          <p className="language-select-subtitle">
            Choose your preferred language to begin your secure journey.
          </p>
        </div>

        <div className="language-select-list">
          {LANGUAGES.map((language) => {
            const isSelected = language.code === selectedCode;
            return (
              <div
                key={language.code}
                className={`language-select-row ${isSelected ? 'selected' : ''}`}
                dir={language.code === 'ar' ? 'rtl' : undefined}
                onClick={() => setSelectedCode(language.code)}
              >
                <span className="language-select-flag">{language.flag}</span>
                <span className="language-select-name">{language.name}</span>
                {isSelected && <IonIcon icon={checkmarkOutline} />}
              </div>
            );
          })}
        </div>
      </IonContent>

      <div className="language-select-confirm-wrapper">
        <button className="language-select-confirm-button" onClick={handleConfirm}>
          Confirm
        </button>
      </div>
    </IonPage>
  );
}

export default LanguageSelect;
