export type BlockedEntry = {
  value: string
  addedAt: string
  label?: string
}

export type GuardianSettings = {
  enabled: boolean
  parentPinHash: string | null
  blockedDomains: BlockedEntry[]
  blockedUrls: BlockedEntry[]
  wildcardEnabled: boolean
}

export type GuardianMatch = {
  entry: BlockedEntry
  kind: 'domain' | 'url'
  matchedUrl: string
}
