import React, { useState } from 'react';
import {
  QuestionNode,
  ClaimNode,
  EvidenceItem,
  ExperimentGroup,
  ArtifactItem,
  DraftSection,
  DraftPlacedReference,
  DraftPlacedArtifact,
} from '../../types';
import {
  SectionAnalysis,
  DraftGapItem,
  getAllClaims,
  getParentQuestion,
  findClaimById,
  findEvidenceById,
  findArtifactById,
  isContraryFinding,
} from '../../utils/draftHelpers';
import { setResearchItemDragData } from '../../researchItemDrag';
import { SectionLabel, StatusDot, Button } from '../ui/instrument';
import { Tooltip, ExplainerButton, Term, GUIDANCE_COPY } from '../../guidance';
import {
  FileText,
  AlertCircle,
  Plus,
  ExternalLink,
  GripVertical,
  CheckCircle2,
  Clock,
  BookOpen,
  FlaskConical,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Image as ImageIcon,
  Table as TableIcon,
  StickyNote,
} from 'lucide-react';

export type LedgerMode = 'claims' | 'findings' | 'artifacts' | 'gaps';

export interface DraftSupportLedgerProps {
  activeSection: DraftSection | null;
  allSections: DraftSection[];
  activeSectionAnalysis?: SectionAnalysis;
  allGaps: DraftGapItem[];
  questions: QuestionNode[];
  experiments: ExperimentGroup[];
  ledgerMode: LedgerMode;
  onSelectLedgerMode: (mode: LedgerMode) => void;
  selectedAnchorId?: string | null;
  onAddReference: (
    sectionId: string,
    targetType: 'claim' | 'evidence',
    targetId: string,
    version?: number | string
  ) => void;
  onAddArtifact: (
    sectionId: string,
    artifactId: string,
    artifactType: 'PLOT' | 'TABLE' | 'NOTE'
  ) => void;
  onSelectSection?: (sectionId: string) => void;
  onOpenWorkbenchForClaim?: (claimId: string) => void;
  onOpenPaper?: (paperId: string) => void;
  onReviewDrift?: (ref: DraftPlacedReference, claim: ClaimNode) => void;
}

export function DraftSupportLedger({
  activeSection,
  allSections,
  activeSectionAnalysis,
  allGaps,
  questions,
  experiments,
  ledgerMode,
  onSelectLedgerMode,
  selectedAnchorId,
  onAddReference,
  onAddArtifact,
  onSelectSection,
  onOpenWorkbenchForClaim,
  onOpenPaper,
  onReviewDrift,
}: DraftSupportLedgerProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const allClaims = getAllClaims(questions);

  // Determine placed status sets across all sections
  const placedClaimIds = new Set<string>();
  const placedEvidenceIds = new Set<string>();
  const placedArtifactIds = new Set<string>();

  allSections.forEach((s) => {
    s.placedReferences?.forEach((r) => {
      if (r.targetType === 'claim') placedClaimIds.add(r.targetId);
      if (r.targetType === 'evidence') placedEvidenceIds.add(r.targetId);
    });
    s.placedArtifacts?.forEach((a) => {
      placedArtifactIds.add(a.artifactId);
    });
  });

  const activeSectionClaimIds = new Set(
    activeSection?.placedReferences
      ?.filter((r) => r.targetType === 'claim')
      .map((r) => r.targetId) || []
  );
  const activeSectionEvidenceIds = new Set(
    activeSection?.placedReferences
      ?.filter((r) => r.targetType === 'evidence')
      .map((r) => r.targetId) || []
  );
  const activeSectionArtifactIds = new Set(
    activeSection?.placedArtifacts?.map((a) => a.artifactId) || []
  );

  // Compute all findings relevant to current section's claims (or all claims if none connected)
  const relevantClaims =
    activeSectionAnalysis && activeSectionAnalysis.linkedClaims.length > 0
      ? activeSectionAnalysis.linkedClaims
      : allClaims;

  const contraryFindings: { evidence: EvidenceItem; parentClaim: ClaimNode }[] = [];
  const supportingFindings: { evidence: EvidenceItem; parentClaim: ClaimNode }[] = [];

  relevantClaims.forEach((c) => {
    c.evidence?.forEach((ev) => {
      if (isContraryFinding(ev)) {
        contraryFindings.push({ evidence: ev, parentClaim: c });
      } else {
        supportingFindings.push({ evidence: ev, parentClaim: c });
      }
    });
  });

  // Compute all artifacts connected to relevant claims
  const relevantArtifacts: { artifact: ArtifactItem; experiment: ExperimentGroup; parentClaim?: ClaimNode }[] = [];
  experiments.forEach((exp) => {
    exp.artifacts?.forEach((art) => {
      const parentClaim = findClaimById(questions, art.claimId);
      if (
        relevantClaims.some((c) => c.id === art.claimId) ||
        relevantClaims.length === allClaims.length
      ) {
        relevantArtifacts.push({ artifact: art, experiment: exp, parentClaim });
      }
    });
  });

  // Gap items for the active section or whole draft
  const currentGaps = activeSectionAnalysis ? activeSectionAnalysis.gaps : allGaps;

  return (
    <aside
      id="draft-support-ledger-column"
      aria-label="Draft Support Ledger"
      className="w-full lg:w-[320px] xl:w-[360px] bg-surface border-l border-rule flex flex-col shrink-0 select-none overflow-hidden h-full font-sans"
    >
      {/* Ledger Header & Mode Switch */}
      <div className="p-3 border-b border-rule flex flex-col gap-2 shrink-0 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SectionLabel mono className="text-ink">
              SUPPORT LEDGER
            </SectionLabel>
            <ExplainerButton explainerKey="draft_drift" surfaceId="draft" />
          </div>
          <span className="text-[10px] font-mono text-ink-muted">
            {activeSection ? activeSection.title.slice(0, 18) + '...' : 'Manuscript'}
          </span>
        </div>

        {/* 4 Modes: Claims | Findings | Artifacts | Gaps */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-paper rounded-[2px] border border-rule/70 text-[11px] font-mono">
          <Tooltip content="Show all claims available to place as references in prose">
            <button
              id="draft-ledger-tab-claims"
              onClick={() => onSelectLedgerMode('claims')}
              className={`py-1 rounded-[2px] transition-colors cursor-pointer ${
                ledgerMode === 'claims'
                  ? 'bg-surface font-semibold text-ink shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Claims ({allClaims.length})
            </button>
          </Tooltip>
          <Tooltip content="Show supporting and contrary findings for current section claims">
            <button
              id="draft-ledger-tab-findings"
              onClick={() => onSelectLedgerMode('findings')}
              className={`py-1 rounded-[2px] transition-colors cursor-pointer ${
                ledgerMode === 'findings'
                  ? 'bg-surface font-semibold text-ink shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Findings
            </button>
          </Tooltip>
          <Tooltip content="Show artifact figures and tables connected to section claims">
            <button
              id="draft-ledger-tab-artifacts"
              onClick={() => onSelectLedgerMode('artifacts')}
              className={`py-1 rounded-[2px] transition-colors cursor-pointer ${
                ledgerMode === 'artifacts'
                  ? 'bg-surface font-semibold text-ink shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Artifacts
            </button>
          </Tooltip>
          <Tooltip content="Inspect active gaps, unplaced contradictions, and broken references">
            <button
              id="draft-ledger-tab-gaps"
              onClick={() => onSelectLedgerMode('gaps')}
              className={`py-1 rounded-[2px] transition-colors cursor-pointer relative ${
                ledgerMode === 'gaps'
                  ? 'bg-surface font-semibold text-ink shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span>Gaps</span>
              {currentGaps.length > 0 && (
                <span className="ml-1 px-1 py-0.2 rounded-full bg-missing text-white text-[9px] font-bold">
                  {currentGaps.length}
                </span>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Mode 1: CLAIMS */}
      {ledgerMode === 'claims' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] font-sans text-ink-muted italic">
            Claims from the research graph. Drag or click "+ Add" to place into the active section.
          </div>

          <div className="space-y-2">
            {allClaims.map((claim) => {
              const parentQ = getParentQuestion(questions, claim.id);
              const isPlacedInCurrent = activeSectionClaimIds.has(claim.id);
              const isPlacedElsewhere = placedClaimIds.has(claim.id) && !isPlacedInCurrent;

              return (
                <div
                  key={claim.id}
                  id={`draft-ledger-claim-${claim.id}`}
                  draggable
                  onDragStart={(e) => {
                    setResearchItemDragData(e.dataTransfer, {
                      id: claim.id,
                      type: 'CLAIM',
                      label: claim.text,
                    });
                  }}
                  className={`group relative bg-surface border rounded-[2px] p-2.5 flex flex-col gap-1.5 transition-colors cursor-grab active:cursor-grabbing ${
                    isPlacedInCurrent
                      ? 'border-ink/60 bg-paper'
                      : 'border-rule hover:border-ink-muted'
                  }`}
                >
                  {/* Top: Status dot + Parent Question */}
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={claim.linkStatus} size="sm" />
                      <span className="text-ink-muted truncate max-w-[170px]">
                        {parentQ?.text || 'Question'}
                      </span>
                    </div>
                    <span className="text-ink-muted">v{claim.version ?? 1}</span>
                  </div>

                  {/* Claim Text */}
                  <p className="font-serif text-xs text-ink leading-relaxed font-medium">
                    {claim.text}
                  </p>

                  {/* Link Status & Reason summary */}
                  {claim.check?.reasonText ? (
                    <p className="text-[10px] font-mono text-ink-muted truncate">
                      Reason: {claim.check.reasonText}
                    </p>
                  ) : (
                    <span className="text-[9px] font-mono text-missing">
                      Reason unwritten — cannot be checked.
                    </span>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-1 border-t border-rule/40 text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-ink-muted">
                      {isPlacedInCurrent ? (
                        <span className="text-ink font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-holds" />
                          <span>Placed in section</span>
                        </span>
                      ) : isPlacedElsewhere ? (
                        <span>Placed elsewhere</span>
                      ) : (
                        <span>Not placed</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onOpenWorkbenchForClaim && (
                        <button
                          onClick={() => onOpenWorkbenchForClaim(claim.id)}
                          className="p-1 hover:bg-paper rounded text-ink-muted hover:text-ink cursor-pointer"
                          title="Open claim in Workbench"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      {activeSection && !isPlacedInCurrent && (
                        <button
                          id={`draft-add-claim-btn-${claim.id}`}
                          onClick={() =>
                            onAddReference(
                              activeSection.id,
                              'claim',
                              claim.id,
                              claim.version ?? 1
                            )
                          }
                          className="px-2 py-0.5 rounded-[2px] bg-paper hover:bg-ink hover:text-paper border border-rule font-medium text-ink transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: FINDINGS */}
      {ledgerMode === 'findings' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] font-sans text-ink-muted italic">
            Evidence findings from connected claims. Contradicting findings appear first.
          </div>

          {/* Group 1: CONTRADICTING FINDINGS (Must appear first and never hidden!) */}
          {contraryFindings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-missing font-mono text-[10px] font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-missing" />
                <span>CONTRADICTING FINDINGS ({contraryFindings.length})</span>
              </div>

              {contraryFindings.map(({ evidence: ev, parentClaim }) => {
                const isPlaced = activeSectionEvidenceIds.has(ev.id);

                return (
                  <div
                    key={ev.id}
                    id={`draft-ledger-contrary-${ev.id}`}
                    draggable
                    onDragStart={(e) => {
                      setResearchItemDragData(e.dataTransfer, {
                        id: ev.id,
                        type: 'EVIDENCE',
                        label: ev.title,
                      });
                    }}
                    className="bg-paper border border-missing/60 rounded-[2px] p-2.5 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-missing font-semibold uppercase">
                        Cuts against claim
                      </span>
                      {ev.citation && <span className="text-ink-muted">{ev.citation}</span>}
                    </div>

                    <p className="font-serif text-xs text-ink leading-relaxed">
                      {ev.title}
                    </p>

                    <div className="text-[10px] font-mono text-ink-muted">
                      Under: {parentClaim.text.slice(0, 45)}...
                    </div>

                    {ev.userReason ? (
                      <p className="text-[10px] font-mono text-ink-muted truncate">
                        Reason: {ev.userReason}
                      </p>
                    ) : (
                      <span className="text-[9px] font-mono text-missing">
                        Reason unwritten — cannot be checked.
                      </span>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-rule/40 text-[10px] font-mono">
                      <span className="text-missing font-medium">
                        {isPlaced ? 'Placed in section' : 'Contradicting finding not placed'}
                      </span>
                      {activeSection && !isPlaced && (
                        <button
                          onClick={() => onAddReference(activeSection.id, 'evidence', ev.id)}
                          className="px-2 py-0.5 rounded-[2px] bg-missing text-white font-medium hover:bg-missing/90 cursor-pointer"
                        >
                          + Place
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Group 2: SUPPORTING FINDINGS */}
          <div className="space-y-2">
            <SectionLabel mono className="text-ink">
              SUPPORTING FINDINGS ({supportingFindings.length})
            </SectionLabel>

            {supportingFindings.map(({ evidence: ev, parentClaim }) => {
              const isPlaced = activeSectionEvidenceIds.has(ev.id);

              return (
                <div
                  key={ev.id}
                  id={`draft-ledger-finding-${ev.id}`}
                  draggable
                  onDragStart={(e) => {
                    setResearchItemDragData(e.dataTransfer, {
                      id: ev.id,
                      type: 'EVIDENCE',
                      label: ev.title,
                    });
                  }}
                  className={`bg-surface border rounded-[2px] p-2.5 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing transition-colors ${
                    isPlaced ? 'border-ink/60 bg-paper' : 'border-rule hover:border-ink-muted'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={ev.linkStatus || 'holds'} size="sm" />
                      <span className="text-ink-muted truncate max-w-[170px]">
                        {parentClaim.text.slice(0, 30)}...
                      </span>
                    </div>
                    {ev.citation && <span className="text-ink-muted">{ev.citation}</span>}
                  </div>

                  <p className="font-serif text-xs text-ink leading-relaxed font-medium">
                    {ev.title}
                  </p>

                  {ev.userReason ? (
                    <p className="text-[10px] font-mono text-ink-muted truncate">
                      Reason: {ev.userReason}
                    </p>
                  ) : (
                    <span className="text-[9px] font-mono text-missing">
                      Reason unwritten — cannot be checked.
                    </span>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-rule/40 text-[10px] font-mono">
                    <span className="text-ink-muted">
                      {isPlaced ? 'Placed in section' : 'Available'}
                    </span>
                    {activeSection && !isPlaced && (
                      <button
                        onClick={() => onAddReference(activeSection.id, 'evidence', ev.id)}
                        className="px-2 py-0.5 rounded-[2px] bg-paper hover:bg-ink hover:text-paper border border-rule font-medium text-ink transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: ARTIFACTS */}
      {ledgerMode === 'artifacts' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] font-sans text-ink-muted italic">
            Plots, tables, and notes from experiments connected to claims.
          </div>

          <div className="space-y-2">
            {relevantArtifacts.length === 0 ? (
              <div className="p-3 text-center text-xs text-ink-muted italic">
                No experiment artifacts are available for the claims in this section.
              </div>
            ) : (
              relevantArtifacts.map(({ artifact: art, experiment: exp, parentClaim }) => {
                const isPlaced = activeSectionArtifactIds.has(art.id);
                const hasResult = Boolean(art.findingSummary?.trim());
                const isDone = exp.status === 'done';
                const isMissingResult = isDone && !hasResult;

                return (
                  <div
                    key={art.id}
                    id={`draft-ledger-art-${art.id}`}
                    draggable
                    onDragStart={(e) => {
                      setResearchItemDragData(e.dataTransfer, {
                        id: art.id,
                        type: 'ARTIFACT',
                        label: art.title,
                      });
                    }}
                    className={`bg-surface border rounded-[2px] p-2.5 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing transition-colors ${
                      isPlaced ? 'border-ink/60 bg-paper' : 'border-rule hover:border-ink-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded-[2px] bg-paper border border-rule font-semibold text-ink">
                        {art.type}
                      </span>
                      <span className="text-ink-muted uppercase">{exp.status}</span>
                    </div>

                    <p className="font-sans text-xs font-semibold text-ink">
                      {art.title}
                    </p>

                    <div className="text-[10px] font-mono text-ink-muted">
                      Experiment: {exp.name.slice(0, 35)}...
                    </div>

                    {isMissingResult ? (
                      <span className="text-[9px] font-mono text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded-[2px]">
                        Result unrecorded
                      </span>
                    ) : art.findingSummary ? (
                      <p className="text-[10px] font-mono text-ink-muted truncate">
                        Observation: {art.findingSummary}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between pt-1 border-t border-rule/40 text-[10px] font-mono">
                      <span className="text-ink-muted">
                        {isPlaced ? 'Placed in section' : 'Available'}
                      </span>
                      {activeSection && !isPlaced && (
                        <button
                          onClick={() =>
                            onAddArtifact(activeSection.id, art.id, art.type)
                          }
                          className="px-2 py-0.5 rounded-[2px] bg-paper hover:bg-ink hover:text-paper border border-rule font-medium text-ink transition-colors cursor-pointer"
                        >
                          + Place
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mode 4: GAPS */}
      {ledgerMode === 'gaps' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] font-sans text-ink-muted italic">
            Explicit assembly defects calculated across explicit graph links and placements.
          </div>

          {currentGaps.length === 0 ? (
            <div className="p-4 text-center text-xs text-ink-muted font-sans italic bg-paper rounded-[2px] border border-rule/50">
              No assembly gaps are visible from the explicit references in this section.
            </div>
          ) : (
            <div className="space-y-2">
              {currentGaps.map((gap) => {
                const severityClass =
                  gap.severity === 'red'
                    ? 'border-missing/60 bg-missing/5 text-missing'
                    : gap.severity === 'amber'
                    ? 'border-weak/60 bg-weak/5 text-weak'
                    : 'border-rule bg-surface text-ink-muted';

                return (
                  <div
                    key={gap.id}
                    id={`draft-gap-card-${gap.id}`}
                    className={`border rounded-[2px] p-2.5 flex flex-col gap-1 text-xs font-sans transition-colors ${severityClass}`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase">
                      <span>{gap.label}</span>
                      {gap.sectionTitle && (
                        <span className="text-ink-muted font-normal">
                          {gap.sectionTitle.slice(0, 18)}...
                        </span>
                      )}
                    </div>

                    <p className="text-ink text-xs font-serif leading-relaxed">
                      {gap.detail}
                    </p>

                    {/* Routing action */}
                    <div className="flex items-center justify-end pt-1 border-t border-rule/30">
                      {gap.sectionId && onSelectSection && (
                        <button
                          onClick={() => onSelectSection(gap.sectionId!)}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-ink hover:underline cursor-pointer"
                        >
                          <span>Go to section</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
