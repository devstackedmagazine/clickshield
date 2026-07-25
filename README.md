# ClickShield

ClickShield is an Ionic/React and Capacitor app with a privacy-first scam and
phishing analysis pipeline. The UI consumes one typed client service while all
provider secrets stay inside the Vercel `/api/scan` function.

## Logic entry points

- `src/services/analysis/scanService.ts` — UI-facing `scan()` service
- `src/services/analysis/localAnalyzer.ts` — offline deterministic analysis
- `src/services/analysis/verdictPresentation.ts` — exact verdict/UI mapping
- `src/services/guardian/guardianService.ts` — PIN-protected local policy
- `src/services/history/historyService.ts` — SQLite history with web fallback
- `src/services/history/historyLock.ts` — independent biometric/PIN history gate
- `src/services/qr/qrService.ts` — camera/file QR decoding without auto-opening
- `api/scan.ts` — stateless Vercel provider gateway
- `src/types/analysis.ts` — stable UI/logic contracts

The public scan API is:

```ts
scan(
  input: ScanInput,
  language: SupportedLanguage,
  onProgress?: (step: ScanStep) => void,
): Promise<ScanResult>
```

Local and Guardian blocklists run before any network request. When the device or
providers are unavailable, the service returns a deterministic result marked
with `isOfflineResult` or `isPartialResult`.

## Environment

Copy `.env.example` only as a reference. Put these secrets in Vercel project
environment variables:

- `AI_OPENROUTER_API_KEY`
- `AI_GROQ_API_KEY`
- `AI_GEMINI_API_KEY`
- `VIRUSTOTAL_API_KEY`
- `GOOGLE_WEB_RISK_API_KEY`

The service degrades gracefully if one or more provider keys are absent.
Provider calls are server-side only; no secret uses a `VITE_` prefix.

For an Android build, set the non-secret `VITE_SCAN_API_URL` to the deployed
Vercel origin. Web builds use same-origin `/api/scan` automatically.

## Development

```sh
npm install
npm run typecheck
npm test
npm run lint
npm run build
npx cap sync android
```

Native Android builds require JDK 21 (see `.java-version`). JDK 25 is not
supported by the current Android Gradle toolchain.

Use `?demo=scam`, `?demo=caution`, or `?demo=safe` for deterministic,
provider-free demonstrations.
