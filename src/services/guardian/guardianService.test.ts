import { describe, expect, it } from 'vitest'
import { GuardianService, type StorageLike } from './guardianService.ts'

function createStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('GuardianService', () => {
  it('stores only a PIN hash and requires it for policy changes', async () => {
    const storage = createStorage()
    const guardian = new GuardianService(storage)
    await guardian.setPin('1234')
    await guardian.setEnabled(true, '1234')

    const serialized = storage.getItem('setting_guardian') ?? ''
    expect(serialized).not.toContain('"1234"')
    await expect(
      guardian.addBlockedEntry('domain', 'youtube.com', '9999'),
    ).rejects.toThrow('incorrect')
  })

  it('matches subdomains only when wildcard blocking is enabled', async () => {
    const guardian = new GuardianService(createStorage())
    await guardian.setPin('1234')
    await guardian.addBlockedEntry('domain', 'youtube.com', '1234')
    await guardian.setEnabled(true, '1234')

    expect(
      guardian.match({ type: 'url', value: 'https://m.youtube.com/watch' }),
    ).not.toBeNull()
    expect(
      guardian.match({ type: 'url', value: 'https://notyoutube.com/watch' }),
    ).toBeNull()

    await guardian.setWildcardEnabled(false, '1234')
    expect(
      guardian.match({ type: 'url', value: 'https://m.youtube.com/watch' }),
    ).toBeNull()
  })

  it('exports and imports plain-text blocklists', async () => {
    const source = new GuardianService(createStorage())
    await source.setPin('1234')
    await source.addBlockedEntry('domain', 'example.test', '1234', 'Family')
    const exported = source.exportBlocklist()

    const target = new GuardianService(createStorage())
    await target.setPin('5678')
    expect(await target.importBlocklist(exported, '5678')).toBe(1)
    expect(target.getSettings().blockedDomains[0]?.value).toBe('example.test')
  })
})
