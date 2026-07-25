# ClickShield — Product Requirements Document

## Overview

ClickShield is a mobile-first scam and phishing detection app that allows users to analyze suspicious content (messages, emails, links, images) by taking or uploading a screenshot. The app uses AI to provide a detailed risk report with severity levels, explanation, and actionable next steps — in the user's local language.

---

## Problem Statement

Everyday users — especially older people, children, and non-technical users — are increasingly targeted by scams through SMS, WhatsApp, email, social media, and marketplace platforms. Existing tools require technical knowledge, are English-only, and don't work on low-end devices. ClickShield solves this with a one-tap experience accessible to anyone.

---

## Target Users

- Primary: Non-technical users (older adults, teenagers)
- Secondary: General smartphone users in supported language markets
- Geography: Albania first, then expanding to 10 language markets

---

## Supported Languages (v1)

1. Albanian (sq)
2. English (en)
3. Turkish (tr)
4. Serbian (sr)
5. Macedonian (mk)
6. German (de)
7. Italian (it)
8. French (fr)
9. Arabic (ar)
10. Romanian (ro)

Language is auto-detected from phone locale. User can override in Settings.

---

## Core Features

### 1. Floating Action Button (Android only)
- A persistent overlay button visible on top of all apps
- Single tap captures current screen screenshot
- Immediately opens analysis flow
- Requires SYSTEM_ALERT_WINDOW permission on Android
- iOS: not available due to platform restrictions

### 2. Screenshot Analysis
- User can provide content via:
  - Floating button auto-capture (Android)
  - Manual screenshot upload from gallery
  - Live camera capture (point at screen or physical document)
  - Text paste / manual input
- Screenshot sent to AI for full analysis

### 3. AI Analysis Engine

#### Online Mode (default)
- Uses OpenRouter API (free tier)
- Recommended models: Llama 3.1 8B, Gemma 2 9B, Mistral 7B
- Requires minimum 3G internet connection
- Works on any phone with 2GB+ RAM
- Analysis includes:
  - Urgency manipulation detection
  - Impersonation detection
  - Payment pressure tactics
  - Credential theft attempts
  - Suspicious link/domain detection
  - Unusual wording patterns
  - Image-based scam detection

#### Offline Mode (optional download)
- Uses local GGUF model via MLC LLM or llama.cpp bindings
- Recommended model: Phi-3 Mini Q4 GGUF (~2.3GB) or Gemma 2B Q4 (~1.5GB)
- Requires 6GB+ RAM and 4GB+ free storage
- Download offered during onboarding only if device meets requirements
- Device RAM checked automatically before showing download option

#### Offline Fallback (no model downloaded)
- Rule-based pattern matching
- Pre-downloaded JSON (~5MB) with scam keywords per language
- Catches ~60-70% of common scams
- Always available regardless of RAM or internet

### 4. Risk Report

#### Simple View (default)
- Color-coded risk indicator: 🔴 High / 🟡 Medium / 🟢 Low
- Numeric score: 0-100
- One-line summary in user's language
- Three action buttons: More Details / Share / Block Number

#### Detailed View (tap "More Details")
- Full severity breakdown
- Detected threat categories with explanation
- Specific suspicious elements highlighted
- Safe next steps recommended
- All text in user's local language

### 5. History
- Every scan saved locally on device
- Stores: screenshot thumbnail, risk score, report summary, timestamp
- Protected by PIN or biometric lock
- User can delete individual entries or clear all
- Data never leaves the device
- Exportable as PDF per entry

### 6. Share Report
- Share full report as:
  - Image (screenshot + report overlay)
  - Text summary
  - PDF
- Via native share sheet (WhatsApp, Telegram, email, etc.)

### 7. Block Number (Android)
- After analysis, if phone number detected in content
- One tap opens native Android block screen
- iOS: shows manual instructions instead

### 8. Link Safety Check
- Any URL detected in analyzed content is checked against Google Safe Browsing API (free)
- Result included in risk report
- If user taps a link: ClickShield intercepts and shows warning first

---

## System Requirements

### Online Mode
| Requirement | Minimum |
|---|---|
| RAM | 2GB |
| Storage | 100MB |
| Internet | 3G |
| Android | 8.0+ |
| iOS | 13+ |

### Offline Mode (local AI)
| Requirement | Minimum |
|---|---|
| RAM | 6GB |
| Storage | 100MB app + 4GB model |
| Internet | Not required |
| Android | 8.0+ |
| iOS | 13+ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + Vite |
| Mobile UI | Ionic Framework |
| Native bridge | Capacitor |
| Online AI | OpenRouter API (free models) |
| Offline AI | MLC LLM / llama.cpp via Capacitor plugin |
| Link scanning | Google Safe Browsing API |
| Local storage | Capacitor Filesystem + SQLite |
| Auth/biometrics | Capacitor Biometrics plugin |
| i18n | i18next |
| Hosting | Vercel (free tier) |

---

## Monetization (future)

- v1: Completely free, no ads, no subscriptions
- v2 consideration: Optional Pro tier with:
  - Unlimited history
  - PDF export
  - Family sharing / send report to trusted contact
  - Priority analysis queue

---

## Non-Goals (v1)

- No real-time background monitoring
- No server-side data storage
- No user accounts required
- No iOS floating button
- No automatic call blocking

---

## Success Metrics

- Installs: 1,000 in first month (Albania market)
- Daily active scans per user: 1-3
- Report share rate: >20% of completed analyses
- Offline model download rate: tracked per device RAM tier
- Crash rate: <1%

---

## Risks

| Risk | Mitigation |
|---|---|
| Play Store overlay permission rejection | Clear use case description in store listing |
| OpenRouter free tier rate limits | Implement request queue + user feedback |
| Low RAM devices poor experience | Auto-detect and degrade gracefully |
| False positives damaging trust | Always show confidence score, never block automatically |
| iOS limitations | Clear communication to users, manual flow available |
