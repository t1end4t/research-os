import React from 'react';
import { X } from 'lucide-react';
import { useGuidance } from './GuidanceContext';
import { GUIDANCE_COPY } from './guidanceCopy';

export type SurfaceId = keyof typeof GUIDANCE_COPY.surface_notes;

export interface SurfaceNoteProps {
  surfaceId: SurfaceId;
  className?: string;
}

export function SurfaceNote({ surfaceId, className = '' }: SurfaceNoteProps) {
  const { isSurfaceNoteDismissed, dismissSurfaceNote } = useGuidance();
  const text = GUIDANCE_COPY.surface_notes[surfaceId];

  if (!text || isSurfaceNoteDismissed(surfaceId)) {
    return null;
  }

  return (
    <div
      id={`surface-note-${surfaceId}`}
      role="region"
      aria-label="Surface purpose guidance"
      className={`h-7 px-6 bg-surface/70 border-b border-rule/70 flex items-center justify-between text-[11px] font-sans text-ink-muted select-none shrink-0 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted/70">
          SURFACE PURPOSE
        </span>
        <span className="text-rule">·</span>
        <span className="text-ink/80 italic truncate">{text}</span>
      </div>

      <button
        type="button"
        onClick={() => dismissSurfaceNote(surfaceId)}
        title="Dismiss surface note"
        aria-label={`Dismiss surface note for ${surfaceId}`}
        className="p-0.5 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
