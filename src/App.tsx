import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  QuestionNode,
  ClaimNode,
  ChatMessage,
  AppTab,
  FilterStatus,
  LeftRailMark,
  AssistantContextInfo,
  AssistantThread,
  OpenProblemNote,
  CandidateQuestion,
  ClusteringProposal,
  EvidenceKind,
  PaperDoc,
  DraftManuscript,
} from './types';
import { ClaimWorkbench } from './components/workbench/ClaimWorkbench';
import { GraphPane } from './components/GraphPane';
import { CheckPane } from './components/CheckPane';
import { GraphCanvas } from './components/GraphCanvas';
import { PapersPane } from './components/PapersPane';
import { ExperimentsPane } from './components/ExperimentsPane';
import { SurveyPane } from './components/SurveyPane';
import { DraftPane } from './components/draft/DraftPane';
import { INITIAL_DRAFT_MANUSCRIPT } from './data/draftData';
import { INITIAL_EXPERIMENTS_DATA } from './data/experimentsData';
import { TopBar } from './components/shell/TopBar';
import {
  StandingBar,
  StandingCounts,
  StandingSegment,
} from './components/shell/StandingBar';
import { LeftRail } from './components/shell/LeftRail';
import { ExaminerDockPlaceholder } from './components/shell/ExaminerDockPlaceholder';
import {
  createClaim,
  createEvidence,
  EvidenceDraft,
} from './graphEdits';
import type { AssistantErrorResponse, AssistantResponse } from './assistantApi';
import type { DraggableResearchItem } from './researchItemDrag';
import type { WorkspaceErrorResponse, WorkspaceResponse } from './workspaceApi';


export default function App() {
  // App-level Navigation & Selection State
  const [activeTab, setActiveTab] = useState<AppTab>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionNode[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEvidenceKind, setEditingEvidenceKind] = useState<EvidenceKind | undefined>();

  // Standing Bar & Model filter state
  const [standingFilter, setStandingFilter] = useState<StandingSegment>('all');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState<boolean>(false);

  // Synchronized Filter Change
  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter);
    if (newFilter === 'all') setStandingFilter('all');
    else if (newFilter === 'weak') setStandingFilter('weak');
    else if (newFilter === 'missing') setStandingFilter('unsupported');
  };

  const handleStandingFilterChange = (segment: StandingSegment) => {
    setStandingFilter(segment);
    if (segment === 'all') setFilter('all');
    else if (segment === 'weak') setFilter('weak');
    else if (segment === 'unsupported') setFilter('missing');
  };


  // Project Tag Filter State (persistent across tab switches and reloads)
  const [selectedTag, setSelectedTag] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epistemic_selected_tag');
      if (saved) return saved;
    }
    return 'all';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epistemic_selected_tag', selectedTag);
    }
  }, [selectedTag]);

  // Draft manuscript state (session-local persistence)
  const [manuscript, setManuscript] = useState<DraftManuscript>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epistemic_draft_manuscript');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DRAFT_MANUSCRIPT;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epistemic_draft_manuscript', JSON.stringify(manuscript));
    }
  }, [manuscript]);

  // Survey discovery state
  const [openProblems, setOpenProblems] = useState<OpenProblemNote[]>([]);
  const [candidateQuestions, setCandidateQuestions] = useState<CandidateQuestion[]>([]);

  // Multi-Paper Tab Strip & Per-Paper State
  const [papersCatalog, setPapersCatalog] = useState<PaperDoc[]>([]);
  const [evidenceToPaperMap, setEvidenceToPaperMap] = useState<Record<string, string>>({});
  const [openPaperIds, setOpenPaperIds] = useState<string[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [paperScrollPositions, setPaperScrollPositions] = useState<Record<string, number>>({});
  const [paperZoomLevels, setPaperZoomLevels] = useState<Record<string, number>>({});
  const [paperMarks, setPaperMarks] = useState<Record<string, LeftRailMark[]>>({});
  const [targetPassageParagraphId, setTargetPassageParagraphId] = useState<string | null>(null);
  const [workspacePath, setWorkspacePath] = useState('');
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const initialQuestionsRef = useRef<QuestionNode[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      try {
        const response = await fetch('/api/workspace');
        const body = await response.json() as WorkspaceResponse | WorkspaceErrorResponse;
        if (!response.ok || !('questions' in body)) {
          throw new Error('error' in body ? body.error : 'Workspace load failed.');
        }
        if (cancelled) return;

        initialQuestionsRef.current = structuredClone(body.questions);
        setQuestionsData(body.questions);
        setPapersCatalog(body.papers);
        setEvidenceToPaperMap(body.evidenceToPaperMap);
        setOpenProblems(body.survey.openProblems);
        setCandidateQuestions(body.survey.candidateQuestions);
        setWorkspacePath(body.workspacePath);

        const firstQuestion = body.questions[0];
        const firstClaim = firstQuestion?.claims[0];
        setSelectedNodeId(firstClaim?.id || firstQuestion?.id || null);
        setSelectedClaimId(firstClaim?.id || null);

        const firstPaperId = body.papers[0]?.id || null;
        setOpenPaperIds(firstPaperId ? [firstPaperId] : []);
        setActivePaperId(firstPaperId);
      } catch (error) {
        if (!cancelled) {
          setWorkspaceError(error instanceof Error ? error.message : 'Workspace load failed.');
        }
      } finally {
        if (!cancelled) setIsWorkspaceLoading(false);
      }
    };

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pane collapse states
  const [isCheckCollapsed, setIsCheckCollapsed] = useState<boolean>(false);

  // Global Assistant Dock State (persistent across tab switches)
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(true);
  const [assistantQuotedSnippet, setAssistantQuotedSnippet] = useState<string | null>(null);
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);

  // Assistant Dock Width & Resizing State with persistence
  const [dockWidth, setDockWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epistemic_assistant_dock_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 300) {
          const maxAllowed = Math.min(
            Math.floor(window.innerWidth * 0.6),
            window.innerWidth - 400
          );
          return Math.min(Math.max(300, parsed), Math.max(300, maxAllowed));
        }
      }
    }
    return 380;
  });

  const [isDraggingDock, setIsDraggingDock] = useState<boolean>(false);
  const [isTooNarrowForAssistant, setIsTooNarrowForAssistant] = useState<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(380);

  // Window resize handler: ensure minimum 400px content pane & max 60% dock width
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 700) {
        setIsTooNarrowForAssistant(true);
        setIsAssistantOpen(false);
      } else {
        setIsTooNarrowForAssistant(false);
        const maxAllowed = Math.min(Math.floor(w * 0.6), w - 400);
        setDockWidth((prev) => {
          if (prev > maxAllowed) {
            const clamped = Math.max(300, maxAllowed);
            try {
              localStorage.setItem('epistemic_assistant_dock_width', String(clamped));
            } catch {}
            return clamped;
          }
          return prev;
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Live dragging listener for dock resize
  useEffect(() => {
    if (!isDraggingDock) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStartXRef.current - e.clientX;
      const candidateWidth = dragStartWidthRef.current + deltaX;
      const maxAllowed = Math.min(
        Math.floor(window.innerWidth * 0.6),
        window.innerWidth - 400
      );
      const clamped = Math.min(Math.max(300, candidateWidth), Math.max(300, maxAllowed));
      setDockWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingDock(false);
      setDockWidth((current) => {
        try {
          localStorage.setItem('epistemic_assistant_dock_width', String(current));
        } catch {}
        return current;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingDock]);

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDock(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = dockWidth;
  };

  const handleDoubleClickResetDock = () => {
    const defaultWidth = 380;
    const maxAllowed = Math.min(
      Math.floor(window.innerWidth * 0.6),
      window.innerWidth - 400
    );
    const clamped = Math.min(Math.max(300, defaultWidth), Math.max(300, maxAllowed));
    setDockWidth(clamped);
    try {
      localStorage.setItem('epistemic_assistant_dock_width', String(clamped));
    } catch {}
  };

  // Compute all tags in use dynamically from questionsData
  const allTagsInUse = useMemo(() => {
    const set = new Set<string>();
    questionsData.forEach((q) => {
      if (q.tags) {
        q.tags.forEach((tag) => set.add(tag));
      }
    });
    return Array.from(set).sort();
  }, [questionsData]);

  // Compute tag-filtered questions
  const tagFilteredQuestions = useMemo(() => {
    if (selectedTag === 'all') return questionsData;
    return questionsData.filter((q) => q.tags && q.tags.includes(selectedTag));
  }, [questionsData, selectedTag]);

  // Compute Standing Bar counts dynamically
  const standingCounts: StandingCounts = useMemo(() => {
    let holds = 0;
    let weak = 0;
    let unsupported = 0;
    let unwrittenReasons = 0;

    tagFilteredQuestions.forEach((q) => {
      q.claims.forEach((c) => {
        if (c.linkStatus === 'holds') holds++;
        else if (c.linkStatus === 'weak') weak++;
        else if (c.linkStatus === 'missing') unsupported++;

        // Check if claim reason is unwritten
        if (!c.check?.reasonText || c.check.reasonText.trim() === '') {
          unwrittenReasons++;
        }

        // Check evidence
        if (!c.evidence || c.evidence.length === 0) {
          // If not already counted as missing
          if (c.linkStatus !== 'missing') {
            unsupported++;
          }
        } else {
          c.evidence.forEach((e) => {
            if (!e.userReason || e.userReason.trim() === '') {
              unwrittenReasons++;
            }
          });
        }
      });
    });

    const openQuestions =
      tagFilteredQuestions.length +
      candidateQuestions.length +
      openProblems.length;

    return {
      holds,
      weak,
      unsupported,
      unwrittenReasons,
      openQuestions,
    };
  }, [tagFilteredQuestions, candidateQuestions, openProblems]);


  // Assistant Threads dictionary & active thread ID
  const [threads, setThreads] = useState<Record<string, AssistantThread>>({
    'thread-whole_graph-whole_graph': {
      id: 'thread-whole_graph-whole_graph',
      contextKind: 'whole_graph',
      contextId: 'whole_graph',
      contextLabel: 'whole graph — 3 questions, 4 claims',
      messages: [],
      lastUpdated: 'Just now',
    },
    'thread-claim-c1': {
      id: 'thread-claim-c1',
      contextKind: 'claim',
      contextId: 'c1',
      contextLabel: 'claim: Sparsity lowers overlap, and overlap causes interference.',
      messages: [],
      lastUpdated: 'Just now',
    },
    'thread-paper-p1': {
      id: 'thread-paper-p1',
      contextKind: 'paper',
      contextId: 'p1',
      contextLabel: 'paper: Emergence of simple-cell receptive field properties by learning a sparse code for natural images',
      messages: [],
      lastUpdated: 'Just now',
    },
    'thread-survey-survey': {
      id: 'thread-survey-survey',
      contextKind: 'survey',
      contextId: 'survey',
      contextLabel: 'survey — 6 open problems',
      messages: [],
      lastUpdated: 'Just now',
    },
  });
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-claim-c1');

  // Highlight state for nodes
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  // Dark mode state with persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epistemic_theme');
      if (saved) return saved === 'dark';
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  // Sync dark class on html root element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('epistemic_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('epistemic_theme', 'light');
      }
    }
  }, [darkMode]);

  // Global Keyboard Shortcut: Cmd/Ctrl+J toggles Assistant Dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trigger 2s amber outline highlight on affected node
  const triggerHighlight = (nodeId: string) => {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    setHighlightedNodeId(nodeId);
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedNodeId(null);
    }, 2000);
  };

  // Find the selected claim object across all filtered questions
  const selectedClaim = selectedClaimId
    ? tagFilteredQuestions.flatMap((q) => q.claims).find((c) => c.id === selectedClaimId)
    : undefined;

  // Find the selected question object
  const selectedQuestion = tagFilteredQuestions.find((q) => q.id === selectedNodeId) ||
    tagFilteredQuestions.find((q) => q.claims.some((c) => c.id === selectedClaim?.id));

  // Helper to get formatted current time
  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to derive current AssistantContextInfo based on activeTab and selectedNodeId
  const getCurrentContext = (): AssistantContextInfo => {
    const totalQuestions = tagFilteredQuestions.length;
    const totalClaims = tagFilteredQuestions.reduce((acc, q) => acc + q.claims.length, 0);

    if (activeTab === 'survey') {
      return {
        kind: 'survey',
        id: 'survey',
        label: `survey — ${openProblems.length} open ${openProblems.length === 1 ? 'problem' : 'problems'}`,
      };
    }

    if (activeTab === 'papers') {
      const activeDoc = papersCatalog.find((paper) => paper.id === activePaperId);
      if (activeDoc) {
        return {
          kind: 'paper',
          id: activeDoc.id,
          label: `paper: ${activeDoc.title}`,
        };
      }
      return {
        kind: 'whole_graph',
        id: 'whole_graph',
        label: `whole graph — ${totalQuestions} questions, ${totalClaims} claims`,
      };
    }

    if (activeTab === 'experiments') {
      return {
        kind: 'experiment',
        id: 'experiments',
        label: 'experiments — 4 active protocols',
      };
    }

    if (activeTab === 'draft') {
      return {
        kind: 'draft',
        id: 'draft',
        label: `draft: ${manuscript.title}`,
      };
    }

    if (selectedNodeId) {
      const claim = tagFilteredQuestions.flatMap((q) => q.claims).find((c) => c.id === selectedNodeId);
      if (claim) {
        return {
          kind: 'claim',
          id: claim.id,
          label: `claim: ${claim.text}`,
        };
      }

      const question = tagFilteredQuestions.find((q) => q.id === selectedNodeId);
      if (question) {
        return {
          kind: 'whole_graph',
          id: question.id,
          label: `question: ${question.text}`,
        };
      }

      const paper = papersCatalog.find((candidate) => candidate.id === selectedNodeId);
      if (paper) {
        return {
          kind: 'paper',
          id: paper.id,
          label: `paper: ${paper.title}`,
        };
      }
    }

    if (activeTab === 'detail' && selectedClaim) {
      return {
        kind: 'claim',
        id: selectedClaim.id,
        label: `claim: ${selectedClaim.text}`,
      };
    }

    return {
      kind: 'whole_graph',
      id: 'whole_graph',
      label: `whole graph — ${totalQuestions} questions, ${totalClaims} claims`,
    };
  };

  const currentContext = getCurrentContext();

  // Ensure thread exists for current context and sync active thread when context changes
  useEffect(() => {
    const threadKey = `thread-${currentContext.kind}-${currentContext.id}`;
    setThreads((prev) => {
      if (prev[threadKey]) {
        return prev;
      }
      return {
        ...prev,
        [threadKey]: {
          id: threadKey,
          contextKind: currentContext.kind,
          contextId: currentContext.id,
          contextLabel: currentContext.label,
          messages: [],
          lastUpdated: 'Just now',
        },
      };
    });
    setActiveThreadId(threadKey);
  }, [currentContext.kind, currentContext.id, currentContext.label]);

  const activeThread = threads[activeThreadId] || {
    id: activeThreadId,
    contextKind: currentContext.kind,
    contextId: currentContext.id,
    contextLabel: currentContext.label,
    messages: [],
    lastUpdated: 'Just now',
  };

  // Synchronize selectedClaimId when selectedNodeId changes to a claim
  const handleSelectClaim = (claimId: string) => {
    setSelectedNodeId(claimId);
    setSelectedClaimId(claimId);
    setIsWorkbenchOpen(true);
    setEditingNodeId(null);
    setEditingEvidenceKind(undefined);
    triggerHighlight(claimId);
  };

  // Synchronize selectedQuestionId when selectedNodeId changes to a question
  const handleSelectQuestion = (questionId: string) => {
    setSelectedNodeId(questionId);
    const question = questionsData.find((item) => item.id === questionId);
    setSelectedClaimId(question?.claims[0]?.id || null);
    setIsWorkbenchOpen(false);
    setEditingNodeId(null);
    setEditingEvidenceKind(undefined);
    triggerHighlight(questionId);
  };

  const handleUpdateClaimNode = (updatedClaim: ClaimNode) => {
    setQuestionsData((prev) =>
      prev.map((question) => {
        const hasClaim = question.claims.some((c) => c.id === updatedClaim.id);
        if (!hasClaim) return question;
        return {
          ...question,
          claims: question.claims.map((c) =>
            c.id === updatedClaim.id ? updatedClaim : c
          ),
        };
      })
    );
    triggerHighlight(updatedClaim.id);
  };

  const handleToggleEditNode = (nodeId: string) => {
    if (editingNodeId === nodeId) {
      setEditingNodeId(null);
      setEditingEvidenceKind(undefined);
      return;
    }
    setEditingNodeId(nodeId);
    setEditingEvidenceKind(undefined);
  };

  const handleEditClaim = (claimId: string, evidenceKind?: EvidenceKind) => {
    if (!claimId) return;
    setEditingNodeId(claimId);
    setEditingEvidenceKind(evidenceKind);
  };

  const handleUpdateQuestion = (questionId: string, text: string, tags: string[]) => {
    if (!text.trim()) return;
    setQuestionsData((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, text: text.trim(), tags }
          : question
      )
    );
  };

  const handleUpdateClaim = (claimId: string, text: string) => {
    if (!text.trim()) return;
    setQuestionsData((prev) =>
      prev.map((question) => ({
        ...question,
        claims: question.claims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                text: text.trim(),
              }
            : claim
        ),
      }))
    );
  };

  const handleAddEvidence = (claimId: string, draft: EvidenceDraft) => {
    const evidence = createEvidence(`evidence-${Date.now()}`, draft);
    setQuestionsData((prev) =>
      prev.map((question) => ({
        ...question,
        claims: question.claims.map((claim) =>
          claim.id === claimId
            ? { ...claim, evidence: [...claim.evidence, evidence] }
            : claim
        ),
      }))
    );
    triggerHighlight(evidence.id);
  };

  // Clicking a node in the graph routes by type
  const handleSelectNodeFromGraph = (node: {
    id: string;
    type: 'QUESTION' | 'CLAIM' | 'PAPER' | 'EXPERIMENT' | 'GHOST';
    questionId: string;
    claimId?: string;
    evidenceId?: string;
  }) => {
    setSelectedNodeId(node.id);

    if (node.type === 'QUESTION') {
      const question = questionsData.find(
        (item) => item.id === node.id || item.id === node.questionId
      );
      setSelectedClaimId(question?.claims[0]?.id || null);
      setIsWorkbenchOpen(false);
      setEditingNodeId(null);
      setEditingEvidenceKind(undefined);
      triggerHighlight(node.id);
      setActiveTab('graph');
      return;
    }

    if (node.type === 'CLAIM') {
      const claimId = node.claimId || node.id;
      setSelectedClaimId(claimId);
      setIsWorkbenchOpen(true);
      triggerHighlight(claimId);
      setActiveTab('graph');
      return;
    }

    if (node.type === 'PAPER') {
      const paperId =
        evidenceToPaperMap[node.id] ||
        (node.evidenceId && evidenceToPaperMap[node.evidenceId]) ||
        node.id;

      if (!openPaperIds.includes(paperId)) {
        setOpenPaperIds((prev) => [...prev, paperId]);
      }
      setActivePaperId(paperId);

      const paperDoc = papersCatalog.find((paper) => paper.id === paperId);
      let linkedParId: string | null = null;
      if (paperDoc) {
        for (const sec of paperDoc.sections) {
          const matchedPar = sec.paragraphs.find(
            (p) => p.linkedClaimId && p.linkedClaimId === node.claimId
          );
          if (matchedPar) {
            linkedParId = matchedPar.id;
            break;
          }
        }
        if (!linkedParId && paperDoc.initialMarks && paperDoc.initialMarks.length > 0) {
          linkedParId = paperDoc.initialMarks[0].paragraphId;
        }
      }
      setTargetPassageParagraphId(linkedParId);
      setActiveTab('papers');
      return;
    }

    if (node.type === 'EXPERIMENT') {
      setActiveTab('experiments');
      return;
    }

    if (node.type === 'GHOST') {
      const parentClaimId = node.claimId || 'c1';
      setSelectedClaimId(parentClaimId);
      setIsWorkbenchOpen(true);
      triggerHighlight(parentClaimId);
      setActiveTab('graph');
      return;
    }
  };

  const handleDropResearchItem = (item: DraggableResearchItem) => {
    if (item.type === 'QUESTION') {
      const question = questionsData.find((candidate) => candidate.id === item.id);
      if (!question) return;
      handleSelectNodeFromGraph({
        id: question.id,
        type: 'QUESTION',
        questionId: question.id,
      });
      return;
    }

    if (item.type === 'CLAIM') {
      const question = questionsData.find((candidate) =>
        candidate.claims.some((claim) => claim.id === item.id)
      );
      if (!question) return;
      handleSelectNodeFromGraph({
        id: item.id,
        type: 'CLAIM',
        questionId: question.id,
        claimId: item.id,
      });
      return;
    }

    if (item.type === 'SURVEY') {
      const problem = openProblems.find((candidate) => candidate.id === item.id);
      if (problem) {
        setSelectedNodeId(problem.id);
        triggerHighlight(problem.id);
        return;
      }

      const candidate = candidateQuestions.find((candidate) => candidate.id === item.id);
      if (candidate) {
        setSelectedNodeId(candidate.id);
        triggerHighlight(candidate.id);
        return;
      }

      setSelectedNodeId(null);
      setActiveTab('survey');
      return;
    }

    if (item.type === 'EXPERIMENT') {
      const linkedExp = questionsData
        .flatMap((question) =>
          question.claims.flatMap((claim) =>
            claim.evidence
              .filter((evidence) => evidence.kind === 'experiment')
              .map((evidence) => ({
                questionId: question.id,
                claimId: claim.id,
                evidenceId: evidence.id,
              }))
          )
        )
        .find((exp) => exp.evidenceId === item.id);

      if (linkedExp) {
        handleSelectNodeFromGraph({
          id: linkedExp.evidenceId,
          type: 'EXPERIMENT',
          questionId: linkedExp.questionId,
          claimId: linkedExp.claimId,
          evidenceId: linkedExp.evidenceId,
        });
        return;
      }

      setSelectedNodeId(item.id);
      triggerHighlight(item.id);
      return;
    }

    const linkedPaper = questionsData
      .flatMap((question) =>
        question.claims.flatMap((claim) =>
          claim.evidence
            .filter((evidence) => evidence.kind === 'paper')
            .map((evidence) => ({
              questionId: question.id,
              claimId: claim.id,
              evidenceId: evidence.id,
            }))
        )
      )
      .find((paper) => paper.evidenceId === item.id);
    const paperId = linkedPaper ? evidenceToPaperMap[linkedPaper.evidenceId] : item.id;
    if (!paperId || !papersCatalog.some((paper) => paper.id === paperId)) return;
    handleSelectNodeFromGraph({
      id: linkedPaper?.evidenceId || paperId,
      type: 'PAPER',
      questionId: linkedPaper?.questionId || '',
      claimId: linkedPaper?.claimId,
      evidenceId: linkedPaper?.evidenceId,
    });
  };

  // Reject claim action
  const handleRejectClaim = (claimId: string) => {
    setQuestionsData((prev) =>
      prev.map((q) => ({
        ...q,
        claims: q.claims.map((claim) => {
          if (claim.id === claimId) {
            return {
              ...claim,
              isRejected: !claim.isRejected,
            };
          }
          return claim;
        }),
      }))
    );
  };

  // Add Claim to Question action
  const handleAddClaimToQuestion = (
    questionId: string,
    text: string,
    userReason: string
  ) => {
    const newClaim = createClaim(`claim-${Date.now()}`, { text, userReason });

    setQuestionsData((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, claims: [...q.claims, newClaim] } : q
      )
    );
    setSelectedNodeId(newClaim.id);
    setSelectedClaimId(newClaim.id);
    triggerHighlight(newClaim.id);
  };

  // Reset to initial
  const handleReset = () => {
    const initialQuestions = structuredClone(initialQuestionsRef.current);
    const firstQuestion = initialQuestions[0];
    const firstClaim = firstQuestion?.claims[0];
    setQuestionsData(initialQuestions);
    setSelectedNodeId(firstClaim?.id || firstQuestion?.id || null);
    setSelectedClaimId(firstClaim?.id || null);
  };

  // Add Evidence from Paper Tab
  const handleAddEvidenceFromPaper = (
    claimId: string,
    evidenceTitle: string,
    citation: string,
    userReason: string
  ) => {
    const newEvId = `paper-ev-${Date.now()}`;
    const newEvidenceItem = {
      id: newEvId,
      kind: 'paper' as const,
      typeLabel: 'PAPER',
      title: evidenceTitle,
      citation,
      userReason,
    };

    setQuestionsData((prev) =>
      prev.map((q) => ({
        ...q,
        claims: q.claims.map((claim) => {
          if (claim.id === claimId) {
            return {
              ...claim,
              evidence: [...claim.evidence, newEvidenceItem],
              linkStatus:
                claim.linkStatus === 'missing' ? 'weak' : claim.linkStatus,
            };
          }
          return claim;
        }),
      }))
    );

    triggerHighlight(newEvId);
  };

  // Remove evidence from claim (e.g. for Undo finding)
  const handleRemoveEvidenceFromClaim = (
    claimId: string,
    evidenceId: string
  ) => {
    setQuestionsData((prev) =>
      prev.map((q) => ({
        ...q,
        claims: q.claims.map((claim) => {
          if (claim.id === claimId) {
            return {
              ...claim,
              evidence: claim.evidence.filter((e) => e.id !== evidenceId),
            };
          }
          return claim;
        }),
      }))
    );
  };

  // Open Problem Management Handlers
  const handleAddOpenProblem = (text: string, citation?: string) => {
    const newProblem: OpenProblemNote = {
      id: `op-${Date.now()}`,
      text,
      citation,
      createdAt: Date.now(),
    };
    setOpenProblems((prev) => [newProblem, ...prev]);
  };

  const handleUpdateOpenProblem = (id: string, text: string, citation?: string) => {
    setOpenProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, text, citation } : p))
    );
  };

  const handleRemoveOpenProblem = (id: string) => {
    setOpenProblems((prev) => prev.filter((p) => p.id !== id));
    // Also unlink from all candidate questions
    setCandidateQuestions((prev) =>
      prev.map((c) => ({
        ...c,
        openProblemIds: c.openProblemIds.filter((pid) => pid !== id),
      }))
    );
  };

  // Candidate Question Management Handlers
  const handleAddCandidateQuestion = (text?: string, linkedIds?: string[]) => {
    const newCandidate: CandidateQuestion = {
      id: `cand-${Date.now()}`,
      text: text || 'New candidate question under investigation',
      openProblemIds: linkedIds || [],
      createdAt: Date.now(),
    };
    setCandidateQuestions((prev) => [newCandidate, ...prev]);
  };

  const handleUpdateCandidateQuestion = (id: string, text: string) => {
    setCandidateQuestions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text } : c))
    );
  };

  const handleRemoveCandidateQuestion = (id: string) => {
    setCandidateQuestions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleLinkProblemToCandidate = (candidateId: string, problemId: string) => {
    setCandidateQuestions((prev) =>
      prev.map((c) =>
        c.id === candidateId && !c.openProblemIds.includes(problemId)
          ? { ...c, openProblemIds: [...c.openProblemIds, problemId] }
          : c
      )
    );
  };

  const handleUnlinkProblemFromCandidate = (candidateId: string, problemId: string) => {
    setCandidateQuestions((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, openProblemIds: c.openProblemIds.filter((pid) => pid !== problemId) }
          : c
      )
    );
  };

  // PROMOTE CANDIDATE TEST HANDLER
  const handlePromoteCandidate = (
    candidate: CandidateQuestion,
    claimText: string,
    tags?: string[],
    falsificationCondition?: string
  ): string => {
    const newQuestionId = `q-${Date.now()}`;
    const newClaimId = `c-${Date.now()}`;

    // Inherit tags or active project tag
    const finalTags =
      tags && tags.length > 0
        ? tags
        : selectedTag !== 'all'
        ? [selectedTag]
        : ['tinyml'];

    const newQuestion: QuestionNode = {
      id: newQuestionId,
      type: 'QUESTION',
      text: candidate.text,
      tags: finalTags,
      claims: [
        {
          id: newClaimId,
          type: 'CLAIM',
          text: claimText,
          linkStatus: 'missing',
          questionReason: '',
          evidence: [],
          check: {
            tag: 'UNWRITTEN REASON',
            tagColor: 'red',
            reasonText: '',
            explanation: falsificationCondition
              ? `Promoted from survey. Falsification test noted: "${falsificationCondition}". User reason required to evaluate link.`
              : 'Promoted from survey. User reason required to evaluate link.',
            checks: [
              {
                label: 'Type',
                status: 'unverified',
                detail: 'Pending user reason to verify causal/correlational alignment',
              },
              {
                label: 'Scope',
                status: 'unverified',
                detail: 'Pending user reason to verify scope boundary',
              },
              {
                label: 'Target',
                status: 'unverified',
                detail: 'Pending user reason to verify target metrics',
              },
            ],
          },
        },
      ],
    };

    // 1. Create Question and Claim in Graph
    setQuestionsData((prev) => [newQuestion, ...prev]);

    // 2. Remove the linked open problems from survey pile
    const linkedSet = new Set(candidate.openProblemIds);
    setOpenProblems((prev) => prev.filter((p) => !linkedSet.has(p.id)));

    // 3. Remove the promoted candidate
    setCandidateQuestions((prev) => prev.filter((c) => c.id !== candidate.id));

    // 4. Select newly created question/claim
    setSelectedNodeId(newQuestionId);
    setSelectedClaimId(newClaimId);
    triggerHighlight(newClaimId);

    return newQuestionId;
  };

  // CLUSTERING HANDLER (Sends notes to assistant)
  const handleClusterNotes = (problemIds: string[]) => {
    setIsAssistantOpen(true);
    const problemsToCluster = problemIds
      .map((id) => openProblems.find((p) => p.id === id))
      .filter((p): p is OpenProblemNote => !!p);

    if (problemsToCluster.length === 0) return;

    // Partition problems into two sensible candidate clusters
    const midpoint = Math.ceil(problemsToCluster.length / 2);
    const group1 = problemsToCluster.slice(0, midpoint);
    const group2 = problemsToCluster.slice(midpoint);

    const proposals: ClusteringProposal[] = [
      {
        id: `prop-${Date.now()}-1`,
        groupName:
          group1[0]?.text.includes('SRAM') || group1[0]?.text.includes('quantization')
            ? 'How do memory footprint and quantization affect transformer latency on microcontrollers?'
            : 'What causes performance discrepancies in embedded sparse activation networks?',
        problemIds: group1.map((p) => p.id),
        problemSnippets: group1.map((p) => p.text),
      },
    ];

    if (group2.length > 0) {
      proposals.push({
        id: `prop-${Date.now()}-2`,
        groupName:
          group2[0]?.text.includes('timer') || group2[0]?.text.includes('latency')
            ? 'Do hardware timer variances invalidate cross-device TinyML benchmarks?'
            : 'Which architectural bottlenecks dominate high-dimensional sparse coding recall?',
        problemIds: group2.map((p) => p.id),
        problemSnippets: group2.map((p) => p.text),
      });
    }

    const proposalMsg: ChatMessage = {
      id: `cluster-msg-${Date.now()}`,
      sender: 'clustering_proposal',
      text: `I've analyzed ${problemsToCluster.length} open problems and identified ${proposals.length} candidate grouping proposals:`,
      timestamp: getFormattedTime(),
      proposals,
    };

    const surveyThreadKey = 'thread-survey-survey';
    setThreads((prev) => {
      const current = prev[surveyThreadKey] || {
        id: surveyThreadKey,
        contextKind: 'survey',
        contextId: 'survey',
        contextLabel: `survey — ${openProblems.length} open problems`,
        messages: [],
        lastUpdated: 'Just now',
      };

      return {
        ...prev,
        [surveyThreadKey]: {
          ...current,
          messages: [...current.messages, proposalMsg],
          lastUpdated: getFormattedTime(),
        },
      };
    });
    setActiveThreadId(surveyThreadKey);
  };

  // Accept / Reject Proposal from Assistant Dock
  const handleAcceptProposal = (proposal: ClusteringProposal, messageId: string) => {
    handleAddCandidateQuestion(proposal.groupName, proposal.problemIds);

    // Remove accepted proposal from message
    setThreads((prev) => {
      const thread = prev[activeThreadId];
      if (!thread) return prev;
      return {
        ...prev,
        [activeThreadId]: {
          ...thread,
          messages: thread.messages.map((m) => {
            if (m.id === messageId && m.proposals) {
              const updatedProposals = m.proposals.filter((p) => p.id !== proposal.id);
              return {
                ...m,
                proposals: updatedProposals,
                text:
                  updatedProposals.length === 0
                    ? `Accepted grouping: "${proposal.groupName}" (candidate created).`
                    : m.text,
              };
            }
            return m;
          }),
        },
      };
    });
  };

  const handleRejectProposal = (proposalId: string, messageId: string) => {
    setThreads((prev) => {
      const thread = prev[activeThreadId];
      if (!thread) return prev;
      return {
        ...prev,
        [activeThreadId]: {
          ...thread,
          messages: thread.messages.map((m) => {
            if (m.id === messageId && m.proposals) {
              const updatedProposals = m.proposals.filter((p) => p.id !== proposalId);
              return {
                ...m,
                proposals: updatedProposals,
                text:
                  updatedProposals.length === 0
                    ? 'All proposals reviewed.'
                    : m.text,
              };
            }
            return m;
          }),
        },
      };
    });
  };

  // Papers Tab actions
  const handleOpenPaper = (paperId: string) => {
    if (!openPaperIds.includes(paperId)) {
      setOpenPaperIds((prev) => [...prev, paperId]);
    }
    setActivePaperId(paperId);
    setSelectedNodeId(paperId);
  };

  const handleClosePaper = (paperId: string) => {
    const remaining = openPaperIds.filter((id) => id !== paperId);
    setOpenPaperIds(remaining);
    if (activePaperId === paperId) {
      const idx = openPaperIds.indexOf(paperId);
      if (remaining.length > 0) {
        const nextId = idx > 0 ? remaining[idx - 1] : remaining[0];
        setActivePaperId(nextId);
        setSelectedNodeId(nextId);
      } else {
        setActivePaperId(null);
      }
    }
  };

  const handleSelectPaperTab = (paperId: string) => {
    setActivePaperId(paperId);
    setSelectedNodeId(paperId);
  };

  const handleSavePaperScrollPosition = (paperId: string, pos: number) => {
    setPaperScrollPositions((prev) => ({ ...prev, [paperId]: pos }));
  };

  const handleSavePaperZoomLevel = (paperId: string, zoom: number) => {
    setPaperZoomLevels((prev) => ({ ...prev, [paperId]: zoom }));
  };

  const handleAddPaperMark = (paperId: string, mark: LeftRailMark) => {
    setPaperMarks((prev) => ({
      ...prev,
      [paperId]: [...(prev[paperId] || []), mark],
    }));
  };

  const handleAddCustomPaper = (paper: PaperDoc) => {
    setPapersCatalog((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === paper.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = paper;
        return copy;
      }
      return [paper, ...prev];
    });
    if (!openPaperIds.includes(paper.id)) {
      setOpenPaperIds((prev) => [...prev, paper.id]);
    }
    setActivePaperId(paper.id);
    setSelectedNodeId(paper.id);
  };

  // "Ask" button in Paper Reader Floating Toolbar -> Opens Assistant Dock with quote
  const handleAskAboutSelection = (snippetText: string) => {
    setIsAssistantOpen(true);
    setAssistantQuotedSnippet(snippetText);
  };

  // Assistant Dock Message Dispatcher
  const handleAssistantSendMessage = async (text: string, quotedSnippet?: string | null) => {
    const trimmed = text.trim();
    if (!trimmed || isAssistantResponding) return;

    const threadId = activeThreadId;
    const context = currentContext;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: quotedSnippet ? `"${quotedSnippet}"\n\n${trimmed}` : trimmed,
      timestamp: getFormattedTime(),
    };

    setThreads((prev) => {
      const thread = prev[threadId] || {
        id: threadId,
        contextKind: context.kind,
        contextId: context.id,
        contextLabel: context.label,
        messages: [],
        lastUpdated: 'Just now',
      };
      return {
        ...prev,
        [threadId]: {
          ...thread,
          messages: [...thread.messages, userMsg],
          lastUpdated: getFormattedTime(),
        },
      };
    });

    const contextData = context.kind === 'survey'
      ? { openProblems, candidateQuestions }
      : context.kind === 'paper'
        ? papersCatalog.find((paper) => paper.id === context.id)
        : context.kind === 'claim'
          ? { question: selectedQuestion, claim: selectedClaim }
          : context.id && context.id !== 'whole_graph'
            ? { question: tagFilteredQuestions.find((question) => question.id === context.id) }
          : { questions: tagFilteredQuestions };

    setIsAssistantResponding(true);
    let responseMsg: ChatMessage;
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          context,
          message: trimmed,
          quotedSnippet: quotedSnippet || undefined,
          contextData,
        }),
      });
      const body = await response.json() as AssistantResponse | AssistantErrorResponse;
      if (!response.ok || !('text' in body)) {
        throw new Error('error' in body ? body.error : 'Assistant request failed.');
      }
      responseMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: body.text,
        timestamp: getFormattedTime(),
        modelId: body.modelId,
      };
    } catch (error) {
      responseMsg = {
        id: `asst-error-${Date.now()}`,
        sender: 'assistant',
        text: error instanceof Error ? `Assistant unavailable: ${error.message}` : 'Assistant unavailable.',
        timestamp: getFormattedTime(),
      };
    } finally {
      setIsAssistantResponding(false);
    }

    setThreads((prev) => {
      const thread = prev[threadId];
      if (!thread) return prev;
      return {
        ...prev,
        [threadId]: {
          ...thread,
          messages: [...thread.messages, responseMsg],
          lastUpdated: getFormattedTime(),
        },
      };
    });
  };

  // Undo edit action
  const handleUndoEdit = (messageId: string) => {
    const thread = threads[activeThreadId];
    if (!thread) return;
    const msg = thread.messages.find((m) => m.id === messageId);
    if (!msg || !msg.undoAction) return;
    const undo = msg.undoAction;

    if (undo.type === 'remove_evidence') {
      setQuestionsData((prev) =>
        prev.map((q) => ({
          ...q,
          claims: q.claims.map((c) =>
            c.id === undo.claimId
              ? {
                  ...c,
                  evidence: c.evidence.filter((e) => e.id !== undo.evidenceId),
                }
              : c
          ),
        }))
      );
    }
  };

  // Context chip click: scrolls/highlights the item
  const handleClickContextChip = () => {
    if (currentContext.kind === 'claim' || currentContext.kind === 'whole_graph') {
      if (selectedNodeId) {
        triggerHighlight(selectedNodeId);
      }
    } else if (currentContext.kind === 'paper') {
      if (activePaperId) {
        setActiveTab('papers');
      }
    } else if (currentContext.kind === 'survey') {
      setActiveTab('survey');
    }
  };

  // Context chip clear button (x): resets back to whole-graph default
  const handleClearContext = () => {
    setSelectedNodeId(null);
    setSelectedClaimId(null);
  };

  // Create a new thread for current context
  const handleCreateNewThread = () => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: AssistantThread = {
      id: newThreadId,
      contextKind: currentContext.kind,
      contextId: currentContext.id,
      contextLabel: currentContext.label,
      messages: [],
      lastUpdated: 'Just now',
    };
    setThreads((prev) => ({
      ...prev,
      [newThreadId]: newThread,
    }));
    setActiveThreadId(newThreadId);
  };

  const allThreadsList: AssistantThread[] = Object.values(threads);

  if (isWorkspaceLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#fcfcfc] text-sm text-stone-500 dark:bg-[#121212] dark:text-stone-400">
        Loading workspace…
      </div>
    );
  }

  if (workspaceError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#fcfcfc] p-8 dark:bg-[#121212]">
        <div className="max-w-xl rounded-lg border border-red-200 bg-white p-5 text-sm text-red-700 shadow-sm dark:border-red-950 dark:bg-[#181818] dark:text-red-300">
          <div className="font-semibold">Workspace unavailable</div>
          <div className="mt-2 font-mono text-xs">{workspaceError}</div>
          <div className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            Set INSTRUMENT_WORKSPACE_DIR to a repo containing the Markdown workspace folders.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-paper text-ink font-sans">
      {/* Top Bar: Wordmark, workspace, tag filter, only mine toggle, theme toggle, ⌘J hint */}
      <TopBar
        workspacePath={workspacePath}
        selectedTag={selectedTag}
        allTags={allTagsInUse}
        onSelectTag={setSelectedTag}
        onlyMine={onlyMine}
        onToggleOnlyMine={() => setOnlyMine(!onlyMine)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isAssistantOpen={isAssistantOpen}
        onToggleAssistant={() => {
          if (!isTooNarrowForAssistant) {
            setIsAssistantOpen(!isAssistantOpen);
          }
        }}
      />

      {/* Standing Bar: Signature element with holds/weak/unsupported/unwritten/open counts */}
      <StandingBar
        counts={standingCounts}
        activeSegment={standingFilter}
        onSelectSegment={handleStandingFilterChange}
      />

      {/* Main Container: Left Rail + Active Screen + Examiner Dock */}
      <div
        className={`flex-1 flex w-full overflow-hidden bg-paper ${
          isDraggingDock ? 'select-none' : ''
        }`}
      >
        {/* Left Rail: Pipeline navigation (Survey -> Map -> Read -> Bench -> Draft) */}
        <LeftRail activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Screen Content */}
        <main className="flex-1 h-full overflow-hidden min-w-0 bg-paper">
          {activeTab === 'graph' && (
            isWorkbenchOpen && selectedClaim ? (
              <div className="h-full w-full overflow-y-auto bg-paper">
                <ClaimWorkbench
                  claim={selectedClaim}
                  question={selectedQuestion || null}
                  onlyMine={onlyMine}
                  onBackToMap={() => setIsWorkbenchOpen(false)}
                  onSelectQuestion={(qId) => {
                    setSelectedNodeId(qId);
                    setIsWorkbenchOpen(false);
                  }}
                  onNavigateToTab={(tab, contextId) => {
                    if (contextId) setSelectedNodeId(contextId);
                    setIsWorkbenchOpen(false);
                    setActiveTab(tab);
                  }}
                  onUpdateClaim={handleUpdateClaimNode}
                />
              </div>
            ) : (
              <GraphCanvas
                questions={tagFilteredQuestions}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNodeFromGraph}
                filter={filter}
                standingFilter={standingFilter}
                onFilterChange={handleFilterChange}
                onStandingFilterChange={handleStandingFilterChange}
                onNavigateToSurvey={() => setActiveTab('survey')}
                isLoading={isWorkspaceLoading}
              />
            )
          )}

          {activeTab === 'survey' && (
            <SurveyPane
              openProblems={openProblems}
              candidateQuestions={candidateQuestions}
              onAddOpenProblem={handleAddOpenProblem}
              onUpdateOpenProblem={handleUpdateOpenProblem}
              onRemoveOpenProblem={handleRemoveOpenProblem}
              onAddCandidateQuestion={handleAddCandidateQuestion}
              onUpdateCandidateQuestion={handleUpdateCandidateQuestion}
              onRemoveCandidateQuestion={handleRemoveCandidateQuestion}
              onLinkProblemToCandidate={handleLinkProblemToCandidate}
              onUnlinkProblemFromCandidate={handleUnlinkProblemFromCandidate}
              onPromoteCandidate={handlePromoteCandidate}
              onClusterNotes={handleClusterNotes}
              onlyMine={onlyMine}
              activeProjectTag={selectedTag}
              onNavigateToMap={(questionId) => {
                if (questionId) {
                  setSelectedNodeId(questionId);
                  const q = questionsData.find((item) => item.id === questionId);
                  if (q?.claims[0]) {
                    setSelectedClaimId(q.claims[0].id);
                    setIsWorkbenchOpen(true);
                  } else {
                    setIsWorkbenchOpen(false);
                  }
                }
                setActiveTab('graph');
              }}
            />
          )}

          {activeTab === 'detail' && selectedClaim && (
            <div className="h-full w-full overflow-y-auto bg-paper">
              <ClaimWorkbench
                claim={selectedClaim}
                question={selectedQuestion || null}
                onlyMine={onlyMine}
                onBackToMap={() => {
                  setIsWorkbenchOpen(false);
                  setActiveTab('graph');
                }}
                onSelectQuestion={(qId) => {
                  setSelectedNodeId(qId);
                  setIsWorkbenchOpen(false);
                  setActiveTab('graph');
                }}
                onNavigateToTab={(tab, contextId) => {
                  if (contextId) setSelectedNodeId(contextId);
                  setIsWorkbenchOpen(false);
                  setActiveTab(tab);
                }}
                onUpdateClaim={handleUpdateClaimNode}
              />
            </div>
          )}

          {activeTab === 'papers' && (
            <PapersPane
              questions={tagFilteredQuestions}
              papers={papersCatalog}
              evidenceToPaperMap={evidenceToPaperMap}
              selectedClaimId={selectedClaimId}
              openPaperIds={openPaperIds}
              activePaperId={activePaperId}
              onOpenPaper={handleOpenPaper}
              onClosePaper={handleClosePaper}
              onSelectPaperTab={handleSelectPaperTab}
              paperScrollPositions={paperScrollPositions}
              onSaveScrollPosition={handleSavePaperScrollPosition}
              paperZoomLevels={paperZoomLevels}
              onSaveZoomLevel={handleSavePaperZoomLevel}
              paperMarks={paperMarks}
              onAddMark={handleAddPaperMark}
              onAddEvidenceToClaim={handleAddEvidenceFromPaper}
              onRemoveEvidence={handleRemoveEvidenceFromClaim}
              onNavigateToClaim={(claimId) => {
                setSelectedNodeId(claimId);
                setSelectedClaimId(claimId);
                setIsWorkbenchOpen(true);
                setActiveTab('graph');
              }}
              onAddOpenProblem={handleAddOpenProblem}
              targetPassageParagraphId={targetPassageParagraphId}
              onAskAboutSelection={handleAskAboutSelection}
              onAddCustomPaper={handleAddCustomPaper}
            />
          )}

          {activeTab === 'experiments' && (
            <ExperimentsPane
              questions={tagFilteredQuestions}
              selectedNodeId={selectedNodeId}
              onlyMine={onlyMine}
              onSelectClaim={(claimId) => {
                setSelectedNodeId(claimId);
                setSelectedClaimId(claimId);
                setActiveTab('detail');
              }}
              onLinkArtifactToClaim={(artifactId, claimId) => {
                setSelectedNodeId(claimId);
                setSelectedClaimId(claimId);
                triggerHighlight(claimId);
              }}
            />
          )}

          {activeTab === 'draft' && (
            <DraftPane
              manuscript={manuscript}
              onUpdateManuscript={setManuscript}
              questions={tagFilteredQuestions}
              experiments={INITIAL_EXPERIMENTS_DATA}
              onNavigateToTab={(tab, contextId) => {
                if (contextId) {
                  setSelectedNodeId(contextId);
                  setSelectedClaimId(contextId);
                }
                setActiveTab(tab);
              }}
              onOpenPaper={(paperId) => {
                handleOpenPaper(paperId);
                setActiveTab('papers');
              }}
            />
          )}
        </main>

        {/* Resizable Examiner Dock (Placeholder) */}
        {isAssistantOpen && !isTooNarrowForAssistant && (
          <aside
            id="examiner-dock-container"
            aria-label="Examiner Dock"
            style={{ width: `${dockWidth}px` }}
            className="relative h-full border-l border-rule shrink-0 overflow-visible bg-surface"
          >
            {/* Drag Handle */}
            <div
              id="examiner-dock-drag-handle"
              onMouseDown={handleMouseDownDrag}
              onDoubleClick={handleDoubleClickResetDock}
              title="Drag to resize dock, double-click to reset (380px)"
              className="absolute top-0 bottom-0 -left-[5px] w-[10px] z-50 cursor-col-resize select-none group flex items-center justify-center"
            >
              <div
                className={`w-[1px] h-full transition-colors ${
                  isDraggingDock ? 'bg-ink' : 'bg-transparent group-hover:bg-ink-muted'
                }`}
              />
            </div>

            <ExaminerDockPlaceholder
              context={currentContext}
              onClearContext={handleClearContext}
              onCloseDock={() => setIsAssistantOpen(false)}
              onClickContextChip={handleClickContextChip}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

