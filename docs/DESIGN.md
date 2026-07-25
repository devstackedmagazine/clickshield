# ClickShield — Design Document

## Design Philosophy

ClickShield must feel trustworthy, fast, and accessible to non-technical users of all ages. The design prioritizes clarity over complexity — one action per screen, large touch targets, clear color coding, and zero jargon. Every screen should work for a 65-year-old grandmother or a 12-year-old child seeing it for the first time.

---

## Visual Identity

### Personality
- Protective but not alarming
- Smart but not intimidating
- Local and familiar, not corporate

### Color System

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Shield Blue | #1A56DB | Primary actions, logo |
| Danger | Alert Red | #E02424 | High risk results |
| Warning | Caution Amber | #D97706 | Medium risk results |
| Safe | Trust Green | #057A55 | Low risk results |
| Background | Off White | #F9FAFB | App background |
| Surface | White | #FFFFFF | Cards, modals |
| Text Primary | Near Black | #111827 | Headings, body |
| Text Secondary | Cool Gray | #6B7280 | Supporting text |
| Border | Light Gray | #E5E7EB | Dividers, inputs |

### Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| App name / Hero | System Bold | 28px | 700 |
| Screen title | System | 22px | 600 |
| Section heading | System | 18px | 600 |
| Body text | System | 16px | 400 |
| Supporting text | System | 14px | 400 |
| Caption / label | System | 12px | 400 |

Use system font stack per platform (San Francisco on iOS, Roboto on Android). This feels native and loads instantly — no web fonts needed.

### Risk Score Visual Language

Always use all three signals together — color, icon, and number. Never rely on color alone.

```
🔴 HIGH RISK     Score 70-100    Red background
🟡 MEDIUM RISK   Score 40-69     Amber background  
🟢 LOW RISK      Score 0-39      Green background
```

---

## Screen Architecture

```
App
├── Onboarding (first launch only)
│   ├── Welcome
│   ├── Language select
│   ├── Permission request (overlay, camera, storage)
│   └── Offline AI offer (shown only if RAM ≥ 6GB)
│
├── Home (main screen)
│   ├── Recent scan summary (if history exists)
│   ├── Scan button (large, center)
│   └── Bottom nav: Home / History / Settings
│
├── Analysis Flow
│   ├── Input screen (camera / upload / paste)
│   ├── Scanning screen (loading state)
│   └── Result screen
│       ├── Simple result view
│       └── Detailed report view
│
├── History
│   ├── List view (thumbnail + score + date)
│   └── Detail view (full report)
│
└── Settings
    ├── Language
    ├── Offline AI (download / remove)
    ├── Biometric lock toggle
    ├── Clear history
    └── About / version
```

---

## Screen Designs

### 1. Home Screen

```
┌─────────────────────────────┐
│  🛡️ ClickShield         ⚙️  │
│                             │
│  ┌─────────────────────┐   │
│  │  Last scan: 2h ago  │   │
│  │  🟢 Low Risk — Safe │   │
│  └─────────────────────┘   │
│                             │
│                             │
│      ┌───────────────┐      │
│      │               │      │
│      │   📷  SCAN    │      │
│      │               │      │
│      └───────────────┘      │
│                             │
│   Tap to analyze anything   │
│   suspicious                │
│                             │
│  ─────────────────────────  │
│  🏠 Home   📋 History  ⚙️   │
└─────────────────────────────┘
```

- Scan button is large (minimum 120x120px touch target)
- No clutter, no distracting elements
- Last scan card only shown if history exists

### 2. Input Screen

```
┌─────────────────────────────┐
│  ← Analyze Content          │
│                             │
│  ┌─────────┐ ┌─────────┐   │
│  │         │ │         │   │
│  │  📷     │ │  🖼️     │   │
│  │ Camera  │ │ Upload  │   │
│  │         │ │         │   │
│  └─────────┘ └─────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ Or paste text here… │   │
│  │                     │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │      ANALYZE        │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### 3. Scanning Screen

```
┌─────────────────────────────┐
│                             │
│                             │
│         🛡️                 │
│                             │
│      Analyzing...           │
│                             │
│   Checking for threats      │
│   ████████░░░░  67%         │
│                             │
│   ✓ Reading content         │
│   ✓ Checking links          │
│   ⟳ Analyzing patterns      │
│                             │
│                             │
└─────────────────────────────┘
```

- Show progressive steps so user knows it's working
- Never show a blank loading spinner alone
- Average wait: 2-4 seconds online, 5-10 seconds offline

### 4. Result Screen — Simple View

```
┌─────────────────────────────┐
│  ← Result              📤  │
│                             │
│  ┌─────────────────────┐   │
│  │   🔴  HIGH RISK     │   │
│  │                     │   │
│  │       87/100        │   │
│  │                     │   │
│  │  This message shows │   │
│  │  signs of a banking │   │
│  │  scam. Do not click │   │
│  │  any links.         │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │   More Details  →   │   │
│  └─────────────────────┘   │
│                             │
│  ┌──────────┐ ┌─────────┐  │
│  │  📤      │ │  🚫     │  │
│  │  Share   │ │  Block  │  │
│  └──────────┘ └─────────┘  │
└─────────────────────────────┘
```

### 5. Result Screen — Detailed View

```
┌─────────────────────────────┐
│  ← Full Report         📤  │
│                             │
│  🔴 HIGH RISK — 87/100      │
│                             │
│  THREATS DETECTED           │
│  ┌─────────────────────┐   │
│  │ ⚠️ Urgency tactics  │   │
│  │ "Act now or account │   │
│  │  will be closed"    │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ ⚠️ Fake domain      │   │
│  │ raiffeisen-al.com   │   │
│  │ ≠ raiffeisen.al     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ ⚠️ Payment pressure │   │
│  │ Asking for PIN code │   │
│  └─────────────────────┘   │
│                             │
│  WHAT TO DO                 │
│  • Do not click any links   │
│  • Do not reply             │
│  • Block this number        │
│  • Report to your bank      │
│                             │
│  ┌─────────────────────┐   │
│  │   Block Number  🚫  │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### 6. History Screen

```
┌─────────────────────────────┐
│  History               🗑️  │
│                             │
│  ┌─────────────────────┐   │
│  │ 🔴 [img] Bank scam  │   │
│  │    87/100 · 2h ago  │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 🟡 [img] Promo msg  │   │
│  │    45/100 · 1d ago  │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 🟢 [img] Delivery   │   │
│  │    12/100 · 3d ago  │   │
│  └─────────────────────┘   │
│                             │
│  ─────────────────────────  │
│  🏠 Home   📋 History  ⚙️   │
└─────────────────────────────┘
```

### 7. Floating Button (Android only)

```
Normal state:
  ●  🛡️   (small shield, 56x56dp, bottom-right corner)

After tap:
  Expands briefly → captures screenshot → opens analysis
```

- Position: bottom-right, 16dp from edges
- Size: 56x56dp (Material Design FAB standard)
- Color: Shield Blue (#1A56DB)
- Semi-transparent when idle (80% opacity) to not obstruct content
- Full opacity on hover/press

---

## Onboarding Flow

### Screen 1 — Welcome
```
🛡️ ClickShield

Protect yourself from
scams in one tap.

Free. Private. Works offline.

[Get Started]
```

### Screen 2 — Language
```
Choose your language
Zgjidhni gjuhën tuaj

[🇦🇱 Shqip        ✓]
[🇬🇧 English        ]
[🇹🇷 Türkçe         ]
[🇷🇸 Srpski         ]
...

[Continue]
```

### Screen 3 — Permissions
```
ClickShield needs access to:

📸 Camera
   To capture suspicious content

🖼️ Photo Library  
   To upload screenshots

🔲 Display over other apps (Android)
   For the floating scan button

[Allow All]  [Choose manually]
```

### Screen 4 — Offline AI (shown only if RAM ≥ 6GB)
```
Want ClickShield to work
without internet?

Download our offline AI model:
• Works with no connection
• Stays on your device
• 3.8GB download

⚠️ Recommended on WiFi

[Download Now]  [Skip for now]
```

---

## Accessibility

- Minimum touch target: 44x44px (iOS) / 48x48dp (Android)
- Text contrast ratio: minimum 4.5:1 (WCAG AA)
- All icons paired with text labels
- VoiceOver / TalkBack compatible
- Text size respects system font size settings
- Never rely on color alone to convey meaning (always paired with icon + text)
- Results read aloud option via native TTS API

---

## Localization Notes

- All UI strings externalized to i18n JSON files
- RTL layout support for Arabic
- Date/time formats follow locale
- Risk explanations generated by AI in user's language — not pre-translated strings
- App store listings in all 10 supported languages

---

## Error States

| Situation | Message shown |
|---|---|
| No internet + no offline model | "No connection. Connect to internet or download offline AI in Settings." |
| Analysis failed | "Could not analyze this content. Please try again." |
| Image too blurry | "Image is unclear. Try again with better lighting." |
| OpenRouter rate limit | "Too many requests. Please wait a moment and try again." |
| Storage full | "Not enough storage to save this scan. Free up space and try again." |
