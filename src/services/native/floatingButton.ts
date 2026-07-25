import { Capacitor } from '@capacitor/core';

export type FloatingButtonProvider = 'web' | 'native';

export interface FloatingButtonService {
  isSupported(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  show(): Promise<void>;
  hide(): Promise<void>;
  isVisible(): Promise<boolean>;
  onTap(callback: () => void): void;
  onCapture(callback: (base64: string | null) => void): void;
}

/**
 * Web provider — the button is rendered by React inside the app window.
 * It cannot escape the browser viewport, so it cannot overlay other apps
 * and cannot capture the screen.
 */
export class WebFloatingButton implements FloatingButtonService {
  private visible = false;
  private tapCallbacks: Array<() => void> = [];
  private captureCallbacks: Array<(base64: string | null) => void> = [];

  async isSupported(): Promise<boolean> {
    return true;
  }

  async hasPermission(): Promise<boolean> {
    // No OS permission is involved when the button lives inside the web view.
    return true;
  }

  async requestPermission(): Promise<boolean> {
    return true;
  }

  async show(): Promise<void> {
    this.visible = true;
  }

  async hide(): Promise<void> {
    this.visible = false;
  }

  async isVisible(): Promise<boolean> {
    return this.visible;
  }

  onTap(callback: () => void): void {
    this.tapCallbacks.push(callback);
  }

  onCapture(callback: (base64: string | null) => void): void {
    this.captureCallbacks.push(callback);
    // The web view cannot screenshot content outside itself.
    callback(null);
  }

  /** Used by the React layer to fan a tap out to registered listeners. */
  emitTap(): void {
    this.tapCallbacks.forEach((cb) => cb());
  }
}

/**
 * Native provider — backed by an Android foreground service that draws a
 * SYSTEM_ALERT_WINDOW overlay and screenshots via MediaProjection.
 *
 * See docs/FLOATING_BUTTON_NATIVE.md for the full implementation plan.
 * Every method below is intentionally unimplemented so that shipping the
 * plugin is a change to this file only — no UI code has to move.
 */
export class NativeFloatingButton implements FloatingButtonService {
  async isSupported(): Promise<boolean> {
    // TODO: return Capacitor.isPluginAvailable('FloatingButton')
    throw new Error('Not implemented');
  }

  async hasPermission(): Promise<boolean> {
    // TODO: const { granted } = await FloatingButtonPlugin.hasOverlayPermission()
    throw new Error('Not implemented');
  }

  async requestPermission(): Promise<boolean> {
    // TODO: FloatingButtonPlugin.requestOverlayPermission()
    throw new Error('Not implemented');
  }

  async show(): Promise<void> {
    // TODO: FloatingButtonPlugin.startService()
    throw new Error('Not implemented');
  }

  async hide(): Promise<void> {
    // TODO: FloatingButtonPlugin.stopService()
    throw new Error('Not implemented');
  }

  async isVisible(): Promise<boolean> {
    // TODO: const { visible } = await FloatingButtonPlugin.isServiceRunning()
    throw new Error('Not implemented');
  }

  onTap(_callback: () => void): void {
    // TODO: FloatingButtonPlugin.addListener('floatingButtonTapped', _callback)
    throw new Error('Not implemented');
  }

  onCapture(_callback: (base64: string | null) => void): void {
    // TODO: FloatingButtonPlugin.addListener('screenCaptured', ({ base64 }) => _callback(base64))
    throw new Error('Not implemented');
  }
}

let cachedService: FloatingButtonService | null = null;

export function getFloatingButtonService(): FloatingButtonService {
  if (cachedService) return cachedService;

  const isNative = Capacitor.isNativePlatform();
  const hasPlugin = Capacitor.isPluginAvailable('FloatingButton');

  cachedService = isNative && hasPlugin ? new NativeFloatingButton() : new WebFloatingButton();
  return cachedService;
}

export function getActiveProvider(): FloatingButtonProvider {
  return getFloatingButtonService() instanceof NativeFloatingButton ? 'native' : 'web';
}
