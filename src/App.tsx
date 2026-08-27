import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  QuestionNode,
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
} from './types';
import { GraphPane } from './components/GraphPane';
import { CheckPane } from './components/CheckPane';
import { GraphCanvas } from './components/GraphCanvas';
import { PapersPane } from './components/PapersPane';
import { ExperimentsPane } from './components/ExperimentsPane';
import { SurveyPane } from './components/SurveyPane';
import { AssistantDock } from './components/AssistantDock';
import {
  createClaim,
  createEvidence,
  EvidenceDraft,
} from './graphEdits';
import type { AssistantErrorResponse, AssistantResponse } from './assistantApi';
import type { DraggableResearchItem } from './researchItemDrag';
import type { WorkspaceErrorResponse, WorkspaceResponse } from './workspaceApi';
import {
  PanelRightClose,
  PanelRightOpen,
  PanelRight,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  // App-level Navigation & Selection State
  const [activeTab, setActiveTab] = useState<AppTab>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionNode[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEvidenceKind, setEditingEvidenceKind] = useState<EvidenceKind | undefined>();

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
    setEditingNodeId(null);
    setEditingEvidenceKind(undefined);
    triggerHighlight(claimId);
  };

  // Synchronize selectedQuestionId when selectedNodeId changes to a question
  const handleSelectQuestion = (questionId: string) => {
    setSelectedNodeId(questionId);
    const question = questionsData.find((item) => item.id === questionId);
    setSelectedClaimId(question?.claims[0]?.id || null);
    setEditingNodeId(null);
    setEditingEvidenceKind(undefined);
    triggerHighlight(questionId);
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
      setEditingNodeId(null);
      setEditingEvidenceKind(undefined);
      triggerHighlight(node.id);
      setActiveTab('detail');
      return;
    }

    if (node.type === 'CLAIM') {
      const claimId = node.claimId || node.id;
      setSelectedClaimId(claimId);
      triggerHighlight(claimId);
      setActiveTab('detail');
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
      triggerHighlight(parentClaimId);
      setActiveTab('detail');
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
  const handlePromoteCandidate = (candidate: CandidateQuestion, claimText: string) => {
    const newQuestionId = `q-${Date.now()}`;
    const newClaimId = `c-${Date.now()}`;

    // Inherit active project tag (or default to tinyml if 'all')
    const inheritedTags = selectedTag !== 'all' ? [selectedTag] : ['tinyml'];

    // Collect linked open problems as preliminary weak evidence
    const linkedProblems = candidate.openProblemIds
      .map((pid) => openProblems.find((p) => p.id === pid))
      .filter((p): p is OpenProblemNote => !!p);

    const newEvidenceItems = linkedProblems.map((prob, idx) => ({
      id: `ev-promoted-${Date.now()}-${idx}`,
      kind: 'paper' as const,
      typeLabel: 'PAPER',
      title: prob.text,
      citation: prob.citation || 'Survey open problem',
    }));

    const newQuestion: QuestionNode = {
      id: newQuestionId,
      type: 'QUESTION',
      text: candidate.text,
      tags: inheritedTags,
      claims: [
        {
          id: newClaimId,
          type: 'CLAIM',
          text: claimText,
          linkStatus: 'weak',
          evidence: newEvidenceItems,
          check: {
            tag: 'TYPE MISMATCH',
            tagColor: 'amber',
            reasonText: 'Promoted candidate hypothesis from discovery survey.',
            explanation:
              'Claim formulated from open problem survey. Evidence items attached as initial weak observational references.',
            checks: [
              {
                label: 'Type',
                status: 'mismatch',
                detail: 'Observational open problem references',
              },
              {
                label: 'Scope',
                status: 'partial',
                detail: 'Survey open problems scope',
              },
              {
                label: 'Target',
                status: 'aligned',
                detail: 'Direct target from candidate question',
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

    // 4. Switch to Detail Tab with new Claim selected
    setSelectedNodeId(newClaimId);
    setSelectedClaimId(newClaimId);
    setActiveTab('detail');
    triggerHighlight(newClaimId);
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
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#fcfcfc] dark:bg-[#121212] text-[#1a1a1a] dark:text-[#ededed] font-sans transition-colors duration-150">
      {/* Top Header Bar: Minimal Text Tabs on Top-Left + Tag Filter + Action Controls on Right */}
      <header
        id="app-top-header"
        className="h-11 px-6 border-b border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#181818] flex items-center justify-between shrink-0 z-30 transition-colors"
      >
        {/* Minimal text tabs (top-left: Graph | Survey | Detail | Papers | Experiments) */}
        <nav aria-label="Main Views" className="flex items-center gap-5 sm:gap-6">
          <button
            id="tab-graph-btn"
            onClick={() => setActiveTab('graph')}
            className={`text-[13px] font-medium transition-colors cursor-pointer py-2.5 ${
              activeTab === 'graph'
                ? 'text-[#1a1a1a] dark:text-white font-semibold border-b-2 border-[#1a1a1a] dark:border-white'
                : 'text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-[#eee] border-b-2 border-transparent'
            }`}
          >
            Graph
          </button>
          <button
            id="tab-survey-btn"
            onClick={() => setActiveTab('survey')}
            className={`text-[13px] font-medium transition-colors cursor-pointer py-2.5 ${
              activeTab === 'survey'
                ? 'text-[#1a1a1a] dark:text-white font-semibold border-b-2 border-[#1a1a1a] dark:border-white'
                : 'text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-[#eee] border-b-2 border-transparent'
            }`}
          >
            Survey
          </button>
          <button
            id="tab-detail-btn"
            onClick={() => setActiveTab('detail')}
            className={`text-[13px] font-medium transition-colors cursor-pointer py-2.5 ${
              activeTab === 'detail'
                ? 'text-[#1a1a1a] dark:text-white font-semibold border-b-2 border-[#1a1a1a] dark:border-white'
                : 'text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-[#eee] border-b-2 border-transparent'
            }`}
          >
            Detail
          </button>
          <button
            id="tab-papers-btn"
            onClick={() => setActiveTab('papers')}
            className={`text-[13px] font-medium transition-colors cursor-pointer py-2.5 ${
              activeTab === 'papers'
                ? 'text-[#1a1a1a] dark:text-white font-semibold border-b-2 border-[#1a1a1a] dark:border-white'
                : 'text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-[#eee] border-b-2 border-transparent'
            }`}
          >
            Papers
          </button>
          <button
            id="tab-experiments-btn"
            onClick={() => setActiveTab('experiments')}
            className={`text-[13px] font-medium transition-colors cursor-pointer py-2.5 ${
              activeTab === 'experiments'
                ? 'text-[#1a1a1a] dark:text-white font-semibold border-b-2 border-[#1a1a1a] dark:border-white'
                : 'text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-[#eee] border-b-2 border-transparent'
            }`}
          >
            Experiments
          </button>
        </nav>

        {/* Right-aligned context & panel controls */}
        <div className="flex items-center gap-2.5">
          <span
            className="max-w-48 truncate font-mono text-[10px] text-[#999] dark:text-[#777]"
            title={workspacePath}
          >
            {workspacePath}
          </span>

          {/* Note when window is too narrow for assistant */}
          {isTooNarrowForAssistant && (
            <span
              id="assistant-narrow-warning-label"
              className="text-[11px] text-[#888] dark:text-[#777] italic"
            >
              Assistant hidden - window too narrow
            </span>
          )}

          {/* PROJECT TAG FILTER: Left of Dark Toggle */}
          <div className="flex items-center gap-1.5">
            <select
              id="tag-filter-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              aria-label="Filter by project tag"
              className="bg-white dark:bg-[#222222] border border-[#ececec] dark:border-[#2e2e2e] text-[#1a1a1a] dark:text-[#dedede] text-[12px] font-medium rounded px-2.5 py-1 focus:outline-hidden cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <option value="all">All projects</option>
              {allTagsInUse.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Detail Tab Check panel collapse control */}
          {activeTab === 'detail' && (
            <button
              id="toggle-check-pane-btn"
              onClick={() => setIsCheckCollapsed(!isCheckCollapsed)}
              title={
                isCheckCollapsed
                  ? 'Show check inspector'
                  : 'Collapse check inspector'
              }
              aria-label={
                isCheckCollapsed
                  ? 'Show check inspector'
                  : 'Collapse check inspector'
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#ececec] dark:border-[#2e2e2e] bg-white dark:bg-[#222222] text-[#6b6b6b] dark:text-[#a0a0a0] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#f0f0f0] dark:hover:bg-[#2c2c2c] hover:text-[#1a1a1a] dark:hover:text-white transition-all cursor-pointer"
            >
              {isCheckCollapsed ? (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>Show check</span>
                </>
              ) : (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#ececec] dark:border-[#2e2e2e] bg-white dark:bg-[#222222] text-[#6b6b6b] dark:text-[#a0a0a0] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#f0f0f0] dark:hover:bg-[#2c2c2c] hover:text-[#1a1a1a] dark:hover:text-white transition-all cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Assistant Dock Toggle: right-aligned, next to Dark toggle */}
          <button
            id="toggle-assistant-dock-btn"
            onClick={() => {
              if (isTooNarrowForAssistant) return;
              setIsAssistantOpen(!isAssistantOpen);
            }}
            disabled={isTooNarrowForAssistant}
            title={
              isTooNarrowForAssistant
                ? 'Window too narrow for assistant'
                : `Toggle Assistant Dock (${typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘J' : 'Ctrl+J'})`
            }
            aria-label="Toggle Assistant Dock"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all cursor-pointer text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
              isTooNarrowForAssistant
                ? 'opacity-40 cursor-not-allowed bg-[#f5f5f5] dark:bg-[#222222] text-[#888] dark:text-[#666] border-[#ececec] dark:border-[#2e2e2e]'
                : isAssistantOpen
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white'
                : 'bg-white dark:bg-[#222222] text-[#6b6b6b] dark:text-[#a0a0a0] border-[#ececec] dark:border-[#2e2e2e] hover:bg-[#f0f0f0] dark:hover:bg-[#2c2c2c] hover:text-[#1a1a1a] dark:hover:text-white'
            }`}
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>
        </div>
      </header>

      {/* Thin Bar under top bar when tag filter is active */}
      {selectedTag !== 'all' && (
        <div
          id="active-tag-banner"
          className="h-7 px-6 bg-[#f7f7f7] dark:bg-[#181818] border-b border-[#ececec] dark:border-[#262626] flex items-center justify-between text-[12px] text-[#666] dark:text-[#aaa] shrink-0"
        >
          <div>
            Showing: <span className="font-semibold text-[#1a1a1a] dark:text-white">{selectedTag}</span> —{' '}
            {tagFilteredQuestions.length}{' '}
            {tagFilteredQuestions.length === 1 ? 'question' : 'questions'}.
          </div>
          <button
            onClick={() => setSelectedTag('all')}
            className="font-medium text-[#1a1a1a] dark:text-white underline hover:no-underline cursor-pointer ml-3"
          >
            [Show all]
          </button>
        </div>
      )}

      {/* Main View Area: Tab Content Resizes beside Dock (No Overlay) */}
      <div
        className={`flex-1 flex w-full ${
          selectedTag !== 'all' ? 'h-[calc(100vh-4.5rem)]' : 'h-[calc(100vh-2.75rem)]'
        } overflow-hidden bg-[#fcfcfc] dark:bg-[#121212] ${
          isDraggingDock ? 'select-none' : ''
        }`}
      >
        {/* Tab Content Container */}
        <main className="flex-1 h-full overflow-hidden min-w-0">
          {activeTab === 'graph' && (
            <GraphCanvas
              questions={tagFilteredQuestions}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNodeFromGraph}
              filter={filter}
              onFilterChange={setFilter}
            />
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
            />
          )}

          {activeTab === 'detail' && (
            <div className="flex h-full w-full">
              {/* Column 1: Left Pane — Graph Tree */}
              <section
                aria-label="Epistemic Graph"
                className={`h-full transition-[width] duration-200 ease-in-out border-r border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#141414] overflow-hidden ${
                  isCheckCollapsed ? 'w-full' : 'w-1/2'
                }`}
              >
                <GraphPane
                  questions={tagFilteredQuestions}
                  selectedNodeId={selectedNodeId}
                  selectedClaimId={selectedClaimId}
                  selectedQuestionId={selectedQuestion?.id}
                  editingNodeId={editingNodeId}
                  editingEvidenceKind={editingEvidenceKind}
                  onSelectClaim={handleSelectClaim}
                  onSelectQuestion={handleSelectQuestion}
                  onToggleEdit={handleToggleEditNode}
                  onUpdateQuestion={handleUpdateQuestion}
                  onAddClaim={handleAddClaimToQuestion}
                  onUpdateClaim={handleUpdateClaim}
                  onAddEvidence={handleAddEvidence}
                  highlightedNodeId={highlightedNodeId}
                />
              </section>

              {/* Column 2: Middle Pane — Check Panel */}
              {!isCheckCollapsed && (
                <section
                  aria-label="Claim Evidence Check Panel"
                  className="h-full w-1/2 transition-[width] duration-200 ease-in-out bg-[#f9f9f9] dark:bg-[#181818] overflow-hidden"
                >
                  <CheckPane
                    claim={selectedClaim}
                    selectedQuestion={selectedQuestion}
                    onRejectClaim={handleRejectClaim}
                    onEditClaim={handleEditClaim}
                    onReset={handleReset}
                  />
                </section>
              )}
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
              onAddOpenProblem={handleAddOpenProblem}
              targetPassageParagraphId={targetPassageParagraphId}
              onAskAboutSelection={handleAskAboutSelection}
            />
          )}

          {activeTab === 'experiments' && (
            <ExperimentsPane
              questions={tagFilteredQuestions}
              selectedNodeId={selectedNodeId}
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
        </main>

        {/* Global Assistant Dock: Resizable right-hand panel, available on every tab */}
        {isAssistantOpen && !isTooNarrowForAssistant && (
          <aside
            id="global-assistant-dock-container"
            aria-label="Global Assistant Dock"
            style={{ width: `${dockWidth}px` }}
            className="relative h-full border-l border-[#ececec] dark:border-[#262626] shrink-0 overflow-visible bg-white dark:bg-[#181818]"
          >
            {/* Drag Handle: 10px hit area, 1px visible line on hover / drag, col-resize cursor */}
            <div
              id="assistant-dock-drag-handle"
              onMouseDown={handleMouseDownDrag}
              onDoubleClick={handleDoubleClickResetDock}
              title="Drag to resize dock, double-click to reset (380px)"
              className="absolute top-0 bottom-0 -left-[5px] w-[10px] z-50 cursor-col-resize select-none group flex items-center justify-center"
            >
              <div
                className={`w-[1px] h-full transition-colors ${
                  isDraggingDock
                    ? 'bg-[#888] dark:bg-[#777]'
                    : 'bg-transparent group-hover:bg-[#888] dark:group-hover:bg-[#777]'
                }`}
              />
            </div>

            <AssistantDock
              dockWidth={dockWidth}
              context={currentContext}
              activeThread={activeThread}
              allThreads={allThreadsList}
              onSelectThread={setActiveThreadId}
              onCreateNewThread={handleCreateNewThread}
              onSendMessage={handleAssistantSendMessage}
              isResponding={isAssistantResponding}
              onUndoEdit={handleUndoEdit}
              onAcceptProposal={handleAcceptProposal}
              onRejectProposal={handleRejectProposal}
              onClearContext={handleClearContext}
              onClickContextChip={handleClickContextChip}
              onCloseDock={() => setIsAssistantOpen(false)}
              quotedSnippet={assistantQuotedSnippet}
              onClearQuotedSnippet={() => setAssistantQuotedSnippet(null)}
              onDropResearchItem={handleDropResearchItem}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
