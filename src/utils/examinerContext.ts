import {
  QuestionNode,
  ClaimNode,
  PaperDoc,
  OpenProblemNote,
  CandidateQuestion,
  DraftManuscript,
  AppTab,
} from '../types';
import { ExaminerContextData } from '../components/examiner/types';

export function getExaminerContext({
  activeTab,
  selectedNodeId,
  selectedClaimId,
  questionsData,
  papersCatalog,
  activePaperId,
  assistantQuotedSnippet,
  openProblems,
  candidateQuestions,
  manuscript,
}: {
  activeTab: AppTab;
  selectedNodeId: string | null;
  selectedClaimId: string | null;
  questionsData: QuestionNode[];
  papersCatalog: PaperDoc[];
  activePaperId: string | null;
  assistantQuotedSnippet: string | null;
  openProblems: OpenProblemNote[];
  candidateQuestions: CandidateQuestion[];
  manuscript: DraftManuscript;
}): ExaminerContextData {
  const totalQuestions = questionsData.length;
  const totalClaims = questionsData.reduce((acc, q) => acc + q.claims.length, 0);

  // 1. Survey tab
  if (activeTab === 'survey') {
    return {
      kind: 'survey',
      id: 'survey',
      label: `${openProblems.length} unclustered notes`,
      subjectType: 'Survey pile',
      subjectName: `${openProblems.length} unclustered notes`,
      fullTitle: `Survey pile · ${openProblems.length} open problems, ${candidateQuestions.length} candidates`,
      unclusteredNotesCount: openProblems.length,
      candidateCount: candidateQuestions.length,
    };
  }

  // 2. Papers tab
  if (activeTab === 'papers') {
    const activeDoc = papersCatalog.find((p) => p.id === activePaperId);
    if (assistantQuotedSnippet) {
      return {
        kind: 'passage',
        id: activeDoc ? `${activeDoc.id}-passage` : 'passage',
        label: `${activeDoc?.title || 'Paper'}, §3`,
        subjectType: 'Passage',
        subjectName: `${activeDoc?.title ? `${activeDoc.title.slice(0, 30)}…` : 'Selected passage'}, §3`,
        fullTitle: `Passage from ${activeDoc?.title || 'open document'}: "${assistantQuotedSnippet.slice(0, 100)}…"`,
        passageSnippet: assistantQuotedSnippet,
        passageCitation: activeDoc?.citation || activeDoc?.title,
      };
    }
    if (activeDoc) {
      return {
        kind: 'paper',
        id: activeDoc.id,
        label: activeDoc.title,
        subjectType: 'Paper',
        subjectName: activeDoc.title,
        fullTitle: activeDoc.title,
        passageCitation: activeDoc.citation,
      };
    }
  }

  // 3. Experiments tab
  if (activeTab === 'experiments') {
    return {
      kind: 'experiment',
      id: 'experiments-sparse-coder',
      label: 'Train an overcomplete sparse coder',
      subjectType: 'Experiment',
      subjectName: 'Train an overcomplete sparse coder',
      fullTitle: 'Experiment: Train an overcomplete sparse coder (4 active protocols)',
    };
  }

  // 4. Draft tab
  if (activeTab === 'draft') {
    const activeSection = manuscript.sections[0];
    return {
      kind: 'draft_section',
      id: activeSection ? activeSection.id : 'draft-results',
      label: activeSection ? activeSection.title : 'Results',
      subjectType: 'Draft section',
      subjectName: activeSection ? activeSection.title : 'Results',
      fullTitle: `Draft section: ${activeSection ? activeSection.title : manuscript.title}`,
    };
  }

  // 5. If specific claim selected
  if (selectedClaimId || (selectedNodeId && selectedNodeId.startsWith('c'))) {
    const claimId = selectedClaimId || selectedNodeId;
    let foundClaim: ClaimNode | undefined;
    let parentQuestion: QuestionNode | undefined;

    for (const q of questionsData) {
      const c = q.claims.find((claim) => claim.id === claimId);
      if (c) {
        foundClaim = c;
        parentQuestion = q;
        break;
      }
    }

    if (foundClaim) {
      const reason = foundClaim.questionReason ?? foundClaim.check?.reasonText ?? '';
      return {
        kind: 'claim',
        id: foundClaim.id,
        claimId: foundClaim.id,
        questionId: parentQuestion?.id,
        label: foundClaim.text,
        subjectType: 'Claim',
        subjectName: foundClaim.text,
        fullTitle: foundClaim.text,
        userReason: reason,
        parentName: parentQuestion?.text,
        existingVerdict: foundClaim.questionCheckResult
          ? {
              overallStatus: foundClaim.linkStatus || 'weak',
              modelId: foundClaim.questionCheckResult.modelId || 'cx/gpt-5.6-sol',
              finding: foundClaim.questionCheckResult.finding,
              axes: foundClaim.questionCheckResult.axes.map((ax) => ({
                label: ax.label,
                verdict: ax.verdict,
                detail: ax.detail,
              })),
            }
          : undefined,
      };
    }
  }

  // 6. If specific question selected
  if (selectedNodeId && selectedNodeId.startsWith('q')) {
    const question = questionsData.find((q) => q.id === selectedNodeId);
    if (question) {
      return {
        kind: 'question',
        id: question.id,
        questionId: question.id,
        label: question.text,
        subjectType: 'Question',
        subjectName: question.text,
        fullTitle: question.text,
      };
    }
  }

  // 7. Default / Whole graph
  return {
    kind: 'whole_graph',
    id: 'whole_graph',
    label: `${totalQuestions} questions, ${totalClaims} claims`,
    subjectType: 'Whole graph',
    subjectName: `${totalQuestions} questions, ${totalClaims} claims`,
    fullTitle: `Whole graph · ${totalQuestions} questions, ${totalClaims} claims`,
  };
}
