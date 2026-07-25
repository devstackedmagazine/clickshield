import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonAlert,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  alertCircle,
  cameraOutline,
  chatbubbleOutline,
  checkmarkCircle,
  chevronBack,
  chevronDown,
  chevronUp,
  clipboardOutline,
  imageOutline,
  linkOutline,
} from 'ionicons/icons';
import { findGuardianBlockMatch } from '../services/analysis/scanService';
import type { ScanInput } from '../types/analysis';
import './Scan.css';

interface ScanLocationState {
  prefillText?: string;
  prefillImage?: string;
}

type ScanTab = 'camera' | 'upload' | 'link';

const URL_REGEX = /https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function extractFirstUrl(text: string): string | null {
  const matches = text.match(URL_REGEX);
  return matches ? matches[0] : null;
}

function isLikelyValidUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value.trim());
}

function Scan() {
  const history = useHistory();
  const location = useLocation<ScanLocationState | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ScanTab>('upload');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [linkFocused, setLinkFocused] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textExpanded, setTextExpanded] = useState(false);
  const [pastedFromClipboard, setPastedFromClipboard] = useState(false);
  const [showCameraPermissionAlert, setShowCameraPermissionAlert] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'danger' | 'medium' } | null>(null);

  useEffect(() => {
    if (location.state?.prefillText) {
      setTextInput(location.state.prefillText);
      setTextExpanded(true);
      setPastedFromClipboard(true);
    }
    if (location.state?.prefillImage) {
      setCapturedImage(location.state.prefillImage);
      setActiveTab('upload');
    }
  }, [location.state]);

  const handleOpenCamera = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        promptLabelHeader: 'Scan suspicious content',
        promptLabelPhoto: 'Take photo',
        promptLabelPicture: 'Choose from gallery',
      });
      setCapturedImage(`data:image/jpeg;base64,${photo.base64String}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/denied|permission/i.test(message)) {
        setShowCameraPermissionAlert(true);
      }
      // A plain user cancellation throws too — no image, no error surfaced.
    }
  };

  const handleChooseFile = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
        });
        setCapturedImage(`data:image/jpeg;base64,${photo.base64String}`);
      } catch {
        // User cancelled the picker — nothing to do.
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setToast({ message: 'Image too large. Max 10MB.', color: 'danger' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCapturedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLinkInput(text);
    } catch {
      setToast({ message: 'Clipboard access denied', color: 'medium' });
    }
  };

  const linkValidation = useMemo(() => {
    if (linkInput.trim().length < 3) return null;
    return isLikelyValidUrl(linkInput) ? 'valid' : 'invalid';
  }, [linkInput]);

  const isAnalyzeEnabled =
    capturedImage !== null || linkInput.trim().length > 0 || textInput.trim().length > 0;

  const handleAnalyze = () => {
    if (!isAnalyzeEnabled) return;

    const urlToCheck = linkInput.trim() || extractFirstUrl(textInput);
    if (urlToCheck) {
      const blockMatch = findGuardianBlockMatch(urlToCheck);
      if (blockMatch) {
        history.push('/link-blocked', blockMatch);
        return;
      }
    }

    let scanInput: ScanInput;
    if (capturedImage) {
      scanInput = { type: 'screenshot', base64: capturedImage };
    } else if (linkInput.trim()) {
      scanInput = { type: 'url', value: linkInput.trim() };
    } else {
      scanInput = { type: 'text', value: textInput.trim() };
    }

    history.push('/result', { scanInput });

    setCapturedImage(null);
    setLinkInput('');
    setTextInput('');
    setPastedFromClipboard(false);
  };

  const renderPreview = () => (
    <div className="scan-preview-wrapper">
      <img className="scan-preview-image" src={capturedImage!} alt="Captured content" />
      <button className="scan-retake-button" onClick={() => setCapturedImage(null)}>
        Retake
      </button>
      <div className="scan-ready-badge">
        <IonIcon icon={checkmarkCircle} />
        <span>Image ready</span>
      </div>
    </div>
  );

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
        <div className="scan-tab-selector">
          <button
            className={`scan-tab-button ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            <IonIcon icon={cameraOutline} />
            Camera
          </button>
          <button
            className={`scan-tab-button ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <IonIcon icon={imageOutline} />
            Upload
          </button>
          <button
            className={`scan-tab-button ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <IonIcon icon={linkOutline} />
            Link
          </button>
        </div>

        {activeTab === 'camera' &&
          (capturedImage ? (
            <div className="scan-capture-card">{renderPreview()}</div>
          ) : (
            <div className="scan-capture-card">
              <IonIcon className="scan-capture-icon" icon={cameraOutline} />
              <p className="scan-capture-title">Point camera at suspicious content</p>
              <p className="scan-capture-subtitle">Screenshots, messages, documents</p>
              <button className="scan-capture-button" onClick={handleOpenCamera}>
                Open Camera
              </button>
            </div>
          ))}

        {activeTab === 'upload' &&
          (capturedImage ? (
            <div className="scan-capture-card">{renderPreview()}</div>
          ) : (
            <div className="scan-capture-card dropzone">
              <IonIcon className="scan-capture-icon" icon={imageOutline} />
              <p className="scan-capture-title">Upload a screenshot</p>
              <p className="scan-capture-subtitle">JPG, PNG up to 10MB</p>
              <button className="scan-capture-button outline" onClick={handleChooseFile}>
                Choose File
              </button>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          ))}

        {activeTab === 'link' && (
          <div className="scan-link-card">
            <div className={`scan-link-input-row ${linkFocused ? 'focused' : ''}`}>
              <IonInput
                label="Paste a suspicious link"
                labelPlacement="stacked"
                placeholder="https://..."
                type="url"
                inputmode="url"
                clearInput
                value={linkInput}
                onIonFocus={() => setLinkFocused(true)}
                onIonBlur={() => setLinkFocused(false)}
                onIonInput={(e) => setLinkInput(e.detail.value ?? '')}
              />
              {linkValidation === 'valid' && <IonIcon className="valid" icon={checkmarkCircle} />}
              {linkValidation === 'invalid' && <IonIcon className="invalid" icon={alertCircle} />}
            </div>
            {linkValidation === 'invalid' && (
              <p className="scan-link-hint">Add https:// at the start</p>
            )}

            <div className="scan-chip-row">
              <button className="scan-chip" onClick={handlePasteFromClipboard}>
                🔗 Paste from clipboard
              </button>
              <button
                className="scan-chip"
                onClick={() => setLinkInput('http://bkt-albania-secure.com/verify')}
              >
                🏦 Test: bank scam
              </button>
              <button className="scan-chip" onClick={() => setLinkInput('https://zara.com/order/123456')}>
                ✅ Test: safe link
              </button>
            </div>
          </div>
        )}

        <div className="scan-text-section">
          <div className="scan-text-header" onClick={() => setTextExpanded((prev) => !prev)}>
            <IonIcon icon={chatbubbleOutline} />
            <span>Or paste message text</span>
            <IonIcon icon={textExpanded ? chevronUp : chevronDown} />
          </div>
          {textExpanded && (
            <div className="scan-text-body">
              {pastedFromClipboard && (
                <div className="scan-paste-chip">
                  <IonIcon icon={clipboardOutline} />
                  <span>Pasted from clipboard</span>
                </div>
              )}
              <IonTextarea
                className="scan-textarea"
                placeholder="Paste suspicious SMS, email, WhatsApp message..."
                autoGrow
                value={textInput}
                onIonInput={(e) => setTextInput(e.detail.value ?? '')}
              />
              {textInput.length > 0 && (
                <p className="scan-char-count">{textInput.length} characters</p>
              )}
            </div>
          )}
        </div>

        <button
          className="scan-analyze-button"
          disabled={!isAnalyzeEnabled}
          onClick={handleAnalyze}
        >
          ANALYZE
        </button>
      </IonContent>

      <IonAlert
        isOpen={showCameraPermissionAlert}
        onDidDismiss={() => setShowCameraPermissionAlert(false)}
        header="Camera Access Needed"
        message="ClickShield needs camera access to scan suspicious content. Please enable it in Settings."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Open Settings',
            handler: () => console.log('Open native settings (deep-link added post-hackathon)'),
          },
        ]}
      />

      <IonToast
        isOpen={toast !== null}
        message={toast?.message}
        duration={2000}
        color={toast?.color}
        onDidDismiss={() => setToast(null)}
      />
    </IonPage>
  );
}

export default Scan;
