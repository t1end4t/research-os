import React, { useState } from 'react';
import { ClaimNode, EvidenceItem, AppTab } from '../../types';
import { Button, SectionLabel, StatusBar, StatusDot, EmptyRequiredReason } from '../ui/instrument';
import { ExaminerCheckBlock } from './ExaminerCheckBlock';
import { InlineReasonEditor } from './InlineReasonEditor';
import {
  FileText,
  FlaskConical,
  ExternalLink,
  ShieldCheck,
  Edit3,
  GitBranch,
  Trash2,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';

interface SupportFindingsListProps {
  claim: ClaimNode;
  onlyMine?: boolean;
  onNavigateToTab?: (tab: AppTab, contextId?: string) => void;
  onUpdateEvidenceReason: (evidenceId: string, newReason: string) => void;
  onCheckEvidenceLink: (evidenceId: string) => void;
  onCheckAllLinks: () => void;
  onOpenWeakenModal: () => void;
  onOpenAddExperimentModal: () => void;
  onOpenDismissModal: (evidence: EvidenceItem) => void;
}

export function SupportFindingsList({
  claim,
  onlyMine = false,
  onNavigateToTab,
  onUpdateEvidenceReason,
  onCheckEvidenceLink,
  onCheckAllLinks,
  onOpenWeakenModal,
  onOpenAddExperimentModal,
  onOpenDismissModal,
}: SupportFindingsListProps) {
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [sortByDefects, setSortByDefects] = useState<boolean>(true);

  const findings = claim.evidence || [];

  // Sort findings: defects first (missing reason -> missing status -> weak status -> holds) vs creation order
  const sortedFindings = [...findings].sort((a, b) => {
    if (!sortByDefects) return 0;
    const getDefectScore = (item: EvidenceItem) => {
      const hasNoReason = !item.userReason || item.userReason.trim().length === 0;
      if (hasNoReason) return 0; // Most urgent defect
      if (item.linkStatus === 'missing') return 1;
      if (item.linkStatus === 'weak') return 2;
      return 3; // holds
    };
    return getDefectScore(a) - getDefectScore(b);
  });

  const checkableCount = findings.filter(
    (f) => f.userReason && f.userReason.trim().length > 0
  ).length;

  return (
    <section
      id="workbench-support-findings-section"
      className="space-y-4 pt-6 border-t border-rule/70"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SectionLabel mono className="text-[11px] text-ink font-medium">
            SUPPORT · {findings.length}{' '}
            {findings.length === 1 ? 'finding' : 'findings'}
          </SectionLabel>

          {findings.length > 1 && (
            <button
              onClick={() => setSortByDefects(!sortByDefects)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted hover:text-ink transition-colors cursor-pointer"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>
                {sortByDefects ? 'Sort: Defects first' : 'Sort: Creation order'}
              </span>
            </button>
          )}
        </div>

        {/* Check all links action */}
        {findings.length > 0 && (
          <Button
            id="workbench-check-all-links"
            size="sm"
            variant="secondary"
            onClick={onCheckAllLinks}
            disabled={checkableCount === 0}
            title={
              checkableCount === 0
                ? 'All findings lack user reasons — write reasons before checking'
                : `Run 3-axis checks on all ${checkableCount} ready findings`
            }
            className="flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-ink-muted" />
            Check all links ({checkableCount}/{findings.length})
          </Button>
        )}
      </div>

      {/* Ghost Node State if 0 findings attached */}
      {findings.length === 0 && (
        <div
          id="workbench-ghost-node-card"
          className="relative p-6 rounded-[2px] bg-paper/60 border border-dashed border-missing/60 space-y-4 text-center"
        >
          <div className="max-w-md mx-auto space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-missing/10 text-missing text-[11px] font-mono uppercase tracking-wider font-medium">
              ! STRUCTURAL HOLE · NO EVIDENCE LINKED
            </div>
            <p className="font-serif text-[15px] text-ink leading-relaxed">
              No evidence findings are attached to this claim yet. An unsupported
              claim is an ungrounded step in your argument.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigateToTab?.('papers')}
              className="flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-ink-muted" />
              Browse papers in Read
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenAddExperimentModal}
              className="flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              + Add experiment in Bench
            </Button>
          </div>
        </div>
      )}

      {/* Findings List */}
      {findings.length > 0 && (
        <div className="space-y-4">
          {sortedFindings.map((finding) => {
            const hasReason =
              Boolean(finding.userReason && finding.userReason.trim().length > 0);
            const isEditingReason = editingEvidenceId === finding.id;
            const linkStatus = finding.linkStatus || 'weak';
            const isExperiment = finding.kind === 'experiment';

            return (
              <div
                key={finding.id}
                id={`workbench-finding-${finding.id}`}
                className="relative p-4 pl-5 rounded-[2px] bg-surface border border-rule transition-colors space-y-3 overflow-hidden shadow-2xs"
              >
                {/* 3px signature status bar */}
                <StatusBar status={linkStatus} />

                {/* Finding Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted font-medium">
                      {isExperiment ? (
                        <>
                          <FlaskConical className="w-3 h-3 text-ink-muted" />
                          EXPERIMENT FINDING
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 text-ink-muted" />
                          PAPER FINDING
                        </>
                      )}
                    </span>

                    <span className="text-rule">•</span>

                    {/* Status badge */}
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-tight">
                      <StatusDot status={linkStatus} size="sm" />
                      <span
                        className={
                          linkStatus === 'holds'
                            ? 'text-holds font-medium'
                            : linkStatus === 'weak'
                              ? 'text-weak font-medium'
                              : 'text-missing font-medium'
                        }
                      >
                        {linkStatus}
                      </span>
                    </div>
                  </div>

                  {/* Individual Check button */}
                  <div className="flex items-center gap-2">
                    {!hasReason ? (
                      <div
                        className="flex items-center gap-1.5"
                        title="Write why this supports the claim before it can be checked."
                      >
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          className="opacity-40 cursor-not-allowed"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Check
                        </Button>
                        <span className="text-[10px] font-mono text-missing">
                          (! reason missing)
                        </span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onCheckEvidenceLink(finding.id)}
                        className="flex items-center gap-1 hover:border-ink"
                        title="Run 3-axis check on this link"
                      >
                        <ShieldCheck className="w-3 h-3 text-ink-muted" />
                        Check
                      </Button>
                    )}
                  </div>
                </div>

                {/* Finding Text & Source */}
                <div className="space-y-1">
                  {/* Finding statement in user-authored serif typeface (visually stronger than the source line!) */}
                  <h2 className="font-serif text-[17px] font-normal leading-snug text-ink select-text">
                    {finding.title || 'Untitled finding'}
                  </h2>

                  {/* Source line in secondary sans */}
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-muted font-sans pt-0.5">
                    <span>{finding.citation || 'Source unlinked'}</span>
                    <span>·</span>
                    {isExperiment ? (
                      <button
                        onClick={() => onNavigateToTab?.('experiments', finding.id)}
                        className="inline-flex items-center gap-1 text-ink hover:underline cursor-pointer"
                        title="Open experiment in Bench"
                      >
                        <span>open in Bench</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onNavigateToTab?.('papers', finding.paperId || 'p1')
                        }
                        className="inline-flex items-center gap-1 text-ink hover:underline cursor-pointer"
                        title="Open paper in Read"
                      >
                        <span>open in Read</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* YOUR REASON section */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                    <span className="font-medium text-ink">YOUR REASON</span>
                    {hasReason && !isEditingReason && (
                      <button
                        onClick={() => setEditingEvidenceId(finding.id)}
                        className="inline-flex items-center gap-1 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title="Edit your reason"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit reason</span>
                      </button>
                    )}
                  </div>

                  {/* Reason content vs Editor vs Empty hole */}
                  {isEditingReason ? (
                    <InlineReasonEditor
                      initialValue={finding.userReason || ''}
                      placeholder="Why does this finding support the claim?"
                      onSave={(newReason) => {
                        onUpdateEvidenceReason(finding.id, newReason);
                        setEditingEvidenceId(null);
                      }}
                      onCancel={() => setEditingEvidenceId(null)}
                    />
                  ) : !hasReason ? (
                    <EmptyRequiredReason
                      label="user_reason"
                      instruction="Write why this supports the claim before it can be checked."
                      onClick={() => setEditingEvidenceId(finding.id)}
                    />
                  ) : (
                    <div className="p-3 bg-paper border border-rule/70 rounded-[2px]">
                      <p className="font-serif text-[15px] leading-relaxed text-ink select-text">
                        {finding.userReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Examiner ModelBlock (3-Axis table & finding) */}
                {!onlyMine && hasReason && finding.checkResult && (
                  <ExaminerCheckBlock
                    checkResult={finding.checkResult}
                    actions={
                      <div className="flex flex-wrap items-center justify-between w-full gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={onOpenWeakenModal}
                            title="Weaken claim to match this finding's scope"
                            className="flex items-center gap-1 text-[11px]"
                          >
                            <GitBranch className="w-3 h-3 text-ink-muted" />
                            Weaken claim
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={onOpenAddExperimentModal}
                            title="Add experiment testing this target mismatch"
                            className="flex items-center gap-1 text-[11px]"
                          >
                            <FlaskConical className="w-3 h-3 text-ink-muted" />
                            Add experiment
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onOpenDismissModal(finding)}
                          title="Dismiss finding from this claim with recorded reason"
                          className="flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3 h-3" />
                          Dismiss finding
                        </Button>
                      </div>
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
