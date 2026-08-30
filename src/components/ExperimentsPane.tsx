import React, { useState, useEffect } from 'react';
import {
  ExperimentGroup,
  ArtifactItem,
  ExperimentStatus,
  QuestionNode,
  ClaimNode,
  LinkStatus,
} from '../types';
import { INITIAL_EXPERIMENTS_DATA } from '../data/experimentsData';
import { ExperimentModule } from './experiments/ExperimentModule';
import { ArtifactDetailOverlay } from './experiments/ArtifactDetailOverlay';
import { AddArtifactModal } from './experiments/AddArtifactModal';
import { LinkArtifactModal } from './experiments/LinkArtifactModal';
import { StatusDot, SectionLabel, UserText } from './ui/instrument';
import {
  Filter,
  AlertCircle,
  FlaskConical,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface ExperimentsPaneProps {
  questions: QuestionNode[];
  selectedNodeId?: string | null;
  onlyMine?: boolean;
  onSelectClaim?: (claimId: string) => void;
  onLinkArtifactToClaim?: (artifactId: string, claimId: string) => void;
}

export function ExperimentsPane({
  questions,
  selectedNodeId,
  onlyMine = false,
  onSelectClaim,
  onLinkArtifactToClaim,
}: ExperimentsPaneProps) {
  const [experimentsData, setExperimentsData] = useState<ExperimentGroup[]>(
    INITIAL_EXPERIMENTS_DATA
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | ExperimentStatus>('ALL');
  const [needsResultOnly, setNeedsResultOnly] = useState<boolean>(false);
  const [claimFilter, setClaimFilter] = useState<string>('all');
  const [flashingElementId, setFlashingElementId] = useState<string | null>(null);

  // Modals state
  const [activeOverlay, setActiveOverlay] = useState<{
    artifact: ArtifactItem;
    experiment: ExperimentGroup;
  } | null>(null);

  const [linkingArtifact, setLinkingArtifact] = useState<ArtifactItem | null>(null);

  const [addingArtifactToExp, setAddingArtifactToExp] = useState<{
    experimentId: string;
    claimId: string;
    claimText: string;
  } | null>(null);

  // Scroll and highlight target when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) return;

    // Check if node is an experiment, claim, or artifact
    const targetExp = experimentsData.find(
      (exp) =>
        exp.id === selectedNodeId ||
        exp.claimId === selectedNodeId ||
        (selectedNodeId === 'e3' && exp.claimId === 'c1') ||
        (selectedNodeId === 'e4' && exp.claimId === 'c3') ||
        exp.artifacts.some((a) => a.id === selectedNodeId)
    );

    if (targetExp) {
      const targetId = `exp-module-${targetExp.id}`;
      setFlashingElementId(targetId);
      const el = document.getElementById(targetId) || document.getElementById(`claim-group-${targetExp.claimId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const timer = setTimeout(() => setFlashingElementId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, experimentsData]);

  // Flatten claims from questions for matching and filtering
  const allClaims: { question: QuestionNode; claim: ClaimNode }[] = [];
  questions.forEach((q) => {
    q.claims.forEach((c) => {
      allClaims.push({ question: q, claim: c });
    });
  });

  // Handle Save Finding observation from Overlay
  const handleSaveFinding = (newFinding: string) => {
    if (!activeOverlay) return;

    const { artifact } = activeOverlay;

    setExperimentsData((prev) =>
      prev.map((exp) => ({
        ...exp,
        artifacts: exp.artifacts.map((art) =>
          art.id === artifact.id
            ? {
                ...art,
                findingSummary: newFinding,
                findingAuthor: newFinding ? 'user' : undefined,
              }
            : art
        ),
      }))
    );

    setActiveOverlay((prev) =>
      prev
        ? {
            ...prev,
            artifact: {
              ...prev.artifact,
              findingSummary: newFinding,
              findingAuthor: newFinding ? 'user' : undefined,
            },
          }
        : null
    );
  };

  // Handle Link Artifact to Claim
  const handleLinkArtifact = (artifactId: string, targetClaimId: string) => {
    const targetClaimObj = allClaims.find((item) => item.claim.id === targetClaimId);
    if (!targetClaimObj) return;

    setExperimentsData((prev) =>
      prev.map((exp) => ({
        ...exp,
        artifacts: exp.artifacts.map((art) =>
          art.id === artifactId
            ? {
                ...art,
                claimId: targetClaimId,
                claimText: targetClaimObj.claim.text,
              }
            : art
        ),
      }))
    );

    if (onLinkArtifactToClaim) {
      onLinkArtifactToClaim(artifactId, targetClaimId);
    }
  };

  // Handle Add Artifact to Experiment
  const handleAddArtifact = (newArtifact: ArtifactItem) => {
    setExperimentsData((prev) =>
      prev.map((exp) =>
        exp.id === newArtifact.experimentId
          ? { ...exp, artifacts: [newArtifact, ...exp.artifacts] }
          : exp
      )
    );
  };

  // Filter experiments
  const filteredExperiments = experimentsData.filter((exp) => {
    // Status filter
    if (statusFilter !== 'ALL' && exp.status !== statusFilter) {
      return false;
    }

    // Claim filter
    if (claimFilter !== 'all' && exp.claimId !== claimFilter) {
      return false;
    }

    // Needs result filter: only show completed experiments that have at least one artifact missing an observation, OR an experiment that is done and has no artifacts
    if (needsResultOnly) {
      if (exp.status !== 'done') return false;
      const hasMissingObservation = exp.artifacts.some(
        (a) => !a.findingSummary || !a.findingSummary.trim()
      );
      if (!hasMissingObservation && exp.artifacts.length > 0) {
        return false;
      }
    }

    return true;
  });

  // Group filtered experiments by Claim
  interface ClaimGroupView {
    claimId: string;
    claimText: string;
    claimStatus: LinkStatus;
    questionText?: string;
    experiments: ExperimentGroup[];
  }

  const claimGroupsMap = new Map<string, ClaimGroupView>();

  // Ensure all relevant claims are created in map
  filteredExperiments.forEach((exp) => {
    if (!claimGroupsMap.has(exp.claimId)) {
      // Find question text
      const matchedClaimObj = allClaims.find((item) => item.claim.id === exp.claimId);
      claimGroupsMap.set(exp.claimId, {
        claimId: exp.claimId,
        claimText: exp.claimText,
        claimStatus: exp.claimStatus || matchedClaimObj?.claim.linkStatus || 'holds',
        questionText: exp.questionText || matchedClaimObj?.question.text,
        experiments: [],
      });
    }
    claimGroupsMap.get(exp.claimId)!.experiments.push(exp);
  });

  const claimGroups = Array.from(claimGroupsMap.values());

  // Count total completed artifacts needing results
  const totalNeedsResultCount = experimentsData
    .filter((e) => e.status === 'done')
    .flatMap((e) => e.artifacts)
    .filter((a) => !a.findingSummary || !a.findingSummary.trim()).length;

  return (
    <div
      id="experiments-pane"
      className="flex flex-col h-full w-full bg-paper text-ink font-sans overflow-y-auto"
    >
      {/* 1. Page Header & Filter Bar */}
      <div
        id="experiments-header-bar"
        className="sticky top-0 z-20 bg-paper/95 backdrop-blur-xs border-b border-rule px-4 sm:px-6 py-3 space-y-2.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
              EXPERIMENTS
            </h1>
            <p className="text-[12px] font-sans text-ink-muted mt-0.5">
              Tests and outputs, grouped by the claims they were meant to examine.
            </p>
          </div>

          {/* Claim Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="claim-filter-select"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted shrink-0"
            >
              By claim:
            </label>
            <select
              id="claim-filter-select"
              value={claimFilter}
              onChange={(e) => setClaimFilter(e.target.value)}
              className="bg-surface border border-rule focus:border-ink rounded-[2px] px-2 py-1 text-[11px] font-sans text-ink focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="all">All claims</option>
              {allClaims.map(({ claim }) => (
                <option key={claim.id} value={claim.id}>
                  {claim.text.length > 42 ? `${claim.text.slice(0, 42)}...` : claim.text}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-rule/50 text-[12px]">
          {/* Status Filter (Neutral styling) */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted mr-0.5">
              Status:
            </span>
            {(['ALL', 'planned', 'running', 'done'] as const).map((st, i) => (
              <React.Fragment key={st}>
                {i > 0 && <span className="text-rule font-mono text-[10px]">|</span>}
                <button
                  onClick={() => setStatusFilter(st)}
                  className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-ink text-paper font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-surface'
                  }`}
                >
                  {st}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Needs Result Filter Toggle */}
          <button
            onClick={() => setNeedsResultOnly(!needsResultOnly)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border font-mono text-[11px] transition-colors cursor-pointer ${
              needsResultOnly
                ? 'bg-missing/15 border-missing text-missing font-bold'
                : 'bg-surface border-rule text-ink-muted hover:border-ink-muted hover:text-ink'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Needs result</span>
            {totalNeedsResultCount > 0 && (
              <span className="px-1 py-0.2 bg-paper border border-rule rounded-[2px] text-[10px]">
                {totalNeedsResultCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Content Area: Grouped by Claim */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-10">
        {claimGroups.length === 0 ? (
          <div className="text-center py-16 text-ink-muted text-[13px] font-sans italic space-y-2 border border-dashed border-rule rounded-[2px] bg-surface/30">
            <FlaskConical className="w-6 h-6 mx-auto text-ink-muted/50" />
            <p>No experiments match the current filters.</p>
            {needsResultOnly && (
              <button
                onClick={() => setNeedsResultOnly(false)}
                className="text-[12px] font-sans text-ink underline cursor-pointer"
              >
                Clear "Needs result" filter
              </button>
            )}
          </div>
        ) : (
          claimGroups.map((group) => {
            const totalArtifacts = group.experiments.reduce(
              (acc, exp) => acc + exp.artifacts.length,
              0
            );

            return (
              <section
                key={group.claimId}
                id={`claim-group-${group.claimId}`}
                className="space-y-4 pt-2 first:pt-0"
              >
                {/* Claim Group Header */}
                <div className="p-4 bg-surface border border-rule rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Parent Question Breadcrumb */}
                    <div className="flex items-center gap-1.5 font-serif text-[12px] text-ink-muted truncate">
                      <span className="font-mono text-[10px] uppercase tracking-wider">
                        Question:
                      </span>
                      <span className="truncate">
                        {group.questionText || 'Root research question'}
                      </span>
                    </div>

                    {/* Claim Link Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusDot status={group.claimStatus} />
                    </div>
                  </div>

                  {/* Full Claim Wording (Visually Prominent!) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                    <UserText
                      size="base"
                      className="font-serif text-[16px] md:text-[17px] text-ink font-normal leading-snug flex-1"
                    >
                      {group.claimText}
                    </UserText>

                    <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                      <span className="font-mono text-[11px] text-ink-muted">
                        {group.experiments.length}{' '}
                        {group.experiments.length === 1 ? 'experiment' : 'experiments'} •{' '}
                        {totalArtifacts} {totalArtifacts === 1 ? 'artifact' : 'artifacts'}
                      </span>

                      {onSelectClaim && (
                        <button
                          onClick={() => onSelectClaim(group.claimId)}
                          className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-ink hover:underline cursor-pointer border-l border-rule pl-3"
                          title="Open this claim in detail workbench"
                        >
                          <span>Open in workbench</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experiments testing this claim */}
                <div className="space-y-4 pl-0 sm:pl-3">
                  {group.experiments.map((exp) => (
                    <div
                      key={exp.id}
                      className={
                        flashingElementId === `exp-module-${exp.id}`
                          ? 'ring-2 ring-ink rounded-[2px] transition-all'
                          : ''
                      }
                    >
                      <ExperimentModule
                        experiment={exp}
                        claimId={group.claimId}
                        claimText={group.claimText}
                        claimStatus={group.claimStatus}
                        onlyMine={onlyMine}
                        onOpenArtifact={(artifact, parentExp) => {
                          setActiveOverlay({
                            artifact,
                            experiment: parentExp,
                          });
                        }}
                        onLinkArtifact={(artifact) => {
                          setLinkingArtifact(artifact);
                        }}
                        onAddArtifact={(experimentId) => {
                          setAddingArtifactToExp({
                            experimentId,
                            claimId: group.claimId,
                            claimText: group.claimText,
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* 3. ARTIFACT DETAIL OVERLAY */}
      {activeOverlay && (
        <ArtifactDetailOverlay
          artifact={activeOverlay.artifact}
          experiment={activeOverlay.experiment}
          questionText={
            activeOverlay.experiment.questionText ||
            allClaims.find((c) => c.claim.id === activeOverlay.artifact.claimId)?.question.text
          }
          claimText={activeOverlay.artifact.claimText}
          claimStatus={activeOverlay.experiment.claimStatus}
          onlyMine={onlyMine}
          onClose={() => setActiveOverlay(null)}
          onSaveFinding={handleSaveFinding}
        />
      )}

      {/* 4. LINK ARTIFACT MODAL */}
      {linkingArtifact && (
        <LinkArtifactModal
          artifact={linkingArtifact}
          questions={questions}
          isOpen={Boolean(linkingArtifact)}
          onClose={() => setLinkingArtifact(null)}
          onLinkToClaim={handleLinkArtifact}
        />
      )}

      {/* 5. ADD ARTIFACT MODAL */}
      {addingArtifactToExp && (
        <AddArtifactModal
          experimentId={addingArtifactToExp.experimentId}
          claimId={addingArtifactToExp.claimId}
          claimText={addingArtifactToExp.claimText}
          isOpen={Boolean(addingArtifactToExp)}
          onClose={() => setAddingArtifactToExp(null)}
          onAdd={handleAddArtifact}
        />
      )}
    </div>
  );
}
