import React from 'react';
import { ClaimNode, QuestionNode } from '../../types';
import { Button, SectionLabel, StatusDot } from '../ui/instrument';
import { ArrowLeft, GitBranch, FlaskConical, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ClaimHeaderProps {
  claim: ClaimNode;
  question: QuestionNode | null;
  onBackToMap: () => void;
  onSelectQuestion?: (questionId: string) => void;
  onOpenWeakenModal: () => void;
  onOpenAddExperimentModal: () => void;
  onOpenRejectModal: () => void;
}

export function ClaimHeader({
  claim,
  question,
  onBackToMap,
  onSelectQuestion,
  onOpenWeakenModal,
  onOpenAddExperimentModal,
  onOpenRejectModal,
}: ClaimHeaderProps) {
  const versionNumber = claim.version || (claim.history ? claim.history.length : 1);
  const lastEdited = claim.lastEditedTime || 'recently';

  return (
    <header
      id="workbench-claim-header"
      className="space-y-4 pb-6 border-b border-rule/70"
    >
      {/* Top navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-ink-muted">
        {/* Back to Argument Map button */}
        <button
          id="workbench-back-to-map"
          onClick={onBackToMap}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 -ml-2 rounded-[2px] text-ink hover:text-ink hover:bg-surface border border-transparent hover:border-rule transition-colors cursor-pointer"
          title="Return to full Argument Map"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="font-sans font-medium tracking-tight">◀ ARGUMENT MAP</span>
        </button>

        {/* Claim Version & Link Status indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface border border-rule rounded-[2px]">
            <StatusDot status={claim.linkStatus} size="sm" />
            <span
              className={`uppercase tracking-wider ${
                claim.linkStatus === 'holds'
                  ? 'text-holds font-medium'
                  : claim.linkStatus === 'weak'
                    ? 'text-weak font-medium'
                    : 'text-missing font-medium'
              }`}
            >
              Link {claim.linkStatus}
            </span>
          </div>

          <span className="text-ink-muted">
            CLAIM · v{versionNumber} · {lastEdited}
          </span>
        </div>
      </div>

      {/* Parent Question line */}
      {question && (
        <div className="space-y-1">
          <SectionLabel mono className="text-[10px] text-ink-muted">
            PARENT QUESTION
          </SectionLabel>
          <button
            onClick={() => onSelectQuestion?.(question.id)}
            className="block text-left font-serif text-[15px] text-ink/80 hover:text-ink transition-colors cursor-pointer"
            title="Jump to this question on the map"
          >
            {question.text}
          </button>
        </div>
      )}

      {/* Primary Claim text & Action buttons */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SectionLabel mono className="text-[10px] text-ink-muted">
              CLAIM
            </SectionLabel>
            {claim.isRejected && (
              <span
                id="workbench-claim-rejected-badge"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-paper border border-rule text-[10px] font-mono uppercase tracking-wider text-ink-muted font-medium"
              >
                [ REJECTED ]
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              id="workbench-action-weaken"
              size="sm"
              variant="secondary"
              onClick={onOpenWeakenModal}
              title="Narrow or weaken the claim wording with a required user note"
              className="flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5 text-ink-muted" />
              Weaken
            </Button>

            <Button
              id="workbench-action-add-exp"
              size="sm"
              variant="secondary"
              onClick={onOpenAddExperimentModal}
              title="Attach a new experiment finding directly under this claim"
              className="flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5 text-ink-muted" />
              Add experiment
            </Button>

            {claim.isRejected ? (
              <Button
                id="workbench-action-unreject"
                size="sm"
                variant="secondary"
                onClick={onOpenRejectModal}
                title="Reactivate this claim"
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-holds" />
                Un-reject
              </Button>
            ) : (
              <Button
                id="workbench-action-reject"
                size="sm"
                variant="destructive"
                onClick={onOpenRejectModal}
                title="Flag this claim as rejected while preserving all reasoning"
                className="flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Reject
              </Button>
            )}
          </div>
        </div>

        {/* Claim Wording - The Largest text on the surface and visual center of gravity */}
        <h1
          id="workbench-claim-wording"
          className="font-serif text-[24px] sm:text-[27px] font-normal leading-[1.32] text-ink select-text tracking-tight"
        >
          {claim.text}
        </h1>

        {/* If rejected, show explanation banner */}
        {claim.isRejected && claim.rejectNote && (
          <div className="p-3 bg-paper border border-rule text-[12px] font-sans text-ink-muted leading-relaxed rounded-[2px]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink block mb-0.5 font-medium">
              REJECTION RECORD:
            </span>
            {claim.rejectNote}
          </div>
        )}
      </div>
    </header>
  );
}
