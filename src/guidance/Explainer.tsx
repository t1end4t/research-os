import React, { useRef, useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X, ArrowRight, RotateCcw } from 'lucide-react';
import { useGuidance } from './GuidanceContext';
import { GUIDANCE_COPY } from './guidanceCopy';

export interface ExplainerButtonProps {
  explainerKey: keyof typeof GUIDANCE_COPY.explainers;
  surfaceId?: string;
  linkText?: string;
  onNavigate?: () => void;
  className?: string;
  title?: string;
}

export function ExplainerButton({
  explainerKey,
  surfaceId,
  linkText,
  onNavigate,
  className = '',
  title,
}: ExplainerButtonProps) {
  const { openExplainer, activeExplainer, restoreSurfaceNote, isSurfaceNoteDismissed } =
    useGuidance();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const data = GUIDANCE_COPY.explainers[explainerKey];
  const isCurrentlyOpen = activeExplainer?.id === explainerKey;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentlyOpen) {
      // Toggle closed handled by backdrop / click
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    openExplainer({
      id: explainerKey,
      title: data.title,
      body: data.body,
      triggerRect: rect,
      triggerElement: buttonRef.current,
      linkText,
      onNavigate,
      canRestoreSurfaceNote: surfaceId ? isSurfaceNoteDismissed(surfaceId) : false,
      onRestoreSurfaceNote: surfaceId
        ? () => {
            restoreSurfaceNote(surfaceId);
          }
        : undefined,
    });
  };

  return (
    <button
      ref={buttonRef}
      id={`explainer-btn-${explainerKey}`}
      type="button"
      onClick={handleClick}
      aria-label={title || `Explain rule: ${data.title}`}
      aria-expanded={isCurrentlyOpen}
      aria-haspopup="dialog"
      className={`inline-flex items-center justify-center w-4 h-4 rounded-[2px] text-ink-muted/80 hover:text-ink hover:bg-surface border border-transparent hover:border-rule/80 transition-colors cursor-pointer text-[11px] font-mono select-none ${
        isCurrentlyOpen ? 'bg-surface text-ink border-rule ring-1 ring-ink/30' : ''
      } ${className}`}
    >
      ?
    </button>
  );
}

/**
 * Global Portal renderer for active Explainer Popover Dialog
 */
export function ExplainerPortalRenderer() {
  const { activeExplainer, closeExplainer, prefersReducedMotion } = useGuidance();
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const rawId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trap focus inside popover dialog
  useEffect(() => {
    if (!activeExplainer) return;

    const focusable = popoverRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    } else {
      popoverRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeExplainer]);

  if (!mounted || !activeExplainer || typeof document === 'undefined') return null;

  const {
    title,
    body,
    triggerRect,
    linkText,
    onNavigate,
    canRestoreSurfaceNote,
    onRestoreSurfaceNote,
  } = activeExplainer;

  // Position calculation relative to triggerRect or screen center
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popoverWidth = Math.min(340, viewportWidth - 32);
  const popoverHeight = 180; // approximate
  const margin = 8;

  let top = viewportHeight / 2 - popoverHeight / 2;
  let left = viewportWidth / 2 - popoverWidth / 2;

  if (triggerRect) {
    // Attempt bottom placement first
    if (triggerRect.bottom + popoverHeight + margin <= viewportHeight) {
      top = triggerRect.bottom + margin;
    } else if (triggerRect.top - popoverHeight - margin >= 0) {
      top = triggerRect.top - popoverHeight - margin;
    } else {
      top = Math.max(margin, (viewportHeight - popoverHeight) / 2);
    }

    // Align left edge or center with trigger
    left = triggerRect.left;
    if (left + popoverWidth > viewportWidth - margin) {
      left = viewportWidth - popoverWidth - margin;
    }
    if (left < margin) left = margin;
  }

  const titleId = `explainer-title-${rawId.replace(/:/g, '')}`;
  const descId = `explainer-desc-${rawId.replace(/:/g, '')}`;

  return createPortal(
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div
        className="fixed inset-0 z-[9995] bg-transparent cursor-default"
        onClick={closeExplainer}
        aria-hidden="true"
      />

      {/* Popover dialog */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${popoverWidth}px`,
          zIndex: 9998,
        }}
        className={`p-3.5 bg-surface text-ink border border-rule rounded-[2px] shadow-lg focus:outline-none ${
          prefersReducedMotion ? '' : 'transition-opacity duration-150 ease-out'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-rule/70">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ink" />
            <h2
              id={titleId}
              className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink truncate"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeExplainer}
            title="Dismiss explainer (Esc)"
            aria-label="Dismiss explainer"
            className="p-1 -mr-1 -mt-1 text-ink-muted hover:text-ink rounded-[2px] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body (2 to 5 lines explaining the rule) */}
        <p
          id={descId}
          className="font-sans text-[12px] leading-relaxed text-ink/90 select-text"
        >
          {body}
        </p>

        {/* Action Link or Restore Surface Note button */}
        {(onNavigate || canRestoreSurfaceNote) && (
          <div className="mt-3 pt-2 border-t border-rule/50 flex items-center justify-between gap-2 text-[11px]">
            {onNavigate && linkText && (
              <button
                type="button"
                onClick={() => {
                  closeExplainer();
                  onNavigate();
                }}
                className="inline-flex items-center gap-1 font-sans text-ink hover:underline cursor-pointer"
              >
                <span>{linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {canRestoreSurfaceNote && onRestoreSurfaceNote && (
              <button
                type="button"
                onClick={() => {
                  onRestoreSurfaceNote();
                  closeExplainer();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted hover:text-ink cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore surface guidance</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
