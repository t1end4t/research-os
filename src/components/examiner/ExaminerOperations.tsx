import React from 'react';
import { ExaminerContextData } from './types';
import { CheckCircle2, HelpCircle, GitCommit, Split, ArrowRightLeft, Trash2, Edit3, Layers, AlertCircle } from 'lucide-react';

export interface ExaminerOperationsProps {
  context: ExaminerContextData;
  activeSurface?: string; // 'graph' | 'survey' | 'detail' | 'papers' | 'experiments' | 'draft'
  onExecuteOperation: (operationId: string, payload?: any) => void;
  onFocusReasonField?: () => void;
}

interface OperationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  disabledReason?: string;
  onAction?: () => void;
}

export function ExaminerOperations({
  context,
  activeSurface = 'graph',
  onExecuteOperation,
  onFocusReasonField,
}: ExaminerOperationsProps) {
  const hasUserReason = Boolean(context.userReason && context.userReason.trim().length > 0);
  const isGraphSurface = activeSurface === 'graph' || activeSurface === 'detail';

  // Compute operations based strictly on Context Permitted Operations Table
  const getOperations = (): OperationItem[] => {
    switch (context.kind) {
      case 'whole_graph':
        if (!isGraphSurface) {
          return [];
        }
        return [
          {
            id: 'op-graph-add',
            label: 'Add node',
            icon: GitCommit,
            enabled: true,
          },
          {
            id: 'op-graph-move',
            label: 'Move node',
            icon: ArrowRightLeft,
            enabled: true,
          },
          {
            id: 'op-graph-rename',
            label: 'Rename node',
            icon: Edit3,
            enabled: true,
          },
          {
            id: 'op-graph-split',
            label: 'Split node',
            icon: Split,
            enabled: true,
          },
          {
            id: 'op-graph-delete',
            label: 'Delete node',
            icon: Trash2,
            enabled: true,
          },
        ];

      case 'question':
        if (!isGraphSurface) {
          return [];
        }
        return [
          {
            id: 'op-question-rename',
            label: 'Rename question',
            icon: Edit3,
            enabled: true,
          },
          {
            id: 'op-question-split',
            label: 'Split question',
            icon: Split,
            enabled: true,
          },
          {
            id: 'op-question-delete',
            label: 'Delete question',
            icon: Trash2,
            enabled: true,
          },
        ];

      case 'claim':
        return [
          {
            id: 'op-claim-check-link',
            label: 'Check link to question',
            icon: CheckCircle2,
            enabled: hasUserReason,
            disabledReason: hasUserReason
              ? undefined
              : 'Write your reason on this link before it can be checked.',
            onAction: hasUserReason ? undefined : onFocusReasonField,
          },
          ...(isGraphSurface
            ? [
                {
                  id: 'op-claim-rename',
                  label: 'Rename claim',
                  icon: Edit3,
                  enabled: true,
                },
                {
                  id: 'op-claim-split',
                  label: 'Split claim',
                  icon: Split,
                  enabled: true,
                },
                {
                  id: 'op-claim-move',
                  label: 'Move claim',
                  icon: ArrowRightLeft,
                  enabled: true,
                },
                {
                  id: 'op-claim-delete',
                  label: 'Delete claim',
                  icon: Trash2,
                  enabled: true,
                },
              ]
            : []),
        ];

      case 'link':
        return [
          {
            id: 'op-link-check',
            label: 'Check this link',
            icon: CheckCircle2,
            enabled: hasUserReason,
            disabledReason: hasUserReason
              ? undefined
              : 'Write your reason on this link before it can be checked.',
            onAction: hasUserReason ? undefined : onFocusReasonField,
          },
          {
            id: 'op-link-explain-verdict',
            label: 'Explain this verdict',
            icon: HelpCircle,
            enabled: Boolean(context.existingVerdict),
            disabledReason: Boolean(context.existingVerdict)
              ? undefined
              : 'No check verdict exists for this link yet.',
          },
        ];

      case 'passage':
        return [
          {
            id: 'op-passage-ask',
            label: 'Ask about this passage',
            icon: HelpCircle,
            enabled: Boolean(context.passageSnippet && context.passageSnippet.trim().length > 0),
            disabledReason: Boolean(context.passageSnippet && context.passageSnippet.trim().length > 0)
              ? undefined
              : 'Highlight a passage in the reader to ask about it.',
          },
        ];

      case 'experiment':
      case 'artifact':
        return [
          {
            id: 'op-experiment-check-target',
            label: 'Check whether measurement targets claim',
            icon: CheckCircle2,
            enabled: true,
          },
        ];

      case 'survey':
        const unclustered = context.unclusteredNotesCount ?? 0;
        return [
          {
            id: 'op-survey-cluster',
            label: 'Propose clusters from existing notes',
            icon: Layers,
            enabled: unclustered >= 2,
            disabledReason:
              unclustered >= 2
                ? undefined
                : 'At least 2 open problem notes needed to propose clusters.',
          },
        ];

      case 'draft_section':
      case 'draft':
        return [
          {
            id: 'op-draft-check-links',
            label: 'Check supporting links for section',
            icon: CheckCircle2,
            enabled: true,
          },
          {
            id: 'op-draft-explain-verdict',
            label: 'Explain existing verdict',
            icon: HelpCircle,
            enabled: Boolean(context.existingVerdict),
            disabledReason: Boolean(context.existingVerdict)
              ? undefined
              : 'No check verdict exists for placed references yet.',
          },
        ];

      default:
        return [];
    }
  };

  const operations = getOperations();

  if (operations.length === 0) {
    return (
      <div
        id="examiner-operations-empty"
        className="px-3 py-2.5 border-b border-rule bg-surface/50 text-[11px] font-mono text-ink-muted leading-relaxed"
      >
        <span>Nothing to check here. Select a link with a written reason.</span>
      </div>
    );
  }

  return (
    <div
      id="examiner-operations-container"
      className="p-2 border-b border-rule bg-surface/40 space-y-1.5 shrink-0"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono font-medium uppercase tracking-[0.08em] text-ink-muted select-none">
          PERMITTED OPERATIONS
        </span>
      </div>

      <div className="space-y-1">
        {operations.map((op) => {
          const Icon = op.icon;
          if (!op.enabled) {
            return (
              <div
                key={op.id}
                id={`examiner-op-disabled-${op.id}`}
                className="group p-2 rounded-[2px] bg-paper border border-dashed border-missing/50 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {Icon && <Icon className="w-3 h-3 text-ink-muted/50 shrink-0" />}
                    <span className="font-sans text-[12px] font-medium text-ink-muted line-through opacity-70">
                      {op.label}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-missing shrink-0">
                    BLOCKED
                  </span>
                </div>
                {op.disabledReason && (
                  <div className="mt-1 flex items-start gap-1 text-[11px] font-sans text-missing leading-snug">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>
                      {op.disabledReason}{' '}
                      {op.onAction && (
                        <button
                          type="button"
                          onClick={op.onAction}
                          className="underline hover:text-ink font-medium cursor-pointer ml-1 inline-block"
                        >
                          Go to reason field
                        </button>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={op.id}
              id={`examiner-op-btn-${op.id}`}
              type="button"
              onClick={() => onExecuteOperation(op.id)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[2px] bg-paper border border-rule hover:border-ink-muted hover:bg-surface text-ink text-left transition-colors cursor-pointer group shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink shrink-0" />}
                <span className="font-sans text-[12px] font-medium text-ink truncate">
                  {op.label}
                </span>
              </div>
              <span className="font-mono text-[10px] text-ink-muted group-hover:text-ink shrink-0">
                run ↵
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
