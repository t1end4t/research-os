import React, { useState } from 'react';
import { LeftRailMark, LinkStatus, QuestionNode } from '../../types';
import { StatusDot, SectionLabel } from '../ui/instrument';
import { ExternalLink, Bookmark, Sparkles } from 'lucide-react';

interface LinkedPassageRailProps {
  marks: LeftRailMark[];
  questions: QuestionNode[];
  onScrollToMark: (mark: LeftRailMark) => void;
  onNavigateToClaim?: (claimId: string) => void;
}

export function LinkedPassageRail({
  marks,
  questions,
  onScrollToMark,
  onNavigateToClaim,
}: LinkedPassageRailProps) {
  const [hoveredMarkId, setHoveredMarkId] = useState<string | null>(null);

  // Group marks by claim info if available
  const getClaimForMark = (claimId?: string) => {
    if (!claimId) return null;
    for (const q of questions) {
      for (const c of q.claims) {
        if (c.id === claimId) return { claim: c, question: q };
      }
    }
    return null;
  };

  const hasFindings = marks.some((m) => m.claimId);

  return (
    <div
      id="linked-passage-rail"
      aria-label="Linked Passages Rail"
      className="w-10 h-full border-r border-rule bg-paper relative shrink-0 select-none z-20 flex flex-col items-center"
    >
      {/* Top subtle rail header */}
      <div className="pt-2 pb-1 text-center w-full border-b border-rule/50">
        <span
          title="Linked Passages & Findings"
          className="text-[9px] font-mono text-ink-muted/80 uppercase tracking-wider block"
        >
          RAIL
        </span>
      </div>

      {/* Marks positioned vertically along the paper height */}
      <div className="relative flex-1 w-full">
        {marks.map((mark) => {
          const claimData = getClaimForMark(mark.claimId);
          const isFinding = Boolean(mark.claimId);
          const status: LinkStatus = claimData?.claim.linkStatus || 'holds';
          const isHovered = hoveredMarkId === mark.id;

          const dotColor = isFinding
            ? status === 'holds'
              ? 'bg-holds'
              : status === 'weak'
              ? 'bg-weak'
              : 'bg-missing'
            : 'bg-ink-muted';

          return (
            <div
              key={mark.id}
              style={{ top: `${Math.max(Math.min(mark.yPercent, 96), 4)}%` }}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
              onMouseEnter={() => setHoveredMarkId(mark.id)}
              onMouseLeave={() => setHoveredMarkId(null)}
            >
              <button
                type="button"
                onClick={() => onScrollToMark(mark)}
                aria-label={`Jump to passage: ${mark.label}`}
                className="p-1 group cursor-pointer flex items-center justify-center transition-transform hover:scale-125"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${dotColor} transition-shadow shadow-xs ring-2 ring-paper`}
                />
              </button>

              {/* Rich Hover Card */}
              {isHovered && (
                <div
                  className="absolute left-7 top-1/2 -translate-y-1/2 w-72 bg-surface border border-rule rounded-[2px] p-3 text-ink shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2 pointer-events-auto"
                >
                  <div className="flex items-center justify-between border-b border-rule/60 pb-1.5 text-[10px] font-mono text-ink-muted">
                    <span className="uppercase tracking-wider font-medium">
                      {isFinding ? 'LINKED FINDING' : 'HIGHLIGHT'}
                    </span>
                    <span>Page {mark.pageNumber || 1}</span>
                  </div>

                  {isFinding && claimData ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted">
                        <StatusDot status={status} size="sm" />
                        <span className="truncate">{claimData.question.text}</span>
                      </div>
                      <p className="font-serif text-[13px] text-ink leading-snug line-clamp-2">
                        {claimData.claim.text}
                      </p>
                      <p className="font-sans italic text-[11px] text-ink-muted line-clamp-2">
                        "{mark.snippet}"
                      </p>
                      {onNavigateToClaim && (
                        <div className="pt-1 flex items-center justify-between border-t border-rule/40">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToClaim(claimData.claim.id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-ink hover:underline cursor-pointer"
                          >
                            <span>View in Workbench</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-serif italic text-[12px] text-ink leading-relaxed line-clamp-3">
                        "{mark.snippet}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle indicator when no findings have been extracted */}
      {!hasFindings && marks.length === 0 && (
        <div className="absolute inset-x-0 bottom-4 text-center px-1">
          <span
            title="No passages from this paper have entered the argument."
            className="text-[9px] font-mono text-ink-muted/50 [writing-mode:vertical-lr] rotate-180 select-none"
          >
            NO FINDINGS YET
          </span>
        </div>
      )}
    </div>
  );
}
