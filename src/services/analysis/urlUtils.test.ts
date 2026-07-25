import { describe, expect, it } from 'vitest'
import {
  extractUrls,
  isSameOrSubdomain,
  normalizeUrl,
  routeQrValue,
} from './urlUtils.ts'

describe('URL utilities', () => {
  it('normalizes HTTP URLs and bare domains', () => {
    expect(normalizeUrl('Example.COM/login#section')).toBe(
      'https://example.com/login',
    )
    expect(normalizeUrl('https://Example.COM/a?b=1')).toBe(
      'https://example.com/a?b=1',
    )
  })

  it('matches exact domains and true subdomains only', () => {
    expect(isSameOrSubdomain('youtube.com', 'youtube.com')).toBe(true)
    expect(isSameOrSubdomain('m.youtube.com', 'youtube.com')).toBe(true)
    expect(isSameOrSubdomain('notyoutube.com', 'youtube.com')).toBe(false)
  })

  it('extracts and deduplicates links from text', () => {
    expect(
      extractUrls('See example.com/a and https://example.com/a.'),
    ).toEqual(['https://example.com/a'])
  })

  it('routes QR values through the regular URL or text pipeline', () => {
    expect(routeQrValue('example.com/login')).toEqual({
      type: 'url',
      value: 'https://example.com/login',
    })
    expect(routeQrValue('Use code 1234')).toEqual({
      type: 'text',
      value: 'Use code 1234',
    })
  })
})
