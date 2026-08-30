import React from 'react';
import { PaperDoc, QuestionNode } from '../../types';
import { SectionLabel, UserText, Button, StatusDot } from '../ui/instrument';
import { X, BookOpen, ExternalLink, FileText, Quote, ArrowRight } from 'lucide-react';

interface PaperInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: PaperDoc;
  questions: QuestionNode[];
  onNavigateToClaim?: (claimId: string) => void;
  onJumpToPage?: (pageNumber: number) => void;
}

export function PaperInfoModal({
  isOpen,
  onClose,
  paper,
  questions,
  onNavigateToClaim,
  onJumpToPage,
}: PaperInfoModalProps) {
  if (!isOpen) return null;

  // Find all evidence nodes that originated from this paper
  const linkedFindings = questions.flatMap((q) =>
    q.claims.flatMap((c) =>
      c.evidence
        .filter((e) => {
          if (e.paperId && e.paperId === paper.id) return true;
          if (e.citation && (e.citation.includes(paper.citation) || e.citation.includes(paper.authors.split('&')[0].trim()))) {
            return true;
          }
          return false;
        })
        .map((e) => ({
          evidence: e,
          claim: c,
          question: q,
        }))
    )
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-info-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100"
    >
      <div className="w-full max-w-2xl max-h-[85vh] bg-paper border border-rule rounded-[2px] p-6 shadow-2xl flex flex-col space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rule pb-3 shrink-0">
          <div className="space-y-1 pr-4">
            <SectionLabel className="text-[10px] text-ink-muted">
              PAPER PROVENANCE & METADATA
            </SectionLabel>
            <h2 id="paper-info-title" className="font-serif text-[18px] text-ink leading-snug">
              {paper.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-ink-muted font-sans pt-0.5">
              <span>{paper.authors}</span>
              <span>·</span>
              <span>{paper.year}</span>
              <span>·</span>
              <span className="font-mono text-[11px]">{paper.citation}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Abstract */}
          {paper.abstract && (
            <div className="space-y-2">
              <SectionLabel className="text-[10px] text-ink-muted">ABSTRACT</SectionLabel>
              <div className="p-3.5 bg-surface border border-rule rounded-[2px]">
                <p className="font-serif italic text-[13px] leading-relaxed text-ink">
                  {paper.abstract}
                </p>
              </div>
            </div>
          )}

          {/* Linked Findings Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel className="text-[10px] text-ink-muted">
                FINDINGS IN YOUR ARGUMENT ({linkedFindings.length})
              </SectionLabel>
              <span className="text-[11px] font-sans text-ink-muted">
                {linkedFindings.length === 0
                  ? 'None created yet'
                  : `${linkedFindings.length} active in tree`}
              </span>
            </div>

            {linkedFindings.length === 0 ? (
              <div className="p-4 bg-surface border border-dashed border-rule rounded-[2px] text-center space-y-1">
                <p className="text-xs text-ink-muted font-sans">
                  No passages from this paper have entered your argument yet.
                </p>
                <p className="text-[11px] text-ink-muted/80 font-sans italic">
                  Select text in the reader and choose "Make finding" to extract evidence.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {linkedFindings.map(({ evidence, claim, question }) => (
                  <div
                    key={evidence.id}
                    className="p-3.5 bg-surface border border-rule rounded-[2px] space-y-2 text-ink"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-ink-muted border-b border-rule/60 pb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <StatusDot status={claim.linkStatus} size="sm" />
                        <span className="truncate">{question.text}</span>
                      </div>
                      {evidence.citation && (
                        <span className="shrink-0">{evidence.citation}</span>
                      )}
                    </div>

                    {/* Finding Title */}
                    <div>
                      <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block mb-0.5">
                        FINDING
                      </span>
                      <p className="font-serif text-[14px] text-ink leading-snug">
                        {evidence.title}
                      </p>
                    </div>

                    {/* User Reason */}
                    {evidence.userReason && (
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block mb-0.5">
                          SUPPORT REASON
                        </span>
                        <p className="font-sans text-[12px] text-ink-muted leading-relaxed italic">
                          "{evidence.userReason}"
                        </p>
                      </div>
                    )}

                    {/* Target Claim & Action */}
                    <div className="pt-2 flex items-center justify-between border-t border-rule/60 text-xs">
                      <div className="truncate pr-2">
                        <span className="text-ink-muted font-sans text-[11px]">Supports claim: </span>
                        <span className="font-serif text-ink text-[12px]">{claim.text}</span>
                      </div>

                      {onNavigateToClaim && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToClaim(claim.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-ink hover:underline cursor-pointer shrink-0 ml-2"
                        >
                          <span>Open Workbench</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-rule flex items-center justify-end shrink-0">
          <Button variant="secondary" size="base" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
