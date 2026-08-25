import { useEffect, useRef } from 'react';
import { QuestionNode } from '../types';
import { ClaimNodeCard } from './ClaimNodeCard';

interface GraphPaneProps {
  questions: QuestionNode[];
  selectedNodeId?: string | null;
  selectedClaimId: string | null;
  selectedQuestionId?: string | null;
  onSelectClaim: (id: string) => void;
  onSelectQuestion?: (id: string) => void;
  highlightedNodeId?: string | null;
}

export function GraphPane({
  questions,
  selectedNodeId,
  selectedClaimId,
  selectedQuestionId,
  onSelectClaim,
  onSelectQuestion,
  highlightedNodeId,
}: GraphPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected question or claim
  useEffect(() => {
    if (selectedNodeId) {
      const el = document.getElementById(`claim-node-${selectedNodeId}`) ||
        document.getElementById(`question-node-${selectedNodeId}`) ||
        document.getElementById(`question-section-${selectedNodeId}`) ||
        document.getElementById(`evidence-node-${selectedNodeId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedNodeId]);

  return (
    <div
      ref={containerRef}
      id="graph-pane"
      className="h-full overflow-y-auto p-6 bg-white dark:bg-[#141414] space-y-8"
    >
      <div className="max-w-xl space-y-8">
        {questions.map((q) => {
          const isQuestionSelected = selectedQuestionId === q.id || selectedNodeId === q.id;

          return (
            <div key={q.id} id={`question-section-${q.id}`} className="space-y-4">
              {/* Level 1: QUESTION (Root Node) */}
              <div
                id={`question-node-${q.id}`}
                onClick={() => onSelectQuestion?.(q.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectQuestion?.(q.id);
                  }
                }}
                className={`rounded-[10px] p-3.5 sm:p-4 transition-all duration-200 cursor-pointer text-left bg-[#F5F2FF] dark:bg-[#6B4FBB]/12 ${
                  isQuestionSelected
                    ? 'border-2 border-[#ffb000] ring-1 ring-[#ffb000]'
                    : 'border border-[#E4DCFA] dark:border-[#6B4FBB]/25 hover:border-[#6B4FBB]/50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7] shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                    QUESTION
                  </span>
                </div>
                <h1 className="text-[15px] font-medium text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug">
                  {q.text}
                </h1>
                {q.tags && q.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded border border-[#E4DCFA] dark:border-[#6B4FBB]/40 text-[#6B4FBB] dark:text-[#BCA8F7] leading-none font-normal"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Level 2: CLAIMS (Nested under Question with Notion-style vertical guide line) */}
              {q.claims.length > 0 ? (
                <div className="relative pl-7 ml-2.5 space-y-4">
                  {/* Vertical line down the left for claims */}
                  <div className="absolute left-[10px] -top-3 bottom-3 w-[1px] bg-[#ececec] dark:bg-[#282828]" />

                  {q.claims.map((claim) => (
                    <ClaimNodeCard
                      key={claim.id}
                      claim={claim}
                      isSelected={claim.id === selectedClaimId}
                      onSelect={onSelectClaim}
                      highlightedNodeId={highlightedNodeId}
                    />
                  ))}
                </div>
              ) : (
                <div className="relative pl-7 ml-2.5">
                  <div className="absolute left-[10px] -top-3 bottom-3 w-[1px] bg-[#ececec] dark:bg-[#282828]" />
                  <div
                    onClick={() => onSelectQuestion?.(q.id)}
                    className="rounded-lg border border-dashed border-[#d1d1d1] dark:border-[#333333] p-3 text-[12px] text-[#a1a1a1] dark:text-[#666666] italic cursor-pointer hover:border-[#aaa] transition-colors"
                  >
                    no claims yet
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
