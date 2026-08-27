import React, { useState } from 'react';
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
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote } from '../types';
import {
  getSurveyFieldSize,
  getSurveyOrbitPosition,
  SURVEY_NOTE_HEIGHT,
  SURVEY_NOTE_WIDTH,
} from '../surveyLayout';

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
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [newProblemText, setNewProblemText] = useState('');
  const [newProblemSource, setNewProblemSource] = useState('');
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editProblemText, setEditProblemText] = useState('');
  const [editProblemSource, setEditProblemSource] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [newCandidateText, setNewCandidateText] = useState('');
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editCandidateText, setEditCandidateText] = useState('');
  const [promotingCandidate, setPromotingCandidate] = useState<CandidateQuestion | null>(null);
  const [promoteClaimText, setPromoteClaimText] = useState('');
  const [box1Checked, setBox1Checked] = useState(false);
  const [box2Checked, setBox2Checked] = useState(false);
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);

  const sortedProblems = [...openProblems].sort((a, b) => b.createdAt - a.createdAt);
  const linkedProblemIds = new Set(candidateQuestions.flatMap((candidate) => candidate.openProblemIds));
  const unresolvedProblems = sortedProblems.filter((problem) => !linkedProblemIds.has(problem.id));
  const selectedUnresolvedIds = selectedProblemIds.filter((id) =>
    unresolvedProblems.some((problem) => problem.id === id)
  );
  const isFifteenNoteStop = unresolvedProblems.length >= 15 && candidateQuestions.length < 3;

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

  const handleCreateProblem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProblemText.trim()) return;
    onAddOpenProblem(newProblemText.trim(), newProblemSource.trim() || undefined);
    setNewProblemText('');
    setNewProblemSource('');
    setIsAddingProblem(false);
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

  const handleCreateCandidate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCandidateText.trim()) return;
    onAddCandidateQuestion(newCandidateText.trim());
    setNewCandidateText('');
    setIsAddingCandidate(false);
  };

  const handleSaveEditCandidate = (id: string) => {
    if (!editCandidateText.trim()) return;
    onUpdateCandidateQuestion(id, editCandidateText.trim());
    setEditingCandidateId(null);
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
  };

  const handleTriggerCluster = () => {
    onClusterNotes(
      selectedUnresolvedIds.length > 0
        ? selectedUnresolvedIds
        : unresolvedProblems.map((problem) => problem.id)
    );
  };

  const renderProblemNode = (
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
                aria-label="Cancel editing open problem"
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
                aria-label="Save open problem"
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

  const renderField = (candidate?: CandidateQuestion) => {
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
                      id={`promote-btn-${candidate.id}`}
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
          renderProblemNode(problem, index, problems.length, fieldSize, candidate?.id)
        )}

        {candidate && problems.length === 0 && (
          <p className="absolute bottom-[calc(50%-92px)] left-1/2 -translate-x-1/2 text-[10px] text-[#aaa] dark:text-[#666]">
            Drop an open problem here
          </p>
        )}
      </section>
    );
  };

  return (
    <div id="survey-pane-container" className="flex h-full w-full flex-col overflow-hidden bg-[#f8f8f7] dark:bg-[#121212] select-none">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#e7e7e7] bg-white px-5 dark:border-[#262626] dark:bg-[#151515]">
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-[#555] dark:text-[#aaa]" />
            <div>
              <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#242424] dark:text-[#e8e8e8]">
                Problem field
              </h2>
              <p className="text-[10px] text-[#999] dark:text-[#666]">
                Explicit groupings only. Position carries no meaning.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-3 border-l border-[#e8e8e8] pl-5 text-[10px] text-[#888] dark:border-[#303030] dark:text-[#777] lg:flex">
            <span>{unresolvedProblems.length} unresolved</span>
            <span>{candidateQuestions.length} candidates</span>
            {selectedProblemIds.length > 0 && <span>{selectedProblemIds.length} selected</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dedede] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#555] hover:bg-[#f4f4f4] disabled:pointer-events-none disabled:opacity-40 dark:border-[#303030] dark:bg-[#202020] dark:text-[#bbb] dark:hover:bg-[#292929]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#2C5EA8] dark:text-[#7DB4F8]" />
            {selectedUnresolvedIds.length > 0 ? `Cluster ${selectedUnresolvedIds.length}` : 'Cluster unresolved'}
          </button>
          {!isFifteenNoteStop && (
            <button
              id="survey-add-problem-btn"
              type="button"
              onClick={() => {
                setIsAddingCandidate(false);
                setIsAddingProblem(true);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-[#dedede] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#444] hover:bg-[#f4f4f4] dark:border-[#303030] dark:bg-[#202020] dark:text-[#ccc] dark:hover:bg-[#292929]"
            >
              <Plus className="h-3.5 w-3.5" />
              Open problem
            </button>
          )}
          <button
            id="survey-new-candidate-btn"
            type="button"
            onClick={() => {
              setIsAddingProblem(false);
              setIsAddingCandidate(true);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-[#1a1a1a] px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-[#333] dark:bg-white dark:text-[#1a1a1a] dark:hover:bg-[#eee]"
          >
            <Plus className="h-3.5 w-3.5" />
            Candidate
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto bg-[radial-gradient(circle_at_center,#d9d9d9_1px,transparent_1px)] bg-size-[18px_18px] dark:bg-[radial-gradient(circle_at_center,#2d2d2d_1px,transparent_1px)]">
        {(isAddingProblem || isAddingCandidate) && (
          <div className="sticky left-0 top-0 z-40 h-0 w-full">
            <div className="absolute left-5 top-5 w-[360px] rounded-xl border border-[#dedede] bg-white p-4 shadow-xl dark:border-[#303030] dark:bg-[#1b1b1b]">
              {isAddingProblem ? (
                <form onSubmit={handleCreateProblem} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2C5EA8] dark:text-[#7DB4F8]">
                      New open problem
                    </span>
                    <button type="button" onClick={() => setIsAddingProblem(false)} className="text-[#999] hover:text-[#222] dark:hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="block text-[11px] font-medium text-[#444] dark:text-[#ccc]">
                    What is still open here? *
                    <textarea
                      autoFocus
                      required
                      rows={3}
                      value={newProblemText}
                      onChange={(event) => setNewProblemText(event.target.value)}
                      className="mt-1.5 w-full resize-none rounded-lg border border-[#dedede] bg-[#fafafa] px-2.5 py-2 text-[12px] text-[#1a1a1a] focus:outline-hidden dark:border-[#383838] dark:bg-[#242424] dark:text-[#ededed]"
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-[#444] dark:text-[#ccc]">
                    Source
                    <input
                      value={newProblemSource}
                      onChange={(event) => setNewProblemSource(event.target.value)}
                      placeholder="Optional citation"
                      className="mt-1.5 w-full rounded-lg border border-[#dedede] bg-[#fafafa] px-2.5 py-2 text-[12px] text-[#1a1a1a] focus:outline-hidden dark:border-[#383838] dark:bg-[#242424] dark:text-[#ededed]"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newProblemText.trim()}
                      className="rounded-md bg-[#1a1a1a] px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-30 dark:bg-white dark:text-[#1a1a1a]"
                    >
                      Add open problem
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateCandidate} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B4FBB] dark:text-[#BCA8F7]">
                      New candidate question
                    </span>
                    <button type="button" onClick={() => setIsAddingCandidate(false)} className="text-[#999] hover:text-[#222] dark:hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="block text-[11px] font-medium text-[#444] dark:text-[#ccc]">
                    Candidate question *
                    <textarea
                      autoFocus
                      required
                      rows={3}
                      value={newCandidateText}
                      onChange={(event) => setNewCandidateText(event.target.value)}
                      className="mt-1.5 w-full resize-none rounded-lg border border-[#dedede] bg-[#fafafa] px-2.5 py-2 text-[12px] text-[#1a1a1a] focus:outline-hidden dark:border-[#383838] dark:bg-[#242424] dark:text-[#ededed]"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCandidateText.trim()}
                      className="rounded-md bg-[#1a1a1a] px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-30 dark:bg-white dark:text-[#1a1a1a]"
                    >
                      Create candidate
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="flex min-h-full min-w-max items-start gap-6 p-6">
          {isFifteenNoteStop && (
            <div
              id="fifteen-note-stop-card"
              className="sticky left-6 top-6 z-30 w-[280px] shrink-0 rounded-xl border border-[#ffb000]/50 bg-[#fffdf5] p-4 shadow-lg dark:bg-[#221c0e]"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb000]" />
                <div>
                  <p className="text-[12px] font-semibold text-[#1a1a1a] dark:text-[#f0f0f0]">
                    15 unresolved problems.
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-[#666] dark:text-[#aaa]">
                    Name three candidate questions before adding more.
                  </p>
                </div>
              </div>
            </div>
          )}

          {unresolvedProblems.length > 0 && renderField()}
          {candidateQuestions.map((candidate) => renderField(candidate))}

          {openProblems.length === 0 && candidateQuestions.length === 0 && (
            <div className="flex h-[420px] w-[620px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#d5d5d5] bg-white/60 text-center dark:border-[#303030] dark:bg-[#171717]/60">
              <HelpCircle className="h-8 w-8 text-[#aaa] dark:text-[#555]" />
              <p className="mt-3 text-[13px] font-medium text-[#555] dark:text-[#bbb]">No open problems yet.</p>
              <p className="mt-1 max-w-xs text-[11px] leading-4 text-[#999] dark:text-[#666]">
                Add an unresolved finding from your reading. Candidate questions come later.
              </p>
            </div>
          )}
        </div>
      </div>

      {promotingCandidate && (
        <div id="promote-test-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div id="promote-test-modal" className="w-full max-w-lg space-y-5 rounded-xl border border-[#ececec] bg-white p-6 shadow-2xl dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3 dark:border-[#282828]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                Promote to question
              </span>
              <button type="button" onClick={() => setPromotingCandidate(null)} className="rounded p-1 text-[#888] hover:text-[#1a1a1a] dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">Candidate question</label>
              <div className="rounded-lg border border-[#ececec] bg-[#f7f7f7] p-3 text-[13px] font-medium leading-snug text-[#1a1a1a] dark:border-[#333] dark:bg-[#242424] dark:text-[#ededed]">
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
                className="w-full resize-none rounded-lg border border-[#ececec] bg-[#fcfcfc] p-2.5 text-[13px] leading-relaxed text-[#1a1a1a] focus:outline-hidden dark:border-[#333] dark:bg-[#222] dark:text-[#ededed]"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-[#2a2a2a] dark:text-[#d0d0d0]">
                <input type="checkbox" checked={box1Checked} onChange={(event) => setBox1Checked(event.target.checked)} className="mt-1 cursor-pointer rounded" />
                <span>This claim could be false</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-[#2a2a2a] dark:text-[#d0d0d0]">
                <input type="checkbox" checked={box2Checked} onChange={(event) => setBox2Checked(event.target.checked)} className="mt-1 cursor-pointer rounded" />
                <span>I could tell within a year whether it is</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#f0f0f0] pt-3 dark:border-[#282828]">
              <button type="button" onClick={() => setPromotingCandidate(null)} className="px-3 py-1.5 text-[13px] text-[#666] hover:text-[#1a1a1a] dark:text-[#999] dark:hover:text-white">
                Cancel
              </button>
              <button
                id="promote-confirm-create-btn"
                type="button"
                onClick={handleConfirmPromote}
                disabled={!promoteClaimText.trim() || !box1Checked || !box2Checked}
                className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white disabled:pointer-events-none disabled:opacity-30 dark:bg-white dark:text-[#1a1a1a]"
              >
                Create question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
