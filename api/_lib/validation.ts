import type {
  ScanInput,
  ScanRequest,
  SupportedLanguage,
} from '../../src/types/analysis.ts'
import {
  isSupportedLanguage,
  ScanServiceError,
} from '../../src/types/analysis.ts'
import { normalizeUrl } from '../../src/services/analysis/urlUtils.ts'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_TEXT_LENGTH = 10_000
const MAX_URL_LENGTH = 2_048

function decodedBase64Size(value: string): number {
  const normalized = value.replace(/\s/g, '')
  const padding = normalized.endsWith('==')
    ? 2
    : normalized.endsWith('=')
      ? 1
      : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

function validateTextValue(
  value: unknown,
  name: string,
  maximumLength: number,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: `${name} must be a non-empty string.`,
    })
  }
  const trimmed = value.trim()
  if (trimmed.length > maximumLength) {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: `${name} is too long.`,
    })
  }
  return trimmed
}

export function validateScanInput(value: unknown): ScanInput {
  if (!value || typeof value !== 'object') {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: 'A scan input is required.',
    })
  }
  const input = value as Record<string, unknown>

  switch (input.type) {
    case 'url': {
      const raw = validateTextValue(input.value, 'URL', MAX_URL_LENGTH)
      const normalized = normalizeUrl(raw)
      if (!normalized) {
        throw new ScanServiceError({
          code: 'INVALID_INPUT',
          message: 'The URL is not valid.',
        })
      }
      return { type: 'url', value: normalized }
    }
    case 'text':
      return {
        type: 'text',
        value: validateTextValue(input.value, 'Text', MAX_TEXT_LENGTH),
      }
    case 'qr':
      return {
        type: 'qr',
        rawValue: validateTextValue(
          input.rawValue,
          'QR value',
          MAX_TEXT_LENGTH,
        ),
    }
    case 'screenshot': {
      if (input.mimeType !== 'image/jpeg' && input.mimeType !== 'image/png') {
        throw new ScanServiceError({
          code: 'UNSUPPORTED_FORMAT',
          message: 'Only JPEG and PNG screenshots are supported.',
        })
      }
      const normalizedBase64 =
        typeof input.base64 === 'string'
          ? input.base64.replace(/\s/g, '')
          : ''
      if (
        normalizedBase64.length === 0 ||
        normalizedBase64.length % 4 !== 0 ||
        !/^[a-z\d+/]+={0,2}$/i.test(normalizedBase64)
      ) {
        throw new ScanServiceError({
          code: 'INVALID_INPUT',
          message: 'Screenshot data is not valid base64.',
        })
      }
      if (decodedBase64Size(normalizedBase64) > MAX_IMAGE_BYTES) {
        throw new ScanServiceError({
          code: 'IMAGE_TOO_LARGE',
          message: 'Screenshots must be no larger than 2 MB.',
        })
      }
      return {
        type: 'screenshot',
        base64: normalizedBase64,
        mimeType: input.mimeType,
      }
    }
    default:
      throw new ScanServiceError({
        code: 'INVALID_INPUT',
        message: 'Unsupported scan input type.',
      })
  }
}

export function validateScanRequest(value: unknown): ScanRequest {
  if (!value || typeof value !== 'object') {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: 'The request body must be a JSON object.',
    })
  }
  const request = value as Record<string, unknown>
  if (!isSupportedLanguage(request.language)) {
    throw new ScanServiceError({
      code: 'INVALID_INPUT',
      message: 'The selected language is not supported.',
    })
  }
  return {
    input: validateScanInput(request.input),
    language: request.language as SupportedLanguage,
  }
}
