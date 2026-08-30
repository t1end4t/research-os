import React, { useState } from 'react';
import { ClaimNode } from '../../types';
import { Button, SectionLabel, EmptyRequiredReason } from '../ui/instrument';
import { ExaminerCheckBlock } from './ExaminerCheckBlock';
import { InlineReasonEditor } from './InlineReasonEditor';
import { Check, Edit3, ShieldCheck } from 'lucide-react';
import { Tooltip, ExplainerButton, GUIDANCE_COPY } from '../../guidance';

interface ClaimToQuestionReasonProps {
  claim: ClaimNode;
  onlyMine?: boolean;
  onUpdateReason: (newReason: string) => void;
  onCheckLink: () => void;
}

export function ClaimToQuestionReason({
  claim,
  onlyMine = false,
  onUpdateReason,
  onCheckLink,
}: ClaimToQuestionReasonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const userReason = claim.questionReason ?? claim.check?.reasonText ?? '';
  const hasReason = userReason.trim().length > 0;

  const checkResult = claim.questionCheckResult || (claim.check ? {
    modelId: 'cx/gpt-5.6-sol',
    timestamp: 'checked 2 days ago',
    finding: claim.check.explanation,
    axes: claim.check.checks.map((c) => ({
      label: (c.label.toUpperCase() as 'TYPE' | 'SCOPE' | 'TARGET') || 'TYPE',
      verdict: (c.status === 'aligned' ? 'pass' : c.status === 'partial' ? 'partial' : 'mismatch') as 'pass' | 'partial' | 'mismatch',
      detail: c.detail,
    })),
  } : null);

  const handleSaveReason = (newReason: string) => {
    onUpdateReason(newReason);
    setIsEditing(false);
  };

  return (
    <section
      id="workbench-claim-question-reason"
      className="space-y-3 py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SectionLabel mono className="text-[11px] text-ink font-medium">
            WHY THIS ANSWERS THE QUESTION
          </SectionLabel>
          <ExplainerButton explainerKey="reason_required" surfaceId="workbench" />
        </div>

        {/* Check link button */}
        <div className="flex items-center gap-2">
          {!hasReason ? (
            <Tooltip content={GUIDANCE_COPY.disabled.check_link}>
              <div className="flex items-center gap-1.5 cursor-help">
                <Button
                  id="workbench-check-question-link-disabled"
                  size="sm"
                  variant="secondary"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Check Link
                </Button>
                <span className="text-[10px] font-mono text-missing">
                  (! Reason required to check)
                </span>
              </div>
            </Tooltip>
          ) : (
            <Tooltip content="Request Examiner 3-axis check on this question-claim reasoning link">
              <Button
                id="workbench-check-question-link"
                size="sm"
                variant="secondary"
                onClick={onCheckLink}
                className="flex items-center gap-1.5 hover:border-ink"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-ink-muted" />
                Check Link
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Inline reason editor vs View mode */}
      {isEditing ? (
        <InlineReasonEditor
          initialValue={userReason}
          label="COMMITTING WHY THIS ANSWERS THE QUESTION (USER-AUTHORED)"
          placeholder="Why does this claim answer the question asked above?"
          onSave={handleSaveReason}
          onCancel={() => setIsEditing(false)}
        />
      ) : !hasReason ? (
        /* Empty Required Reason Hole */
        <EmptyRequiredReason
          label="question_link_reason"
          instruction="Required to check link — click to write why this claim answers the parent question"
          onClick={() => setIsEditing(true)}
        />
      ) : (
        <div className="group relative p-3.5 bg-surface border border-rule hover:border-ink-muted/80 rounded-[2px] transition-colors">
          <div className="flex items-start justify-between gap-4">
            <p className="font-serif text-[15px] leading-relaxed text-ink select-text">
              {userReason}
            </p>
            <Tooltip content="Edit reason in place">
              <button
                onClick={() => setIsEditing(true)}
                className="shrink-0 p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] transition-colors cursor-pointer"
                aria-label="Edit why this claim answers question"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Model Examiner block for Question Link */}
      {!onlyMine && hasReason && checkResult && (
        <ExaminerCheckBlock
          checkResult={checkResult}
          isStale={false}
          className="mt-3"
        />
      )}
    </section>
  );
}
