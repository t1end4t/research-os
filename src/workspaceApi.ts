import type {
  CandidateQuestion,
  OpenProblemNote,
  PaperDoc,
  QuestionNode,
} from './types';

export interface WorkspaceData {
  questions: QuestionNode[];
  papers: PaperDoc[];
  evidenceToPaperMap: Record<string, string>;
  survey: {
    openProblems: OpenProblemNote[];
    candidateQuestions: CandidateQuestion[];
  };
}

export interface WorkspaceResponse extends WorkspaceData {
  workspacePath: string;
}

export interface WorkspaceErrorResponse {
  error: string;
}
