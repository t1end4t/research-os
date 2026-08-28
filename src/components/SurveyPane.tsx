import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CircleDotDashed,
  Edit2,
  HelpCircle,
  Link2,
  Network,
  Plus,
  Sparkles,
  Trash2,
  Unlink,
  X,
  Layers,
  Compass,
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote } from '../types';
import {
  getSurveyFieldSize,
  getSurveyOrbitPosition,
  SURVEY_NOTE_HEIGHT,
  SURVEY_NOTE_WIDTH,
} from '../surveyLayout';
import {
  ObsidianSurveyGraph,
} from './survey/ObsidianSurveyGraph';
import {
  SurveyGraphHUD,
  GraphDisplayOptions,
} from './survey/SurveyGraphHUD';
import {
  SurveyNodeInspector,
} from './survey/SurveyNodeInspector';

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
  // View mode: 'obsidian' (Obsidian Network Graph) or 'orbit' (Classic Orbit Field)
  const [viewMode, setViewMode] = useState<'obsidian' | 'orbit'>('obsidian');

  // Obsidian Graph state
  const [isHUDOpen, setIsHUDOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphOptions, setGraphOptions] = useState<GraphDisplayOptions>(DEFAULT_GRAPH_OPTIONS);
  const [selectedGraphNode, setSelectedGraphNode] = useState<{
    type: 'problem' | 'candidate';
    id: string;
  } | null>(null);

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

  // Multi-selection state for classic clustering
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Modals and create forms
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [newProblemText, setNewProblemText] = useState('');
  const [newProblemSource, setNewProblemSource] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [newCandidateText, setNewCandidateText] = useState('');
  const [promotingCandidate, setPromotingCandidate] = useState<CandidateQuestion | null>(null);
  const [promoteClaimText, setPromoteClaimText] = useState('');
  const [box1Checked, setBox1Checked] = useState(false);
  const [box2Checked, setBox2Checked] = useState(false);
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);

  // Orbit editing state
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editProblemText, setEditProblemText] = useState('');
  const [editProblemSource, setEditProblemSource] = useState('');
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editCandidateText, setEditCandidateText] = useState('');

  const sortedProblems = [...openProblems].sort((a, b) => b.createdAt - a.createdAt);
  const linkedProblemIds = new Set(candidateQuestions.flatMap((candidate) => candidate.openProblemIds));
  const unresolvedProblems = sortedProblems.filter((problem) => !linkedProblemIds.has(problem.id));
  const selectedUnresolvedIds = selectedProblemIds.filter((id) =>
    unresolvedProblems.some((problem) => problem.id === id)
  );
  const isFifteenNoteStop = unresolvedProblems.length >= 15 && candidateQuestions.length < 3;

  // Compute matched count for search
  const query = searchQuery.trim().toLowerCase();
  const matchedCount = query
    ? openProblems.filter((p) => p.text.toLowerCase().includes(query)).length +
      candidateQuestions.filter((c) => c.text.toLowerCase().includes(query)).length
    : undefined;

  // Inspector selected node data
  const inspectorNode = selectedGraphNode
    ? selectedGraphNode.type === 'problem'
      ? (() => {
          const problem = openProblems.find((p) => p.id === selectedGraphNode.id);
          if (!problem) return null;
          const candidate = candidateQuestions.find((c) => c.openProblemIds.includes(problem.id));
          return { type: 'problem' as const, problem, linkedCandidate: candidate };
        })()
      : (() => {
          const candidate = candidateQuestions.find((c) => c.id === selectedGraphNode.id);
          if (!candidate) return null;
          const linked = candidate.openProblemIds
            .map((id) => openProblems.find((p) => p.id === id))
            .filter((p): p is OpenProblemNote => Boolean(p));
          return { type: 'candidate' as const, candidate, linkedProblems: linked };
        })()
    : null;

  const handleCreateProblem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProblemText.trim()) return;
    onAddOpenProblem(newProblemText.trim(), newProblemSource.trim() || undefined);
    setNewProblemText('');
    setNewProblemSource('');
    setIsAddingProblem(false);
  };

  const handleCreateCandidate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCandidateText.trim()) return;
    onAddCandidateQuestion(newCandidateText.trim());
    setNewCandidateText('');
    setIsAddingCandidate(false);
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
    setSelectedGraphNode(null);
  };

  const handleTriggerCluster = () => {
    onClusterNotes(
      selectedUnresolvedIds.length > 0
        ? selectedUnresolvedIds
        : unresolvedProblems.map((problem) => problem.id)
    );
  };

  const handleProblemClick = (event: React.MouseEvent, id: string) => {
    if (event.shiftKey && lastSelectedId) {
      const firstIndex = sortedProblems.findIndex((problem) => problem.id === lastSelectedId);
      const secondIndex = sortedProblems.findIndex((problem) => problem.id === id);
      if (firstIndex !== -1 && secondIndex !== -1) {
        const start = Math.min(firstIndex, secondIndex);
        const end = Math.max(firstIndex, secondIndex);
        const rangeIds = sortedProblems.slice(start, end + 1).map((problem) => problem.id);
        setSelectedProblemIds((current) => Array.from(new Set([...current, ...rangeIds])));
        return;
      }
    }

    setLastSelectedId(id);
    setSelectedProblemIds((current) =>
      current.includes(id) ? current.filter((problemId) => problemId !== id) : [...current, id]
    );
  };

  const handleSaveEditProblem = (id: string) => {
    if (!editProblemText.trim()) return;
    onUpdateOpenProblem(id, editProblemText.trim(), editProblemSource.trim() || undefined);
    setEditingProblemId(null);
  };

  const handleStartEditProblem = (problem: OpenProblemNote) => {
    setEditingProblemId(problem.id);
    setEditProblemText(problem.text);
    setEditProblemSource(problem.citation || '');
  };

  const handleSaveEditCandidate = (id: string) => {
    if (!editCandidateText.trim()) return;
    onUpdateCandidateQuestion(id, editCandidateText.trim());
    setEditingCandidateId(null);
  };

  // Render node in Orbit Field view
  const renderProblemNodeOrbit = (
    problem: OpenProblemNote,
    index: number,
    problemCount: number,
    fieldSize: number,
    candidateId?: string
  ) => {
    const position = getSurveyOrbitPosition(index, problemCount, fieldSize);
    const isSelected = selectedProblemIds.includes(problem.id);
    const isEditing = editingProblemId === problem.id;

    return (
      <div
        key={`${candidateId || 'unresolved'}-${problem.id}`}
        id={`open-problem-${candidateId || 'unresolved'}-${problem.id}`}
        draggable={!isEditing}
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', problem.id);
          event.dataTransfer.effectAllowed = 'copyMove';
        }}
        onClick={(event) => handleProblemClick(event, problem.id)}
        className={`group absolute z-10 rounded-xl bg-white dark:bg-[#1a1a1a] shadow-sm transition-all cursor-grab active:cursor-grabbing select-text ${
          isSelected
            ? 'border-2 border-[#2C5EA8] dark:border-[#7DB4F8] ring-4 ring-[#2C5EA8]/10'
            : 'border border-[#dedede] dark:border-[#303030] hover:border-[#9bb6dc] dark:hover:border-[#5d82b4] hover:shadow-md'
        }`}
        style={{
          left: position.left,
          top: position.top,
          width: SURVEY_NOTE_WIDTH,
          minHeight: SURVEY_NOTE_HEIGHT,
        }}
      >
        {isEditing ? (
          <div className="p-2.5 space-y-2">
            <textarea
              autoFocus
              rows={3}
              value={editProblemText}
              onChange={(event) => setEditProblemText(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              className="w-full resize-none rounded-md border border-[#d8d8d8] dark:border-[#383838] bg-[#fafafa] dark:bg-[#242424] px-2 py-1.5 text-[11px] text-[#1a1a1a] dark:text-[#ededed] focus:outline-hidden"
            />
            <input
              value={editProblemSource}
              onChange={(event) => setEditProblemSource(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder="Source"
              className="w-full rounded-md border border-[#d8d8d8] dark:border-[#383838] bg-[#fafafa] dark:bg-[#242424] px-2 py-1 text-[10px] text-[#1a1a1a] dark:text-[#ededed] focus:outline-hidden"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingProblemId(null);
                }}
                className="rounded p-1 text-[#777] hover:bg-[#f1f1f1] dark:hover:bg-[#2d2d2d]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSaveEditProblem(problem.id);
                }}
                className="rounded bg-[#1a1a1a] p-1 text-white dark:bg-white dark:text-[#1a1a1a]"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[#eeeeee] dark:border-[#292929] px-3 py-2">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2C5EA8] dark:text-[#7DB4F8]">
                <CircleDotDashed className="h-3 w-3" />
                Open problem
              </span>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {candidateId && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onUnlinkProblemFromCandidate(candidateId, problem.id);
                    }}
                    className="rounded p-1 text-[#999] hover:bg-[#f3f3f3] hover:text-[#1a1a1a] dark:hover:bg-[#292929] dark:hover:text-white"
                    title="Unlink from this candidate"
                  >
                    <Unlink className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleStartEditProblem(problem);
                  }}
                  className="rounded p-1 text-[#999] hover:bg-[#f3f3f3] hover:text-[#1a1a1a] dark:hover:bg-[#292929] dark:hover:text-white"
                  title="Edit open problem"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveOpenProblem(problem.id);
                  }}
                  className="rounded p-1 text-[#999] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  title="Delete open problem"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <p className="max-h-[48px] overflow-hidden text-[11px] font-medium leading-4 text-[#242424] dark:text-[#e5e5e5]">
                {problem.text}
              </p>
              {problem.citation && (
                <p className="mt-1.5 truncate text-[9px] text-[#8a8a8a] dark:text-[#777]">
                  {problem.citation}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Render Orbit Field section
  const renderOrbitField = (candidate?: CandidateQuestion) => {
    const problems = candidate
      ? candidate.openProblemIds
          .map((id) => openProblems.find((problem) => problem.id === id))
          .filter((problem): problem is OpenProblemNote => Boolean(problem))
      : unresolvedProblems;
    const fieldSize = getSurveyFieldSize(problems.length);
    const fieldId = candidate?.id || 'unresolved';
    const isDragOver = candidate ? dragOverCandidateId === candidate.id : false;
    const isEditing = candidate ? editingCandidateId === candidate.id : false;

    return (
      <section
        key={fieldId}
        aria-label={candidate ? `Candidate question: ${candidate.text}` : 'Unresolved open problems'}
        className={`relative shrink-0 rounded-[32px] border transition-colors ${
          candidate
            ? isDragOver
              ? 'border-dashed border-[#2C5EA8] bg-[#EFF5FF]/70 dark:border-[#7DB4F8] dark:bg-[#2C5EA8]/10'
              : 'border-[#e4e4e4] bg-white/55 dark:border-[#2c2c2c] dark:bg-[#171717]/65'
            : 'border-dashed border-[#d8d8d8] bg-[#fafafa]/70 dark:border-[#303030] dark:bg-[#151515]/65'
        }`}
        style={{ width: fieldSize, height: fieldSize }}
        onDragOver={
          candidate
            ? (event) => {
                event.preventDefault();
                setDragOverCandidateId(candidate.id);
              }
            : undefined
        }
        onDragLeave={candidate ? () => setDragOverCandidateId(null) : undefined}
        onDrop={
          candidate
            ? (event) => {
                event.preventDefault();
                setDragOverCandidateId(null);
                const problemId = event.dataTransfer.getData('text/plain');
                if (problemId) onLinkProblemToCandidate(candidate.id, problemId);
              }
            : undefined
        }
      >
        <div className="absolute left-6 top-5 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#888] dark:text-[#777]">
          {candidate ? <Network className="h-3.5 w-3.5" /> : <CircleDotDashed className="h-3.5 w-3.5" />}
          {candidate ? 'Candidate cluster' : 'Unresolved field'}
          <span className="font-normal tracking-normal">{problems.length}</span>
        </div>

        <svg
          viewBox={`0 0 ${fieldSize} ${fieldSize}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {candidate &&
            problems.map((problem, index) => {
              const position = getSurveyOrbitPosition(index, problems.length, fieldSize);
              return (
                <line
                  key={problem.id}
                  x1={fieldSize / 2}
                  y1={fieldSize / 2}
                  x2={position.centerX}
                  y2={position.centerY}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[#c9d7e8] dark:text-[#3d5674]"
                />
              );
            })}
        </svg>

        <div
          className={`absolute z-20 flex w-[238px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-white shadow-lg dark:bg-[#1b1b1b] ${
            candidate
              ? isDragOver
                ? 'border-[#2C5EA8] ring-4 ring-[#2C5EA8]/10 dark:border-[#7DB4F8]'
                : 'border-[#cfc4ee] dark:border-[#5d4d87]'
              : 'border-dashed border-[#cfcfcf] bg-white/80 shadow-none dark:border-[#3a3a3a] dark:bg-[#191919]/80'
          }`}
          style={{ left: fieldSize / 2, top: fieldSize / 2 }}
        >
          {candidate ? (
            isEditing ? (
              <div className="space-y-2 p-3">
                <textarea
                  autoFocus
                  rows={3}
                  value={editCandidateText}
                  onChange={(event) => setEditCandidateText(event.target.value)}
                  className="w-full resize-none rounded-lg border border-[#d8d8d8] dark:border-[#383838] bg-[#fafafa] dark:bg-[#242424] px-2.5 py-2 text-[12px] text-[#1a1a1a] dark:text-[#ededed] focus:outline-hidden"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingCandidateId(null)}
                    className="rounded px-2 py-1 text-[11px] text-[#777] hover:bg-[#f1f1f1] dark:hover:bg-[#2d2d2d]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEditCandidate(candidate.id)}
                    className="rounded bg-[#1a1a1a] px-2 py-1 text-[11px] text-white dark:bg-white dark:text-[#1a1a1a]"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#eeeaf8] px-4 py-2.5 dark:border-[#302b3f]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B4FBB] dark:text-[#BCA8F7]">
                    Candidate question
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCandidateId(candidate.id);
                        setEditCandidateText(candidate.text);
                      }}
                      className="rounded p-1 text-[#999] hover:bg-[#f3f3f3] hover:text-[#1a1a1a] dark:hover:bg-[#292929] dark:hover:text-white"
                      title="Edit candidate"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCandidateQuestion(candidate.id)}
                      className="rounded p-1 text-[#999] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      title="Delete candidate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold leading-5 text-[#1a1a1a] dark:text-[#ededed]">
                    {candidate.text}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-[#888] dark:text-[#777]">
                      <Link2 className="h-3 w-3" />
                      {problems.length} linked
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPromote(candidate)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#1a1a1a] px-2 py-1 text-[10px] font-medium text-white hover:bg-[#333] dark:bg-white dark:text-[#1a1a1a] dark:hover:bg-[#eee]"
                    >
                      Promote
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </>
            )
          ) : (
            <div className="px-5 py-4 text-center">
              <CircleDotDashed className="mx-auto h-5 w-5 text-[#9a9a9a]" />
              <p className="mt-2 text-[12px] font-semibold text-[#555] dark:text-[#bbb]">No candidate yet</p>
              <p className="mt-1 text-[10px] leading-4 text-[#999] dark:text-[#666]">
                Select notes to cluster, or drag them onto a candidate.
              </p>
            </div>
          )}
        </div>

        {problems.map((problem, index) =>
          renderProblemNodeOrbit(problem, index, problems.length, fieldSize, candidate?.id)
        )}
      </section>
    );
  };

  return (
    <div
      id="survey-pane-container"
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0e0e12] select-none"
    >
      {/* Top Header Bar */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#e7e7e7] bg-white/95 px-5 backdrop-blur-md dark:border-[#24242c] dark:bg-[#131318]/95 z-20">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold tracking-tight text-stone-900 dark:text-white">
                  Survey Graph
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-mono">
                  {openProblems.length} Notes · {candidateQuestions.length} Hubs
                </span>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 hidden sm:block">
                Interactive cosmic network view of open research problems & candidate groupings.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex shrink-0 items-center gap-2">
          {/* View Mode Toggle (Obsidian Graph vs Orbit Cluster) */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-[#1f1f26] border border-stone-200/80 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setViewMode('obsidian')}
              title="Obsidian Interactive Network Graph"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'obsidian'
                  ? 'bg-white dark:bg-[#141418] text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Obsidian Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('orbit')}
              title="Orbit Clusters Field"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'orbit'
                  ? 'bg-white dark:bg-[#141418] text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Orbit Fields</span>
            </button>
          </div>

          <button
            id="survey-cluster-btn"
            type="button"
            onClick={handleTriggerCluster}
            disabled={unresolvedProblems.length < 5}
            title={
              unresolvedProblems.length < 5
                ? 'Add at least 5 unresolved open problems to cluster'
                : selectedUnresolvedIds.length > 0
                ? `Cluster ${selectedUnresolvedIds.length} selected unresolved notes`
                : 'Cluster all unresolved open problems'
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40 dark:border-stone-800 dark:bg-[#1a1a22] dark:text-stone-300 dark:hover:bg-[#22222c] transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Cluster Notes</span>
          </button>

          {!isFifteenNoteStop && (
            <button
              id="survey-add-problem-btn"
              type="button"
              onClick={() => {
                setIsAddingCandidate(false);
                setIsAddingProblem(true);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-200/90 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-[#1a1a22] dark:text-stone-300 dark:hover:bg-[#22222c] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Open Problem</span>
            </button>
          )}

          <button
            id="survey-new-candidate-btn"
            type="button"
            onClick={() => {
              setIsAddingProblem(false);
              setIsAddingCandidate(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Candidate</span>
          </button>
        </div>
      </header>

      {/* Main Canvas / View Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Obsidian Network Graph View */}
        {viewMode === 'obsidian' && (
          <>
            <ObsidianSurveyGraph
              openProblems={openProblems}
              candidateQuestions={candidateQuestions}
              selectedNodeId={selectedGraphNode ? selectedGraphNode.id : null}
              onSelectNode={setSelectedGraphNode}
              onLinkProblemToCandidate={onLinkProblemToCandidate}
              onQuickAddProblem={() => setIsAddingProblem(true)}
              searchQuery={searchQuery}
              options={graphOptions}
              onOptionsChange={setGraphOptions}
              isDarkMode={isDarkMode}
            />

            {/* Obsidian Floating HUD Settings & Filter Panel */}
            <SurveyGraphHUD
              isOpen={isHUDOpen}
              onToggleOpen={() => setIsHUDOpen(!isHUDOpen)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              options={graphOptions}
              onOptionsChange={setGraphOptions}
              onResetForces={() =>
                setGraphOptions((prev) => ({
                  ...prev,
                  repulsion: DEFAULT_GRAPH_OPTIONS.repulsion,
                  linkDistance: DEFAULT_GRAPH_OPTIONS.linkDistance,
                  centerGravity: DEFAULT_GRAPH_OPTIONS.centerGravity,
                }))
              }
              matchedCount={matchedCount}
              totalNotes={openProblems.length}
              candidateCount={candidateQuestions.length}
              unresolvedCount={unresolvedProblems.length}
            />

            {/* Obsidian Node Quick-Look Inspector */}
            <SurveyNodeInspector
              selectedNode={inspectorNode}
              onClose={() => setSelectedGraphNode(null)}
              candidateQuestions={candidateQuestions}
              allOpenProblems={openProblems}
              onUpdateOpenProblem={onUpdateOpenProblem}
              onRemoveOpenProblem={onRemoveOpenProblem}
              onUpdateCandidateQuestion={onUpdateCandidateQuestion}
              onRemoveCandidateQuestion={onRemoveCandidateQuestion}
              onLinkProblemToCandidate={onLinkProblemToCandidate}
              onUnlinkProblemFromCandidate={onUnlinkProblemFromCandidate}
              onOpenPromoteModal={handleOpenPromote}
              onSelectNodeById={(type, id) => setSelectedGraphNode({ type, id })}
            />
          </>
        )}

        {/* Orbit Clusters Field View */}
        {viewMode === 'orbit' && (
          <div className="relative h-full w-full overflow-auto bg-[radial-gradient(circle_at_center,#d9d9d9_1px,transparent_1px)] bg-size-[18px_18px] dark:bg-[radial-gradient(circle_at_center,#2d2d2d_1px,transparent_1px)]">
            <div className="flex min-h-full min-w-max items-start gap-6 p-6">
              {unresolvedProblems.length > 0 && renderOrbitField()}
              {candidateQuestions.map((candidate) => renderOrbitField(candidate))}

              {openProblems.length === 0 && candidateQuestions.length === 0 && (
                <div className="flex h-[420px] w-[620px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#d5d5d5] bg-white/60 text-center dark:border-[#303030] dark:bg-[#171717]/60">
                  <HelpCircle className="h-8 w-8 text-[#aaa] dark:text-[#555]" />
                  <p className="mt-3 text-[13px] font-medium text-[#555] dark:text-[#bbb]">
                    No open problems yet.
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] leading-4 text-[#999] dark:text-[#666]">
                    Add an unresolved finding from your reading. Candidate questions come later.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 15-Note Stop Card (Deliberate friction constraint) */}
        {isFifteenNoteStop && (
          <div
            id="fifteen-note-stop-card"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full rounded-2xl border border-amber-500/40 bg-amber-50/95 dark:bg-[#201808]/95 backdrop-blur-md p-4 shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  15 Unresolved Problems Reached
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Group these open problems into at least <strong>three candidate questions</strong>{' '}
                  before adding more notes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Open Problem Modal / Popover */}
        {isAddingProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-[#17171d] space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  <CircleDotDashed className="w-4 h-4" />
                  New Open Problem Note
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingProblem(false)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProblem} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    What is still open here? *
                  </label>
                  <textarea
                    autoFocus
                    required
                    rows={4}
                    value={newProblemText}
                    onChange={(event) => setNewProblemText(event.target.value)}
                    placeholder="e.g. Sparse codes emerge from image statistics, but higher-order receptive fields remain unexplained..."
                    className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs text-stone-900 focus:outline-none focus:border-purple-500 focus:bg-white dark:border-stone-700 dark:bg-[#121216] dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Source / Citation
                  </label>
                  <input
                    type="text"
                    value={newProblemSource}
                    onChange={(event) => setNewProblemSource(event.target.value)}
                    placeholder="e.g. Olshausen & Field 1996"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-purple-500 focus:bg-white dark:border-stone-700 dark:bg-[#121216] dark:text-stone-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingProblem(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newProblemText.trim()}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-medium text-white shadow-xs disabled:opacity-40 transition-colors"
                  >
                    Add Open Problem
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Candidate Question Modal / Popover */}
        {isAddingCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-[#17171d] space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  <Network className="w-4 h-4" />
                  New Candidate Question Hub
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCandidate(false)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCandidate} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Candidate Question *
                  </label>
                  <textarea
                    autoFocus
                    required
                    rows={4}
                    value={newCandidateText}
                    onChange={(event) => setNewCandidateText(event.target.value)}
                    placeholder="e.g. Does sparsity in neural activations causally improve sample efficiency in downstream tasks?"
                    className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-xs text-stone-900 focus:outline-none focus:border-purple-500 focus:bg-white dark:border-stone-700 dark:bg-[#121216] dark:text-stone-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingCandidate(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCandidateText.trim()}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-medium text-white shadow-xs disabled:opacity-40 transition-colors"
                  >
                    Create Candidate Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Question Promotion Modal */}
      {promotingCandidate && (
        <div
          id="promote-test-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="promote-test-modal"
            className="w-full max-w-lg space-y-5 rounded-2xl border border-[#ececec] bg-white p-6 shadow-2xl dark:border-[#2e2e2e] dark:bg-[#18181f]"
          >
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3 dark:border-[#282828]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                Promote to Question Node
              </span>
              <button
                type="button"
                onClick={() => setPromotingCandidate(null)}
                className="rounded p-1 text-[#888] hover:text-[#1a1a1a] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                Candidate question
              </label>
              <div className="rounded-xl border border-[#ececec] bg-[#f7f7f7] p-3 text-[13px] font-medium leading-snug text-[#1a1a1a] dark:border-[#333] dark:bg-[#202028] dark:text-[#ededed]">
                {promotingCandidate.text}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#1a1a1a] dark:text-[#ededed]">
                Write a claim that answers this and could turn out to be false. *
              </label>
              <textarea
                rows={3}
                autoFocus
                value={promoteClaimText}
                onChange={(event) => setPromoteClaimText(event.target.value)}
                placeholder="Assert your claim here..."
                className="w-full resize-none rounded-xl border border-[#ececec] bg-[#fcfcfc] p-3 text-[13px] leading-relaxed text-[#1a1a1a] focus:outline-none focus:border-purple-500 dark:border-[#333] dark:bg-[#141418] dark:text-[#ededed]"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-[#2a2a2a] dark:text-[#d0d0d0]">
                <input
                  type="checkbox"
                  checked={box1Checked}
                  onChange={(event) => setBox1Checked(event.target.checked)}
                  className="mt-1 cursor-pointer rounded text-purple-600 focus:ring-purple-500/20"
                />
                <span>This claim could be false</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-[#2a2a2a] dark:text-[#d0d0d0]">
                <input
                  type="checkbox"
                  checked={box2Checked}
                  onChange={(event) => setBox2Checked(event.target.checked)}
                  className="mt-1 cursor-pointer rounded text-purple-600 focus:ring-purple-500/20"
                />
                <span>I could tell within a year whether it is</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#f0f0f0] pt-3 dark:border-[#282828]">
              <button
                type="button"
                onClick={() => setPromotingCandidate(null)}
                className="px-3 py-1.5 text-[13px] text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                id="promote-confirm-create-btn"
                type="button"
                onClick={handleConfirmPromote}
                disabled={!promoteClaimText.trim() || !box1Checked || !box2Checked}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-[13px] font-medium text-white disabled:pointer-events-none disabled:opacity-30 transition-colors shadow-xs"
              >
                Create Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
