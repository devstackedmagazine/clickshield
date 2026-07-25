import {
  Camera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera'
import {
  BrowserQRCodeReader,
  type IScannerControls,
} from '@zxing/browser'
import type { ScanInput } from '../../types/analysis.ts'
import { routeQrValue } from '../analysis/urlUtils.ts'

const qrReader = new BrowserQRCodeReader()

export async function decodeQrImageUrl(imageUrl: string): Promise<string> {
  const result = await qrReader.decodeFromImageUrl(imageUrl)
  return result.getText()
}

export async function decodeQrFile(file: Blob): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    return await decodeQrImageUrl(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function captureQrCode(): Promise<string> {
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.Base64,
    allowEditing: false,
    correctOrientation: true,
    quality: 90,
  })
  if (!photo.base64String) {
    throw new Error('The camera did not return image data.')
  }
  return decodeQrImageUrl(
    `data:image/${photo.format};base64,${photo.base64String}`,
  )
}

export async function startQrVideoScanner(
  preview: HTMLVideoElement,
  onDecoded: (value: string) => void,
  deviceId?: string,
): Promise<IScannerControls> {
  return qrReader.decodeFromVideoDevice(
    deviceId,
    preview,
    (result, _error, controls) => {
      if (result) {
        controls.stop()
        onDecoded(result.getText())
      }
    },
  )
}

export function decodedQrToScanInput(rawValue: string): ScanInput {
  return routeQrValue(rawValue)
}
