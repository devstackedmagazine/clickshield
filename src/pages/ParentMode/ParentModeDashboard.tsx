import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonAlert,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonToggle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  addCircleOutline,
  banOutline,
  chevronBack,
  chevronForward,
  cloudDownloadOutline,
  cloudUploadOutline,
  informationCircleOutline,
  keyOutline,
  listOutline,
  peopleOutline,
  shieldOutline,
} from 'ionicons/icons';
import AddWebsiteModal from '../../components/ParentMode/AddWebsiteModal';
import {
  GUARDIAN_ENABLED_KEY,
  getGuardianBlocklist,
  getGuardianEnabled,
  hasGuardianPin,
} from '../../types/guardian';
import type { BlockedEntry } from '../../types/guardian';
import './ParentModeDashboard.css';

function ParentModeDashboard() {
  const history = useHistory();

  const [guardianEnabled, setGuardianEnabled] = useState(getGuardianEnabled);
  const [blocklist, setBlocklist] = useState<BlockedEntry[]>(getGuardianBlocklist);
  const [showDisableAlert, setShowDisableAlert] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useIonViewWillEnter(() => {
    setGuardianEnabled(getGuardianEnabled());
    setBlocklist(getGuardianBlocklist());
  });

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      setGuardianEnabled(true);
      localStorage.setItem(GUARDIAN_ENABLED_KEY, 'true');
      if (!hasGuardianPin()) {
        history.push('/parent-pin-setup');
      }
    } else {
      setShowDisableAlert(true);
    }
  };

  const confirmDisable = () => {
    setGuardianEnabled(false);
    localStorage.setItem(GUARDIAN_ENABLED_KEY, 'false');
  };

  const handleWebsiteAdded = (entry: BlockedEntry) => {
    setBlocklist((prev) => [...prev, entry]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="parent-mode-header-dark">
          <button
            slot="start"
            className="parent-mode-back-button"
            onClick={() => history.push('/tabs/settings')}
          >
            <IonIcon icon={chevronBack} />
          </button>
          <span className="parent-mode-header-title" style={{ display: 'block', textAlign: 'center' }}>
            Parent Mode
          </span>
        </IonToolbar>
      </IonHeader>
      <IonContent className="parent-mode-content">
        <div className="parent-mode-hero-card">
          <h1 className="parent-mode-hero-heading">Stay Protected</h1>
          <p className="parent-mode-hero-subtitle">
            Parent Mode ensures your loved ones are shielded from malicious websites and
            inappropriate content automatically.
          </p>

          <div className="parent-mode-illustration">
            <IonIcon icon={peopleOutline} />
          </div>

          <div className="parent-mode-divider" />

          <div className="parent-mode-enable-row">
            <div>
              <p className="parent-mode-enable-title">Enable Protection</p>
              <p className="parent-mode-enable-description">
                Restrict access to specific categories
              </p>
            </div>
            <IonToggle
              checked={guardianEnabled}
              onIonChange={(e) => handleToggleChange(e.detail.checked)}
              color="primary"
            />
          </div>
        </div>

        <div className="parent-mode-stats-grid">
          <div className="parent-mode-stat-card">
            <div className="parent-mode-stat-header">
              <IonIcon icon={shieldOutline} style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
              <span>STATUS</span>
            </div>
            <p className={`parent-mode-stat-value ${guardianEnabled ? 'active' : 'disabled'}`}>
              {guardianEnabled ? 'Active' : 'Disabled'}
            </p>
          </div>
          <div className="parent-mode-stat-card">
            <div className="parent-mode-stat-header">
              <IonIcon icon={banOutline} style={{ color: 'var(--color-danger)', fontSize: '20px' }} />
              <span>BLOCKED</span>
            </div>
            <p className="parent-mode-stat-value blocked-count">{blocklist.length}</p>
          </div>
        </div>

        <p className="parent-mode-section-label">QUICK ACTIONS</p>
        <div className="parent-mode-actions-card">
          <div
            className="parent-mode-action-row"
            onClick={() => history.push('/parent-blocklist')}
          >
            <div className="parent-mode-action-icon-circle blue">
              <IonIcon icon={listOutline} />
            </div>
            <div className="parent-mode-action-text">
              <p className="parent-mode-action-title">Manage Blocklist</p>
              <p className="parent-mode-action-subtitle">View and edit restricted sites</p>
            </div>
            <IonIcon icon={chevronForward} />
          </div>

          <div className="parent-mode-action-row" onClick={() => setShowAddModal(true)}>
            <div className="parent-mode-action-icon-circle blue">
              <IonIcon icon={addCircleOutline} />
            </div>
            <div className="parent-mode-action-text">
              <p className="parent-mode-action-title">Add Website</p>
              <p className="parent-mode-action-subtitle">Manually block a new URL</p>
            </div>
            <IonIcon icon={chevronForward} />
          </div>

          <div
            className="parent-mode-action-row"
            onClick={() => history.push('/parent-pin-setup')}
          >
            <div className="parent-mode-action-icon-circle amber">
              <IonIcon icon={keyOutline} />
            </div>
            <div className="parent-mode-action-text">
              <p className="parent-mode-action-title">Change Parent PIN</p>
              <p className="parent-mode-action-subtitle">Update security credentials</p>
            </div>
            <IonIcon icon={chevronForward} />
          </div>
        </div>

        <div className="parent-mode-import-export-grid">
          <button
            className="parent-mode-outline-button"
            onClick={() => console.log('Import blocklist')}
          >
            <IonIcon icon={cloudUploadOutline} />
            Import
          </button>
          <button
            className="parent-mode-outline-button"
            onClick={() => console.log('Export blocklist')}
          >
            <IonIcon icon={cloudDownloadOutline} />
            Export
          </button>
        </div>

        <div className="parent-mode-info-banner">
          <IonIcon icon={informationCircleOutline} />
          <span>
            ClickShield uses real-time AI to analyze websites before they load. Guardian Mode
            adds an extra layer of human control to ensure family-safe browsing.
          </span>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showDisableAlert}
        onDidDismiss={() => setShowDisableAlert(false)}
        header="Disable Protection?"
        message="This will pause all Guardian Controls."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Disable', role: 'destructive', handler: confirmDisable },
        ]}
      />

      <AddWebsiteModal
        isOpen={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onAdded={handleWebsiteAdded}
      />
    </IonPage>
  );
}

export default ParentModeDashboard;
