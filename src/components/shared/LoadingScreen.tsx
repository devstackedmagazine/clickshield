import { IonIcon, IonProgressBar } from '@ionic/react';
import { pulseOutline, scanOutline, shieldCheckmark, shieldCheckmarkOutline, syncOutline } from 'ionicons/icons';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  progress: number;
  statusText?: string;
  layerText?: string;
  isVisible: boolean;
}

const DEFAULT_STATUS_TEXT = 'Cross-referencing databases...';
const DEFAULT_LAYER_TEXT =
  'Scanning metadata for hidden executable markers and suspicious redirect chains.';

function LoadingScreen({
  progress,
  statusText = DEFAULT_STATUS_TEXT,
  layerText = DEFAULT_LAYER_TEXT,
  isVisible,
}: LoadingScreenProps) {
  if (!isVisible) {
    return null;
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="loading-screen">
      <div className="loading-screen-header">
        <div className="loading-screen-header-left">
          <IonIcon icon={scanOutline} />
          <span>AI Scan in Progress</span>
        </div>
        <div className="loading-screen-avatar" />
      </div>

      <div className="loading-screen-body">
        <div className="loading-screen-card">
          <div className="loading-screen-brand">
            <IonIcon icon={shieldCheckmarkOutline} />
            <span>ClickShield</span>
          </div>
          <p className="loading-screen-title">AI Scan in Progress</p>
          <p className="loading-screen-subtitle">Protecting your digital environment</p>

          <div className="loading-screen-cyber-assist">
            <IonIcon icon={pulseOutline} />
          </div>
          <p className="loading-screen-cyber-assist-label">CYBER ASSIST</p>

          <IonIcon className="loading-screen-sync-icon" icon={syncOutline} />
          <p className="loading-screen-status-text">{statusText}</p>
        </div>

        <div className="loading-screen-security-card">
          <div className="loading-screen-security-header">
            <IonIcon icon={shieldCheckmark} />
            <span>SECURITY LAYER 1</span>
          </div>
          <p className="loading-screen-security-description">{layerText}</p>
        </div>
      </div>

      <div className="loading-screen-bottom-strip">
        <div className="loading-screen-bottom-strip-labels">
          <span>Threat Analysis</span>
          <span>{clampedProgress}%</span>
        </div>
        <IonProgressBar
          className="loading-screen-bottom-progress"
          value={clampedProgress / 100}
          color="primary"
        />
      </div>
    </div>
  );
}

export default LoadingScreen;
