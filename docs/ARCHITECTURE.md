# ClickShield — Architecture Document

## Project Structure

```
clickshield/
├── src/
│   ├── components/
│   │   ├── FloatingButton/
│   │   │   ├── FloatingButton.tsx
│   │   │   └── FloatingButton.css
│   │   ├── RiskScore/
│   │   │   ├── RiskScoreSimple.tsx
│   │   │   └── RiskScoreDetailed.tsx
│   │   ├── ScanInput/
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── GalleryUpload.tsx
│   │   │   └── TextPaste.tsx
│   │   ├── Report/
│   │   │   ├── ReportCard.tsx
│   │   │   ├── ThreatItem.tsx
│   │   │   └── ActionButtons.tsx
│   │   └── shared/
│   │       ├── LoadingScreen.tsx
│   │       └── ErrorScreen.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Scan.tsx
│   │   ├── Result.tsx
│   │   ├── History.tsx
│   │   ├── Settings.tsx
│   │   └── Onboarding/
│   │       ├── Welcome.tsx
│   │       ├── LanguageSelect.tsx
│   │       ├── Permissions.tsx
│   │       └── OfflineAIOffer.tsx
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── openrouter.ts        # Online AI via OpenRouter
│   │   │   ├── localModel.ts        # Offline AI via MLC LLM
│   │   │   └── fallbackRules.ts     # Rule-based offline fallback
│   │   ├── analysis/
│   │   │   ├── imageAnalysis.ts     # Screenshot → AI pipeline
│   │   │   ├── linkScanner.ts       # Google Safe Browsing
│   │   │   └── reportBuilder.ts     # Structure AI response → report
│   │   ├── storage/
│   │   │   ├── historyStore.ts      # SQLite history management
│   │   │   └── settingsStore.ts     # App settings persistence
│   │   └── native/
│   │       ├── screenshot.ts        # Capacitor screenshot plugin
│   │       ├── biometrics.ts        # Fingerprint / Face ID
│   │       └── deviceInfo.ts        # RAM check, OS version
│   │
│   ├── hooks/
│   │   ├── useAnalysis.ts
│   │   ├── useHistory.ts
│   │   ├── useSettings.ts
│   │   └── useNetworkStatus.ts
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── sq.json              # Albanian
│   │       ├── en.json              # English
│   │       ├── tr.json              # Turkish
│   │       ├── sr.json              # Serbian
│   │       ├── mk.json              # Macedonian
│   │       ├── de.json              # German
│   │       ├── it.json              # Italian
│   │       ├── fr.json              # French
│   │       ├── ar.json              # Arabic
│   │       └── ro.json              # Romanian
│   │
│   ├── offline/
│   │   └── scam-patterns.json       # Rule-based patterns (~5MB)
│   │
│   ├── types/
│   │   ├── analysis.ts
│   │   ├── report.ts
│   │   └── history.ts
│   │
│   └── utils/
│       ├── imageUtils.ts
│       ├── urlExtractor.ts
│       └── languageDetect.ts
│
├── android/                         # Capacitor Android project
├── ios/                             # Capacitor iOS project
├── public/
│   └── offline/
│       └── scam-patterns.json
│
├── capacitor.config.ts
├── vite.config.ts
├── package.json
└── .env.example
```

---

## Data Flow

### Online Analysis Flow
```
User input (screenshot / text / camera)
        ↓
imageUtils.ts → compress + base64 encode
        ↓
urlExtractor.ts → extract any URLs from image/text
        ↓
linkScanner.ts → Google Safe Browsing API check (parallel)
        ↓
openrouter.ts → send image + text + URL results to AI
        ↓
reportBuilder.ts → parse AI response → structured report object
        ↓
Result screen rendered
        ↓
historyStore.ts → save screenshot + report to SQLite
```

### Offline Analysis Flow
```
User input
        ↓
useNetworkStatus → no internet detected
        ↓
Check: local model downloaded?
  YES → localModel.ts → MLC LLM inference on device
  NO  → fallbackRules.ts → pattern match against scam-patterns.json
        ↓
reportBuilder.ts → structure result
        ↓
Result screen (with "Limited analysis - offline mode" notice)
```

---

## AI Prompt Design

### System Prompt (sent with every request)
```
You are ClickShield, a scam and phishing detection assistant.
Analyze the provided content (image, text, or both) and identify 
any signs of fraud, scams, or phishing.

Respond ONLY in valid JSON with this exact structure:
{
  "riskScore": <number 0-100>,
  "riskLevel": <"HIGH" | "MEDIUM" | "LOW">,
  "summary": <one sentence summary in the user's language>,
  "threats": [
    {
      "type": <"urgency" | "impersonation" | "payment_pressure" | "credential_theft" | "suspicious_link" | "unusual_wording">,
      "description": <explanation of the specific threat found>,
      "evidence": <the exact text or element that triggered this>
    }
  ],
  "safeNextSteps": [<action 1>, <action 2>, ...],
  "detectedLinks": [<url1>, <url2>],
  "detectedPhoneNumbers": [<number1>],
  "language": <detected language code>
}

Respond in this language: {userLanguage}
Be specific. Reference exact text from the content. Never be vague.
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/camera": "^6.0.0",
    "@capacitor/filesystem": "^6.0.0",
    "@capacitor/network": "^6.0.0",
    "@capacitor/biometrics": "^6.0.0",
    "@capacitor/device": "^6.0.0",
    "@capacitor/share": "^6.0.0",
    "@ionic/react": "^8.0.0",
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "i18next": "^23.0.0",
    "react-i18next": "^14.0.0",
    "@capacitor-community/sqlite": "^6.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Environment Variables

```env
# .env.example

# OpenRouter API (free)
VITE_OPENROUTER_API_KEY=your_key_here
VITE_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Google Safe Browsing (free)
VITE_SAFE_BROWSING_API_KEY=your_key_here

# App config
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=sq
```

---

## SQLite Schema

```sql
-- History table
CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  screenshot_path TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  summary TEXT,
  full_report TEXT,  -- JSON string
  language TEXT
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## Capacitor Config

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clickshield.app',
  appName: 'ClickShield',
  webDir: 'dist',
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
    },
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#1A56DB',
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
```

---

## Offline Scam Patterns Schema

```json
{
  "version": "1.0",
  "languages": {
    "sq": {
      "urgencyPhrases": ["vepro tani", "llogaria juaj do të bllokohet", "i fundit paralajmërim"],
      "paymentPhrases": ["dërgoni para", "transferoni", "paguani menjëherë"],
      "credentialPhrases": ["PIN kodi", "fjalëkalimi", "numri i kartës"],
      "suspiciousDomains": ["bank-al.com", "raiffeisen-al.net"]
    },
    "en": {
      "urgencyPhrases": ["act now", "your account will be closed", "final warning"],
      "paymentPhrases": ["send money", "transfer funds", "pay immediately"],
      "credentialPhrases": ["PIN code", "password", "card number"],
      "suspiciousDomains": []
    }
  }
}
```

---

## Build & Deploy

```bash
# Install dependencies
npm install

# Run web dev server
npm run dev

# Build web
npm run build

# Add Android
npx cap add android

# Add iOS  
npx cap add ios

# Sync web build to native
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios
```

---

## Security Considerations

- API keys stored in environment variables, never in client bundle for production
- All history stored locally, never on remote servers
- Screenshots processed in memory, not written to temp files unnecessarily  
- Biometric lock on history using device secure enclave
- HTTPS only for all external API calls
- No analytics or tracking SDKs in v1
- OpenRouter calls proxied through a lightweight edge function to hide API key in production
