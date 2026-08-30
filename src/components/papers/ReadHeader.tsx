import React from 'react';
import { SectionLabel } from '../ui/instrument';
import { FileText } from 'lucide-react';
import { Tooltip, ExplainerButton, GUIDANCE_COPY } from '../../guidance';

interface ReadHeaderProps {
  sessionFindingCount: number;
  sessionHighlightCount: number;
  activePaperTitle?: string;
  onOpenInfo?: () => void;
}

export function ReadHeader({
  sessionFindingCount,
  sessionHighlightCount,
  activePaperTitle,
  onOpenInfo,
}: ReadHeaderProps) {
  const hasFindings = sessionFindingCount > 0;

  return (
    <div
      id="read-surface-header"
      className="border-b border-rule bg-paper px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none"
    >
      {/* Left: Section Identity & Purpose */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-ink-muted" />
          <SectionLabel className="text-[12px] font-semibold text-ink tracking-[0.1em]">
            PAPERS
          </SectionLabel>
        </div>
        <ExplainerButton explainerKey="finding_not_paper" surfaceId="papers" />
        <div className="h-3 w-[1px] bg-rule" />
        <span className="text-[12px] text-ink-muted font-sans">
          Turn passages into findings.
        </span>
      </div>

      {/* Right: Session Output Indicator */}
      <div className="flex items-center gap-3 text-xs">
        <Tooltip content="The reader's purpose is to produce findings. Highlights remain local to the paper.">
          <div
            id="session-output-indicator"
            className="flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-surface border border-rule cursor-help"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-muted">
              THIS SESSION
            </span>
            <div className="flex items-center gap-1.5 font-sans">
              <span
                className={`font-semibold ${
                  hasFindings ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {sessionFindingCount} {sessionFindingCount === 1 ? 'finding' : 'findings'}
              </span>
              <span className="text-ink-muted">·</span>
              <span className="text-ink-muted text-[11px]">
                {sessionHighlightCount} {sessionHighlightCount === 1 ? 'highlight' : 'highlights'}
              </span>
            </div>
          </div>
        </Tooltip>

        {/* Quiet statement if session has produced no finding yet */}
        {!hasFindings && sessionHighlightCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-ink-muted italic font-sans">
            <span>Highlights remain in paper, but nothing entered argument.</span>
          </div>
        )}
      </div>
    </div>
  );
}
