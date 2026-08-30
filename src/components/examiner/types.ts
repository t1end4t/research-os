import {
  LinkStatus,
  ExaminerVerdict,
  ClusteringProposal,
} from '../../types';

export type ExaminerContextKind =
  | 'whole_graph'
  | 'question'
  | 'claim'
  | 'link'
  | 'passage'
  | 'paper'
  | 'experiment'
  | 'artifact'
  | 'survey'
  | 'draft_section'
  | 'draft';

export interface ExaminerContextData {
  kind: ExaminerContextKind;
  id?: string;
  label: string;
  subjectType: string;
  subjectName: string;
  fullTitle?: string;
  userReason?: string;
  reasonFieldId?: string;
  questionId?: string;
  claimId?: string;
  evidenceId?: string;
  parentName?: string;
  childName?: string;
  passageSnippet?: string;
  passageCitation?: string;
  unclusteredNotesCount?: number;
  candidateCount?: number;
  existingVerdict?: {
    overallStatus: LinkStatus;
    modelId: string;
    finding: string;
    axes: {
      label: 'Type' | 'Scope' | 'Target' | 'TYPE' | 'SCOPE' | 'TARGET';
      verdict: ExaminerVerdict;
      detail?: string;
    }[];
  };
}

export type ExaminerMessageSender =
  | 'user'
  | 'assistant'
  | 'verdict'
  | 'refusal'
  | 'edit_confirmation'
  | 'clustering_proposal';

export interface ExaminerVerdictAxis {
  label: 'Type' | 'Scope' | 'Target' | 'TYPE' | 'SCOPE' | 'TARGET';
  verdict: ExaminerVerdict;
  detail?: string;
}

export interface ExaminerVerdictData {
  overallStatus: LinkStatus;
  modelId: string;
  axes: ExaminerVerdictAxis[];
  finding: string;
  targetContext?: string;
  isPrewiredPreview?: boolean;
  actions?: Array<'weaken_claim' | 'add_experiment' | 'dismiss'>;
  claimId?: string;
  evidenceId?: string;
}

export interface ExaminerRefusalData {
  declinedWhat: string;
  declinedReason: string;
  modelId?: string;
}

export interface ExaminerConfirmationData {
  modelId: string;
  actionDescription: string;
  isUndone?: boolean;
  isPrewiredPreview?: boolean;
  undoPayload?: {
    type: 'rename' | 'move' | 'split' | 'delete' | 'add' | 'remove_evidence';
    nodeId?: string;
    claimId?: string;
    evidenceId?: string;
    previousValue?: string;
  };
}

export interface ExaminerMessage {
  id: string;
  sender: ExaminerMessageSender;
  text?: string;
  timestamp: string;
  modelId?: string;
  verdictData?: ExaminerVerdictData;
  refusalData?: ExaminerRefusalData;
  confirmationData?: ExaminerConfirmationData;
  proposals?: ClusteringProposal[];
  isPrewiredPreview?: boolean;
}

export interface ExaminerThread {
  id: string;
  contextKind: ExaminerContextKind;
  contextId?: string;
  contextLabel: string;
  messages: ExaminerMessage[];
  lastUpdated: string;
}
