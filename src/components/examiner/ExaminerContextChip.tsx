import React from 'react';
import { ExaminerContextData } from './types';
import { X, Network, HelpCircle, GitBranch, Link2, FileText, FlaskConical, FileSpreadsheet, Compass, Layers } from 'lucide-react';

interface ExaminerContextChipProps {
  context: ExaminerContextData;
  onClickContextChip?: () => void;
  onClearContext?: () => void;
}

export function ExaminerContextChip({
  context,
  onClickContextChip,
  onClearContext,
}: ExaminerContextChipProps) {
  const getContextVisual = () => {
    switch (context.kind) {
      case 'question':
        return {
          icon: HelpCircle,
          typeLabel: 'Question',
        };
      case 'claim':
        return {
          icon: GitBranch,
          typeLabel: 'Claim',
        };
      case 'link':
        return {
          icon: Link2,
          typeLabel: 'Link',
        };
      case 'passage':
        return {
          icon: FileText,
          typeLabel: 'Passage',
        };
      case 'experiment':
        return {
          icon: FlaskConical,
          typeLabel: 'Experiment',
        };
      case 'artifact':
        return {
          icon: FileSpreadsheet,
          typeLabel: 'Artifact',
        };
      case 'survey':
        return {
          icon: Compass,
          typeLabel: 'Survey pile',
        };
      case 'draft_section':
      case 'draft':
        return {
          icon: Layers,
          typeLabel: 'Draft section',
        };
      case 'whole_graph':
      default:
        return {
          icon: Network,
          typeLabel: 'Whole graph',
        };
    }
  };

  const visual = getContextVisual();
  const Icon = visual.icon;
  const isWholeGraph = context.kind === 'whole_graph';

  // Construct label showing Type · Subject
  // e.g. "Question · Why do V1 simple cells develop...", "Claim · Sparse coding...", "Whole graph"
  const formattedChipText = isWholeGraph
    ? 'Whole graph'
    : `${visual.typeLabel} · ${context.subjectName || context.label}`;

  const accessibleFullText = isWholeGraph
    ? 'Whole graph overview'
    : `${visual.typeLabel} · ${context.fullTitle || context.subjectName || context.label}`;

  return (
    <div
      id="examiner-context-chip-container"
      className="flex items-center gap-1.5 px-3 py-2 bg-paper border-b border-rule shrink-0 text-ink"
    >
      <button
        type="button"
        id="examiner-context-chip-button"
        onClick={onClickContextChip}
        title={accessibleFullText}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-[2px] px-2 py-1 bg-surface border border-rule hover:border-ink-muted transition-colors cursor-pointer text-left group"
      >
        <span className="shrink-0 text-ink-muted group-hover:text-ink">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="font-mono text-[11px] truncate min-w-0 flex-1 leading-snug">
          <span className="text-ink-muted font-medium">{visual.typeLabel}</span>
          {!isWholeGraph && (
            <>
              <span className="text-rule mx-1">·</span>
              <span className="text-ink font-normal">{context.subjectName || context.label}</span>
            </>
          )}
        </span>
      </button>

      {!isWholeGraph && onClearContext && (
        <button
          type="button"
          id="examiner-clear-context-button"
          onClick={onClearContext}
          title="Reset focus to Whole graph"
          aria-label="Reset focus to Whole graph"
          className="shrink-0 p-1 text-ink-muted hover:text-ink hover:bg-surface rounded-[2px] border border-transparent hover:border-rule transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
