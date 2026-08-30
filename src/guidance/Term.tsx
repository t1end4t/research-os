import React from 'react';
import { Tooltip } from './Tooltip';
import { GUIDANCE_COPY } from './guidanceCopy';

export type TermKey = keyof typeof GUIDANCE_COPY.terms;

export interface TermProps {
  name: TermKey;
  className?: string;
  children: React.ReactNode;
}

export function Term({ name, className = '', children }: TermProps) {
  const definition = GUIDANCE_COPY.terms[name];

  return (
    <Tooltip content={definition}>
      <span
        tabIndex={0}
        role="term"
        className={`border-b border-dotted border-ink-muted/70 cursor-help focus:outline-none focus:ring-1 focus:ring-ink/40 rounded-[1px] transition-colors hover:text-ink ${className}`}
      >
        {children}
      </span>
    </Tooltip>
  );
}
