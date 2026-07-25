import { Device } from '@capacitor/device'

export type OfflineModelEligibility = {
  eligible: boolean
  memoryGb: number | null
  reason: 'eligible' | 'insufficient-memory' | 'memory-unknown'
}

type NavigatorWithDeviceMemory = Navigator & { deviceMemory?: number }

export async function getOfflineModelEligibility(): Promise<OfflineModelEligibility> {
  await Device.getInfo().catch(() => null)
  const memoryGb =
    typeof navigator === 'undefined'
      ? null
      : (navigator as NavigatorWithDeviceMemory).deviceMemory ?? null

  if (memoryGb === null) {
    return {
      eligible: false,
      memoryGb: null,
      reason: 'memory-unknown',
    }
  }
  return {
    eligible: memoryGb >= 6,
    memoryGb,
    reason: memoryGb >= 6 ? 'eligible' : 'insufficient-memory',
  }
}
