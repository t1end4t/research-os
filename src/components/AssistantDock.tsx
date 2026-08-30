import React from 'react';
import { ExaminerDock } from './examiner/ExaminerDock';
import { ExaminerContextData } from './examiner/types';
import { AssistantContextInfo, AssistantThread } from '../types';
import { DraggableResearchItem } from '../researchItemDrag';

export { ExaminerDock };

interface AssistantDockProps {
  dockWidth?: number;
  context: AssistantContextInfo;
  activeThread?: AssistantThread;
  allThreads?: AssistantThread[];
  onSelectThread?: (threadId: string) => void;
  onCreateNewThread?: () => void;
  onSendMessage?: (text: string, quotedSnippet?: string | null) => Promise<any>;
  isResponding?: boolean;
  onUndoEdit?: (messageId: string) => void;
  onAcceptProposal?: (proposal: any, messageId: string) => void;
  onRejectProposal?: (proposalId: string, messageId: string) => void;
  onClearContext: () => void;
  onClickContextChip?: () => void;
  onCloseDock: () => void;
  quotedSnippet?: string | null;
  onClearQuotedSnippet?: () => void;
  onDropResearchItem?: (item: DraggableResearchItem) => void;
  onlyMine?: boolean;
}

export function AssistantDock(props: AssistantDockProps) {
  const examinerContextData: ExaminerContextData = {
    kind: (props.context.kind === 'paper' ? 'paper' :
          props.context.kind === 'claim' ? 'claim' :
          props.context.kind === 'survey' ? 'survey' :
          props.context.kind === 'experiment' ? 'experiment' :
          props.context.kind === 'draft' ? 'draft_section' : 'whole_graph') as any,
    id: props.context.id,
    label: props.context.label,
    subjectType: props.context.kind.charAt(0).toUpperCase() + props.context.kind.slice(1),
    subjectName: props.context.label.replace(/^(question|claim|paper):\s*/i, ''),
    fullTitle: props.context.rawTitle || props.context.label,
  };

  return (
    <ExaminerDock
      isOpen={true}
      context={examinerContextData}
      onlyMine={props.onlyMine}
      onCloseDock={props.onCloseDock}
      onClearContext={props.onClearContext}
      onClickContextChip={props.onClickContextChip}
      onSendMessage={props.onSendMessage ? async (msg) => {
        const res = await props.onSendMessage!(msg, props.quotedSnippet);
        return res;
      } : undefined}
    />
  );
}
