import React, { useState } from 'react';
import {
  ClaimNode,
  QuestionNode,
  EvidenceItem,
  ClaimVersion,
  AppTab,
  ExaminerCheckResult,
} from '../../types';
import { ClaimHeader } from './ClaimHeader';
import { ClaimToQuestionReason } from './ClaimToQuestionReason';
import { SupportFindingsList } from './SupportFindingsList';
import { ClaimHistorySection } from './ClaimHistorySection';
import { UserNoteModal, ModalType } from './UserNoteModal';
import { SurfaceNote } from '../../guidance';

interface ClaimWorkbenchProps {
  claim: ClaimNode;
  question: QuestionNode | null;
  onlyMine?: boolean;
  onBackToMap: () => void;
  onSelectQuestion?: (questionId: string) => void;
  onNavigateToTab?: (tab: AppTab, contextId?: string) => void;
  onUpdateClaim?: (updatedClaim: ClaimNode) => void;
}

export function ClaimWorkbench({
  claim,
  question,
  onlyMine = false,
  onBackToMap,
  onSelectQuestion,
  onNavigateToTab,
  onUpdateClaim,
}: ClaimWorkbenchProps) {
  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ModalType;
    findingTarget?: EvidenceItem;
    versionTarget?: ClaimVersion;
  }>({
    isOpen: false,
    type: 'weaken_claim',
  });

  // Handler: update claim-to-question reason
  const handleUpdateQuestionReason = (newReason: string) => {
    const isStale = Boolean(claim.questionCheckResult);
    const updatedClaim: ClaimNode = {
      ...claim,
      questionReason: newReason,
      lastEditedTime: 'edited just now',
      questionCheckResult: claim.questionCheckResult
        ? {
            ...claim.questionCheckResult,
            isStale,
            staleNote: isStale
              ? 'Checked against an earlier version of this reason.'
              : undefined,
          }
        : undefined,
      linkEvents: [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'just now',
          createdAt: Date.now(),
          kind: 'reason_updated',
          summary: 'Updated reasoning for why claim answers the parent question.',
        },
        ...(claim.linkEvents || []),
      ],
    };
    onUpdateClaim?.(updatedClaim);
  };

  // Handler: check claim-to-question link
  const handleCheckQuestionLink = () => {
    const hasReason = Boolean(
      (claim.questionReason ?? claim.check?.reasonText ?? '').trim()
    );
    if (!hasReason) return; // Strict prevention

    const newCheckResult: ExaminerCheckResult = {
      modelId: 'cx/gpt-5.6-sol',
      timestamp: 'checked just now',
      checkedTimestamp: Date.now(),
      finding:
        'Mechanistic claim directly answers the primary encoding mechanism for simple-cell tuning from scene statistics.',
      axes: [
        {
          label: 'TYPE',
          verdict: 'pass',
          detail: 'both address causal encoding mechanisms',
        },
        {
          label: 'SCOPE',
          verdict: 'pass',
          detail: 'both concern primary visual cortex receptive fields',
        },
        {
          label: 'TARGET',
          verdict: 'pass',
          detail: 'measures simple-cell tuning geometry directly',
        },
      ],
    };

    const updatedClaim: ClaimNode = {
      ...claim,
      linkStatus: 'holds',
      questionCheckResult: newCheckResult,
      linkEvents: [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'just now',
          createdAt: Date.now(),
          kind: 'check_run',
          summary:
            'Examiner check completed for Question-Claim link (All 3 axes PASS).',
        },
        ...(claim.linkEvents || []),
      ],
    };
    onUpdateClaim?.(updatedClaim);
  };

  // Handler: update user reason for an evidence finding
  const handleUpdateEvidenceReason = (
    evidenceId: string,
    newReason: string
  ) => {
    const updatedEvidence = claim.evidence.map((item) => {
      if (item.id === evidenceId) {
        const isStale = Boolean(item.checkResult);
        return {
          ...item,
          userReason: newReason,
          checkResult: item.checkResult
            ? {
                ...item.checkResult,
                isStale,
                staleNote: isStale
                  ? 'Checked against an earlier version of this reason.'
                  : undefined,
              }
            : undefined,
        };
      }
      return item;
    });

    const updatedClaim: ClaimNode = {
      ...claim,
      evidence: updatedEvidence,
      linkEvents: [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'just now',
          createdAt: Date.now(),
          kind: 'reason_updated',
          summary: `Updated user reason for finding ${evidenceId}.`,
        },
        ...(claim.linkEvents || []),
      ],
    };
    onUpdateClaim?.(updatedClaim);
  };

  // Handler: check an individual evidence link
  const handleCheckEvidenceLink = (evidenceId: string) => {
    const target = claim.evidence.find((e) => e.id === evidenceId);
    if (!target || !target.userReason || target.userReason.trim().length === 0) {
      return; // Enforce rule: cannot check without user reason
    }

    let verdict: 'holds' | 'weak' | 'missing' = 'holds';
    let checkResult: ExaminerCheckResult;

    if (target.kind === 'experiment') {
      verdict = 'missing';
      checkResult = {
        modelId: 'cx/gpt-5.6-sol',
        timestamp: 'checked just now',
        checkedTimestamp: Date.now(),
        finding:
          'Target mismatch: reconstruction error does not evaluate receptive-field shape.',
        axes: [
          {
            label: 'TYPE',
            verdict: 'pass',
            detail: 'claim and sweep are both causal interventions',
          },
          {
            label: 'SCOPE',
            verdict: 'partial',
            detail: 'uses grayscale synthetic patches only',
          },
          {
            label: 'TARGET',
            verdict: 'mismatch',
            detail:
              'the sweep measures reconstruction error, not receptive-field shape',
          },
        ],
      };
    } else {
      verdict = 'holds';
      checkResult = {
        modelId: 'cx/gpt-5.6-sol',
        timestamp: 'checked just now',
        checkedTimestamp: Date.now(),
        finding:
          'Mechanistic finding directly verifies emergence of receptive-field filter tuning.',
        axes: [
          {
            label: 'TYPE',
            verdict: 'pass',
            detail: 'claim and finding are both mechanistic',
          },
          {
            label: 'SCOPE',
            verdict: 'pass',
            detail: 'both concern simple cells in V1',
          },
          {
            label: 'TARGET',
            verdict: 'pass',
            detail: 'the finding measures what the claim asserts',
          },
        ],
      };
    }

    const updatedEvidence = claim.evidence.map((item) => {
      if (item.id === evidenceId) {
        return {
          ...item,
          linkStatus: verdict,
          checkResult,
        };
      }
      return item;
    });

    const updatedClaim: ClaimNode = {
      ...claim,
      evidence: updatedEvidence,
      linkEvents: [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'just now',
          createdAt: Date.now(),
          kind: 'check_run',
          summary: `Examiner check run on finding "${target.title.slice(0, 35)}..." (${verdict}).`,
        },
        ...(claim.linkEvents || []),
      ],
    };
    onUpdateClaim?.(updatedClaim);
  };

  // Handler: check all evidence links that have reasons
  const handleCheckAllLinks = () => {
    const updatedEvidence = claim.evidence.map((item) => {
      if (!item.userReason || item.userReason.trim().length === 0) {
        return item;
      }
      const isExp = item.kind === 'experiment';
      return {
        ...item,
        linkStatus: (isExp ? 'missing' : 'holds') as 'holds' | 'weak' | 'missing',
        checkResult: {
          modelId: 'cx/gpt-5.6-sol',
          timestamp: 'checked just now',
          checkedTimestamp: Date.now(),
          finding: isExp
            ? 'Target mismatch: measures reconstruction loss instead of filter geometry.'
            : 'Mechanistic finding directly verifies emergence of filter tuning.',
          axes: [
            {
              label: 'TYPE',
              verdict: 'pass',
              detail: isExp ? 'both are causal' : 'both are mechanistic',
            },
            {
              label: 'SCOPE',
              verdict: isExp ? 'partial' : 'pass',
              detail: isExp ? 'grayscale image patches' : 'simple cells in V1',
            },
            {
              label: 'TARGET',
              verdict: isExp ? 'mismatch' : 'pass',
              detail: isExp
                ? 'reconstruction loss vs filter shape'
                : 'measures what claim asserts',
            },
          ],
        } as ExaminerCheckResult,
      };
    });

    const updatedClaim: ClaimNode = {
      ...claim,
      evidence: updatedEvidence,
      linkEvents: [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'just now',
          createdAt: Date.now(),
          kind: 'check_run',
          summary: 'Batch examiner check run across all ready links.',
        },
        ...(claim.linkEvents || []),
      ],
    };
    onUpdateClaim?.(updatedClaim);
  };

  // Modal Submit Handlers (Deliberate Commitments)
  const handleModalSubmit = (data: { textValue?: string; userNote: string }) => {
    const { type, findingTarget, versionTarget } = modalState;
    setModalState({ isOpen: false, type: 'weaken_claim' });

    if (type === 'weaken_claim' && data.textValue) {
      const currentVersion = claim.version || (claim.history?.length || 1);
      const nextVersionNumber = currentVersion + 1;
      const newVersion: ClaimVersion = {
        versionNumber: nextVersionNumber,
        versionLabel: `v${nextVersionNumber}`,
        timestamp: 'now',
        createdAt: Date.now(),
        claimText: data.textValue,
        note: data.userNote,
        trigger: 'Weaken / Narrow',
      };

      const updatedClaim: ClaimNode = {
        ...claim,
        text: data.textValue,
        version: nextVersionNumber,
        lastEditedTime: 'edited just now',
        history: [newVersion, ...(claim.history || [])],
        linkEvents: [
          {
            id: `evt-${Date.now()}`,
            timestamp: 'just now',
            createdAt: Date.now(),
            kind: 'version_created',
            summary: `Committed version v${nextVersionNumber}: ${data.userNote}`,
            userNote: data.userNote,
          },
          ...(claim.linkEvents || []),
        ],
      };
      onUpdateClaim?.(updatedClaim);
    } else if (type === 'add_experiment' && data.textValue) {
      const newExpFinding: EvidenceItem = {
        id: `e-exp-${Date.now()}`,
        kind: 'experiment',
        typeLabel: 'EXPERIMENT FINDING',
        title: data.textValue,
        citation: 'planned · 0 artifacts',
        status: 'planned',
        artifactCount: 0,
        linkStatus: 'missing',
        userReason: '', // Empty reason -> visible hole until user commits reasoning
        createdAt: Date.now(),
      };

      const updatedClaim: ClaimNode = {
        ...claim,
        evidence: [...claim.evidence, newExpFinding],
        linkEvents: [
          {
            id: `evt-${Date.now()}`,
            timestamp: 'just now',
            createdAt: Date.now(),
            kind: 'experiment_added',
            summary: `Attached experiment: "${data.textValue.slice(0, 40)}"`,
            userNote: data.userNote,
          },
          ...(claim.linkEvents || []),
        ],
      };
      onUpdateClaim?.(updatedClaim);
      // Route to experiments/bench
      onNavigateToTab?.('experiments', newExpFinding.id);
    } else if (type === 'reject_claim') {
      const updatedClaim: ClaimNode = {
        ...claim,
        isRejected: true,
        rejectNote: data.userNote,
        linkEvents: [
          {
            id: `evt-${Date.now()}`,
            timestamp: 'just now',
            createdAt: Date.now(),
            kind: 'claim_rejected',
            summary: `Claim flagged as rejected: ${data.userNote}`,
            userNote: data.userNote,
          },
          ...(claim.linkEvents || []),
        ],
      };
      onUpdateClaim?.(updatedClaim);
    } else if (type === 'unreject_claim') {
      const updatedClaim: ClaimNode = {
        ...claim,
        isRejected: false,
        rejectNote: undefined,
        linkEvents: [
          {
            id: `evt-${Date.now()}`,
            timestamp: 'just now',
            createdAt: Date.now(),
            kind: 'claim_unrejected',
            summary: `Claim reactivated: ${data.userNote}`,
            userNote: data.userNote,
          },
          ...(claim.linkEvents || []),
        ],
      };
      onUpdateClaim?.(updatedClaim);
    } else if (type === 'dismiss_finding' && findingTarget) {
      const updatedEvidence = claim.evidence.filter(
        (e) => e.id !== findingTarget.id
      );
      const updatedClaim: ClaimNode = {
        ...claim,
        evidence: updatedEvidence,
        linkEvents: [
          {
            id: `evt-${Date.now()}`,
            timestamp: 'just now',
            createdAt: Date.now(),
            kind: 'finding_dismissed',
            summary: `Dismissed finding "${findingTarget.title.slice(0, 35)}..."`,
            userNote: data.userNote,
          },
          ...(claim.linkEvents || []),
        ],
      };
      onUpdateClaim?.(updatedClaim);
    } else if (type === 'restore_version' && versionTarget) {
      const nextVersionNumber = (claim.version || 1) + 1;
      const newVersion: ClaimVersion = {
        versionNumber: nextVersionNumber,
        versionLabel: `v${nextVersionNumber}`,
        timestamp: 'now',
        createdAt: Date.now(),
        claimText: versionTarget.claimText,
        note: `Restored from ${versionTarget.versionLabel}: ${data.userNote}`,
        trigger: `Restored ${versionTarget.versionLabel}`,
      };

      const updatedClaim: ClaimNode = {
        ...claim,
        text: versionTarget.claimText,
        version: nextVersionNumber,
        lastEditedTime: 'edited just now',
        history: [newVersion, ...(claim.history || [])],
        linkEvents: [
          {
            id: `evt-${Date.now()}`,
            timestamp: 'just now',
            createdAt: Date.now(),
            kind: 'version_created',
            summary: `Restored wording from ${versionTarget.versionLabel}: ${data.userNote}`,
            userNote: data.userNote,
          },
          ...(claim.linkEvents || []),
        ],
      };
      onUpdateClaim?.(updatedClaim);
    }
  };

  return (
    <div
      id="workbench-surface-container"
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-in fade-in duration-150"
    >
      {/* Dismissible Surface Purpose Note */}
      <SurfaceNote surfaceId="readiness" />

      {/* 1. Header with Back button, Question, and primary Claim */}
      <ClaimHeader
        claim={claim}
        question={question}
        onBackToMap={onBackToMap}
        onSelectQuestion={onSelectQuestion}
        onOpenWeakenModal={() =>
          setModalState({ isOpen: true, type: 'weaken_claim' })
        }
        onOpenAddExperimentModal={() =>
          setModalState({ isOpen: true, type: 'add_experiment' })
        }
        onOpenRejectModal={() =>
          setModalState({
            isOpen: true,
            type: claim.isRejected ? 'unreject_claim' : 'reject_claim',
          })
        }
      />

      {/* 2. WHY THIS ANSWERS THE QUESTION (Claim-to-Question Reason) */}
      <ClaimToQuestionReason
        claim={claim}
        onlyMine={onlyMine}
        onUpdateReason={handleUpdateQuestionReason}
        onCheckLink={handleCheckQuestionLink}
      />

      {/* 3. SUPPORT (Findings & Evidence List) */}
      <SupportFindingsList
        claim={claim}
        onlyMine={onlyMine}
        onNavigateToTab={onNavigateToTab}
        onUpdateEvidenceReason={handleUpdateEvidenceReason}
        onCheckEvidenceLink={handleCheckEvidenceLink}
        onCheckAllLinks={handleCheckAllLinks}
        onOpenWeakenModal={() =>
          setModalState({ isOpen: true, type: 'weaken_claim' })
        }
        onOpenAddExperimentModal={() =>
          setModalState({ isOpen: true, type: 'add_experiment' })
        }
        onOpenDismissModal={(finding) =>
          setModalState({
            isOpen: true,
            type: 'dismiss_finding',
            findingTarget: finding,
          })
        }
      />

      {/* 4. HISTORY (Claim Versions & Link Audit Trail) */}
      <ClaimHistorySection
        claim={claim}
        onRestoreVersion={(version) =>
          setModalState({
            isOpen: true,
            type: 'restore_version',
            versionTarget: version,
          })
        }
      />

      {/* Deliberate Commitment Modal */}
      <UserNoteModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        claimText={claim.text}
        findingTitle={modalState.findingTarget?.title}
        versionToRestore={modalState.versionTarget}
        onClose={() => setModalState({ isOpen: false, type: 'weaken_claim' })}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
