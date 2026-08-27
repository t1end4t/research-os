export type EvidenceKind = 'paper' | 'experiment';

export type LinkStatus = 'holds' | 'weak' | 'missing';

export type ExperimentStatus = 'planned' | 'running' | 'done';

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  typeLabel?: string;
  title: string;
  citation?: string;
  status?: ExperimentStatus;
  placeholderText?: string;
  isEmpty?: boolean;
}

export interface CheckItem {
  label: 'Type' | 'Scope' | 'Target';
  status: 'aligned' | 'partial' | 'mismatch' | 'missing' | 'unverified';
  detail: string;
}

export interface ClaimCheck {
  tag: string;
  tagColor: 'amber' | 'red' | 'emerald' | 'stone';
  reasonText: string;
  explanation: string;
  checks: CheckItem[];
}

export interface ClaimNode {
  id: string;
  type: 'CLAIM';
  text: string;
  linkStatus: LinkStatus;
  evidence: EvidenceItem[];
  check: ClaimCheck;
  isRejected?: boolean;
}

export type FilterStatus = 'all' | 'weak' | 'missing';
export type AppTab = 'graph' | 'detail' | 'papers' | 'experiments';

export type AssistantContextKind = 'whole_graph' | 'claim' | 'paper' | 'experiment';

export interface QuestionNode {
  id: string;
  type: 'QUESTION';
  text: string;
  tags?: string[];
  claims: ClaimNode[];
}

export type MessageSender = 'user' | 'assistant' | 'edit_confirmation';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  modelId?: string;
  affectedNodeId?: string;
  undoAction?: {
    type: 'remove_evidence' | 'weaken_claim' | 'remove_experiment';
    claimId: string;
    evidenceId?: string;
  };
  editDetails?: {
    actionType: 'add_paper' | 'add_experiment';
    claimId: string;
    nodeId: string;
    summary: string;
  };
}

export interface AssistantContextInfo {
  kind: AssistantContextKind;
  id?: string;
  label: string;
  rawTitle?: string;
}

export interface AssistantThread {
  id: string;
  contextKind: AssistantContextKind;
  contextId?: string;
  contextLabel: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface LeftRailMark {
  id: string;
  paragraphId: string;
  yPercent: number;
  type: 'amber' | 'emerald';
  label: string;
  snippet: string;
  claimId?: string;
}

export interface PaperDoc {
  id: string;
  title: string;
  authors: string;
  year: number;
  citation: string;
  pageCount: number;
  abstract: string;
  sections: {
    id: string;
    heading: string;
    paragraphs: {
      id: string;
      text: string;
      linkedClaimId?: string;
    }[];
  }[];
  initialMarks: LeftRailMark[];
}

export type ArtifactType = 'PLOT' | 'TABLE' | 'NOTE';

export interface ArtifactItem {
  id: string;
  type: ArtifactType;
  title: string;
  caption: string;
  date: string;
  claimId: string;
  claimText: string;
  findingSummary?: string;
  // For PLOT
  plotPoints?: { x: number; y: number; y2?: number; label?: string }[];
  plotLabels?: { x: string; y: string };
  // For TABLE
  tableHeaders?: string[];
  tableRows?: string[][];
  totalRows?: number;
  // For NOTE
  noteContent?: string;
}

export interface ExperimentGroup {
  id: string;
  name: string;
  claimId: string;
  claimText: string;
  claimStatus: LinkStatus;
  status: ExperimentStatus;
  artifacts: ArtifactItem[];
}
