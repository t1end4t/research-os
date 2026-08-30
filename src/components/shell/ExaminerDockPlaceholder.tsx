import React from 'react';
import { X } from 'lucide-react';
import { AssistantContextInfo } from '../../types';
import { ModelBlock, SectionLabel, UserText } from '../ui/instrument';

export interface ExaminerDockPlaceholderProps {
  context: AssistantContextInfo;
  onClearContext: () => void;
  onCloseDock: () => void;
  onClickContextChip?: () => void;
}

export function ExaminerDockPlaceholder({
  context,
  onClearContext,
  onCloseDock,
  onClickContextChip,
}: ExaminerDockPlaceholderProps) {
  return (
    <div className="flex flex-col h-full bg-surface text-ink font-sans select-none">
      {/* Dock Header */}
      <div className="h-10 px-3 border-b border-rule flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink shrink-0">
            EXAMINER
          </span>
          <span className="text-rule font-mono text-[10px]">/</span>
          {/* Context Chip */}
          <button
            onClick={onClickContextChip}
            title="Click to locate context in workspace"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-paper border border-rule font-mono text-[10px] text-ink hover:border-ink-muted truncate max-w-[170px] cursor-pointer"
          >
            <span className="text-ink-muted uppercase">{context.kind}:</span>
            <span className="truncate">{context.label}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {context.kind !== 'whole_graph' && (
            <button
              onClick={onClearContext}
              title="Reset context to whole graph"
              aria-label="Reset context"
              className="px-1 py-0.5 text-[10px] font-mono text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] border border-transparent hover:border-rule transition-colors cursor-pointer"
            >
              clear
            </button>
          )}
          <button
            onClick={onCloseDock}
            title="Close dock (⌘J)"
            aria-label="Close dock"
            className="p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] border border-transparent hover:border-rule transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dock Body Placeholder */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Active Context Card */}
        <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Focus Target</SectionLabel>
            <span className="font-mono text-[10px] text-ink-muted uppercase">
              {context.kind}
            </span>
          </div>
          <UserText size="sm" className="font-serif text-ink">
            {context.label || 'Entire graph selected.'}
          </UserText>
        </div>

        {/* Model Examiner Protocol Block */}
        <ModelBlock modelId="cx/gpt-5.6-sol" badge="AI EXAMINER PROTOCOL">
          <p className="mb-2">
            The AI examiner checks link validity across three strict criteria:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[12px] text-ink-muted">
            <li><strong className="text-ink">Type</strong>: causal claim supported by correlational evidence</li>
            <li><strong className="text-ink">Scope</strong>: evidence settings narrower than claim boundaries</li>
            <li><strong className="text-ink">Target</strong>: empirical metrics misaligned with claim target</li>
          </ul>
          <div className="mt-3 pt-2 border-t border-rule/60 text-[11px] text-ink-muted italic">
            Note: The model never authors or edits user reasons. Links without a user reason cannot be checked.
          </div>
        </ModelBlock>

        {/* Standing Inspection Reminder */}
        <div className="p-3 bg-surface border border-dashed border-rule rounded-[2px] space-y-1.5 text-xs">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider block">
            REASON INTEGRITY
          </span>
          <p className="font-sans text-ink-muted text-[12px] leading-relaxed">
            Select any claim or evidence link in the graph to inspect the verification status, pass/fail checks, and user-committed assertions.
          </p>
        </div>
      </div>
    </div>
  );
}
