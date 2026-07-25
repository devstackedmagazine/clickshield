import { Network } from '@capacitor/network'

export type NetworkStatus = {
  connected: boolean
  connectionType: string
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const status = await Network.getStatus()
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    }
  } catch {
    return {
      connected:
        typeof navigator === 'undefined' ? true : navigator.onLine !== false,
      connectionType: 'unknown',
    }
  }
}
