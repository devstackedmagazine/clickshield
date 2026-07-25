import type { ScanInput } from '../../types/analysis.ts'

const URL_SHORTENERS = new Set([
  'bit.ly',
  'buff.ly',
  'cutt.ly',
  'goo.gl',
  'is.gd',
  'ow.ly',
  'rebrand.ly',
  'shorturl.at',
  't.co',
  'tiny.cc',
  'tinyurl.com',
])

const SUSPICIOUS_TLDS = new Set([
  'buzz',
  'click',
  'country',
  'fit',
  'gq',
  'info',
  'kim',
  'link',
  'loan',
  'men',
  'ml',
  'mom',
  'party',
  'pw',
  'rest',
  'review',
  'stream',
  'support',
  'tk',
  'top',
  'work',
  'xyz',
])

const TRUSTED_BRANDS = [
  { name: 'raiffeisen', domains: ['raiffeisen.al', 'raiffeisen.com'] },
  { name: 'bkt', domains: ['bkt.com.al', 'bkt.com'] },
  { name: 'credins', domains: ['bankacredins.com'] },
  { name: 'otp', domains: ['otpbank.al', 'otpbank.com'] },
  { name: 'paypal', domains: ['paypal.com'] },
  { name: 'google', domains: ['google.com'] },
  { name: 'microsoft', domains: ['microsoft.com', 'live.com'] },
] as const

const TRAILING_PUNCTUATION = /[),.;!?'"\]}،؛]+$/u
const LEADING_PUNCTUATION = /^[([{'"]+/u
const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:\/\//iu
const DOMAIN_PATTERN =
  /^(?:www\.)?(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+[\p{L}]{2,63}(?::\d{1,5})?(?:[/?#]\S*)?$/iu
const URL_CANDIDATE_PATTERN =
  /(?:https?:\/\/|www\.)[^\s<>"']+|(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+[\p{L}]{2,63}(?::\d{1,5})?(?:\/[^\s<>"']*)?/giu
const PHONE_PATTERN = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/g

function trimCandidate(value: string): string {
  return value
    .trim()
    .replace(LEADING_PUNCTUATION, '')
    .replace(TRAILING_PUNCTUATION, '')
}

export function normalizeHostname(value: string): string | null {
  const candidate = trimCandidate(value).toLowerCase().replace(/\.$/, '')
  if (!candidate || candidate.includes(' ')) {
    return null
  }

  try {
    const parsed = new URL(
      SCHEME_PATTERN.test(candidate) ? candidate : `https://${candidate}`,
    )
    return parsed.hostname.toLowerCase().replace(/\.$/, '') || null
  } catch {
    return null
  }
}

export function normalizeUrl(value: string): string | null {
  const candidate = trimCandidate(value)
  if (!candidate || (!SCHEME_PATTERN.test(candidate) && !DOMAIN_PATTERN.test(candidate))) {
    return null
  }

  try {
    const parsed = new URL(
      SCHEME_PATTERN.test(candidate) ? candidate : `https://${candidate}`,
    )
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    parsed.hostname = parsed.hostname.toLowerCase().replace(/\.$/, '')
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return null
  }
}

export function isSameOrSubdomain(
  hostname: string,
  blockedDomain: string,
): boolean {
  const host = normalizeHostname(hostname)
  const blocked = normalizeHostname(blockedDomain)
  if (!host || !blocked) {
    return false
  }
  return host === blocked || host.endsWith(`.${blocked}`)
}

export function urlsMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeUrl(left)
  const normalizedRight = normalizeUrl(right)
  return normalizedLeft !== null && normalizedLeft === normalizedRight
}

export function extractUrls(value: string): string[] {
  const candidates = value.match(URL_CANDIDATE_PATTERN) ?? []
  const normalized = candidates
    .map(normalizeUrl)
    .filter((url): url is string => url !== null)
  return [...new Set(normalized)]
}

export function extractPhoneNumbers(value: string): string[] {
  const matches = value.match(PHONE_PATTERN) ?? []
  const normalized = matches
    .map((phone) => phone.trim().replace(/[.\s()-]/g, ''))
    .filter((phone) => phone.replace(/^\+/, '').length >= 7)
  return [...new Set(normalized)]
}

export function routeQrValue(rawValue: string): ScanInput {
  const trimmed = rawValue.trim()
  const normalized = normalizeUrl(trimmed)
  if (normalized) {
    return { type: 'url', value: normalized }
  }
  return { type: 'text', value: trimmed }
}

export function inputAsText(input: ScanInput): string {
  switch (input.type) {
    case 'url':
    case 'text':
      return input.value
    case 'qr':
      return input.rawValue
    case 'screenshot':
      return ''
  }
}

export function urlsFromInput(input: ScanInput): string[] {
  if (input.type === 'screenshot') {
    return []
  }
  if (input.type === 'url') {
    const normalized = normalizeUrl(input.value)
    return normalized ? [normalized] : []
  }
  return extractUrls(inputAsText(input))
}

export function isUrlShortener(hostname: string): boolean {
  const host = normalizeHostname(hostname)
  return host !== null && [...URL_SHORTENERS].some((shortener) =>
    isSameOrSubdomain(host, shortener),
  )
}

export function hasSuspiciousTld(hostname: string): boolean {
  const host = normalizeHostname(hostname)
  if (!host) {
    return false
  }
  const tld = host.split('.').at(-1)
  return tld !== undefined && SUSPICIOUS_TLDS.has(tld)
}

function isTrustedBrandDomain(
  hostname: string,
  domains: readonly string[],
): boolean {
  return domains.some((domain) => isSameOrSubdomain(hostname, domain))
}

export function findImitatedBrand(hostname: string): string | null {
  const host = normalizeHostname(hostname)
  if (!host) {
    return null
  }

  const labels = host.split('.')
  for (const brand of TRUSTED_BRANDS) {
    if (isTrustedBrandDomain(host, brand.domains)) {
      continue
    }
    if (
      labels.some(
        (label) =>
          label === brand.name ||
          (label.includes(brand.name) && label !== brand.name),
      )
    ) {
      return brand.name
    }
  }
  return null
}

export function hasSuspiciousUrlStructure(value: string): boolean {
  const normalized = normalizeUrl(value)
  if (!normalized) {
    return false
  }
  const parsed = new URL(normalized)
  const hyphenCount = (parsed.hostname.match(/-/g) ?? []).length
  const isIpAddress =
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsed.hostname) ||
    parsed.hostname.startsWith('[')
  return (
    parsed.username.length > 0 ||
    isIpAddress ||
    hyphenCount >= 3 ||
    parsed.hostname.split('.').length >= 6
  )
}
