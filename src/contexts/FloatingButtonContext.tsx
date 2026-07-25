import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export const FLOATING_BUTTON_ENABLED_KEY = 'floating_button_enabled';
export const FLOATING_BUTTON_POSITION_KEY = 'floating_button_position';

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 16;
const TAB_BAR_OFFSET = 88;
const POSITION_SAVE_DEBOUNCE_MS = 300;

export interface FloatingButtonPosition {
  x: number;
  y: number;
}

interface FloatingButtonContextValue {
  isEnabled: boolean;
  isVisible: boolean;
  position: FloatingButtonPosition;
  isExpanded: boolean;
  isDragging: boolean;
  enable: () => void;
  disable: () => void;
  hideForSession: () => void;
  setPosition: (x: number, y: number) => void;
  setDragging: (dragging: boolean) => void;
  toggleExpanded: () => void;
  collapse: () => void;
}

const FloatingButtonContext = createContext<FloatingButtonContextValue | null>(null);

function getDefaultPosition(): FloatingButtonPosition {
  const width = typeof window === 'undefined' ? 390 : window.innerWidth;
  const height = typeof window === 'undefined' ? 844 : window.innerHeight;
  return {
    x: width - BUTTON_SIZE - EDGE_MARGIN,
    y: height - BUTTON_SIZE - TAB_BAR_OFFSET,
  };
}

function readStoredEnabled(): boolean {
  const stored = localStorage.getItem(FLOATING_BUTTON_ENABLED_KEY);
  return stored === null ? true : stored === 'true';
}

function readStoredPosition(): FloatingButtonPosition {
  try {
    const raw = localStorage.getItem(FLOATING_BUTTON_POSITION_KEY);
    if (!raw) return getDefaultPosition();
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return parsed;
    }
  } catch {
    // fall through to default
  }
  return getDefaultPosition();
}

export function FloatingButtonProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(readStoredEnabled);
  const [hiddenForSession, setHiddenForSession] = useState(false);
  const [position, setPositionState] = useState<FloatingButtonPosition>(readStoredPosition);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const enable = useCallback(() => {
    setIsEnabled(true);
    setHiddenForSession(false);
    localStorage.setItem(FLOATING_BUTTON_ENABLED_KEY, 'true');
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
    setIsExpanded(false);
    localStorage.setItem(FLOATING_BUTTON_ENABLED_KEY, 'false');
  }, []);

  const hideForSession = useCallback(() => {
    setHiddenForSession(true);
    setIsExpanded(false);
  }, []);

  const setPosition = useCallback((x: number, y: number) => {
    setPositionState({ x, y });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(FLOATING_BUTTON_POSITION_KEY, JSON.stringify({ x, y }));
    }, POSITION_SAVE_DEBOUNCE_MS);
  }, []);

  const setDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const value = useMemo<FloatingButtonContextValue>(
    () => ({
      isEnabled,
      isVisible: isEnabled && !hiddenForSession,
      position,
      isExpanded,
      isDragging,
      enable,
      disable,
      hideForSession,
      setPosition,
      setDragging,
      toggleExpanded,
      collapse,
    }),
    [
      isEnabled,
      hiddenForSession,
      position,
      isExpanded,
      isDragging,
      enable,
      disable,
      hideForSession,
      setPosition,
      setDragging,
      toggleExpanded,
      collapse,
    ],
  );

  return <FloatingButtonContext.Provider value={value}>{children}</FloatingButtonContext.Provider>;
}

export function useFloatingButton(): FloatingButtonContextValue {
  const context = useContext(FloatingButtonContext);
  if (!context) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider');
  }
  return context;
}
