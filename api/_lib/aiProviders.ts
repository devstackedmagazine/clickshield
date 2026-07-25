import type {
  AiAnalysis,
  ScanInput,
  SupportedLanguage,
} from '../../src/types/analysis.ts'
import { inputAsText } from '../../src/services/analysis/urlUtils.ts'
import { LANGUAGE_NAMES } from '../../src/services/analysis/i18n.ts'
import { parseAiAnalysis } from './aiSchema.ts'
import { fetchWithTimeout, readJsonResponse } from './fetchWithTimeout.ts'

export type AiRunResult = {
  analysis: AiAnalysis | null
  attempted: boolean
  partial: boolean
}

const OUTPUT_SCHEMA = `{
  "messageSummary": "one sentence",
  "extractedUrls": ["https://example.test/path"],
  "extractedPhones": ["+355691234567"],
  "detectedSender": "sender name or empty string",
  "language": "requested two-letter language code",
  "signals": [{
    "type": "urgency_manipulation | impersonation | payment_pressure | credential_theft | suspicious_link | unusual_wording | prize_scam | fake_delivery | romance_scam | tech_support_scam | blacklisted_domain | lookalike_domain | url_shortener | suspicious_tld",
    "severity": "low | medium | high",
    "reason": "localized explanation",
    "evidence": "exact content excerpt"
  }]
}`

function systemPrompt(
  language: SupportedLanguage,
  strictRetry: boolean,
): string {
  return `You are ClickShield, an expert scam and phishing detection assistant.
Analyze the provided content and identify signs of fraud, scams, or phishing.
AI observations are supporting evidence, not automatic proof that content is malicious.

Respond ONLY in valid JSON matching this exact schema. No preamble, markdown, or code fences.
${OUTPUT_SCHEMA}

Respond in this language: ${language} (${LANGUAGE_NAMES[language]}).
Be specific and reference exact content as evidence.
${strictRetry ? 'Your previous response was invalid. Return one strict JSON object and use the requested language code exactly.' : ''}`
}

function userText(input: ScanInput): string {
  const text = inputAsText(input)
  return text
    ? `Analyze this user-provided content:\n\n${text}`
    : 'Analyze the user-provided screenshot.'
}

function openAiContent(value: Record<string, unknown>): string {
  const choices = value.choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('AI provider returned no choices.')
  }
  const first = choices[0]
  if (!first || typeof first !== 'object') {
    throw new Error('AI provider returned an invalid choice.')
  }
  const message = (first as Record<string, unknown>).message
  if (!message || typeof message !== 'object') {
    throw new Error('AI provider returned no message.')
  }
  const content = (message as Record<string, unknown>).content
  if (typeof content !== 'string') {
    throw new Error('AI provider returned non-text content.')
  }
  return content
}

async function callOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  input: ScanInput,
  language: SupportedLanguage,
  strictRetry: boolean,
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const userContent =
    input.type === 'screenshot'
      ? [
          { type: 'text', text: userText(input) },
          {
            type: 'image_url',
            image_url: {
              url: `data:${input.mimeType};base64,${input.base64}`,
            },
          },
        ]
      : userText(input)

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt(language, strictRetry) },
          { role: 'user', content: userContent },
        ],
      }),
    },
    18_000,
  )
  if (!response.ok) {
    throw new Error(`AI provider request failed with ${response.status}.`)
  }
  return openAiContent(await readJsonResponse(response))
}

function geminiContent(value: Record<string, unknown>): string {
  const candidates = value.candidates
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('Gemini returned no candidates.')
  }
  const candidate = candidates[0]
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Gemini returned an invalid candidate.')
  }
  const content = (candidate as Record<string, unknown>).content
  if (!content || typeof content !== 'object') {
    throw new Error('Gemini returned no content.')
  }
  const parts = (content as Record<string, unknown>).parts
  if (!Array.isArray(parts)) {
    throw new Error('Gemini returned no content parts.')
  }
  const textPart = parts.find(
    (part) =>
      part &&
      typeof part === 'object' &&
      typeof (part as Record<string, unknown>).text === 'string',
  ) as Record<string, unknown> | undefined
  if (!textPart || typeof textPart.text !== 'string') {
    throw new Error('Gemini returned no JSON text.')
  }
  return textPart.text
}

async function callGemini(
  apiKey: string,
  model: string,
  input: ScanInput,
  language: SupportedLanguage,
  strictRetry: boolean,
): Promise<string> {
  const parts: Record<string, unknown>[] = [
    {
      text: `${systemPrompt(language, strictRetry)}\n\n${userText(input)}`,
    },
  ]
  if (input.type === 'screenshot') {
    parts.push({
      inlineData: {
        mimeType: input.mimeType,
        data: input.base64,
      },
    })
  }

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
    18_000,
  )
  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}.`)
  }
  return geminiContent(await readJsonResponse(response))
}

async function callAndValidate(
  call: (strictRetry: boolean) => Promise<string>,
  language: SupportedLanguage,
): Promise<AiAnalysis> {
  let lastError: unknown
  for (const strictRetry of [false, true]) {
    try {
      return parseAiAnalysis(await call(strictRetry), language)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

function modelsFromEnvironment(
  value: string | undefined,
  defaults: string[],
): string[] {
  const configured = value
    ?.split(',')
    .map((model) => model.trim())
    .filter(Boolean)
  return configured?.length ? configured : defaults
}

async function analyzeText(
  input: ScanInput,
  language: SupportedLanguage,
): Promise<AiRunResult> {
  const openRouterKey = process.env.AI_OPENROUTER_API_KEY
  const groqKey = process.env.AI_GROQ_API_KEY
  let attempted = false

  if (openRouterKey) {
    attempted = true
    const models = modelsFromEnvironment(
      process.env.AI_OPENROUTER_TEXT_MODELS,
      [
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemma-2-9b-it:free',
        'mistralai/mistral-7b-instruct:free',
      ],
    )
    for (const model of models) {
      try {
        const analysis = await callAndValidate(
          (strictRetry) =>
            callOpenAiCompatible(
              'https://openrouter.ai/api/v1/chat/completions',
              openRouterKey,
              model,
              input,
              language,
              strictRetry,
              process.env.APP_ORIGIN
                ? { 'HTTP-Referer': process.env.APP_ORIGIN }
                : {},
            ),
          language,
        )
        return { analysis, attempted, partial: false }
      } catch {
        // Continue through configured free models, then use Groq.
      }
    }
  }

  if (groqKey) {
    attempted = true
    try {
      const analysis = await callAndValidate(
        (strictRetry) =>
          callOpenAiCompatible(
            'https://api.groq.com/openai/v1/chat/completions',
            groqKey,
            process.env.AI_GROQ_MODEL ?? 'llama-3.3-70b-versatile',
            input,
            language,
            strictRetry,
          ),
        language,
      )
      return { analysis, attempted, partial: false }
    } catch {
      // Return the deterministic result as partial.
    }
  }

  return { analysis: null, attempted, partial: true }
}

async function analyzeScreenshot(
  input: Extract<ScanInput, { type: 'screenshot' }>,
  language: SupportedLanguage,
): Promise<AiRunResult> {
  const geminiKey = process.env.AI_GEMINI_API_KEY
  const openRouterKey = process.env.AI_OPENROUTER_API_KEY
  let attempted = false

  if (geminiKey) {
    attempted = true
    try {
      const analysis = await callAndValidate(
        (strictRetry) =>
          callGemini(
            geminiKey,
            process.env.AI_GEMINI_MODEL ?? 'gemini-2.0-flash',
            input,
            language,
            strictRetry,
          ),
        language,
      )
      return { analysis, attempted, partial: false }
    } catch {
      // Fall through to the OpenRouter vision model.
    }
  }

  if (openRouterKey) {
    attempted = true
    try {
      const analysis = await callAndValidate(
        (strictRetry) =>
          callOpenAiCompatible(
            'https://openrouter.ai/api/v1/chat/completions',
            openRouterKey,
            process.env.AI_OPENROUTER_VISION_MODEL ??
              'qwen/qwen2.5-vl-72b-instruct:free',
            input,
            language,
            strictRetry,
          ),
        language,
      )
      return { analysis, attempted, partial: false }
    } catch {
      // Return the deterministic result as partial.
    }
  }

  return { analysis: null, attempted, partial: true }
}

export async function analyzeWithAi(
  input: ScanInput,
  language: SupportedLanguage,
): Promise<AiRunResult> {
  return input.type === 'screenshot'
    ? analyzeScreenshot(input, language)
    : analyzeText(input, language)
}
