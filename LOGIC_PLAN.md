# ClickShield Logic Implementation Plan

## Scope

Implement the application logic without changing the in-progress UI. The UI will consume typed scan state and results from a client-side service and stateless Vercel API gateway.

The MVP protects links opened or scanned through ClickShield. It does not implement system-wide Android traffic interception, a floating overlay button, a VPN, automatic message reading, or user accounts.

## MVP behavior

```text
Paste/share URL, text, or upload a user-approved screenshot, or scan a QR code
        -> local blacklist and deterministic rules (offline-capable)
        -> if offline: rule-based pattern matching against scam-patterns.json
        -> if online: AI extracts scam signals and URLs as structured JSON
        -> VirusTotal/Google Web Risk checks URLs/domains when needed
        -> ClickShield returns an explainable verdict in the user's language
        -> block page or safe-open confirmation
        -> result saved to local history (SQLite)
```

Use these verdicts, mapped explicitly to UI states:

| Verdict | UI Risk Level | UI Color | UI Header |
|---|---|---|---|
| `blocked` | HIGH | Red #E02424 | "Threat Identified" |
| `highRisk` | HIGH | Red #E02424 | "Threat Identified" |
| `caution` | MEDIUM | Amber #D97706 | "Risk Detected" |
| `noKnownRisk` | LOW | Green #057A55 | "Scan Complete" |

## 1. Define shared contracts

Create shared TypeScript types for scan inputs, signals, progress steps, results, and errors. These types are the stable boundary between the UI and the logic layer.

```ts
// Supported language codes (all 10 supported languages)
type SupportedLanguage =
  | 'sq' // Albanian (default)
  | 'en' // English
  | 'tr' // Turkish
  | 'sr' // Serbian
  | 'mk' // Macedonian
  | 'de' // German
  | 'it' // Italian
  | 'fr' // French
  | 'ar' // Arabic (RTL)
  | 'ro' // Romanian

// Scan input — one of three types
type ScanInput =
  | { type: 'url';        value: string }
  | { type: 'text';       value: string }
  | { type: 'screenshot'; base64: string; mimeType: 'image/jpeg' | 'image/png' }
  | { type: 'qr';         rawValue: string } // QR decoded value, then treated as url or text

// Individual risk signal
type RiskSignal = {
  type:
    | 'urgency_manipulation'
    | 'impersonation'
    | 'payment_pressure'
    | 'credential_theft'
    | 'suspicious_link'
    | 'unusual_wording'
    | 'prize_scam'
    | 'fake_delivery'
    | 'romance_scam'
    | 'tech_support_scam'
    | 'blacklisted_domain'
    | 'lookalike_domain'
    | 'url_shortener'
    | 'suspicious_tld'
  severity: 'low' | 'medium' | 'high'
  reason: string        // Always in the user's language
  evidence?: string     // Exact text or URL that triggered this
}

// Progress step shown in the LoadingScreen component
type ScanStep = {
  id: 'local' | 'ai' | 'reputation' | 'combining'
  label: string         // In user's language
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
}

// Final scan result
type ScanResult = {
  verdict:           'blocked' | 'highRisk' | 'caution' | 'noKnownRisk'
  riskScore:         number       // 0-100
  summary:           string       // One sentence, in user's language
  signals:           RiskSignal[]
  extractedUrls:     string[]
  detectedPhones:    string[]
  category:          string       // e.g. "Phishing", "Malware", "Safe"
  confidence:        number       // 0-100
  recommendedAction: string       // In user's language
  language:          SupportedLanguage
  isOfflineResult:   boolean
  isPartialResult:   boolean      // True if VirusTotal/AI was unavailable
  trace:             ScanStep[]
  scannedAt:         string       // ISO timestamp
}

// Error types
type ScanError =
  | { code: 'INVALID_INPUT';        message: string }
  | { code: 'OFFLINE_NO_MODEL';     message: string }
  | { code: 'AI_FAILURE';           message: string }
  | { code: 'VIRUSTOTAL_FAILURE';   message: string }
  | { code: 'QUOTA_EXHAUSTED';      message: string }
  | { code: 'IMAGE_TOO_LARGE';      message: string }
  | { code: 'UNSUPPORTED_FORMAT';   message: string }
  | { code: 'TIMEOUT';              message: string }
```

## 2. Implement deterministic local analysis

Build pure, unit-tested modules that run in both the browser and Vercel Functions:

- Normalize URLs and hostnames.
- Match exact URLs and domains against the custom blacklist.
- Match subdomains safely (blocking `bank.com` must not accidentally block `notbank.com`).
- Decode QR code values and route them into the normal URL/text pipeline.
- Identify deterministic signals:
  - URL shorteners (bit.ly, tinyurl, t.co, etc.)
  - Lookalike domains (raiffeisen-al.com vs raiffeisen.al)
  - Misleading subdomains (bkt.albania-secure.com)
  - Suspicious TLDs (.xyz, .tk, .top, .pw, etc.)
  - Urgency language per language (see scam-patterns.json)
  - Payment request phrases per language
  - Credential request phrases per language
- Aggregate weighted signals into an explainable risk score (0-100).
- Return results in the user's selected language (read from localStorage key `setting_language`).

Keep the initial blacklist as a versioned JSON file at `src/offline/scam-patterns.json`.
A local blacklist match must return a `blocked` verdict immediately, before calling any external API.

### Offline scam patterns structure

```json
{
  "version": "1.0",
  "blacklist": {
    "domains": ["bank-al.com", "raiffeisen-al.net"],
    "urls": []
  },
  "languages": {
    "sq": {
      "urgencyPhrases":    ["vepro tani", "llogaria juaj do të bllokohet"],
      "paymentPhrases":    ["dërgoni para", "transferoni", "paguani menjëherë"],
      "credentialPhrases": ["PIN kodi", "fjalëkalimi", "numri i kartës"],
      "prizePhrases":      ["çmim i fituar", "keni fituar"],
      "weights": {
        "urgency":    25,
        "payment":    30,
        "credential": 35,
        "prize":      20
      }
    },
    "en": {
      "urgencyPhrases":    ["act now", "your account will be closed", "final warning"],
      "paymentPhrases":    ["send money", "transfer funds", "pay immediately"],
      "credentialPhrases": ["PIN code", "password", "card number"],
      "prizePhrases":      ["you have won", "claim your prize"],
      "weights": {
        "urgency":    25,
        "payment":    30,
        "credential": 35,
        "prize":      20
      }
    }
    // ... repeat for tr, sr, mk, de, it, fr, ar, ro
  }
}
```

## 3. Offline mode

ClickShield must degrade gracefully when there is no internet connection.

Detection: use `@capacitor/network` to monitor connectivity. Expose network status via a `useNetworkStatus()` hook.

```text
Online  → Full pipeline: local rules → AI → Google Web Risk → VirusTotal
Offline → Local rules only → scam-patterns.json pattern matching
        → If local GGUF model downloaded: run local AI inference instead
```

**Offline AI (optional, user-initiated download):**
- Offered only if device RAM ≥ 6GB (check via `@capacitor/device`)
- Recommended model: Phi-3 Mini Q4 GGUF (~2.3GB) or Gemma 3n E2B (~2.95GB)
- Integrated via MLC LLM or llama.cpp Capacitor bindings
- Download progress shown with a progress bar
- Model stored in app's private filesystem

**Rule-based fallback (always available, no download needed):**
- Pattern match against `scam-patterns.json` for the user's language
- Catches ~60-70% of common scams
- Result always marked with `isOfflineResult: true`
- UI shows: "Limited analysis — offline mode" notice below result

## 4. AI provider configuration

Do not rely on a single AI provider. Use this priority order:

**For text analysis:**
1. Primary: OpenRouter free tier
   - Models: `meta-llama/llama-3.1-8b-instruct:free`, `google/gemma-2-9b-it:free`, `mistralai/mistral-7b-instruct:free`
   - Rate limit: 50 req/day (free), 1,000 req/day (after $10 one-time credit)
2. Fallback: Groq free tier
   - Model: `llama-3.3-70b-versatile`
   - Rate limit: 14,400 req/day — most generous free tier available

**For screenshot/image analysis (multimodal):**
1. Primary: Google Gemini 2.0 Flash free tier (multimodal, handles screenshots natively)
2. Fallback: OpenRouter vision-capable models (Qwen2.5-VL)

**Environment variables (Vercel server-side only — never in VITE_ prefixed variables):**
```text
AI_OPENROUTER_API_KEY
AI_GROQ_API_KEY
AI_GEMINI_API_KEY
VIRUSTOTAL_API_KEY
GOOGLE_WEB_RISK_API_KEY
```

These keys must never appear in the client-side bundle. All AI calls go through the Vercel Edge Function, never directly from the app.

## 5. Guardian Controls local state

Create a local settings/policy layer stored in SQLite and localStorage:

```ts
type GuardianSettings = {
  enabled:          boolean
  parentPinHash:    string | null   // SHA-256 hash of PIN, never plaintext
  blockedDomains:   BlockedEntry[]
  blockedUrls:      BlockedEntry[]
  wildcardEnabled:  boolean         // block subdomains of blocked domains
}

type BlockedEntry = {
  value:     string   // domain or URL
  addedAt:   string   // ISO timestamp
  label?:    string   // optional parent note e.g. "gambling site"
}
```

Guardian Controls behavior:
- Parent sets a separate PIN (independent from history biometric lock)
- PIN stored as SHA-256 hash, never plaintext
- Blocked domains/URLs checked first in every scan pipeline
- Wildcard matching: blocking `youtube.com` also blocks `m.youtube.com`
- Blocklist exportable as plain text for sharing across family devices
- Blocklist importable from plain text
- Guardian Controls toggle (disable temporarily without deleting list)
- Modifying blocked list requires PIN verification

## 6. Add the Vercel scan gateway

Create a stateless `POST /api/scan` Vercel Edge Function at `api/scan.ts`.

Request body:
```ts
{
  input:    ScanInput
  language: SupportedLanguage
}
```

Processing order:
1. Validate request — enforce size limits (screenshots max 2MB), input format
2. Re-run blacklist and deterministic checks server-side
3. Return `blocked` immediately if blacklist match (no AI call needed)
4. For non-blocked inputs:
   a. Extract URLs from text/screenshot
   b. Check extracted URLs against Google Web Risk API (primary, free ≤100k/mo)
   c. Call AI vision API for screenshot/text analysis
   d. Validate AI response against strict JSON schema
   e. For suspicious URLs: check VirusTotal (secondary, 500 req/day free)
5. Combine all signals into final `ScanResult`
6. Return only normalized `ScanResult` — never raw provider responses or secrets

**URL scanning priority:**
- Google Web Risk: primary gate (fast, commercial license, 100k free/mo)
- VirusTotal: deep scan for suspicious/unknown URLs only (not every request)
- CheckPhish: ML-based verdict for ambiguous cases (250 free/mo)

## 7. Constrain and validate AI output

Require the AI model to return structured JSON only. No preamble, no markdown.

```json
{
  "messageSummary":  "A message claiming to be from a bank.",
  "extractedUrls":   ["https://example.test/login"],
  "extractedPhones": ["+355691234567"],
  "detectedSender":  "BKT Bank",
  "language":        "sq",
  "signals": [
    {
      "type":     "urgency_manipulation",
      "severity": "high",
      "reason":   "Mesazhi kërkon veprim të menjëhershëm.",
      "evidence": "Veproni tani ose llogaria juaj do të bllokohet"
    }
  ]
}
```

**Important constraints:**
- AI output is supporting evidence, never automatic proof
- A local blacklist match or strong VirusTotal result overrides AI
- AI-only signals without corroboration → `caution` at most, never `blocked`
- AI must respond in the user's language (pass `language` in every prompt)
- If AI returns invalid JSON: retry once with stricter prompt, then fall back to offline rules
- If AI response is in wrong language: extract JSON fields, re-request summary only

**AI system prompt template:**
```
You are ClickShield, an expert scam and phishing detection assistant.
Analyze the provided content and identify all signs of fraud, scams, or phishing.

Respond ONLY in valid JSON matching this exact schema. No preamble, no markdown.
[schema here]

Respond in this language: {languageCode} ({languageName})
Be specific. Always reference exact text from the content as evidence.
```

## 8. Use VirusTotal conservatively

- Use Google Web Risk as the primary URL scanner (not VirusTotal) — it has a commercial license and 100k free requests/month
- Use VirusTotal only as a secondary deep scan for URLs flagged suspicious by Web Risk or AI
- Query URL and domain reputation only for MVP
- Hash files locally before any reputation lookup
- Do not upload files or screenshots to VirusTotal
- Do not submit unknown URLs without explicit user consent
- If VirusTotal is unavailable or quota-limited: return local and AI findings with `isPartialResult: true`
- VirusTotal free tier: 4 req/min, 500 req/day — use sparingly

## 9. QR code scanning

The Scan tab includes a QR code scanner. QR-decoded values feed into the normal pipeline:

```text
QR code decoded
      ↓
Extract value (usually a URL)
      ↓
If URL → treat as ScanInput type 'url'
If text → treat as ScanInput type 'text'
      ↓
Normal scan pipeline from Step 2
```

QR integration:
- Use `@capacitor/camera` + a JS QR decoder library (e.g. `jsQR` or `@zxing/browser`)
- Never open QR-decoded URLs without scanning first
- Show a "Scanning QR code..." step in the LoadingScreen progress

## 10. Implement the client scan service

Expose one UI-facing service at `src/services/analysis/scanService.ts`:

```ts
scan(
  input: ScanInput,
  language: SupportedLanguage,
  onProgress: (step: ScanStep) => void
): Promise<ScanResult>
```

Internal stages:

```text
Stage 1: "Checking custom protection"
  → Check Guardian blocklist (local, instant)
  → If blocked: return immediately, skip all further steps

Stage 2: "Extracting links and scam signals"
  → Run deterministic local rules
  → Check offline scam-patterns.json
  → If offline and no local model: return rule-based result

Stage 3: "Checking threat intelligence"
  → Call /api/scan (Vercel Edge Function)
  → AI analysis + Google Web Risk + VirusTotal

Stage 4: "Preparing recommendation"
  → Combine all signals
  → Map to final verdict using verdict table
  → Generate recommendedAction in user's language
```

The service must:
- Run local checks first, return `blocked` immediately when matched
- Call `/api/scan` only when local checks don't produce a definitive result
- Convert all network/provider failures into typed `ScanError` values
- Never expose raw API errors to the UI

## 11. History storage

Every completed scan must be saved locally to SQLite.

```sql
CREATE TABLE IF NOT EXISTS scans (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  scanned_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  screenshot_path  TEXT,           -- local file path to thumbnail
  input_type       TEXT,           -- 'url' | 'text' | 'screenshot' | 'qr'
  input_preview    TEXT,           -- first 100 chars of text, or URL
  verdict          TEXT,           -- 'blocked' | 'highRisk' | 'caution' | 'noKnownRisk'
  risk_score       INTEGER,
  summary          TEXT,
  full_report      TEXT,           -- full ScanResult as JSON string
  language         TEXT            -- SupportedLanguage code
);
```

History behavior:
- Every scan auto-saved after result is returned
- Protected by biometric/PIN lock (Capacitor Biometrics plugin)
- User can delete individual entries or clear all
- Data never leaves the device — no remote sync
- History list shows: thumbnail + verdict color + risk score + date

## 12. Privacy and security safeguards

- API keys live only in Vercel environment variables — never in `VITE_` prefixed variables
- Screenshots and message content never logged server-side
- Scan data kept in memory only during analysis — not written to temp files
- History stored locally in SQLite only — never uploaded
- Guardian PIN stored as SHA-256 hash — never plaintext
- All external API calls over HTTPS only
- Request size limits enforced server-side (screenshots max 2MB)
- Vercel Edge Function restricts allowed origins to deployed app URL and Capacitor origin
- No analytics or tracking SDKs in v1
- Rate limiting on `/api/scan` before wider release to prevent quota abuse

## 13. Demo fixtures (hackathon requirement)

Hardcode deterministic demo fixtures for offline demo and judge testing. These bypass the API and return instant results.

```ts
// Activate with: ?demo=scam | ?demo=caution | ?demo=safe
const DEMO_FIXTURES = {
  scam: {
    input: "URGJENT: Llogaria juaj BKT është pezulluar. Verifikoni PIN-in tuaj menjëherë në: bkt-albania-secure.com ose llogaria juaj do të mbyllet brenda 24 orësh.",
    result: {
      verdict: 'blocked',
      riskScore: 96,
      category: 'Phishing',
      confidence: 98,
      summary: "Ky mesazh tregon shenja të qarta të mashtrimit bankar.",
      signals: [
        { type: 'urgency_manipulation', severity: 'high', evidence: 'URGJENT' },
        { type: 'impersonation',        severity: 'high', evidence: 'BKT' },
        { type: 'credential_theft',     severity: 'high', evidence: 'PIN-in tuaj' },
        { type: 'suspicious_link',      severity: 'high', evidence: 'bkt-albania-secure.com' }
      ]
    }
  },
  caution: {
    input: "Congratulations! You have been selected for a special offer. Call us back at +355 69 123 4567 to claim your reward.",
    result: {
      verdict: 'caution',
      riskScore: 52,
      category: 'Prize Scam',
      confidence: 65,
      summary: "This message contains suspicious prize claim language."
    }
  },
  safe: {
    input: "Porosia juaj nga Zara është dërguar. Gjurmoni porosinë tuaj në: zara.com/order/123456. Koha e parashikuar: 3-5 ditë pune.",
    result: {
      verdict: 'noKnownRisk',
      riskScore: 8,
      category: 'Delivery',
      confidence: 92,
      summary: "Ky mesazh duket i ligjshëm. Nuk u gjetën shenja mashtrimi."
    }
  }
}
```

## 14. Test plan

Add unit tests for:

- URL normalization and safe subdomain matching
- Blacklist precedence (local match must beat AI result)
- Guardian blocklist matching including wildcards
- Deterministic risk scoring per language
- QR code value extraction and routing
- AI schema validation and malformed response handling
- VirusTotal timeout, quota-exhausted, and unknown-result handling
- Offline mode: rule-based scoring produces correct verdict
- History: scan saves correctly, retrieve by id, delete works
- End-to-end fixtures: blocked URL, suspicious screenshot, benign URL, unavailable providers

Use `scam-demo.clickshield.test` as the reserved test domain. Never use active malicious URLs in tests.

## Implementation order

1. Shared TypeScript contracts (types.ts)
2. scam-patterns.json (all 10 languages)
3. Local URL rules and blacklist module
4. Guardian Controls state (localStorage + SQLite)
5. Client scan service (scanService.ts) — local checks only first
6. Vercel `/api/scan` Edge Function
7. AI schema validation and provider fallback logic
8. Google Web Risk integration
9. VirusTotal integration (secondary only)
10. Offline mode — network detection + rule-based fallback
11. QR code decoder integration
12. History storage (SQLite)
13. Tests and demo fixtures
14. Deployment verification

## Acceptance criteria

The logic layer is complete when:

- Guardian-blocklisted URLs are blocked instantly with no external API calls
- A screenshot produces an explainable structured result in the user's language
- Extracted URLs are checked against Google Web Risk, then VirusTotal if suspicious
- The UI receives consistent loading, success, warning, block, and failure states
- API keys never appear in the frontend bundle
- All 10 languages produce correctly localized results and summaries
- QR codes are decoded and scanned before any URL is opened
- Every scan is saved to local history
- Offline mode works with rule-based fallback when no internet is available
- Demo fixtures work without any external API calls