import React, { useState } from 'react';
import { ArtifactItem, QuestionNode, ClaimNode } from '../../types';
import { X, Link2, Check, AlertCircle } from 'lucide-react';
import { StatusDot } from '../ui/instrument';

export interface LinkArtifactModalProps {
  artifact: ArtifactItem;
  questions: QuestionNode[];
  isOpen: boolean;
  onClose: () => void;
  onLinkToClaim: (artifactId: string, claimId: string) => void;
}

export function LinkArtifactModal({
  artifact,
  questions,
  isOpen,
  onClose,
  onLinkToClaim,
}: LinkArtifactModalProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(artifact.claimId);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const allClaims: { question: QuestionNode; claim: ClaimNode }[] = [];
  questions.forEach((q) => {
    q.claims.forEach((c) => {
      allClaims.push({ question: q, claim: c });
    });
  });

  const handleConfirm = () => {
    if (!selectedClaimId) return;
    onLinkToClaim(artifact.id, selectedClaimId);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[1px] animate-in fade-in duration-150"
    >
      <div className="bg-paper border border-rule rounded-[2px] shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-10 px-4 border-b border-rule flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-ink" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
              LINK ARTIFACT TO CLAIM
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div className="p-2.5 bg-surface border border-rule rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] font-bold uppercase text-ink-muted">
              Artifact to Link
            </span>
            <p className="font-sans text-[13px] font-semibold text-ink truncate">
              {artifact.title}
            </p>
            <p className="font-mono text-[10px] text-ink-muted">
              Current Claim: {artifact.claimText}
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] font-bold uppercase text-ink-muted">
              Select Target Claim
            </label>
            <div className="max-h-[220px] overflow-y-auto divide-y divide-rule/60 border border-rule rounded-[2px] bg-surface">
              {allClaims.map(({ question, claim }) => {
                const isSelected = selectedClaimId === claim.id;
                return (
                  <div
                    key={claim.id}
                    onClick={() => setSelectedClaimId(claim.id)}
                    className={`p-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-ink/5 border-l-2 border-l-ink'
                        : 'hover:bg-paper'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetClaim"
                      checked={isSelected}
                      onChange={() => setSelectedClaimId(claim.id)}
                      className="mt-1 accent-ink"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-ink-muted">
                        <span className="truncate">{question.text}</span>
                        <StatusDot status={claim.linkStatus} />
                      </div>
                      <p className="font-serif text-[12px] text-ink leading-snug">
                        {claim.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-rule">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-sans text-ink-muted hover:text-ink rounded-[2px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 text-[12px] font-sans font-medium bg-ink text-paper rounded-[2px] hover:bg-ink/90 flex items-center gap-1.5 cursor-pointer"
            >
              {success ? (
                <>
                  <Check className="w-3.5 h-3.5 text-holds" />
                  <span>Linked!</span>
                </>
              ) : (
                <span>Confirm Link</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
