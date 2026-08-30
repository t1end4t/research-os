import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

export interface TooltipTargetInfo {
  id: string;
  content: string;
  rect: DOMRect;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
}

export interface ExplainerInfo {
  id: string;
  title: string;
  body: string;
  triggerRect?: DOMRect;
  triggerElement?: HTMLElement | null;
  linkText?: string;
  onNavigate?: () => void;
  onRestoreSurfaceNote?: () => void;
  canRestoreSurfaceNote?: boolean;
}

interface GuidanceContextType {
  // Tooltip
  activeTooltip: TooltipTargetInfo | null;
  showTooltip: (info: TooltipTargetInfo) => void;
  hideTooltip: (id?: string) => void;
  cancelScheduledTooltip: () => void;

  // Explainer
  activeExplainer: ExplainerInfo | null;
  openExplainer: (info: ExplainerInfo) => void;
  closeExplainer: () => void;

  // Surface notes persistence
  dismissedSurfaceNotes: Set<string>;
  dismissSurfaceNote: (surfaceId: string) => void;
  restoreSurfaceNote: (surfaceId: string) => void;
  isSurfaceNoteDismissed: (surfaceId: string) => boolean;

  // User motion preference
  prefersReducedMotion: boolean;
}

const GuidanceContext = createContext<GuidanceContextType | null>(null);

const SURFACE_NOTES_STORAGE_KEY = 'instrument_dismissed_surface_notes_v1';

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const [activeTooltip, setActiveTooltip] = useState<TooltipTargetInfo | null>(null);
  const [activeExplainer, setActiveExplainer] = useState<ExplainerInfo | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Warm sibling tracking: if a tooltip closed within 300ms, open next tooltip immediately
  const lastClosedTimestampRef = useRef<number>(0);
  const openTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Surface notes state
  const [dismissedSurfaceNotes, setDismissedSurfaceNotes] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SURFACE_NOTES_STORAGE_KEY);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch {}
    }
    return new Set<string>();
  });

  const dismissSurfaceNote = useCallback((surfaceId: string) => {
    setDismissedSurfaceNotes((prev) => {
      const next = new Set(prev);
      next.add(surfaceId);
      try {
        localStorage.setItem(
          SURFACE_NOTES_STORAGE_KEY,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
  }, []);

  const restoreSurfaceNote = useCallback((surfaceId: string) => {
    setDismissedSurfaceNotes((prev) => {
      const next = new Set(prev);
      next.delete(surfaceId);
      try {
        localStorage.setItem(
          SURFACE_NOTES_STORAGE_KEY,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
  }, []);

  const isSurfaceNoteDismissed = useCallback(
    (surfaceId: string) => dismissedSurfaceNotes.has(surfaceId),
    [dismissedSurfaceNotes]
  );

  // Listen to drag events to suppress tooltips during drag
  useEffect(() => {
    const handleDragStart = () => {
      isDraggingRef.current = true;
      setActiveTooltip(null);
    };
    const handleDragEnd = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const cancelScheduledTooltip = useCallback(() => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(
    (info: TooltipTargetInfo) => {
      if (isDraggingRef.current) return;
      if (activeExplainer) return; // Popover takes priority

      cancelScheduledTooltip();
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const now = Date.now();
      const isWarm = now - lastClosedTimestampRef.current < 350 || activeTooltip !== null;

      if (isWarm) {
        setActiveTooltip(info);
      } else {
        openTimeoutRef.current = window.setTimeout(() => {
          setActiveTooltip(info);
        }, 400);
      }
    },
    [activeExplainer, activeTooltip, cancelScheduledTooltip]
  );

  const hideTooltip = useCallback(
    (id?: string) => {
      cancelScheduledTooltip();
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setActiveTooltip((current) => {
          if (!id || current?.id === id) {
            lastClosedTimestampRef.current = Date.now();
            return null;
          }
          return current;
        });
      }, 50);
    },
    [cancelScheduledTooltip]
  );

  const openExplainer = useCallback(
    (info: ExplainerInfo) => {
      setActiveTooltip(null);
      cancelScheduledTooltip();
      setActiveExplainer(info);
    },
    [cancelScheduledTooltip]
  );

  const closeExplainer = useCallback(() => {
    setActiveExplainer((prev) => {
      if (prev?.triggerElement) {
        // Return focus to the ? trigger
        setTimeout(() => prev.triggerElement?.focus(), 10);
      }
      return null;
    });
  }, []);

  // Global dismissals for tooltip: scroll, click, Escape
  useEffect(() => {
    const handleScroll = () => {
      if (activeTooltip) {
        setActiveTooltip(null);
        lastClosedTimestampRef.current = Date.now();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Dismiss tooltip on click
      if (activeTooltip) {
        setActiveTooltip(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeTooltip) {
          setActiveTooltip(null);
          e.stopPropagation();
        } else if (activeExplainer) {
          closeExplainer();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeTooltip, activeExplainer, closeExplainer]);

  return (
    <GuidanceContext.Provider
      value={{
        activeTooltip,
        showTooltip,
        hideTooltip,
        cancelScheduledTooltip,
        activeExplainer,
        openExplainer,
        closeExplainer,
        dismissedSurfaceNotes,
        dismissSurfaceNote,
        restoreSurfaceNote,
        isSurfaceNoteDismissed,
        prefersReducedMotion,
      }}
    >
      {children}
    </GuidanceContext.Provider>
  );
}

export function useGuidance() {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error('useGuidance must be used within a GuidanceProvider');
  }
  return context;
}
