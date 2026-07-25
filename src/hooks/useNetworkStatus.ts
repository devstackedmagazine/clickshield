import { useEffect, useState } from 'react'
import { Network } from '@capacitor/network'
import {
  getNetworkStatus,
  type NetworkStatus,
} from '../services/offline/networkStatus.ts'

const INITIAL_STATUS: NetworkStatus = {
  connected: typeof navigator === 'undefined' ? true : navigator.onLine,
  connectionType: 'unknown',
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(INITIAL_STATUS)

  useEffect(() => {
    let active = true
    void getNetworkStatus().then((nextStatus) => {
      if (active) {
        setStatus(nextStatus)
      }
    })

    const listener = Network.addListener('networkStatusChange', (nextStatus) => {
      if (active) {
        setStatus({
          connected: nextStatus.connected,
          connectionType: nextStatus.connectionType,
        })
      }
    })

    return () => {
      active = false
      void listener.then((handle) => handle.remove())
    }
  }, [])

  return status
}
