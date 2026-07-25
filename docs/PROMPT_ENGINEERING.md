# ClickShield — Prompt Engineering Guide

## Overview

This document defines the exact prompts used for AI analysis in ClickShield. These prompts must be maintained carefully — they are the core intelligence of the product.

---

## Main Analysis Prompt

### System Prompt
```
You are ClickShield, an expert scam and phishing detection assistant specialized in protecting everyday users from digital fraud.

Your job is to analyze any content provided — screenshots, text messages, emails, marketplace listings, social media posts, or links — and identify all signs of fraud, scams, or phishing attempts.

You must respond ONLY in valid JSON. No preamble, no explanation outside the JSON, no markdown code blocks. Raw JSON only.

Response format:
{
  "riskScore": <integer 0-100>,
  "riskLevel": <"HIGH" | "MEDIUM" | "LOW">,
  "summary": <string: one clear sentence explaining the verdict, in the user's language>,
  "threats": [
    {
      "type": <"urgency_manipulation" | "impersonation" | "payment_pressure" | "credential_theft" | "suspicious_link" | "unusual_wording" | "prize_scam" | "fake_delivery" | "romance_scam" | "tech_support_scam">,
      "title": <string: short threat name in user's language>,
      "description": <string: clear explanation of this specific threat, in user's language>,
      "evidence": <string: exact text or element from content that triggered this detection>
    }
  ],
  "safeNextSteps": [<string>, <string>, ...],
  "detectedLinks": [<string>],
  "detectedPhoneNumbers": [<string>],
  "detectedSenderName": <string | null>,
  "isLikelyScam": <boolean>,
  "confidence": <integer 0-100>,
  "language": <string: ISO 639-1 language code of detected content>
}

Risk scoring guide:
- 0-39: LOW — content appears legitimate
- 40-69: MEDIUM — suspicious elements present, proceed with caution
- 70-100: HIGH — strong indicators of scam or phishing

Be specific. Always reference exact text from the content as evidence.
Never be vague. If you cannot determine risk, say so with a medium score and low confidence.
```

### User Message Template
```
Analyze this content for scams and phishing. 

User's preferred language for response: {languageCode} ({languageName})

{if image}: [IMAGE ATTACHED]
{if text}: Content to analyze:
"""
{pastedText}
"""
{if linkScanResult}: URL scan results from Google Safe Browsing: {linkScanResult}

Respond in {languageName}.
```

---

## Language-Specific Calibration Notes

### Albanian (sq)
Common local scams to detect:
- Fake bank messages (Raiffeisen, BKT, Credins impersonation)
- Fake DHL/Albanian Post delivery notifications
- Facebook Marketplace fraud
- "You won a prize" SMS scams
- Fake job offers

Key urgency phrases to watch:
- "llogaria juaj do të bllokohet" (your account will be blocked)
- "vepro menjëherë" (act immediately)
- "çmim i fituar" (prize won)

### English (en)
Standard phishing patterns apply. Extra attention to:
- Package delivery scams (FedEx, UPS, Amazon)
- Bank verification requests
- Prize/lottery scams
- Tech support scams

### Arabic (ar)
RTL text — model handles this natively. Common patterns:
- Banking impersonation
- WhatsApp prize scams
- Fake government messages

---

## Prompt Testing Matrix

Use these test cases to validate prompt output quality:

### Test 1 — Obvious Scam (should score 85+)
```
Input text:
"URGENT: Your BKT account has been suspended. 
Verify your PIN immediately at: bkt-albania-secure.com 
or your account will be permanently closed within 24 hours."

Expected output:
- riskScore: 85-95
- riskLevel: HIGH
- threats: urgency_manipulation, impersonation, credential_theft, suspicious_link
- isLikelyScam: true
```

### Test 2 — Legitimate Message (should score 0-20)
```
Input text:
"Porosia juaj nga Zara është dërguar. 
Gjurmoni porosinë tuaj në: zara.com/order/123456
Koha e parashikuar e dorëzimit: 3-5 ditë pune."

Expected output:
- riskScore: 0-20
- riskLevel: LOW
- threats: [] (empty)
- isLikelyScam: false
```

### Test 3 — Medium Risk (should score 40-65)
```
Input text:
"Congratulations! You have been selected for a special offer. 
Call us back at +355 69 XXX XXXX to claim your reward."

Expected output:
- riskScore: 45-65
- riskLevel: MEDIUM
- threats: prize_scam or unusual_wording
- confidence: 60-75
```

### Test 4 — Image Screenshot
```
Input: Screenshot of a WhatsApp message impersonating DHL
Expected: Detects fake sender name, suspicious link, urgency manipulation
```

---

## Fallback Rules (Offline Mode)

When no AI is available, use this scoring algorithm:

```typescript
function scoreOffline(text: string, language: string): OfflineReport {
  const patterns = loadPatterns(language);
  let score = 0;
  const threats = [];

  // Check urgency phrases (+25 per match, max 40)
  const urgencyMatches = patterns.urgencyPhrases.filter(p => 
    text.toLowerCase().includes(p.toLowerCase())
  );
  if (urgencyMatches.length > 0) {
    score += Math.min(urgencyMatches.length * 25, 40);
    threats.push({ type: 'urgency_manipulation', evidence: urgencyMatches[0] });
  }

  // Check payment phrases (+30 per match, max 50)
  const paymentMatches = patterns.paymentPhrases.filter(p =>
    text.toLowerCase().includes(p.toLowerCase())
  );
  if (paymentMatches.length > 0) {
    score += Math.min(paymentMatches.length * 30, 50);
    threats.push({ type: 'payment_pressure', evidence: paymentMatches[0] });
  }

  // Check credential phrases (+35 per match, max 50)
  const credentialMatches = patterns.credentialPhrases.filter(p =>
    text.toLowerCase().includes(p.toLowerCase())
  );
  if (credentialMatches.length > 0) {
    score += Math.min(credentialMatches.length * 35, 50);
    threats.push({ type: 'credential_theft', evidence: credentialMatches[0] });
  }

  // Check suspicious domains (+40 per match)
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlRegex) || [];
  urls.forEach(url => {
    const domain = new URL(url).hostname;
    if (patterns.suspiciousDomains.includes(domain)) {
      score += 40;
      threats.push({ type: 'suspicious_link', evidence: url });
    }
  });

  score = Math.min(score, 100);

  return {
    riskScore: score,
    riskLevel: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
    threats,
    isOfflineAnalysis: true,
    summary: getOfflineSummary(score, language)
  };
}
```

---

## Model Selection Guide

### OpenRouter Free Models (Online)

| Model | Best for | Tradeoff |
|---|---|---|
| meta-llama/llama-3.1-8b-instruct:free | General analysis, fast | Occasionally less nuanced |
| google/gemma-2-9b-it:free | Multilingual content | Slightly slower |
| mistralai/mistral-7b-instruct:free | Structured JSON output | Good balance |

Recommended: Try Llama 3.1 8B first. Fall back to Gemma 2 9B if JSON parsing fails.

### Local Models (Offline)

| Model | Size | Quality |
|---|---|---|
| Phi-3 Mini Q4 GGUF | 2.3GB | Best for size |
| Gemma 2B Q4 GGUF | 1.5GB | Smaller, less accurate |
| Llama 3.2 3B Q4 GGUF | 2GB | Good reasoning |

Recommended: Phi-3 Mini Q4 GGUF for best quality/size ratio.

---

## Error Handling in Prompts

### If AI returns invalid JSON
1. Retry once with stricter prompt: "Respond ONLY with raw JSON. No other text."
2. If still fails, fall back to offline rules
3. Show user: "Analysis completed with limited detail"

### If AI returns empty threats array for high-risk content
- Cross-check with offline rules
- If offline rules flag threats, use the higher score
- Log the discrepancy for prompt improvement

### If response is in wrong language
- Extract JSON regardless of surrounding language
- Re-request summary field only in correct language
- Never show AI errors to the user directly
