import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { cameraOutline, chevronBack, imageOutline } from 'ionicons/icons';
import './Scan.css';

function Scan() {
  const history = useHistory();
  const [text, setText] = useState('');

  const handleCamera = () => {
    console.log('camera capture requested');
  };

  const handleUpload = () => {
    console.log('gallery upload requested');
  };

  const handleAnalyze = () => {
    history.push('/result');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <button
              aria-label="Back"
              onClick={() => history.goBack()}
              style={{ background: 'none', border: 'none', padding: '0 8px' }}
            >
              <IonIcon icon={chevronBack} style={{ fontSize: '22px', color: 'var(--color-text-primary)' }} />
            </button>
          </IonButtons>
          <IonTitle>Analyze Content</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="scan-input-grid">
          <div className="scan-input-card" onClick={handleCamera}>
            <IonIcon icon={cameraOutline} />
            <span>Camera</span>
          </div>
          <div className="scan-input-card" onClick={handleUpload}>
            <IonIcon icon={imageOutline} />
            <span>Upload</span>
          </div>
        </div>

        <IonTextarea
          className="scan-textarea"
          placeholder="Or paste text here…"
          value={text}
          onIonInput={(e) => setText(e.detail.value ?? '')}
        />

        <button
          className="scan-analyze-button"
          disabled={text.trim().length === 0}
          onClick={handleAnalyze}
        >
          ANALYZE
        </button>
      </IonContent>
    </IonPage>
  );
}

export default Scan;
