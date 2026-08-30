import React from 'react';
import { ExaminerDock } from '../examiner/ExaminerDock';
import { ExaminerContextData } from '../examiner/types';
import { AssistantContextInfo } from '../../types';

export interface ExaminerDockPlaceholderProps {
  context: AssistantContextInfo;
  onClearContext: () => void;
  onCloseDock: () => void;
  onClickContextChip?: () => void;
  onSendMessage?: (text: string) => Promise<void>;
  onlyMine?: boolean;
}

/**
 * Backward-compatible bridge to ExaminerDock
 */
export function ExaminerDockPlaceholder({
  context,
  onClearContext,
  onCloseDock,
  onClickContextChip,
  onlyMine = false,
}: ExaminerDockPlaceholderProps) {
  const examinerContextData: ExaminerContextData = {
    kind: (context.kind === 'paper' ? 'paper' :
          context.kind === 'claim' ? 'claim' :
          context.kind === 'survey' ? 'survey' :
          context.kind === 'experiment' ? 'experiment' :
          context.kind === 'draft' ? 'draft_section' : 'whole_graph') as any,
    id: context.id,
    label: context.label,
    subjectType: context.kind.charAt(0).toUpperCase() + context.kind.slice(1),
    subjectName: context.label.replace(/^(question|claim|paper):\s*/i, ''),
    fullTitle: context.rawTitle || context.label,
  };

  return (
    <ExaminerDock
      isOpen={true}
      context={examinerContextData}
      onlyMine={onlyMine}
      onCloseDock={onCloseDock}
      onClearContext={onClearContext}
      onClickContextChip={onClickContextChip}
    />
  );
}
