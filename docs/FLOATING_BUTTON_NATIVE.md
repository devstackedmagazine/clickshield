# ClickShield — Floating Button Native Android Implementation

This document specifies the native Android implementation that will back
`NativeFloatingButton` in [`src/services/native/floatingButton.ts`](../src/services/native/floatingButton.ts).

**No UI code changes when this ships.** The React layer talks only to the
`FloatingButtonService` interface. Implementing this plugin means filling in the
`TODO` bodies in `NativeFloatingButton` and nothing else.

---

## Why native is required

The web implementation renders the button inside the ClickShield web view. It
therefore:

- cannot appear on top of other apps (it is confined to the browser viewport)
- cannot capture the screen outside itself

Both capabilities require Android system APIs.

---

## Required permissions

Add to `android/app/src/main/AndroidManifest.xml`:

| Permission | Purpose |
|---|---|
| `SYSTEM_ALERT_WINDOW` | Draw the button over other apps |
| `FOREGROUND_SERVICE` | Keep the overlay alive when ClickShield is backgrounded |
| `FOREGROUND_SERVICE_MEDIA_PROJECTION` | Required on Android 14+ for screenshot capture |
| `POST_NOTIFICATIONS` | Android 13+ requires the foreground-service notification |

```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<service
    android:name=".floatingbutton.FloatingButtonService"
    android:exported="false"
    android:foregroundServiceType="mediaProjection" />
```

`SYSTEM_ALERT_WINDOW` is **not** granted by a runtime permission dialog. It
requires sending the user to a system settings screen (see *Permission flow*).

---

## Files to create

All under `android/app/src/main/java/com/clickshield/app/floatingbutton/`:

| File | Responsibility |
|---|---|
| `FloatingButtonPlugin.kt` | Capacitor bridge — exposes methods/events to JS |
| `FloatingButtonService.kt` | Foreground service owning the overlay lifecycle |
| `FloatingButtonView.kt` | The `WindowManager` overlay view + drag/snap logic |
| `ScreenCaptureManager.kt` | `MediaProjection` → `ImageReader` → `Bitmap` → base64 |

---

## Plugin method signatures

These map 1:1 onto the `FloatingButtonService` TypeScript interface.

```kotlin
@CapacitorPlugin(name = "FloatingButton")
class FloatingButtonPlugin : Plugin() {

    @PluginMethod fun isSupported(call: PluginCall)
    // → resolve { supported: Boolean }  (Build.VERSION.SDK_INT >= 23)

    @PluginMethod fun hasOverlayPermission(call: PluginCall)
    // → resolve { granted: Settings.canDrawOverlays(context) }

    @PluginMethod fun requestOverlayPermission(call: PluginCall)
    // → launches ACTION_MANAGE_OVERLAY_PERMISSION, resolves on activity result

    @PluginMethod fun startService(call: PluginCall)
    // → ContextCompat.startForegroundService(...) ; resolve()

    @PluginMethod fun stopService(call: PluginCall)
    // → context.stopService(...) ; resolve()

    @PluginMethod fun isServiceRunning(call: PluginCall)
    // → resolve { visible: Boolean }

    @PluginMethod fun requestScreenCapture(call: PluginCall)
    // → launches MediaProjection consent intent, then captures one frame
}
```

### Events emitted to JS

| Event | Payload | Maps to |
|---|---|---|
| `floatingButtonTapped` | `{}` | `onTap(callback)` |
| `screenCaptured` | `{ base64: String? }` | `onCapture(callback)` |

Emit with `notifyListeners("floatingButtonTapped", JSObject())`.

---

## Permission flow

```
hasOverlayPermission()
   └─ false ─▶ requestOverlayPermission()
                 └─ Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                           Uri.parse("package:$packageName"))
                    startActivityForResult(...)
                    └─ onActivityResult ▶ re-check Settings.canDrawOverlays()
                                          resolve { granted }
```

The system settings screen cannot be skipped or auto-approved. Show an
in-app explainer *before* firing the intent so the user knows what to enable —
otherwise most users bounce off the settings screen without granting.

---

## Overlay view notes (`FloatingButtonView.kt`)

- Window type: `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` (API 26+)
- Flags: `FLAG_NOT_FOCUSABLE or FLAG_LAYOUT_NO_LIMITS`
- Format: `PixelFormat.TRANSLUCENT`
- Drag: handle `ACTION_DOWN` / `ACTION_MOVE` / `ACTION_UP` in `onTouchEvent`,
  updating `LayoutParams.x/y` via `windowManager.updateViewLayout(...)`
- Snap-to-edge on `ACTION_UP`: animate x to `0` or `screenWidth - buttonWidth`
  with a `ValueAnimator` (~300 ms, `DecelerateInterpolator`)
- Tap vs drag: same 8 px threshold the web implementation uses, so the two
  providers feel identical
- Persist last position in `SharedPreferences` so it survives service restarts

---

## Screenshot flow (`ScreenCaptureManager.kt`)

```
requestScreenCapture()
  ├─ MediaProjectionManager.createScreenCaptureIntent()
  ├─ startActivityForResult → user grants "Start recording?" consent
  ├─ MediaProjectionManager.getMediaProjection(resultCode, data)
  ├─ ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
  ├─ mediaProjection.createVirtualDisplay(..., imageReader.surface, ...)
  ├─ imageReader.acquireLatestImage() → Image → Bitmap
  ├─ Bitmap.compress(JPEG, 80, outputStream)
  ├─ Base64.encodeToString(bytes, Base64.NO_WRAP)
  └─ notifyListeners("screenCaptured", { base64 })
```

Important details:

- **Hide the overlay button before capturing**, then restore it — otherwise the
  button appears in its own screenshot.
- Release `VirtualDisplay`, `ImageReader`, and `MediaProjection` immediately
  after grabbing the frame; leaking these drains battery and trips Play Store
  policy checks.
- Android 14+ requires the service to already be running as
  `foregroundServiceType="mediaProjection"` *before* `getMediaProjection` is
  called, or the system throws.
- Consent is per-capture-session on most OEM builds — do not assume one grant
  lasts forever.

---

## Play Store review requirements

`SYSTEM_ALERT_WINDOW` is a sensitive permission and gets manual review. To pass:

1. **Declare the core-functionality justification.** ClickShield's floating
   button is the primary scan entry point, which is an accepted use case
   (comparable to chat heads / accessibility overlays).
2. **Never obscure system UI.** Do not draw over the status bar, navigation bar,
   or system permission dialogs.
3. **Provide an in-app off switch.** Already satisfied: Settings →
   *Floating Scan Button* toggle, plus the long-press → *Turn off permanently*
   action sheet.
4. **Disclose screen capture in the privacy policy.** State explicitly that
   screenshots are analyzed and never uploaded without user action.
5. **Record a demo video** of the overlay flow — reviewers routinely request one
   for overlay apps.

Expect the first submission with this permission to take longer than a normal
review cycle. Budget for it.
