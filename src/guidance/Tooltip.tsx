import React, {
  useRef,
  useId,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useGuidance } from './GuidanceContext';

export interface TooltipProps {
  content?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  disabled?: boolean; // if true, don't show tooltip
  className?: string;
  children: React.ReactNode;
}

export function Tooltip({
  content,
  placement = 'top',
  maxWidth = 280,
  disabled = false,
  className = '',
  children,
}: TooltipProps) {
  const { showTooltip, hideTooltip } = useGuidance();
  const triggerRef = useRef<HTMLElement | null>(null);
  const rawId = useId();
  const tooltipId = `inst-tt-${rawId.replace(/:/g, '')}`;

  if (!content || disabled) {
    return <>{children}</>;
  }

  const handlePointerEnter = (e: React.PointerEvent) => {
    // Touch/coarse pointer check: do not fire on tap/touch
    if (e.pointerType === 'touch') return;
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    showTooltip({
      id: tooltipId,
      content,
      rect,
      placement,
      maxWidth,
    });
  };

  const handlePointerLeave = () => {
    hideTooltip(tooltipId);
  };

  const handleFocus = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    showTooltip({
      id: tooltipId,
      content,
      rect,
      placement,
      maxWidth,
    });
  };

  const handleBlur = () => {
    hideTooltip(tooltipId);
  };

  // If child is a single valid React element and not a disabled native button, attach props directly
  if (isValidElement(children) && typeof children.type === 'string') {
    const isNativeDisabled = (children.props as any).disabled;
    if (!isNativeDisabled) {
      return cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          const originalRef = (children as any).ref;
          if (typeof originalRef === 'function') originalRef(node);
          else if (originalRef && 'current' in originalRef) originalRef.current = node;
        },
        onPointerEnter: (e: React.PointerEvent) => {
          (children.props as any).onPointerEnter?.(e);
          handlePointerEnter(e);
        },
        onPointerLeave: (e: React.PointerEvent) => {
          (children.props as any).onPointerLeave?.(e);
          handlePointerLeave();
        },
        onFocus: (e: React.FocusEvent) => {
          (children.props as any).onFocus?.(e);
          handleFocus();
        },
        onBlur: (e: React.FocusEvent) => {
          (children.props as any).onBlur?.(e);
          handleBlur();
        },
        'aria-describedby': tooltipId,
      });
    }
  }

  // Wrap in an inline-flex container so disabled controls can still receive hover and focus
  return (
    <span
      ref={triggerRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      aria-describedby={tooltipId}
      className={`inline-flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-ink/40 rounded-[2px] ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Global Portal renderer for active Hover Tooltip
 */
export function TooltipPortalRenderer() {
  const { activeTooltip, prefersReducedMotion } = useGuidance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeTooltip || typeof document === 'undefined') return null;

  const { id, content, rect, placement = 'top', maxWidth = 280 } = activeTooltip;

  // Viewport measurements & positioning math
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 8; // Margin from target and screen edge

  let top = 0;
  let left = 0;
  let chosenPlacement = placement;

  // Center horizontally relative to target by default
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;

  // Estimated tooltip height ~ 36px
  const estHeight = 40;
  const estWidth = Math.min(maxWidth, 260);

  if (placement === 'top') {
    if (rect.top - estHeight - margin < 0) {
      chosenPlacement = 'bottom';
      top = rect.bottom + margin;
    } else {
      top = rect.top - margin;
    }
    left = targetCenterX;
  } else if (placement === 'bottom') {
    if (rect.bottom + estHeight + margin > viewportHeight) {
      chosenPlacement = 'top';
      top = rect.top - margin;
    } else {
      top = rect.bottom + margin;
    }
    left = targetCenterX;
  } else if (placement === 'left') {
    if (rect.left - estWidth - margin < 0) {
      chosenPlacement = 'right';
      left = rect.right + margin;
    } else {
      left = rect.left - margin;
    }
    top = targetCenterY;
  } else if (placement === 'right') {
    if (rect.right + estWidth + margin > viewportWidth) {
      chosenPlacement = 'left';
      left = rect.left - margin;
    } else {
      left = rect.right + margin;
    }
    top = targetCenterY;
  }

  // Clamping style
  const style: React.CSSProperties = {
    position: 'fixed',
    maxWidth: `${maxWidth}px`,
    zIndex: 9990, // Above normal cards/drawers, below modal dialogs
    pointerEvents: 'none',
  };

  if (chosenPlacement === 'top') {
    style.top = `${top}px`;
    style.left = `${Math.min(
      Math.max(margin + estWidth / 2, left),
      viewportWidth - margin - estWidth / 2
    )}px`;
    style.transform = 'translate(-50%, -100%)';
  } else if (chosenPlacement === 'bottom') {
    style.top = `${top}px`;
    style.left = `${Math.min(
      Math.max(margin + estWidth / 2, left),
      viewportWidth - margin - estWidth / 2
    )}px`;
    style.transform = 'translate(-50%, 0)';
  } else if (chosenPlacement === 'left') {
    style.top = `${Math.min(
      Math.max(margin + estHeight / 2, top),
      viewportHeight - margin - estHeight / 2
    )}px`;
    style.left = `${left}px`;
    style.transform = 'translate(-100%, -50%)';
  } else if (chosenPlacement === 'right') {
    style.top = `${Math.min(
      Math.max(margin + estHeight / 2, top),
      viewportHeight - margin - estHeight / 2
    )}px`;
    style.left = `${left}px`;
    style.transform = 'translate(0, -50%)';
  }

  return createPortal(
    <div
      id={id}
      role="tooltip"
      style={style}
      className={`px-2.5 py-1.5 bg-surface text-ink text-[12px] font-sans leading-snug border border-rule rounded-[2px] shadow-md select-none text-left ${
        prefersReducedMotion ? '' : 'transition-opacity duration-100 ease-out'
      }`}
    >
      {content}
    </div>,
    document.body
  );
}
