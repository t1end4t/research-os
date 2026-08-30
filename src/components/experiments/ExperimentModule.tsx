import React from 'react';
import {
  ArtifactItem,
  ExperimentGroup,
  LinkStatus,
} from '../../types';
import { ArtifactCard } from './ArtifactCard';
import { ModelBlock, SectionLabel } from '../ui/instrument';
import { setResearchItemDragData } from '../../researchItemDrag';
import {
  GripVertical,
  AlertCircle,
  Plus,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface ExperimentModuleProps {
  experiment: ExperimentGroup;
  claimId: string;
  claimText: string;
  claimStatus: LinkStatus;
  onlyMine?: boolean;
  onOpenArtifact: (artifact: ArtifactItem, experiment: ExperimentGroup) => void;
  onLinkArtifact: (artifact: ArtifactItem) => void;
  onAddArtifact: (experimentId: string) => void;
}

export function ExperimentModule({
  experiment,
  claimId,
  claimText,
  claimStatus,
  onlyMine = false,
  onOpenArtifact,
  onLinkArtifact,
  onAddArtifact,
}: ExperimentModuleProps) {
  const isDone = experiment.status === 'done';
  const isPlanned = experiment.status === 'planned';
  const isRunning = experiment.status === 'running';

  const hasMismatch = Boolean(
    experiment.targetMismatchNote ||
      (experiment.checkResult?.axes &&
        experiment.checkResult.axes.some(
          (ax) => ax.label === 'TARGET' && ax.verdict === 'mismatch'
        ))
  );

  return (
    <div
      id={`exp-module-${experiment.id}`}
      className="bg-paper border border-rule rounded-[2px] p-4 space-y-3.5 transition-all"
    >
      {/* Experiment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rule/70">
        <div className="flex items-start sm:items-center gap-2 min-w-0">
          <div
            title="Drag experiment to Assistant panel"
            className="cursor-grab active:cursor-grabbing text-ink-muted shrink-0 mt-0.5 sm:mt-0"
            draggable
            onDragStart={(e) => {
              setResearchItemDragData(e.dataTransfer, {
                id: experiment.id,
                type: 'EXPERIMENT',
                label: `EXPERIMENT: ${experiment.name}`,
              });
            }}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <h3 className="font-sans text-[14px] font-semibold text-ink leading-snug">
            {experiment.name}
          </h3>
        </div>

        {/* Status + Metadata */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-6 sm:pl-0">
          {/* Neutral Status Badge */}
          <span className="px-2 py-0.5 bg-surface border border-rule font-mono text-[10px] font-bold uppercase tracking-wider text-ink rounded-[2px]">
            {experiment.status}
          </span>

          {experiment.date && (
            <span className="font-mono text-[11px] text-ink-muted/80 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{experiment.date}</span>
            </span>
          )}

          <span className="font-mono text-[11px] text-ink-muted border-l border-rule pl-2">
            {experiment.artifacts.length} {experiment.artifacts.length === 1 ? 'artifact' : 'artifacts'}
          </span>
        </div>
      </div>

      {/* Target Statement Section */}
      {experiment.targetStatement && (
        <div className="p-3 bg-surface/70 border border-rule/60 rounded-[2px] space-y-1">
          <div className="flex items-center justify-between">
            <SectionLabel>Target Statement (What this was meant to test)</SectionLabel>
            <span className="text-[10px] font-mono text-ink-muted">Empirical Target</span>
          </div>
          <p className="font-serif text-[13px] text-ink leading-relaxed">
            {experiment.targetStatement}
          </p>
        </div>
      )}

      {/* Target Check Verdict (Model-Authored) */}
      {!onlyMine && hasMismatch && (
        <div className="p-3 bg-missing/10 border-l-4 border-l-missing border border-rule/60 rounded-[2px] space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold text-missing">
            <div className="flex items-center gap-1.5 uppercase">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Target Mismatch</span>
            </div>
            <span className="text-[10px] text-ink-muted font-normal">
              [cx/gpt-5.6-sol]
            </span>
          </div>
          <p className="font-sans text-[12px] text-ink leading-snug">
            {experiment.targetMismatchNote ||
              experiment.checkResult?.finding ||
              'Target mismatch — the experiment measures something other than the parent claim.'}
          </p>
        </div>
      )}

      {!onlyMine && !hasMismatch && experiment.checkResult && (
        <ModelBlock
          modelId={experiment.checkResult.modelId || 'cx/gpt-5.6-sol'}
          badge="AI EXAMINER TARGET CHECK"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-holds shrink-0 mt-0.5" />
            <p className="text-[12px] text-ink leading-relaxed">
              {experiment.checkResult.finding}
            </p>
          </div>
        </ModelBlock>
      )}

      {/* Artifacts Gallery */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Outputs & Artifacts ({experiment.artifacts.length})
          </span>

          <button
            onClick={() => onAddArtifact(experiment.id)}
            className="text-[11px] font-sans font-medium text-ink hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add artifact</span>
          </button>
        </div>

        {experiment.artifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {experiment.artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                experimentStatus={experiment.status}
                onlyMine={onlyMine}
                onClick={() => onOpenArtifact(artifact, experiment)}
                onLinkClick={(e) => {
                  e.stopPropagation();
                  onLinkArtifact(artifact);
                }}
              />
            ))}
          </div>
        ) : (
          /* Empty state for experiment without artifacts */
          <div className="p-6 border border-dashed border-rule rounded-[2px] bg-surface/50 text-center space-y-2">
            <p className="text-[12px] font-sans text-ink-muted max-w-md mx-auto">
              No artifacts yet. Add outputs when this experiment produces something that can be examined.
            </p>
            <button
              onClick={() => onAddArtifact(experiment.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-rule hover:border-ink-muted rounded-[2px] font-sans text-[12px] text-ink transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add output artifact</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
