import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonAlert,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToggle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { backspaceOutline, close, fingerPrintOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import {
  GUARDIAN_BIOMETRIC_KEY,
  GUARDIAN_ENABLED_KEY,
  GUARDIAN_PIN_HASH_KEY,
  GUARDIAN_PIN_SESSION_KEY,
} from '../../types/guardian';
import './ParentPinSetup.css';

const PIN_LENGTH = 4;
const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const STEP_ADVANCE_DELAY_MS = 300;
const NAVIGATE_AFTER_SUCCESS_DELAY_MS = 800;

type Step = 0 | 1 | 2;

function getStoredBiometric(): boolean {
  return localStorage.getItem(GUARDIAN_BIOMETRIC_KEY) === 'true';
}

function hasExistingPin(): boolean {
  return localStorage.getItem(GUARDIAN_PIN_HASH_KEY) !== null;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface PinDotsProps {
  length: number;
}

function PinDots({ length }: PinDotsProps) {
  return (
    <div className="pin-dots">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`pin-dot ${i < length ? 'filled' : ''}`} />
      ))}
    </div>
  );
}

function ParentPinSetup() {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [step, setStep] = useState<Step>(() => (hasExistingPin() ? 0 : 1));
  const [currentPin, setCurrentPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(getStoredBiometric);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  const showToast = (message: string, color: string) => {
    return presentToast({ message, duration: 2000, position: 'top', color });
  };

  // Step 0 — verify the existing PIN before allowing a change.
  useEffect(() => {
    if (step !== 0 || currentPin.length !== PIN_LENGTH) return;

    let cancelled = false;
    (async () => {
      setIsProcessing(true);
      const hashHex = await hashPin(currentPin);
      const storedHash = localStorage.getItem(GUARDIAN_PIN_HASH_KEY);
      if (cancelled) return;

      if (hashHex === storedHash) {
        setCurrentPin('');
        setStep(1);
        await showToast('Identity verified ✓', 'success');
      } else {
        await showToast('Incorrect PIN. Try again.', 'danger');
        setCurrentPin('');
      }
      setIsProcessing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [step, currentPin]);

  // Step 1 — advance to confirmation once 4 digits are entered.
  useEffect(() => {
    if (step !== 1 || pin.length !== PIN_LENGTH) return;
    const timer = setTimeout(() => setStep(2), STEP_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step, pin]);

  // Step 2 — confirm once 4 digits are entered.
  useEffect(() => {
    if (step !== 2 || confirmPin.length !== PIN_LENGTH) return;

    let cancelled = false;
    (async () => {
      setIsProcessing(true);

      if (confirmPin !== pin) {
        await showToast('PINs do not match. Please try again.', 'danger');
        if (cancelled) return;
        setPin('');
        setConfirmPin('');
        setStep(1);
        setIsProcessing(false);
        return;
      }

      try {
        const hashHex = await hashPin(pin);
        localStorage.setItem(GUARDIAN_PIN_HASH_KEY, hashHex);
        sessionStorage.setItem(GUARDIAN_PIN_SESSION_KEY, pin);
        localStorage.setItem(GUARDIAN_ENABLED_KEY, 'true');
        localStorage.setItem(GUARDIAN_BIOMETRIC_KEY, String(biometricEnabled));

        await showToast('Guardian PIN created successfully! ✓', 'success');
        if (cancelled) return;

        setTimeout(() => {
          history.push('/parent-mode');
        }, NAVIGATE_AFTER_SUCCESS_DELAY_MS);
      } catch (error) {
        console.error('PIN setup error:', error);
        await showToast('Something went wrong. Please try again.', 'danger');
        if (cancelled) return;
        setPin('');
        setConfirmPin('');
        setStep(1);
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, confirmPin]);

  const activePin = step === 0 ? currentPin : step === 1 ? pin : confirmPin;
  const setActivePin = step === 0 ? setCurrentPin : step === 1 ? setPin : setConfirmPin;

  const handleDigitTap = (digit: string) => {
    if (isProcessing) return;
    setActivePin((prev) => (prev.length < PIN_LENGTH ? prev + digit : prev));
  };

  const handleBackspace = () => {
    if (isProcessing) return;
    setActivePin((prev) => prev.slice(0, -1));
  };

  const handleFingerprintTap = () => {
    console.log('Fingerprint authentication requested (Capacitor Biometrics not available)');
  };

  const handleBiometricToggle = (checked: boolean) => {
    setBiometricEnabled(checked);
    localStorage.setItem(GUARDIAN_BIOMETRIC_KEY, String(checked));
  };

  const handleChangePinLink = () => {
    setPin('');
    setConfirmPin('');
    setStep(1);
  };

  const handleCloseTap = () => {
    if (step === 2) {
      setPin('');
      setConfirmPin('');
      setStep(1);
      return;
    }
    setShowCancelAlert(true);
  };

  const handleCancelConfirm = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.push('/tabs/settings');
    }
  };

  const stepIndicatorLabel =
    step === 0 ? 'VERIFY IDENTITY' : step === 1 ? 'STEP 1 OF 2 — CREATE NEW PIN' : 'STEP 2 OF 2 — CONFIRM NEW PIN';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="pin-setup-header-dark">
          <span className="pin-setup-header-title" style={{ display: 'block', textAlign: 'center' }}>
            Parent PIN Setup
          </span>
        </IonToolbar>
      </IonHeader>
      <IonContent className="pin-setup-content">
        <div className="pin-setup-logo-card">
          <button className="pin-setup-close-button" onClick={handleCloseTap}>
            <IonIcon icon={close} />
          </button>
          <IonIcon icon={shieldCheckmarkOutline} />
          <span>ClickShield</span>
        </div>

        <p className="pin-setup-step-indicator">{stepIndicatorLabel}</p>

        {step === 0 && (
          <>
            <h1 className="pin-setup-heading">Enter Current PIN</h1>
            <p className="pin-setup-subtitle">Verify your identity before changing your PIN.</p>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="pin-setup-heading">Create Parent PIN</h1>
            <p className="pin-setup-subtitle">
              This PIN will be required to manage security settings. It is separate from your
              device or History PIN.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="pin-setup-heading">Confirm Parent PIN</h1>
            <p className="pin-setup-subtitle">Re-enter your PIN to confirm.</p>
          </>
        )}

        <PinDots length={activePin.length} />

        {isProcessing && (
          <IonSpinner name="crescent" color="primary" className="pin-setup-spinner" />
        )}

        <div className={`pin-setup-keypad ${isProcessing ? 'disabled' : ''}`}>
          {KEYPAD_DIGITS.map((digit) => (
            <button key={digit} className="pin-setup-key" onClick={() => handleDigitTap(digit)}>
              {digit}
            </button>
          ))}
          <button className="pin-setup-key fingerprint" onClick={handleFingerprintTap}>
            <IonIcon icon={fingerPrintOutline} />
          </button>
          <button className="pin-setup-key" onClick={() => handleDigitTap('0')}>
            0
          </button>
          <button className="pin-setup-key backspace" onClick={handleBackspace}>
            <IonIcon icon={backspaceOutline} />
          </button>
        </div>

        {step === 2 && (
          <button className="pin-setup-change-pin-link" onClick={handleChangePinLink}>
            ← Change PIN
          </button>
        )}

        <div className="pin-setup-biometric-row">
          <IonIcon icon={fingerPrintOutline} />
          <span>Enable Biometric Unlock</span>
          <IonToggle
            checked={biometricEnabled}
            onIonChange={(e) => handleBiometricToggle(e.detail.checked)}
            color="primary"
          />
        </div>
      </IonContent>

      <IonAlert
        isOpen={showCancelAlert}
        onDidDismiss={() => setShowCancelAlert(false)}
        header="Cancel PIN Setup?"
        message="Guardian Controls will remain disabled until a PIN is set."
        buttons={[
          { text: 'Continue Setup', role: 'cancel' },
          {
            text: 'Cancel',
            role: 'destructive',
            handler: handleCancelConfirm,
          },
        ]}
      />
    </IonPage>
  );
}

export default ParentPinSetup;
