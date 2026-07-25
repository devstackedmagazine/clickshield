# ClickShield — Development Roadmap

## Build Order

Always build in this order. Each phase must work before moving to the next.

---

## Phase 1 — Core (Week 1-2)
*Get the basic scan working on web first*

- [ ] Project scaffold (React + Vite + Ionic + Capacitor)
- [ ] OpenRouter API integration (text analysis)
- [ ] Basic UI: Home + Scan + Result screens
- [ ] JSON prompt response parser
- [ ] Risk score display (simple view)
- [ ] i18n setup with Albanian + English

**Done when:** User can paste text, get a risk score and report in Albanian.

---

## Phase 2 — Image Analysis (Week 2-3)
*Add screenshot and camera support*

- [ ] Camera capture via Capacitor Camera plugin
- [ ] Gallery upload
- [ ] Image → base64 → OpenRouter pipeline
- [ ] Image compression before sending (max 1MB)
- [ ] Test with real scam screenshots

**Done when:** User can upload a screenshot and get a full analysis.

---

## Phase 3 — History (Week 3)
*Save and protect scan history*

- [ ] SQLite setup via @capacitor-community/sqlite
- [ ] Save scan result + thumbnail + report
- [ ] History list screen
- [ ] History detail screen
- [ ] Biometric / PIN lock on history

**Done when:** Every scan is saved, viewable, and protected.

---

## Phase 4 — Share + Block (Week 4)
*Add action features*

- [ ] Share report as image via native share sheet
- [ ] Share report as text
- [ ] Block number (Android — open native block screen)
- [ ] Block number (iOS — show manual instructions)
- [ ] Link detection + Google Safe Browsing check

**Done when:** User can share report to WhatsApp and block a number in one tap.

---

## Phase 5 — Internationalization (Week 4-5)
*Expand to all 10 languages*

- [ ] Extract all UI strings to i18n JSON files
- [ ] Translate all 10 languages
- [ ] Auto-detect phone locale on first launch
- [ ] Language override in Settings
- [ ] RTL layout for Arabic
- [ ] Test AI responses in each language

**Done when:** App works end-to-end in all 10 languages.

---

## Phase 6 — Floating Button Android (Week 5-6)
*Native Android overlay feature*

- [ ] Capacitor plugin for SYSTEM_ALERT_WINDOW permission
- [ ] Floating button service (Android foreground service)
- [ ] Auto screenshot on button tap
- [ ] Permission request flow in onboarding
- [ ] Handle permission denied gracefully

**Done when:** Floating button appears over all apps, tapping it captures and analyzes the screen.

---

## Phase 7 — Offline Mode (Week 6-7)
*Add rule-based and local AI offline support*

- [ ] scam-patterns.json for all 10 languages
- [ ] Offline rule-based scoring engine
- [ ] Network status detection
- [ ] Seamless online/offline switching
- [ ] Device RAM detection
- [ ] Offline AI download offer (6GB+ RAM only)
- [ ] MLC LLM or llama.cpp Capacitor integration
- [ ] Model download + progress UI
- [ ] Local inference pipeline

**Done when:** App works without internet using rules, and optionally with local AI on capable devices.

---

## Phase 8 — Polish + Store Prep (Week 7-8)
*Get ready for launch*

- [ ] Onboarding flow (welcome → language → permissions → offline offer)
- [ ] Splash screen + app icon
- [ ] Error states for all failure scenarios
- [ ] Loading states with progress indicators
- [ ] Performance optimization (image compression, lazy loading)
- [ ] Accessibility audit (contrast, touch targets, screen reader)
- [ ] App store screenshots (all 10 languages)
- [ ] Privacy policy
- [ ] Google Play Store listing
- [ ] Apple App Store listing

**Done when:** App submitted to both stores.

---

## What NOT to build in v1

- User accounts or login
- Server-side data storage
- Push notifications
- Real-time background monitoring
- Automatic call blocking (requires being default phone app)
- iOS floating button (not possible)
- In-app purchases

---

## Tech Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Framework | React + Vite + Ionic | Official Ionic recommendation, less config than Next.js |
| Online AI | OpenRouter (free models) | Zero cost, multiple model options, reliable |
| Offline AI | MLC LLM + Phi-3 Mini Q4 | Best quality/size for mobile |
| Storage | Capacitor SQLite | Structured, fast, local, encrypted |
| Hosting | Vercel free | Zero cost, edge functions for API proxy |
| i18n | i18next | Industry standard, good React integration |
| Link scanning | Google Safe Browsing | Free, reliable, simple API |
