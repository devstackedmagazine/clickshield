import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonAlert,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import {
  chevronForward,
  cloudOfflineOutline,
  codeSlashOutline,
  colorPaletteOutline,
  documentTextOutline,
  fingerPrintOutline,
  informationCircleOutline,
  languageOutline,
  moonOutline,
  scanOutline,
  settingsOutline,
  shieldOutline,
  trashOutline,
} from 'ionicons/icons';
import './Settings.css';

const APP_VERSION = '1.0.0';

type ThemeOption = 'light' | 'dark' | 'system';

function getStoredBoolean(key: string, fallback: boolean): boolean {
  const stored = localStorage.getItem(key);
  return stored === null ? fallback : stored === 'true';
}

function getStoredTheme(): ThemeOption {
  const stored = localStorage.getItem('setting_theme');
  return stored === 'dark' || stored === 'system' || stored === 'light' ? stored : 'light';
}

function applyTheme(theme: ThemeOption) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.body.classList.toggle('dark', shouldUseDark);
}

const THEME_LABEL: Record<ThemeOption, string> = {
  light: 'Light Mode',
  dark: 'Dark Mode',
  system: 'System Default',
};

function Settings() {
  const history = useHistory();
  const [biometricEnabled, setBiometricEnabled] = useState(() =>
    getStoredBoolean('setting_biometric', true),
  );
  const [offlineAiEnabled, setOfflineAiEnabled] = useState(() =>
    getStoredBoolean('setting_offline_ai', false),
  );
  const [theme, setTheme] = useState<ThemeOption>(getStoredTheme);
  const [showClearHistoryAlert, setShowClearHistoryAlert] = useState(false);

  const handleBiometricToggle = (checked: boolean) => {
    setBiometricEnabled(checked);
    localStorage.setItem('setting_biometric', String(checked));
  };

  const handleOfflineAiToggle = (checked: boolean) => {
    setOfflineAiEnabled(checked);
    localStorage.setItem('setting_offline_ai', String(checked));
  };

  const handleThemeChange = (value: ThemeOption) => {
    setTheme(value);
    localStorage.setItem('setting_theme', value);
    applyTheme(value);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="settings-header-dark">
          <div className="settings-header-dark-left">
            <IonIcon icon={settingsOutline} />
            <span>App Settings</span>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="settings-content">
        <div className="settings-title-block">
          <h1 className="settings-page-title">App Settings</h1>
          <p className="settings-page-subtitle">Customize your protection and app experience.</p>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <IonIcon icon={shieldOutline} />
            <span>SECURITY</span>
          </div>

          <div className="settings-row">
            <div className="settings-row-icon">
              <IonIcon icon={fingerPrintOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title">Biometric Lock</p>
              <p className="settings-row-description">Require FaceID or Fingerprint</p>
            </div>
            <IonToggle
              checked={biometricEnabled}
              onIonChange={(e) => handleBiometricToggle(e.detail.checked)}
              color="primary"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-icon">
              <IonIcon icon={cloudOfflineOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title">Offline AI Scanning</p>
              <p className="settings-row-description">Process data without cloud</p>
            </div>
            <IonToggle
              checked={offlineAiEnabled}
              onIonChange={(e) => handleOfflineAiToggle(e.detail.checked)}
              color="primary"
            />
          </div>
          {offlineAiEnabled && (
            <div className="settings-offline-banner">
              <IonIcon icon={informationCircleOutline} />
              <span>
                Requires 6GB+ RAM and 4GB free storage. Download model in Offline Settings.
              </span>
            </div>
          )}
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <IonIcon icon={colorPaletteOutline} />
            <span>APPEARANCE</span>
          </div>

          <div className="settings-row">
            <div className="settings-row-icon">
              <IonIcon icon={moonOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title">Theme</p>
              <p className="settings-row-description">{THEME_LABEL[theme]}</p>
            </div>
            <IonSelect
              className="settings-row-select"
              value={theme}
              interface="popover"
              onIonChange={(e) => handleThemeChange(e.detail.value as ThemeOption)}
            >
              <IonSelectOption value="light">Light</IonSelectOption>
              <IonSelectOption value="dark">Dark</IonSelectOption>
              <IonSelectOption value="system">System</IonSelectOption>
            </IonSelect>
          </div>

          <div
            className="settings-row settings-row-tappable"
            onClick={() => history.push('/onboarding/language', { fromSettings: true })}
          >
            <div className="settings-row-icon">
              <IonIcon icon={languageOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title">Language</p>
              <p className="settings-row-description">English</p>
            </div>
            <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <IonIcon icon={informationCircleOutline} />
            <span>ABOUT</span>
          </div>

          <div className="settings-row">
            <div className="settings-row-icon">
              <IonIcon icon={codeSlashOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title">Version</p>
            </div>
            <span className="settings-row-value">{APP_VERSION}</span>
          </div>

          <div
            className="settings-row settings-row-tappable"
            onClick={() => console.log('Privacy Policy tapped')}
          >
            <div className="settings-row-icon">
              <IonIcon icon={documentTextOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title">Privacy Policy</p>
            </div>
            <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-secondary)' }} />
          </div>

          <div
            className="settings-row settings-row-tappable"
            onClick={() => setShowClearHistoryAlert(true)}
          >
            <div className="settings-row-icon danger">
              <IonIcon icon={trashOutline} />
            </div>
            <div className="settings-row-text">
              <p className="settings-row-title danger">Clear History</p>
            </div>
          </div>
        </div>
      </IonContent>

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton className="settings-fab" onClick={() => history.push('/tabs/scan')}>
          <IonIcon icon={scanOutline} />
        </IonFabButton>
      </IonFab>

      <IonAlert
        isOpen={showClearHistoryAlert}
        onDidDismiss={() => setShowClearHistoryAlert(false)}
        header="Are you sure?"
        message="This will delete all scan history."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Clear All',
            role: 'destructive',
            handler: () => console.log('Clear history confirmed'),
          },
        ]}
      />
    </IonPage>
  );
}

export default Settings;
