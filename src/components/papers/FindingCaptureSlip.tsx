import React, { useState, useEffect, useMemo } from 'react';
import { PaperDoc, QuestionNode, ClaimNode } from '../../types';
import { UserText, SectionLabel, Button, StatusDot, EmptyRequiredReason } from '../ui/instrument';
import { X, Quote, ArrowRight, CheckCircle2, Eye, Search, AlertCircle } from 'lucide-react';

export interface FindingDraftPayload {
  finding: string;
  claimId: string;
  userReason: string;
  passageText: string;
  pageNumber: number;
  paragraphId?: string;
}

interface FindingCaptureSlipProps {
  isOpen: boolean;
  onClose: () => void;
  passageText: string;
  pageNumber: number;
  paragraphId?: string;
  paper: PaperDoc;
  questions: QuestionNode[];
  initialClaimId?: string | null;
  onSubmitFinding: (payload: FindingDraftPayload) => void;
  onViewInContext?: () => void;
}

export function FindingCaptureSlip({
  isOpen,
  onClose,
  passageText,
  pageNumber,
  paragraphId,
  paper,
  questions,
  initialClaimId,
  onSubmitFinding,
  onViewInContext,
}: FindingCaptureSlipProps) {
  const [findingText, setFindingText] = useState<string>('');
  const [userReasonText, setUserReasonText] = useState<string>('');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [claimSearchQuery, setClaimSearchQuery] = useState<string>('');
  const [isSelectingClaim, setIsSelectingClaim] = useState<boolean>(false);

  // Flatten all claims from questions
  const allClaims = useMemo(() => {
    return questions.flatMap((q) =>
      q.claims.map((c) => ({
        ...c,
        questionId: q.id,
        questionText: q.text,
        questionTags: q.tags || [],
      }))
    );
  }, [questions]);

  // Set initial selected claim
  useEffect(() => {
    if (initialClaimId && allClaims.some((c) => c.id === initialClaimId)) {
      setSelectedClaimId(initialClaimId);
    } else if (allClaims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(allClaims[0].id);
    }
  }, [initialClaimId, allClaims, selectedClaimId]);

  // Reset form when opened with new passage
  useEffect(() => {
    if (isOpen) {
      setFindingText('');
      setUserReasonText('');
      setClaimSearchQuery('');
      setIsSelectingClaim(false);
    }
  }, [isOpen, passageText]);

  // Filtered claims for search
  const filteredClaims = useMemo(() => {
    if (!claimSearchQuery.trim()) return allClaims;
    const query = claimSearchQuery.toLowerCase();
    return allClaims.filter(
      (c) =>
        c.text.toLowerCase().includes(query) ||
        c.questionText.toLowerCase().includes(query)
    );
  }, [allClaims, claimSearchQuery]);

  const selectedClaim = allClaims.find((c) => c.id === selectedClaimId);

  // Validation: ALL 4 elements MUST be present
  const hasPassage = Boolean(passageText && passageText.trim().length > 0);
  const hasFinding = Boolean(findingText.trim().length > 0);
  const hasClaim = Boolean(selectedClaimId);
  const hasReason = Boolean(userReasonText.trim().length > 0);

  const isValid = hasPassage && hasFinding && hasClaim && hasReason;

  // Missing components list
  const missingFields: string[] = [];
  if (!hasFinding) missingFields.push('Finding statement');
  if (!hasClaim) missingFields.push('Target claim');
  if (!hasReason) missingFields.push('Reason for support');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmitFinding({
      finding: findingText.trim(),
      claimId: selectedClaimId,
      userReason: userReasonText.trim(),
      passageText: passageText.trim(),
      pageNumber,
      paragraphId,
    });
  };

  if (!isOpen) return null;

  return (
    <aside
      id="finding-capture-slip"
      aria-label="Make Finding Slip"
      className="w-full sm:w-[420px] md:w-[460px] h-full bg-paper border-l border-rule flex flex-col shrink-0 z-30 overflow-hidden shadow-[-4px_0_16px_rgba(0,0,0,0.04)] animate-in slide-in-from-right duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-rule bg-surface flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Quote className="w-3.5 h-3.5 text-ink-muted" />
            <SectionLabel className="text-[11px] font-semibold text-ink tracking-[0.1em]">
              MAKE FINDING
            </SectionLabel>
          </div>
          <p className="text-[12px] text-ink-muted leading-relaxed font-sans">
            Extract an empirical or theoretical finding and attach it to a claim.
          </p>
        </div>
        <button
          onClick={onClose}
          title="Close finding slip (Esc)"
          className="p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Section 1: SOURCE PASSAGE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel className="text-[10px] text-ink-muted tracking-[0.08em]">
              1. SOURCE PASSAGE
            </SectionLabel>
            {onViewInContext && (
              <button
                type="button"
                onClick={onViewInContext}
                className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink hover:underline cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>View in context</span>
              </button>
            )}
          </div>

          <blockquote className="p-3 bg-surface border-l-2 border-ink-muted/60 rounded-r-[2px] space-y-2 text-ink">
            <p className="font-serif italic text-[13px] leading-relaxed select-text">
              "{passageText}"
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted border-t border-rule/60 pt-1.5">
              <span>
                {paper.authors} ({paper.year})
              </span>
              <span>Page {pageNumber}</span>
            </div>
          </blockquote>
        </div>

        {/* Section 2: FINDING (Voice 1 UserText) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="finding-input"
              className="text-[11px] font-medium font-sans uppercase tracking-[0.08em] text-ink"
            >
              2. WHAT DID THIS PASSAGE ESTABLISH? <span className="text-missing">*</span>
            </label>
            <span className="text-[10px] font-mono text-ink-muted">User finding</span>
          </div>

          <textarea
            id="finding-input"
            required
            rows={3}
            value={findingText}
            onChange={(e) => setFindingText(e.target.value)}
            placeholder="State the empirical finding in clear terms (e.g. Sparse coding emerges from natural image statistics under an L1 sparsity penalty without supervisory signal)."
            className="w-full bg-surface border border-rule focus:border-ink rounded-[2px] p-3 font-serif text-[14px] leading-relaxed text-ink placeholder:font-sans placeholder:text-[12px] placeholder:text-ink-muted/70 focus:outline-none resize-y min-h-[80px]"
          />
          <p className="text-[11px] text-ink-muted font-sans italic">
            Evidence is a finding, not a citation. Write what was shown.
          </p>
        </div>

        {/* Section 3: ATTACH TO CLAIM */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium font-sans uppercase tracking-[0.08em] text-ink">
              3. ATTACH TO CLAIM <span className="text-missing">*</span>
            </label>
            <span className="text-[10px] font-mono text-ink-muted">Target claim</span>
          </div>

          {selectedClaim && !isSelectingClaim ? (
            <div className="p-3 bg-surface border border-rule rounded-[2px] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusDot status={selectedClaim.linkStatus} size="sm" />
                  <span className="text-[10px] font-mono uppercase text-ink-muted">
                    {selectedClaim.questionText}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSelectingClaim(true)}
                  className="text-[11px] text-ink-muted hover:text-ink underline cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>

              <UserText size="sm" className="font-serif text-[14px] text-ink">
                {selectedClaim.text}
              </UserText>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-surface border border-rule rounded-[2px]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={claimSearchQuery}
                  onChange={(e) => setClaimSearchQuery(e.target.value)}
                  placeholder="Search claims in your argument..."
                  className="w-full bg-paper border border-rule rounded-[2px] pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-rule/60 pt-1">
                {filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    onClick={() => {
                      setSelectedClaimId(claim.id);
                      setIsSelectingClaim(false);
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-2 rounded-[2px] cursor-pointer transition-colors text-left space-y-1 ${
                      claim.id === selectedClaimId
                        ? 'bg-paper border border-ink'
                        : 'hover:bg-paper'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={claim.linkStatus} size="sm" />
                      <span className="text-[10px] font-mono text-ink-muted truncate">
                        {claim.questionText}
                      </span>
                    </div>
                    <p className="font-serif text-[13px] text-ink leading-snug">
                      {claim.text}
                    </p>
                  </div>
                ))}

                {filteredClaims.length === 0 && (
                  <div className="p-3 text-center text-xs text-ink-muted font-sans">
                    No matching claims found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: YOUR REASON (Voice 1 UserText) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reason-input"
              className="text-[11px] font-medium font-sans uppercase tracking-[0.08em] text-ink"
            >
              4. WHY DOES THIS SUPPORT THAT CLAIM? <span className="text-missing">*</span>
            </label>
            <span className="text-[10px] font-mono text-missing font-medium">user_reason</span>
          </div>

          <textarea
            id="reason-input"
            required
            rows={3}
            value={userReasonText}
            onChange={(e) => setUserReasonText(e.target.value)}
            placeholder="Explain why this finding supports the target claim (e.g. Directly proves that early cortical receptive fields are predictable from statistical efficiency alone)."
            className="w-full bg-surface border border-rule focus:border-ink rounded-[2px] p-3 font-serif text-[14px] leading-relaxed text-ink placeholder:font-sans placeholder:text-[12px] placeholder:text-ink-muted/70 focus:outline-none resize-y min-h-[80px]"
          />

          {!userReasonText.trim() && (
            <EmptyRequiredReason
              label="user_reason"
              instruction="Required — write why this finding supports the claim"
              onClick={() => {
                const el = document.getElementById('reason-input');
                el?.focus();
              }}
            />
          )}

          <p className="text-[11px] text-ink-muted font-sans italic">
            The assistant checks reasoning, but never writes it. A link without a user reason cannot be checked.
          </p>
        </div>
      </form>

      {/* Action Footer */}
      <div className="p-4 border-t border-rule bg-surface shrink-0 space-y-2">
        {!isValid && missingFields.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-missing font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Missing required: {missingFields.join(', ')}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="base"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="base"
            type="button"
            disabled={!isValid}
            onClick={handleSubmit}
            title={
              isValid
                ? 'Create evidence finding node under selected claim'
                : `Cannot create: missing ${missingFields.join(', ')}`
            }
          >
            Create finding
          </Button>
        </div>
      </div>
    </aside>
  );
}
