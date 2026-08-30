export type EvidenceKind = 'paper' | 'experiment';

export type LinkStatus = 'holds' | 'weak' | 'missing';

export type ExperimentStatus = 'planned' | 'running' | 'done';

export type ExaminerVerdict = 'pass' | 'partial' | 'mismatch';

export interface ExaminerAxisVerdict {
  label: 'TYPE' | 'SCOPE' | 'TARGET';
  verdict: ExaminerVerdict;
  detail: string;
}

export interface ExaminerCheckResult {
  modelId: string;
  timestamp: string;
  checkedTimestamp?: number;
  finding: string;
  axes: ExaminerAxisVerdict[];
  isStale?: boolean;
  staleNote?: string;
  checkedReason?: string;
  checkedClaimText?: string;
}

export interface ClaimVersion {
  versionNumber: number;
  versionLabel: string;
  timestamp: string;
  createdAt: number;
  claimText: string;
  note: string;
  trigger?: string;
}

export interface LinkHistoryEvent {
  id: string;
  timestamp: string;
  createdAt: number;
  kind:
    | 'version_created'
    | 'reason_updated'
    | 'check_run'
    | 'finding_dismissed'
    | 'experiment_added'
    | 'claim_rejected'
    | 'claim_unrejected';
  summary: string;
  userNote?: string;
  targetId?: string;
}

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  typeLabel?: string;
  title: string;
  userReason?: string;
  citation?: string;
  paperId?: string;
  experimentId?: string;
  status?: ExperimentStatus;
  artifactCount?: number;
  linkStatus?: LinkStatus;
  checkResult?: ExaminerCheckResult;
  placeholderText?: string;
  isEmpty?: boolean;
  createdAt?: number;
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
  version?: number;
  lastEditedTime?: string;
  linkStatus: LinkStatus;
  questionReason?: string;
  questionCheckResult?: ExaminerCheckResult;
  evidence: EvidenceItem[];
  check: ClaimCheck;
  isRejected?: boolean;
  rejectNote?: string;
  history?: ClaimVersion[];
  linkEvents?: LinkHistoryEvent[];
}

export type FilterStatus = 'all' | 'weak' | 'missing';
export type AppTab = 'graph' | 'survey' | 'detail' | 'papers' | 'experiments' | 'draft';

// ==========================================
// DRAFT ASSEMBLY DATA STRUCTURES (Outside Graph Tree)
// ==========================================

export type DraftReferenceTargetType = 'claim' | 'evidence';

export interface DraftPlacedReference {
  id: string;
  targetType: DraftReferenceTargetType;
  targetId: string;
  placedVersion?: number | string;
  anchorCode: string; // e.g. 'C1', 'E1', 'E3'
  placedTimestamp?: number;
  userNote?: string;
  paragraphIndex?: number;
}

export interface DraftPlacedArtifact {
  id: string;
  artifactId: string;
  artifactType: ArtifactType;
  localNumber: number; // e.g. 1 for Figure 1 or Table 1
  caption: string; // Required user-written caption field, never generated
  anchorCode: string; // e.g. 'F1', 'T1', 'N1'
  paragraphIndex?: number;
}

export interface DraftSubsection {
  id: string;
  title: string;
  purpose: string;
  prose: string;
  placedReferences: DraftPlacedReference[];
  placedArtifacts: DraftPlacedArtifact[];
}

export interface DraftSection {
  id: string;
  title: string;
  purpose: string; // 'What must this section establish?' - user-written only
  prose: string;
  subsections?: DraftSubsection[];
  placedReferences: DraftPlacedReference[];
  placedArtifacts: DraftPlacedArtifact[];
}

export interface DraftManuscript {
  title: string;
  sections: DraftSection[];
  lastEditedTimestamp?: number;
}

export type AssistantContextKind = 'whole_graph' | 'survey' | 'claim' | 'paper' | 'experiment' | 'draft';

export interface OpenProblemNote {
  id: string;
  text: string;
  citation?: string;
  createdAt: number;
}

export interface CandidateQuestion {
  id: string;
  text: string;
  openProblemIds: string[];
  createdAt: number;
}

export interface ClusteringProposal {
  id: string;
  groupName: string;
  sharedObservation?: string;
  workingPhrase?: string;
  problemIds: string[];
  problemSnippets: string[];
  modelId?: string;
}

export interface QuestionNode {
  id: string;
  type: 'QUESTION';
  text: string;
  tags?: string[];
  claims: ClaimNode[];
}

export type MessageSender = 'user' | 'assistant' | 'edit_confirmation' | 'clustering_proposal';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  modelId?: string;
  affectedNodeId?: string;
  proposals?: ClusteringProposal[];
  undoAction?: {
    type: 'remove_evidence';
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
  pageNumber?: number;
}

export interface PdfOutlineItem {
  title: string;
  pageNumber: number;
  children?: PdfOutlineItem[];
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
  pdfUrl?: string;
  pdfData?: Uint8Array | ArrayBuffer;
  sourceType?: 'workspace' | 'uploaded' | 'arxiv' | 'url';
  outline?: PdfOutlineItem[];
}

export type ArtifactType = 'PLOT' | 'TABLE' | 'NOTE';

export interface ArtifactItem {
  id: string;
  type: ArtifactType;
  title: string;
  filename?: string;
  caption: string;
  date: string;
  claimId: string;
  claimText: string;
  experimentId?: string;
  findingSummary?: string;
  findingAuthor?: 'user';
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
  questionId?: string;
  questionText?: string;
  claimId: string;
  claimText: string;
  claimStatus: LinkStatus;
  status: ExperimentStatus;
  targetStatement?: string;
  date?: string;
  checkResult?: ExaminerCheckResult;
  targetMismatchNote?: string;
  artifacts: ArtifactItem[];
}
