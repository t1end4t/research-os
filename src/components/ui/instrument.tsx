import React from 'react';
import { LinkStatus } from '../../types';

// ==========================================
// 1. TYPOGRAPHY & VOICES
// ==========================================

/**
 * VOICE 1: USER-AUTHORED
 * Serif ("Newsreader"), larger, confident. This is the human's thinking.
 */
export interface UserTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  size?: 'sm' | 'base' | 'lg' | 'xl';
  italic?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function UserText({
  as: Component = 'p',
  size = 'base',
  italic = false,
  className = '',
  children,
  ...props
}: UserTextProps) {
  const sizeClasses = {
    sm: 'text-[14px] leading-relaxed',
    base: 'text-[16px] leading-[1.6]',
    lg: 'text-[18px] leading-[1.5]',
    xl: 'text-[22px] leading-[1.4]',
  }[size];

  return (
    <Component
      className={`font-serif text-ink ${sizeClasses} ${italic ? 'italic' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * VOICE 2: CHROME / UI LABELS
 * Sans ("Public Sans"), small, uppercase tracking for labels.
 */
export interface SectionLabelProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'span' | 'h2' | 'h3' | 'h4' | 'div';
  mono?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SectionLabel({
  as: Component = 'span',
  mono = false,
  className = '',
  children,
  ...props
}: SectionLabelProps) {
  return (
    <Component
      className={`text-[11px] font-medium uppercase tracking-[0.08em] ${
        mono ? 'font-mono' : 'font-sans'
      } text-ink-muted select-none ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * VOICE 3: MODEL-PRODUCED
 * Monospace ("IBM Plex Mono"), hatched left edge, small model-id stamp in corner.
 * Never styled like user prose.
 */
export interface ModelBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  modelId?: string;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}


export function ModelBlock({
  modelId = 'cx/gpt-5.6-sol',
  badge = 'MODEL EXAMINER',
  className = '',
  children,
  ...props
}: ModelBlockProps) {
  return (
    <div
      className={`relative pl-4 pr-3 py-3 bg-surface border border-rule rounded-[2px] font-mono text-[13px] text-ink leading-relaxed hatched-left-border ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-rule/60 select-none">
        <span className="text-[10px] uppercase tracking-[0.08em] text-ink-muted font-mono font-medium">
          {badge}
        </span>
        <span className="text-[10px] font-mono text-ink-muted/80 tracking-tight">
          [{modelId}]
        </span>
      </div>
      <div className="font-mono text-[13px] leading-relaxed text-ink">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// 2. STATUS INDICATORS (Link Status Only)
// ==========================================

export interface StatusDotProps {
  status: LinkStatus;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
}

export function StatusDot({ status, size = 'base', className = '' }: StatusDotProps) {
  const sizeClass = {
    sm: 'w-1.5 h-1.5',
    base: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  const colorClass = {
    holds: 'bg-holds',
    weak: 'bg-weak',
    missing: 'bg-missing',
  }[status];

  return (
    <span
      className={`inline-block shrink-0 rounded-full ${sizeClass} ${colorClass} ${className}`}
      title={`Link status: ${status}`}
      aria-label={`Status: ${status}`}
    />
  );
}

export interface StatusBarProps {
  status: LinkStatus;
  orientation?: 'left' | 'top';
  className?: string;
}

export function StatusBar({ status, orientation = 'left', className = '' }: StatusBarProps) {
  const colorClass = {
    holds: 'bg-holds',
    weak: 'bg-weak',
    missing: 'bg-missing',
  }[status];

  if (orientation === 'top') {
    return <div className={`h-[3px] w-full ${colorClass} ${className}`} />;
  }

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-[3px] ${colorClass} ${className}`}
      aria-hidden="true"
    />
  );
}

// ==========================================
// 3. CARD CONTAINER
// ==========================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: LinkStatus;
  interactive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  status,
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`relative bg-surface border border-rule rounded-[2px] p-3 text-ink transition-colors ${
        interactive ? 'cursor-pointer hover:border-ink-muted' : ''
      } ${status ? 'pl-4' : ''} ${className}`}
      {...props}
    >
      {status && <StatusBar status={status} />}
      {children}
    </div>
  );
}

// ==========================================
// 4. BUTTON VARIANTS
// ==========================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive';
  size?: 'sm' | 'base' | 'lg';
  id?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}


export function Button({
  variant = 'secondary',
  size = 'base',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-1 min-h-[26px]',
    base: 'text-[12px] px-3 py-1.5 min-h-[32px]',
    lg: 'text-[13px] px-4 py-2 min-h-[38px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-ink text-paper border border-ink hover:bg-ink/90 active:bg-ink font-medium shadow-[0_1px_1px_rgba(0,0,0,0.04)]',
    secondary:
      'bg-surface text-ink border border-rule hover:border-ink-muted active:bg-paper font-medium',
    quiet:
      'bg-transparent text-ink-muted hover:text-ink hover:bg-surface active:bg-paper font-normal',
    destructive:
      'bg-surface text-ink-muted border border-rule hover:border-missing hover:text-missing active:bg-paper font-medium',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-[2px] font-sans tracking-normal select-none transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ==========================================
// 5. FIELD & EMPTY REQUIRED FIELD HOLE
// ==========================================

export interface EmptyRequiredReasonProps {
  label?: string;
  instruction?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * The empty-required-field treatment:
 * "A link with no user reason cannot be checked. Missing reasons are the central
 * defect this tool exposes, so an empty required field must render as a visible
 * hole in the layout — a ruled blank line with a short instruction beside it —
 * not as a neutral empty input."
 */
export function EmptyRequiredReason({
  label = 'user_reason',
  instruction = 'Required to check link — click to write why this supports the parent',
  onClick,
  className = '',
}: EmptyRequiredReasonProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col gap-1.5 p-2.5 rounded-[2px] bg-paper border border-dashed border-missing/60 hover:border-missing hover:bg-surface cursor-pointer transition-colors ${className}`}
    >
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-missing font-medium uppercase tracking-[0.06em]">
          ! {label} missing
        </span>
        <span className="text-ink-muted text-[10px]">unwritten</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-missing/40 group-hover:bg-missing transition-colors" />
        <span className="text-[12px] font-sans text-ink-muted group-hover:text-ink italic transition-colors">
          {instruction}
        </span>
      </div>
    </div>
  );
}
