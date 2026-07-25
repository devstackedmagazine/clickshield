import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonActionSheet, IonIcon, IonToast } from '@ionic/react';
import { addOutline, cameraOutline, clipboardOutline, scanOutline, shieldCheckmark } from 'ionicons/icons';
import { useFloatingButton } from '../../contexts/FloatingButtonContext';
import { getFloatingButtonService } from '../../services/native/floatingButton';
import './FloatingButton.css';

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 16;
const DRAG_THRESHOLD_PX = 8;
const LONG_PRESS_MS = 600;
const SNAP_ANIMATION_MS = 300;
const PANEL_MIN_WIDTH = 200;
const PANEL_GAP_ABOVE_BUTTON = 68;

/** Routes where the floating button must never appear. */
const HIDDEN_ROUTES = [
  '/splash',
  '/onboarding',
  '/onboarding/language',
  '/onboarding/permissions',
  '/link-blocked',
  '/parent-pin-setup',
];

type ToastState = { message: string; color: 'warning' | 'medium' } | null;

interface ActionDefinition {
  key: string;
  icon: string;
  label: string;
}

const ACTIONS: ActionDefinition[] = [
  { key: 'quick-scan', icon: scanOutline, label: 'Quick Scan' },
  { key: 'paste-check', icon: clipboardOutline, label: 'Paste & Check' },
  { key: 'capture', icon: cameraOutline, label: 'Capture Screen' },
];

async function triggerHaptic(style: 'medium' | 'heavy') {
  try {
    // Haptics is optional — it is a no-op on web and the plugin may not be installed.
    const haptics = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } })
      .Capacitor?.Plugins?.Haptics as
      | { impact?: (opts: { style: string }) => Promise<void> }
      | undefined;
    await haptics?.impact?.({ style: style === 'heavy' ? 'HEAVY' : 'MEDIUM' });
  } catch {
    // Haptics unavailable — silently ignore.
  }
}

function FloatingButton() {
  const history = useHistory();
  const location = useLocation();
  const {
    isVisible,
    position,
    isExpanded,
    isDragging,
    setPosition,
    setDragging,
    toggleExpanded,
    collapse,
    disable,
    hideForSession,
  } = useFloatingButton();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, originX: 0, originY: 0 });
  const movedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livePositionRef = useRef(position);

  const [isPressed, setIsPressed] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [renderPosition, setRenderPosition] = useState(position);
  const [isPanelMounted, setIsPanelMounted] = useState(false);

  // Keep the rendered position in sync when context position changes externally.
  useEffect(() => {
    livePositionRef.current = position;
    setRenderPosition(position);
  }, [position]);

  // Keep the panel mounted briefly after collapse so its CSS close transition
  // (scale + fade, 0.15s) can actually play instead of the node vanishing instantly.
  useEffect(() => {
    if (isExpanded) {
      setIsPanelMounted(true);
      return;
    }
    const timer = setTimeout(() => setIsPanelMounted(false), 180);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clampPosition = useCallback((x: number, y: number) => {
    const maxX = window.innerWidth - BUTTON_SIZE - 8;
    const maxY = window.innerHeight - BUTTON_SIZE - 8;
    return {
      x: Math.min(Math.max(x, 8), Math.max(maxX, 8)),
      y: Math.min(Math.max(y, 8), Math.max(maxY, 8)),
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      movedRef.current = false;
      setIsPressed(true);
      setIsSnapping(false);

      dragStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        originX: livePositionRef.current.x,
        originY: livePositionRef.current.y,
      };

      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        if (!movedRef.current) {
          triggerHaptic('heavy');
          setShowActionSheet(true);
        }
      }, LONG_PRESS_MS);
    },
    [clearLongPressTimer],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

      const dx = event.clientX - dragStartRef.current.pointerX;
      const dy = event.clientY - dragStartRef.current.pointerY;
      const distance = Math.hypot(dx, dy);

      if (!movedRef.current && distance < DRAG_THRESHOLD_PX) return;

      if (!movedRef.current) {
        movedRef.current = true;
        clearLongPressTimer();
        setDragging(true);
        collapse();
      }

      const next = clampPosition(
        dragStartRef.current.originX + dx,
        dragStartRef.current.originY + dy,
      );
      livePositionRef.current = next;
      setRenderPosition(next);
    },
    [clampPosition, clearLongPressTimer, collapse, setDragging],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      clearLongPressTimer();
      setIsPressed(false);

      if (!movedRef.current) {
        // Treated as a tap, not a drag.
        setDragging(false);
        triggerHaptic('medium');
        toggleExpanded();
        return;
      }

      // Snap to the nearest horizontal edge, preserving vertical position.
      const current = livePositionRef.current;
      const centerX = current.x + BUTTON_SIZE / 2;
      const snappedX =
        centerX < window.innerWidth / 2
          ? EDGE_MARGIN
          : window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
      const snapped = clampPosition(snappedX, current.y);

      setIsSnapping(true);
      livePositionRef.current = snapped;
      setRenderPosition(snapped);
      setPosition(snapped.x, snapped.y);
      setDragging(false);

      setTimeout(() => setIsSnapping(false), SNAP_ANIMATION_MS);
    },
    [clampPosition, clearLongPressTimer, setDragging, setPosition, toggleExpanded],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleExpanded();
      } else if (event.key === 'Escape') {
        collapse();
      }
    },
    [collapse, toggleExpanded],
  );

  // Escape collapses the menu even when focus is elsewhere.
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded, collapse]);

  const handleQuickScan = useCallback(() => {
    collapse();
    history.push('/tabs/scan');
  }, [collapse, history]);

  const handlePasteCheck = useCallback(async () => {
    collapse();
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        history.push('/tabs/scan', { prefillText: text });
      } else {
        setToast({ message: 'Nothing in clipboard', color: 'warning' });
      }
    } catch {
      setToast({ message: 'Nothing in clipboard', color: 'warning' });
    }
  }, [collapse, history]);

  const handleCaptureScreen = useCallback(() => {
    collapse();
    const service = getFloatingButtonService();
    service.onCapture((base64) => {
      if (base64) {
        history.push('/tabs/scan', { prefillImage: base64 });
      } else {
        setToast({ message: 'Screen capture requires the Android app', color: 'warning' });
      }
    });
  }, [collapse, history]);

  const actionHandlers: Record<string, () => void> = {
    'quick-scan': handleQuickScan,
    'paste-check': handlePasteCheck,
    capture: handleCaptureScreen,
  };

  const routeHidden = HIDDEN_ROUTES.includes(location.pathname);
  if (!isVisible || routeHidden) {
    return null;
  }

  const isOnRightHalf = renderPosition.x + BUTTON_SIZE / 2 > window.innerWidth / 2;
  // Estimated panel height: 3 rows * 52px + 8px top/bottom padding.
  const estimatedPanelHeight = ACTIONS.length * 52 + 16;
  // Flip below the button when there isn't room to show the panel above it.
  const panelBelow = renderPosition.y - PANEL_GAP_ABOVE_BUTTON - estimatedPanelHeight < 8;

  const buttonClassName = [
    'floating-button',
    isPressed && !isDragging ? 'pressed' : '',
    isDragging ? 'dragging' : '',
    isSnapping ? 'snapping' : '',
    isExpanded ? 'expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const panelStyle: React.CSSProperties = {
    minWidth: PANEL_MIN_WIDTH,
    bottom: panelBelow
      ? undefined
      : window.innerHeight - renderPosition.y + 12,
    top: panelBelow ? renderPosition.y + BUTTON_SIZE + 12 : undefined,
    transformOrigin: panelBelow ? 'top center' : 'bottom center',
  };
  if (isOnRightHalf) {
    panelStyle.right = window.innerWidth - (renderPosition.x + BUTTON_SIZE);
  } else {
    panelStyle.left = renderPosition.x;
  }

  return (
    <>
      {isExpanded && <div className="floating-button-backdrop" onClick={collapse} />}

      {isPanelMounted && (
        <div
          className={`floating-button-panel ${isExpanded ? 'visible' : ''}`}
          style={panelStyle}
          role="menu"
        >
          {ACTIONS.map((action, index) => (
            <div key={action.key}>
              <button
                className="floating-button-panel-row"
                role="menuitem"
                onClick={actionHandlers[action.key]}
              >
                <span className="floating-button-panel-icon-circle">
                  <IonIcon icon={action.icon} />
                </span>
                <span className="floating-button-panel-label">{action.label}</span>
              </button>
              {index < ACTIONS.length - 1 && <div className="floating-button-panel-divider" />}
            </div>
          ))}
        </div>
      )}

      <button
        ref={buttonRef}
        className={buttonClassName}
        style={{
          transform: `translate3d(${renderPosition.x}px, ${renderPosition.y}px, 0)${
            isExpanded ? ' scale(1.05)' : ''
          }`,
        }}
        role="button"
        aria-label="ClickShield quick scan"
        aria-expanded={isExpanded}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <IonIcon icon={isExpanded ? addOutline : shieldCheckmark} />
      </button>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Floating Button"
        buttons={[
          { text: 'Hide for now', handler: () => hideForSession() },
          { text: 'Turn off permanently', role: 'destructive', handler: () => disable() },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />

      <IonToast
        isOpen={toast !== null}
        message={toast?.message}
        duration={2000}
        position="top"
        color={toast?.color}
        onDidDismiss={() => setToast(null)}
      />
    </>
  );
}

export default FloatingButton;
