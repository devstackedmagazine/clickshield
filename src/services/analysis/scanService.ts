import type {
  ScanError,
  ScanInput,
  ScanResult,
  ScanStep,
  ScanStepId,
  ScanVerdict,
  SupportedLanguage,
} from '../../types/analysis.ts'
import { ScanServiceError } from '../../types/analysis.ts'
import { guardianService, type GuardianService } from '../guardian/guardianService.ts'
import { saveScanToHistory } from '../history/historyService.ts'
import { getNetworkStatus } from '../offline/networkStatus.ts'
import {
  getDemoFixture,
  getDemoFixtureNameFromLocation,
  type DemoFixtureName,
} from './demoFixtures.ts'
import { getMessages } from './i18n.ts'
import { analyzeLocally } from './localAnalyzer.ts'
import { createTrace } from './progress.ts'
import { parseScanResult } from './scanResultSchema.ts'
import { normalizeUrl } from './urlUtils.ts'

type ProgressCallback = (step: ScanStep) => void

type ScanDependencies = {
  guardian: Pick<GuardianService, 'match'>
  networkStatus: typeof getNetworkStatus
  saveHistory: typeof saveScanToHistory
  fetcher: typeof fetch
  demoFixtureName: () => DemoFixtureName | null
  endpoint: string
}

const DEFAULT_ENDPOINT =
  import.meta.env.VITE_SCAN_API_URL?.replace(/\/$/, '') + '/api/scan'

const defaultDependencies: ScanDependencies = {
  guardian: guardianService,
  networkStatus: getNetworkStatus,
  saveHistory: saveScanToHistory,
  fetcher: fetch,
  demoFixtureName: getDemoFixtureNameFromLocation,
  endpoint: import.meta.env.VITE_SCAN_API_URL ? DEFAULT_ENDPOINT : '/api/scan',
}

const VERDICT_PRIORITY: Record<ScanVerdict, number> = {
  noKnownRisk: 0,
  caution: 1,
  highRisk: 2,
  blocked: 3,
}

function validateClientInput(input: ScanInput): void {
  if (input.type === 'url' && !normalizeUrl(input.value)) {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: 'Enter a valid HTTP or HTTPS URL.',
    })
  }
  if (
    (input.type === 'text' && !input.value.trim()) ||
    (input.type === 'qr' && !input.rawValue.trim())
  ) {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: 'The scan input cannot be empty.',
    })
  }
  if (input.type === 'screenshot') {
    const padding = input.base64.endsWith('==')
      ? 2
      : input.base64.endsWith('=')
        ? 1
        : 0
    const bytes = Math.floor((input.base64.length * 3) / 4) - padding
    if (bytes > 2 * 1024 * 1024) {
      throw new ScanServiceError({
        code: 'IMAGE_TOO_LARGE',
        message: 'Screenshots must be no larger than 2 MB.',
      })
    }
  }
}

function emit(
  language: SupportedLanguage,
  onProgress: ProgressCallback,
  id: ScanStepId,
  status: ScanStep['status'],
): void {
  const step = createTrace(language).find((candidate) => candidate.id === id)
  if (step) {
    onProgress({ ...step, status })
  }
}

function partialLocalResult(
  local: ScanResult,
  failedStep: 'ai' | 'reputation',
): ScanResult {
  const trace = createTrace(local.language, {
    local: 'done',
    ai: failedStep === 'ai' ? 'failed' : 'done',
    reputation: failedStep === 'reputation' ? 'failed' : 'skipped',
    combining: 'done',
  })
  return {
    ...local,
    isPartialResult: true,
    trace,
    scannedAt: new Date().toISOString(),
  }
}

function mergeClientResults(local: ScanResult, remote: ScanResult): ScanResult {
  const verdict =
    VERDICT_PRIORITY[local.verdict] > VERDICT_PRIORITY[remote.verdict]
      ? local.verdict
      : remote.verdict
  const signals = [...local.signals, ...remote.signals].filter(
    (signal, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.type === signal.type &&
          candidate.evidence === signal.evidence &&
          candidate.reason === signal.reason,
      ) === index,
  )
  return {
    ...remote,
    verdict,
    riskScore: Math.max(local.riskScore, remote.riskScore),
    signals,
    extractedUrls: [
      ...new Set([...local.extractedUrls, ...remote.extractedUrls]),
    ],
    detectedPhones: [
      ...new Set([...local.detectedPhones, ...remote.detectedPhones]),
    ],
    summary:
      verdict === remote.verdict
        ? remote.summary
        : getMessages(remote.language).summary[verdict],
    recommendedAction: getMessages(remote.language).action[verdict],
  }
}

function scanErrorFromResponse(value: unknown): ScanError | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const error = (value as Record<string, unknown>).error
  if (!error || typeof error !== 'object') {
    return null
  }
  const code = (error as Record<string, unknown>).code
  const message = (error as Record<string, unknown>).message
  if (typeof code !== 'string' || typeof message !== 'string') {
    return null
  }
  const supportedCodes: ScanError['code'][] = [
    'INVALID_INPUT',
    'OFFLINE_NO_MODEL',
    'AI_FAILURE',
    'VIRUSTOTAL_FAILURE',
    'QUOTA_EXHAUSTED',
    'IMAGE_TOO_LARGE',
    'UNSUPPORTED_FORMAT',
    'TIMEOUT',
  ]
  return supportedCodes.includes(code as ScanError['code'])
    ? ({ code, message } as ScanError)
    : null
}

async function saveResult(
  dependencies: ScanDependencies,
  input: ScanInput,
  result: ScanResult,
): Promise<ScanResult> {
  await dependencies.saveHistory({ input, result })
  return result
}

export function createScanService(
  overrides: Partial<ScanDependencies> = {},
): (
  input: ScanInput,
  language: SupportedLanguage,
  onProgress?: ProgressCallback,
) => Promise<ScanResult> {
  const dependencies = { ...defaultDependencies, ...overrides }

  return async (
    input: ScanInput,
    language: SupportedLanguage,
    onProgress: ProgressCallback = () => undefined,
  ): Promise<ScanResult> => {
    validateClientInput(input)

    const demoName = dependencies.demoFixtureName()
    if (demoName) {
      const fixture = getDemoFixture(demoName, language)
      for (const step of fixture.result.trace) {
        onProgress(step)
      }
      return saveResult(dependencies, fixture.input, fixture.result)
    }

    emit(language, onProgress, 'local', 'running')
    const guardianMatch = dependencies.guardian.match(input)
    if (guardianMatch) {
      const result = analyzeLocally(input, language, {
        blockedUrls: [guardianMatch.matchedUrl],
        blockedReason: getMessages(language).reason.guardian,
      })
      emit(language, onProgress, 'local', 'done')
      emit(language, onProgress, 'ai', 'skipped')
      emit(language, onProgress, 'reputation', 'skipped')
      emit(language, onProgress, 'combining', 'done')
      return saveResult(dependencies, input, result)
    }

    const local = analyzeLocally(input, language)
    emit(language, onProgress, 'local', 'done')
    if (local.verdict === 'blocked') {
      emit(language, onProgress, 'ai', 'skipped')
      emit(language, onProgress, 'reputation', 'skipped')
      emit(language, onProgress, 'combining', 'done')
      return saveResult(dependencies, input, local)
    }

    const network = await dependencies.networkStatus()
    if (!network.connected) {
      const offline = {
        ...local,
        isOfflineResult: true,
        isPartialResult: true,
        trace: createTrace(language, {
          local: 'done',
          ai: 'skipped',
          reputation: 'skipped',
          combining: 'done',
        }),
      }
      emit(language, onProgress, 'ai', 'skipped')
      emit(language, onProgress, 'reputation', 'skipped')
      emit(language, onProgress, 'combining', 'done')
      return saveResult(dependencies, input, offline)
    }

    emit(language, onProgress, 'ai', 'running')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25_000)
    let response: Response
    try {
      response = await dependencies.fetcher(dependencies.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, language }),
        signal: controller.signal,
      })
    } catch {
      emit(language, onProgress, 'ai', 'failed')
      emit(language, onProgress, 'reputation', 'skipped')
      emit(language, onProgress, 'combining', 'done')
      return saveResult(
        dependencies,
        input,
        partialLocalResult(local, 'ai'),
      )
    } finally {
      clearTimeout(timeout)
    }

    let responseBody: unknown
    try {
      responseBody = await response.json()
    } catch {
      responseBody = null
    }
    if (!response.ok) {
      const typedError = scanErrorFromResponse(responseBody)
      if (
        typedError &&
        ['INVALID_INPUT', 'IMAGE_TOO_LARGE', 'UNSUPPORTED_FORMAT'].includes(
          typedError.code,
        )
      ) {
        throw new ScanServiceError(typedError)
      }
      emit(language, onProgress, 'ai', 'failed')
      emit(language, onProgress, 'reputation', 'skipped')
      emit(language, onProgress, 'combining', 'done')
      return saveResult(
        dependencies,
        input,
        partialLocalResult(local, 'ai'),
      )
    }

    try {
      const remote = parseScanResult(responseBody, language)
      const result = mergeClientResults(local, remote)
      const aiStep = remote.trace.find((step) => step.id === 'ai')
      const reputationStep = remote.trace.find(
        (step) => step.id === 'reputation',
      )
      emit(language, onProgress, 'ai', aiStep?.status ?? 'done')
      emit(
        language,
        onProgress,
        'reputation',
        reputationStep?.status ?? 'done',
      )
      emit(language, onProgress, 'combining', 'done')
      return saveResult(dependencies, input, result)
    } catch {
      emit(language, onProgress, 'ai', 'failed')
      emit(language, onProgress, 'reputation', 'skipped')
      emit(language, onProgress, 'combining', 'done')
      return saveResult(
        dependencies,
        input,
        partialLocalResult(local, 'ai'),
      )
    }
  }
}

export const scan = createScanService()
