import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  X,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  ArrowRight,
  Network,
  List as ListIcon,
  Search,
  Copy,
  GripVertical,
  CornerDownRight,
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote } from '../types';
import { setResearchItemDragData } from '../researchItemDrag';
import { ObsidianSurveyGraph } from './survey/ObsidianSurveyGraph';
import { SurveyGraphHUD, GraphDisplayOptions } from './survey/SurveyGraphHUD';

interface SurveyPaneProps {
  openProblems: OpenProblemNote[];
  candidateQuestions: CandidateQuestion[];
  onAddOpenProblem: (text: string, citation?: string) => void;
  onUpdateOpenProblem: (id: string, text: string, citation?: string) => void;
  onRemoveOpenProblem: (id: string) => void;
  onAddCandidateQuestion: (text?: string, linkedIds?: string[]) => void;
  onUpdateCandidateQuestion: (id: string, text: string) => void;
  onRemoveCandidateQuestion: (id: string) => void;
  onLinkProblemToCandidate: (candidateId: string, problemId: string) => void;
  onUnlinkProblemFromCandidate: (candidateId: string, problemId: string) => void;
  onPromoteCandidate: (candidate: CandidateQuestion, claimText: string) => void;
  onClusterNotes: (selectedProblemIds: string[]) => void;
}

const DEFAULT_GRAPH_OPTIONS: GraphDisplayOptions = {
  nodeScale: 1.0,
  linkThickness: 1.5,
  labelMode: 'all',
  showParticles: true,
  showStarfield: true,
  centerGravity: 0.08,
  repulsion: 1200,
  linkDistance: 130,
  isPhysicsActive: true,
  showUnresolved: true,
  showCandidates: true,
  showLinkedOnly: false,
};

export function SurveyPane({
  openProblems,
  candidateQuestions,
  onAddOpenProblem,
  onUpdateOpenProblem,
  onRemoveOpenProblem,
  onAddCandidateQuestion,
  onUpdateCandidateQuestion,
  onRemoveCandidateQuestion,
  onLinkProblemToCandidate,
  onUnlinkProblemFromCandidate,
  onPromoteCandidate,
  onClusterNotes,
}: SurveyPaneProps) {
  // View mode: 'list' (Two-column List View) or 'obsidian' (Obsidian Network Graph)
  const [viewMode, setViewMode] = useState<'list' | 'obsidian'>('list');

  // Obsidian Graph & HUD state
  const [isHUDOpen, setIsHUDOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphOptions, setGraphOptions] = useState<GraphDisplayOptions>(DEFAULT_GRAPH_OPTIONS);

  // Selection & dynamic cross-highlighting state
  const [selectedNode, setSelectedNode] = useState<{
    type: 'problem' | 'candidate';
    id: string;
  } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    type: 'problem' | 'candidate';
    id: string;
  } | null>(null);
  const [flashHighlightId, setFlashHighlightId] = useState<string | null>(null);

  // Filters for List View
  const [noteFilter, setNoteFilter] = useState<'all' | 'unassigned' | 'multi'>('all');

  // Drag-and-drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);

  // Copied feedback toast
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Dropdown state for assigning candidates per note
  const [openAssignDropdownId, setOpenAssignDropdownId] = useState<string | null>(null);
  const assignDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(event.target as Node)) {
        setOpenAssignDropdownId(null);
      }
    };
    if (openAssignDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openAssignDropdownId]);

  // Modals & form state
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [editingProblem, setEditingProblem] = useState<OpenProblemNote | null>(null);
  const [problemText, setProblemText] = useState('');
  const [problemSource, setProblemSource] = useState('');

  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateQuestion | null>(null);
  const [candidateText, setCandidateText] = useState('');
  const [selectedNotesForNewCandidate, setSelectedNotesForNewCandidate] = useState<string[]>([]);

  const [promotingCandidate, setPromotingCandidate] = useState<CandidateQuestion | null>(null);
  const [promoteClaimText, setPromoteClaimText] = useState('');
  const [box1Checked, setBox1Checked] = useState(false);
  const [box2Checked, setBox2Checked] = useState(false);

  // Derive unassigned / unresolved count
  const getAssignedCandidateIds = (problemId: string): string[] => {
    return candidateQuestions
      .filter((candidate) => candidate.openProblemIds.includes(problemId))
      .map((candidate) => candidate.id);
  };

  const linkedProblemIds = useMemo(
    () => new Set(candidateQuestions.flatMap((candidate) => candidate.openProblemIds)),
    [candidateQuestions]
  );
  const unresolvedProblems = useMemo(
    () => openProblems.filter((problem) => !linkedProblemIds.has(problem.id)),
    [openProblems, linkedProblemIds]
  );
  const isFifteenNoteStop = unresolvedProblems.length >= 15 && candidateQuestions.length < 3;

  // Sorting rule for Left Column:
  // "Sort order: all unassigned rows first, then 2 candidates, then 1 candidate. Do not sort by date or relevance."
  const sortedNotes = useMemo(() => {
    return [...openProblems].sort((a, b) => {
      const countA = getAssignedCandidateIds(a.id).length;
      const countB = getAssignedCandidateIds(b.id).length;

      const rankA = countA === 0 ? 0 : countA >= 2 ? 1 : 2;
      const rankB = countB === 0 ? 0 : countB >= 2 ? 1 : 2;

      if (rankA !== rankB) return rankA - rankB;
      if (rankA === 1 && countA !== countB) return countB - countA;
      return 0;
    });
  }, [openProblems, candidateQuestions]);

  // Filtered Notes based on search & filter tab
  const filteredNotes = useMemo(() => {
    return sortedNotes.filter((note) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = note.text.toLowerCase().includes(q);
        const matchCitation = note.citation ? note.citation.toLowerCase().includes(q) : false;
        if (!matchText && !matchCitation) return false;
      }

      const assignedCount = getAssignedCandidateIds(note.id).length;
      if (noteFilter === 'unassigned') return assignedCount === 0;
      if (noteFilter === 'multi') return assignedCount >= 2;
      return true;
    });
  }, [sortedNotes, searchQuery, noteFilter, candidateQuestions]);

  // Filtered Candidate Questions based on search
  const filteredCandidates = useMemo(() => {
    return candidateQuestions.filter((candidate) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = candidate.text.toLowerCase().includes(q);
        const matchFindings = candidate.openProblemIds.some((pid) => {
          const problem = openProblems.find((p) => p.id === pid);
          return problem ? problem.text.toLowerCase().includes(q) : false;
        });
        if (!matchText && !matchFindings) return false;
      }
      return true;
    });
  }, [candidateQuestions, searchQuery, openProblems]);

  // Selection from Obsidian Graph -> Switch to List & Scroll/Flash highlight
  const handleSelectNodeFromGraph = (node: { type: 'problem' | 'candidate'; id: string } | null) => {
    if (!node) return;
    setViewMode('list');
    setSelectedNode(node);
    setFlashHighlightId(node.id);

    setTimeout(() => {
      const elementId = node.type === 'problem' ? `note-row-${node.id}` : `candidate-card-${node.id}`;
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      setFlashHighlightId(null);
    }, 3200);
  };

  // Drag and drop handlers
  const handleDragStartNote = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'copyMove';

    const note = openProblems.find((p) => p.id === noteId);
    if (note) {
      setResearchItemDragData(e.dataTransfer, {
        id: note.id,
        type: 'SURVEY',
        label: note.citation ? `"${note.text}" — ${note.citation}` : note.text,
      });
    }
  };

  const handleDragOverCandidate = (e: React.DragEvent, candidateId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverCandidateId !== candidateId) {
      setDragOverCandidateId(candidateId);
    }
  };

  const handleDragLeaveCandidate = (e: React.DragEvent, candidateId: string) => {
    if (dragOverCandidateId === candidateId) {
      setDragOverCandidateId(null);
    }
  };

  const handleDropOnCandidate = (e: React.DragEvent, candidateId: string) => {
    e.preventDefault();
    setDragOverCandidateId(null);
    const noteId = draggedNoteId || e.dataTransfer.getData('text/plain');
    if (noteId && candidateId) {
      onLinkProblemToCandidate(candidateId, noteId);
    }
    setDraggedNoteId(null);
  };

  // Copy Citation / Text handler
  const handleCopyNote = (note: OpenProblemNote) => {
    const textToCopy = note.citation ? `"${note.text}" — ${note.citation}` : note.text;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Form actions
  const handleSaveProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim()) return;
    if (editingProblem) {
      onUpdateOpenProblem(editingProblem.id, problemText.trim(), problemSource.trim() || undefined);
    } else {
      onAddOpenProblem(problemText.trim(), problemSource.trim() || undefined);
    }
    setProblemText('');
    setProblemSource('');
    setIsAddingProblem(false);
    setEditingProblem(null);
  };

  const handleOpenEditProblem = (problem: OpenProblemNote) => {
    setEditingProblem(problem);
    setProblemText(problem.text);
    setProblemSource(problem.citation || '');
    setIsAddingProblem(true);
  };

  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateText.trim()) return;
    if (editingCandidate) {
      onUpdateCandidateQuestion(editingCandidate.id, candidateText.trim());
    } else {
      onAddCandidateQuestion(candidateText.trim(), selectedNotesForNewCandidate);
    }
    setCandidateText('');
    setSelectedNotesForNewCandidate([]);
    setIsAddingCandidate(false);
    setEditingCandidate(null);
  };

  const handleOpenEditCandidate = (candidate: CandidateQuestion) => {
    setEditingCandidate(candidate);
    setCandidateText(candidate.text);
    setIsAddingCandidate(true);
  };

  const handleToggleCandidateLink = (candidateId: string, problemId: string) => {
    const candidate = candidateQuestions.find((c) => c.id === candidateId);
    if (!candidate) return;
    if (candidate.openProblemIds.includes(problemId)) {
      onUnlinkProblemFromCandidate(candidateId, problemId);
    } else {
      onLinkProblemToCandidate(candidateId, problemId);
    }
  };

  const handleOpenPromote = (candidate: CandidateQuestion) => {
    setPromotingCandidate(candidate);
    setPromoteClaimText('');
    setBox1Checked(false);
    setBox2Checked(false);
  };

  const handleConfirmPromote = () => {
    if (!promotingCandidate || !promoteClaimText.trim() || !box1Checked || !box2Checked) return;
    onPromoteCandidate(promotingCandidate, promoteClaimText.trim());
    setPromotingCandidate(null);
    setSelectedNode(null);
  };

  // Cross-column connection helpers
  const activeHoverOrSelectProblemId =
    (hoveredNode?.type === 'problem' && hoveredNode.id) ||
    (selectedNode?.type === 'problem' && selectedNode.id) ||
    null;

  const activeHoverOrSelectCandidateId =
    (hoveredNode?.type === 'candidate' && hoveredNode.id) ||
    (selectedNode?.type === 'candidate' && selectedNode.id) ||
    null;

  const connectedCandidateIds = useMemo(() => {
    if (!activeHoverOrSelectProblemId) return new Set<string>();
    return new Set(getAssignedCandidateIds(activeHoverOrSelectProblemId));
  }, [activeHoverOrSelectProblemId, candidateQuestions]);

  const connectedProblemIds = useMemo(() => {
    if (!activeHoverOrSelectCandidateId) return new Set<string>();
    const cand = candidateQuestions.find((c) => c.id === activeHoverOrSelectCandidateId);
    return new Set(cand ? cand.openProblemIds : []);
  }, [activeHoverOrSelectCandidateId, candidateQuestions]);

  return (
    <div
      id="survey-pane-container"
      className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-[#121212] select-none"
    >
      {/* 1. TOP HEADER BAR: SURVEY BRAND, VIEW TOGGLE, ACTION CONTROLS */}
      <header
        id="survey-header-bar"
        className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#141414] px-4 z-20"
      >
        {/* Left: Section label `SURVEY` & Live count */}
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              SURVEY
            </span>
          </div>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
            {openProblems.length} {openProblems.length === 1 ? 'finding' : 'findings'} · {candidateQuestions.length}{' '}
            {candidateQuestions.length === 1 ? 'candidate' : 'candidates'}
          </span>
          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500 hidden xl:inline truncate pl-2 border-l border-stone-200 dark:border-[#262626]">
            {unresolvedProblems.length < 15
              ? `${15 - unresolvedProblems.length} unassigned findings remaining before 3 candidates required`
              : 'Adding notes stopped until 3 candidates exist'}
          </span>
        </div>

        {/* Right: View switcher (List vs Obsidian Graph), Cluster, + Note, + Candidate */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Switcher */}
          <div className="flex items-center p-0.5 rounded-[6px] bg-stone-100 dark:bg-[#1f1f1f] border border-stone-200 dark:border-[#2a2a2a]">
            <button
              id="survey-view-list-btn"
              type="button"
              onClick={() => setViewMode('list')}
              title="Two-column Dynamic List View"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#2c2c2c] text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              id="survey-view-obsidian-btn"
              type="button"
              onClick={() => setViewMode('obsidian')}
              title="Obsidian Network Graph"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'obsidian'
                  ? 'bg-white dark:bg-[#2c2c2c] text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Obsidian Graph</span>
            </button>
          </div>

          <div className="h-4 w-px bg-stone-200 dark:border-[#262626] mx-0.5" />

          {/* Cluster button */}
          <button
            id="survey-cluster-btn"
            type="button"
            onClick={() => onClusterNotes(unresolvedProblems.map((p) => p.id))}
            disabled={unresolvedProblems.length < 3}
            title={
              unresolvedProblems.length < 3
                ? 'Add at least 3 unassigned notes to cluster'
                : 'Cluster unassigned open problems'
            }
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-stone-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1c1c1c] px-2.5 py-1 text-xs font-mono text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#252525] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Cluster</span>
          </button>

          {/* + Note Button */}
          <button
            id="survey-add-note-btn"
            type="button"
            disabled={isFifteenNoteStop}
            onClick={() => {
              setEditingProblem(null);
              setProblemText('');
              setProblemSource('');
              setIsAddingProblem(true);
            }}
            title={
              isFifteenNoteStop
                ? 'Limit reached: 15 unassigned notes without 3 candidates'
                : 'Add a new open problem finding note'
            }
            className="inline-flex items-center gap-1 rounded-[5px] border border-stone-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1c1c1c] px-2.5 py-1 text-xs font-mono text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#252525] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Note</span>
          </button>

          {/* + Candidate Button */}
          <button
            id="survey-add-candidate-btn"
            type="button"
            onClick={() => {
              setEditingCandidate(null);
              setCandidateText('');
              setSelectedNotesForNewCandidate([]);
              setIsAddingCandidate(true);
            }}
            title="Add a new candidate question"
            className="inline-flex items-center gap-1 rounded-[5px] border border-stone-900 dark:border-white bg-stone-900 dark:bg-white px-2.5 py-1 text-xs font-mono font-medium text-white dark:text-stone-900 hover:opacity-90 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Candidate</span>
          </button>
        </div>
      </header>

      {/* 2. DYNAMIC SEARCH BAR */}
      <div className="h-9 border-b border-[#ececec] dark:border-[#262626] bg-stone-50/50 dark:bg-[#161616] px-4 flex items-center justify-between gap-3 shrink-0 select-none z-10">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter findings & candidates..."
            className="w-full pl-8 pr-7 py-0.5 text-xs bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-[#2a2a2a] rounded-[4px] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400 dark:text-stone-500">
          <span>Candidates:</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((idx) => {
              const filled = candidateQuestions.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full border transition-all ${
                    filled
                      ? 'bg-purple-600 border-purple-600 dark:bg-purple-400 dark:border-purple-400'
                      : 'bg-transparent border-stone-300 dark:border-stone-700'
                  }`}
                  title={`Candidate ${idx + 1} / 3`}
                />
              );
            })}
          </div>
          <span>({candidateQuestions.length}/3)</span>
        </div>
      </div>

      {/* 3. MAIN CONTENT: TWO-COLUMN LIST OR OBSIDIAN GRAPH */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* VIEW 1: DYNAMIC TWO-COLUMN LIST VIEW */}
        {viewMode === 'list' && (
          <div
            id="survey-two-columns-layout"
            className="grid grid-cols-1 md:grid-cols-2 h-full w-full divide-y md:divide-y-0 md:divide-x divide-[#ececec] dark:divide-[#262626] overflow-hidden bg-white dark:bg-[#121212]"
          >
            {/* === LEFT COLUMN: OPEN PROBLEMS === */}
            <div
              id="survey-left-column"
              className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#141414]"
            >
              <div className="h-9 flex items-center justify-between px-4 border-b border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#141414]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNoteFilter('all')}
                    className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] cursor-pointer transition-colors ${
                      noteFilter === 'all'
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    All ({openProblems.length})
                  </button>
                  <button
                    onClick={() => setNoteFilter('unassigned')}
                    className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] cursor-pointer transition-colors ${
                      noteFilter === 'unassigned'
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Unassigned ({unresolvedProblems.length})
                  </button>
                  <button
                    onClick={() => setNoteFilter('multi')}
                    className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] cursor-pointer transition-colors ${
                      noteFilter === 'multi'
                        ? 'bg-amber-600 text-white font-medium'
                        : 'text-amber-700 dark:text-amber-400 hover:underline'
                    }`}
                  >
                    Multi ({openProblems.filter((p) => getAssignedCandidateIds(p.id).length >= 2).length})
                  </button>
                </div>

                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                  {filteredNotes.length} notes
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {filteredNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-stone-200 dark:border-[#262626] rounded-[6px] text-center space-y-2">
                    <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
                      {searchQuery
                        ? `No findings matched "${searchQuery}".`
                        : 'No open problems yet. Add loose notes: what is still open here?'}
                    </p>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const assignedCandidateIds = getAssignedCandidateIds(note.id);
                    const isDropdownOpen = openAssignDropdownId === note.id;
                    const isSelected = selectedNode?.type === 'problem' && selectedNode.id === note.id;
                    const isConnectedToActiveCandidate = connectedProblemIds.has(note.id);
                    const isFlash = flashHighlightId === note.id;

                    const isDimmed = activeHoverOrSelectCandidateId && !isConnectedToActiveCandidate;

                    return (
                      <div
                        key={note.id}
                        id={`note-row-${note.id}`}
                        draggable
                        onDragStart={(e) => handleDragStartNote(e, note.id)}
                        onMouseEnter={() => setHoveredNode({ type: 'problem', id: note.id })}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => {
                          setSelectedNode(
                            selectedNode?.id === note.id ? null : { type: 'problem', id: note.id }
                          );
                        }}
                        className={`group relative w-full rounded-[8px] border p-3 flex flex-col gap-2 transition-all cursor-pointer ${
                          isDimmed ? 'opacity-30 scale-[0.99]' : 'opacity-100'
                        } ${
                          isFlash
                            ? 'ring-2 ring-amber-500 dark:ring-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border-amber-400'
                            : isSelected
                            ? 'border-2 border-[#ffb000] ring-1 ring-[#ffb000] bg-white dark:bg-[#1c1c1c]'
                            : isConnectedToActiveCandidate
                            ? 'border-[#6B4FBB] dark:border-[#BCA8F7] bg-[#F5F2FF]/60 dark:bg-[#6B4FBB]/15'
                            : 'border-stone-200 dark:border-[#262626] bg-white dark:bg-[#181818] hover:border-stone-300 dark:hover:border-[#383838]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div
                              title="Drag note to a Candidate Question"
                              className="opacity-40 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-stone-400"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            {assignedCandidateIds.length === 0 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border border-stone-200 dark:border-stone-800 text-stone-400 rounded bg-stone-50/50 dark:bg-stone-900/40">
                                unassigned
                              </span>
                            ) : assignedCandidateIds.length === 1 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border border-[#6B4FBB]/30 text-[#6B4FBB] dark:text-[#BCA8F7] rounded bg-[#F5F2FF] dark:bg-[#6B4FBB]/20">
                                1 candidate
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium border border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded">
                                {assignedCandidateIds.length} candidates
                              </span>
                            )}

                            {isConnectedToActiveCandidate && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700 rounded">
                                <CornerDownRight className="w-2.5 h-2.5" />
                                <span>assigned to selected</span>
                              </span>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleCopyNote(note)}
                              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
                              title="Copy citation"
                            >
                              {copiedId === note.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {/* Assign Dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenAssignDropdownId(isDropdownOpen ? null : note.id)
                                }
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border border-stone-200 dark:border-[#2c2c2c] rounded bg-stone-50 dark:bg-[#1a1a1a] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#252525] cursor-pointer"
                              >
                                <span>Assign</span>
                                <ChevronDown className="w-2.5 h-2.5 text-stone-400" />
                              </button>

                              {isDropdownOpen && (
                                <div
                                  ref={assignDropdownRef}
                                  className="absolute right-0 top-full mt-1 w-64 z-30 rounded-[6px] border border-stone-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1c1c1c] p-2 space-y-1 shadow-xl"
                                >
                                  <div className="font-mono text-[9px] uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100 dark:border-[#262626]">
                                    Assign to Candidate
                                  </div>
                                  {candidateQuestions.length === 0 ? (
                                    <div className="p-2 text-xs text-stone-400 font-mono">
                                      No candidate questions yet
                                    </div>
                                  ) : (
                                    <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                                      {candidateQuestions.map((candidate) => {
                                        const isAssigned = candidate.openProblemIds.includes(note.id);
                                        return (
                                          <button
                                            key={candidate.id}
                                            type="button"
                                            onClick={() =>
                                              handleToggleCandidateLink(candidate.id, note.id)
                                            }
                                            className="w-full flex items-start gap-2 p-1.5 rounded hover:bg-stone-50 dark:hover:bg-[#222222] text-left cursor-pointer"
                                          >
                                            <div
                                              className={`mt-0.5 w-3 h-3 rounded-[2px] border flex items-center justify-center shrink-0 ${
                                                isAssigned
                                                  ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900'
                                                  : 'border-stone-300 dark:border-stone-600 bg-transparent'
                                              }`}
                                            >
                                              {isAssigned && <Check className="w-2 h-2 stroke-[3]" />}
                                            </div>
                                            <span className="text-xs text-stone-800 dark:text-stone-200 leading-snug line-clamp-2">
                                              {candidate.text}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditProblem(note)}
                              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
                              title="Edit note"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onRemoveOpenProblem(note.id)}
                              className="p-1 text-stone-400 hover:text-rose-500 rounded cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[13px] leading-relaxed text-stone-900 dark:text-stone-100 font-normal">
                          {note.text}
                        </div>

                        {note.citation && (
                          <div className="font-mono text-[11px] text-stone-400 dark:text-stone-500 pt-0.5 border-t border-stone-100 dark:border-[#222222]">
                            {note.citation}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* === RIGHT COLUMN: CANDIDATE QUESTIONS === */}
            <div
              id="survey-right-column"
              className="flex flex-col h-full overflow-hidden bg-[#fbfbfb] dark:bg-[#161616]"
            >
              <div className="h-9 flex items-center justify-between px-4 border-b border-[#ececec] dark:border-[#262626] bg-[#fbfbfb] dark:bg-[#161616]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2C5EA8] dark:bg-[#7DB4F8]" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2C5EA8] dark:text-[#7DB4F8]">
                    Candidate Questions
                  </span>
                </div>
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                  {filteredCandidates.length} candidates
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {filteredCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-stone-200 dark:border-[#262626] rounded-[6px] text-center space-y-2">
                    <p className="font-mono text-xs text-stone-400 dark:text-stone-500">
                      {searchQuery
                        ? `No candidate questions matched "${searchQuery}".`
                        : 'No candidate questions yet. Group notes that seem to ask the same thing.'}
                    </p>
                  </div>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const assignedFindings = candidate.openProblemIds
                      .map((id) => openProblems.find((p) => p.id === id))
                      .filter((p): p is OpenProblemNote => Boolean(p));

                    const isSelected = selectedNode?.type === 'candidate' && selectedNode.id === candidate.id;
                    const isConnectedToActiveNote = connectedCandidateIds.has(candidate.id);
                    const isDragOver = dragOverCandidateId === candidate.id;
                    const isFlash = flashHighlightId === candidate.id;

                    const isDimmed = activeHoverOrSelectProblemId && !isConnectedToActiveNote;

                    return (
                      <div
                        key={candidate.id}
                        id={`candidate-card-${candidate.id}`}
                        draggable
                        onDragStart={(e) => {
                          setResearchItemDragData(e.dataTransfer, {
                            id: candidate.id,
                            type: 'SURVEY',
                            label: candidate.text,
                          });
                        }}
                        onDragOver={(e) => handleDragOverCandidate(e, candidate.id)}
                        onDragLeave={(e) => handleDragLeaveCandidate(e, candidate.id)}
                        onDrop={(e) => handleDropOnCandidate(e, candidate.id)}
                        onMouseEnter={() => setHoveredNode({ type: 'candidate', id: candidate.id })}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => {
                          setSelectedNode(
                            selectedNode?.id === candidate.id ? null : { type: 'candidate', id: candidate.id }
                          );
                        }}
                        className={`group/cand relative rounded-[8px] p-4 border transition-all cursor-pointer ${
                          isDimmed ? 'opacity-30 scale-[0.99]' : 'opacity-100'
                        } ${
                          isDragOver
                            ? 'border-2 border-dashed border-[#2C5EA8] dark:border-[#7DB4F8] bg-blue-50/40 dark:bg-blue-950/20'
                            : isFlash
                            ? 'ring-2 ring-amber-500 dark:ring-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border-amber-400'
                            : isSelected
                            ? 'border-2 border-[#ffb000] ring-1 ring-[#ffb000] bg-white dark:bg-[#1c1c1c]'
                            : isConnectedToActiveNote
                            ? 'border-[#2C5EA8] dark:border-[#7DB4F8] bg-[#F0F6FF]/60 dark:bg-[#2C5EA8]/15'
                            : 'border-stone-200 dark:border-[#2a2a2a] bg-white dark:bg-[#181818] hover:border-stone-300 dark:hover:border-[#383838]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            <div
                              title="Drag candidate to Assistant panel"
                              className="opacity-40 group-hover/cand:opacity-100 cursor-grab active:cursor-grabbing text-stone-400 mt-0.5"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-[14px] font-medium text-stone-900 dark:text-stone-100 leading-snug flex-1">
                              {candidate.text}
                            </h3>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenPromote(candidate)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium rounded border border-stone-300 dark:border-[#3a3a3a] bg-stone-50 dark:bg-[#222222] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2c2c2c] transition-colors"
                            >
                              <span>Promote</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCandidate(candidate)}
                              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                              title="Edit question"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveCandidateQuestion(candidate.id)}
                              className="p-1 text-stone-400 hover:text-rose-500 rounded"
                              title="Delete candidate"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Grouped findings */}
                        <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-[#222222]">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                            Findings ({assignedFindings.length})
                          </div>
                          {assignedFindings.length === 0 ? (
                            <p className="text-xs font-mono text-stone-400 dark:text-stone-600 italic py-0.5">
                              Drop notes here to link
                            </p>
                          ) : (
                            assignedFindings.map((finding) => (
                              <div
                                key={finding.id}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleDragStartNote(e, finding.id);
                                }}
                                className="flex items-start justify-between gap-2 p-2 rounded bg-stone-50 dark:bg-[#141414] border border-stone-200/60 dark:border-[#222222] text-xs group/item cursor-grab active:cursor-grabbing"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-stone-800 dark:text-stone-200 leading-snug">
                                    {finding.text}
                                  </p>
                                  {finding.citation && (
                                    <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 block truncate">
                                      {finding.citation}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUnlinkProblemFromCandidate(candidate.id, finding.id);
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-0.5 text-stone-400 hover:text-rose-500 rounded transition-opacity"
                                  title="Unlink finding"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: OBSIDIAN NETWORK GRAPH CANVAS */}
        {viewMode === 'obsidian' && (
          <div className="relative w-full h-full">
            {/* Interactive Obsidian HUD */}
            <SurveyGraphHUD
              isOpen={isHUDOpen}
              onToggleOpen={() => setIsHUDOpen(!isHUDOpen)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              options={graphOptions}
              onOptionsChange={setGraphOptions}
              onResetForces={() => {
                setGraphOptions((prev) => ({
                  ...prev,
                  repulsion: 1200,
                  linkDistance: 130,
                  centerGravity: 0.08,
                }));
              }}
              totalNotes={openProblems.length}
              candidateCount={candidateQuestions.length}
              unresolvedCount={unresolvedProblems.length}
            />

            {/* Obsidian 2D Canvas */}
            <ObsidianSurveyGraph
              openProblems={openProblems}
              candidateQuestions={candidateQuestions}
              selectedNodeId={selectedNode ? selectedNode.id : null}
              onSelectNode={handleSelectNodeFromGraph}
              onLinkProblemToCandidate={onLinkProblemToCandidate}
              onQuickAddProblem={() => {
                setEditingProblem(null);
                setProblemText('');
                setProblemSource('');
                setIsAddingProblem(true);
              }}
              searchQuery={searchQuery}
              options={graphOptions}
              onOptionsChange={setGraphOptions}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT OPEN PROBLEM                            */}
      {/* ========================================================= */}
      {isAddingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[8px] bg-white dark:bg-[#1c1c1c] border border-stone-200 dark:border-[#2e2e2e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  {editingProblem ? 'Edit Open Problem' : 'New Open Problem'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingProblem(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  What is still open here? *
                </label>
                <textarea
                  required
                  rows={3}
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="e.g. On-device INT4 quantization degrades attention map sparsity unpredictably across transformer layers."
                  className="w-full text-xs p-2.5 rounded-[6px] border border-stone-200 dark:border-[#2e2e2e] bg-stone-50 dark:bg-[#141414] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Source / Citation
                </label>
                <input
                  type="text"
                  value={problemSource}
                  onChange={(e) => setProblemSource(e.target.value)}
                  placeholder="e.g. Lin et al. 2023, MLSys"
                  className="w-full text-xs p-2 rounded-[6px] border border-stone-200 dark:border-[#2e2e2e] bg-stone-50 dark:bg-[#141414] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProblem(false)}
                  className="px-3 py-1.5 text-xs font-mono rounded-[5px] border border-stone-200 dark:border-[#2e2e2e] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-[#252525]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-mono rounded-[5px] bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium hover:opacity-90"
                >
                  {editingProblem ? 'Save changes' : 'Add note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CANDIDATE QUESTION                      */}
      {/* ========================================================= */}
      {isAddingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[8px] bg-white dark:bg-[#1c1c1c] border border-stone-200 dark:border-[#2e2e2e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2C5EA8] dark:bg-[#7DB4F8]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  {editingCandidate ? 'Edit Candidate Question' : 'New Candidate Question'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCandidate(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Candidate Question Text *
                </label>
                <textarea
                  required
                  rows={3}
                  value={candidateText}
                  onChange={(e) => setCandidateText(e.target.value)}
                  placeholder="e.g. Are TinyML latency numbers comparable across devices?"
                  className="w-full text-xs p-2.5 rounded-[6px] border border-stone-200 dark:border-[#2e2e2e] bg-stone-50 dark:bg-[#141414] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 leading-relaxed"
                />
              </div>

              {!editingCandidate && openProblems.length > 0 && (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Attach Open Problems (Optional)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-[6px] border border-stone-200 dark:border-[#2e2e2e] bg-stone-50 dark:bg-[#141414]">
                    {openProblems.map((prob) => {
                      const isChecked = selectedNotesForNewCandidate.includes(prob.id);
                      return (
                        <button
                          key={prob.id}
                          type="button"
                          onClick={() => {
                            setSelectedNotesForNewCandidate((prev) =>
                              isChecked ? prev.filter((id) => id !== prob.id) : [...prev, prob.id]
                            );
                          }}
                          className="w-full flex items-start gap-2 p-1.5 rounded hover:bg-stone-200/50 dark:hover:bg-[#202020] text-left cursor-pointer transition-colors"
                        >
                          <div
                            className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white text-white dark:text-stone-900'
                                : 'border-stone-300 dark:border-stone-600 bg-transparent'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs text-stone-800 dark:text-stone-200 leading-snug line-clamp-2">
                            {prob.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCandidate(false)}
                  className="px-3 py-1.5 text-xs font-mono rounded-[5px] border border-stone-200 dark:border-[#2e2e2e] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-[#252525]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-mono rounded-[5px] bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium hover:opacity-90"
                >
                  {editingCandidate ? 'Save changes' : 'Create candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PROMOTE CANDIDATE TO QUESTION                      */}
      {/* ========================================================= */}
      {promotingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[8px] bg-white dark:bg-[#1c1c1c] border border-stone-200 dark:border-[#2e2e2e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb000]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Promote to Research Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPromotingCandidate(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-[6px] bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#262626]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                Candidate Question
              </span>
              <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                {promotingCandidate.text}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Your Initial Claim answering this question *
                </label>
                <textarea
                  required
                  rows={3}
                  value={promoteClaimText}
                  onChange={(e) => setPromoteClaimText(e.target.value)}
                  placeholder="State the assertion that answers this question..."
                  className="w-full text-xs p-2.5 rounded-[6px] border border-stone-200 dark:border-[#2e2e2e] bg-stone-50 dark:bg-[#141414] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 leading-relaxed"
                />
              </div>

              {/* Epistemic Verification Checkboxes (AGENTS.md mandatory rule) */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-[#262626]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={box1Checked}
                    onChange={(e) => setBox1Checked(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-0"
                  />
                  <span className="text-xs text-stone-700 dark:text-stone-300 leading-snug">
                    This claim could be false (it is falsifiable, not a trivial definition).
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={box2Checked}
                    onChange={(e) => setBox2Checked(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-0"
                  />
                  <span className="text-xs text-stone-700 dark:text-stone-300 leading-snug">
                    This claim could be settled within a year (the scope is bounded).
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-[#262626]">
              <span className="text-[10px] font-mono text-stone-400">
                Promotion is one-way.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromotingCandidate(null)}
                  className="px-3 py-1.5 text-xs font-mono rounded-[5px] border border-stone-200 dark:border-[#2e2e2e] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-[#252525]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!promoteClaimText.trim() || !box1Checked || !box2Checked}
                  onClick={handleConfirmPromote}
                  className="px-3 py-1.5 text-xs font-mono rounded-[5px] bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium disabled:opacity-40 hover:opacity-90"
                >
                  Promote to Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
