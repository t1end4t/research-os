import React, { useState } from 'react';
import { OpenProblemNote, CandidateQuestion } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

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
  // Multi-selection state for open problems
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Add problem form state
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [newProblemText, setNewProblemText] = useState('');
  const [newProblemSource, setNewProblemSource] = useState('');

  // Editing problem state
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editProblemText, setEditProblemText] = useState('');
  const [editProblemSource, setEditProblemSource] = useState('');

  // Add candidate question state
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [newCandidateText, setNewCandidateText] = useState('');

  // Inline editing candidate question
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editCandidateText, setEditCandidateText] = useState('');

  // Promote Modal state
  const [promotingCandidate, setPromotingCandidate] = useState<CandidateQuestion | null>(null);
  const [promoteClaimText, setPromoteClaimText] = useState('');
  const [box1Checked, setBox1Checked] = useState(false);
  const [box2Checked, setBox2Checked] = useState(false);

  // Drag-and-drop state
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);

  // Sort open problems newest first
  const sortedProblems = [...openProblems].sort((a, b) => b.createdAt - a.createdAt);

  // Fifteen-note stop rule: >= 15 problems and < 3 candidates
  const isFifteenNoteStop = openProblems.length >= 15 && candidateQuestions.length < 3;

  // Handle open problem card selection with shift-click support
  const handleProblemClick = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey && lastSelectedId) {
      const idx1 = sortedProblems.findIndex((p) => p.id === lastSelectedId);
      const idx2 = sortedProblems.findIndex((p) => p.id === id);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const rangeIds = sortedProblems.slice(start, end + 1).map((p) => p.id);
        setSelectedProblemIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        return;
      }
    }

    setLastSelectedId(id);
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit new open problem
  const handleCreateProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblemText.trim()) return;
    onAddOpenProblem(newProblemText.trim(), newProblemSource.trim() || undefined);
    setNewProblemText('');
    setNewProblemSource('');
    setIsAddingProblem(false);
  };

  // Save edited open problem
  const handleSaveEditProblem = (id: string) => {
    if (!editProblemText.trim()) return;
    onUpdateOpenProblem(id, editProblemText.trim(), editProblemSource.trim() || undefined);
    setEditingProblemId(null);
  };

  // Start editing open problem
  const handleStartEditProblem = (problem: OpenProblemNote) => {
    setEditingProblemId(problem.id);
    setEditProblemText(problem.text);
    setEditProblemSource(problem.citation || '');
  };

  // Submit new candidate question
  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateText.trim()) return;
    onAddCandidateQuestion(newCandidateText.trim());
    setNewCandidateText('');
    setIsAddingCandidate(false);
  };

  // Save edited candidate question
  const handleSaveEditCandidate = (id: string) => {
    if (!editCandidateText.trim()) return;
    onUpdateCandidateQuestion(id, editCandidateText.trim());
    setEditingCandidateId(null);
  };

  // Open Promote modal
  const handleOpenPromote = (candidate: CandidateQuestion) => {
    setPromotingCandidate(candidate);
    setPromoteClaimText('');
    setBox1Checked(false);
    setBox2Checked(false);
  };

  // Confirm promote
  const handleConfirmPromote = () => {
    if (!promotingCandidate || !promoteClaimText.trim() || !box1Checked || !box2Checked) return;
    onPromoteCandidate(promotingCandidate, promoteClaimText.trim());
    setPromotingCandidate(null);
  };

  // Trigger clustering on selected or all notes
  const handleTriggerCluster = () => {
    const idsToCluster = selectedProblemIds.length > 0 ? selectedProblemIds : openProblems.map((p) => p.id);
    onClusterNotes(idsToCluster);
  };

  return (
    <div id="survey-pane-container" className="flex h-full w-full bg-[#fcfcfc] dark:bg-[#121212] overflow-hidden select-none">
      {/* LEFT COLUMN: OPEN PROBLEMS (50%) */}
      <section
        id="survey-left-col"
        aria-label="Open Problems Pile"
        className="w-1/2 h-full flex flex-col border-r border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#141414] overflow-hidden"
      >
        {/* Column Header */}
        <div className="h-12 px-5 border-b border-[#ececec] dark:border-[#262626] flex items-center justify-between shrink-0 bg-white dark:bg-[#161616]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#f0f0f0]">
              OPEN PROBLEMS
            </span>
            <span className="text-[12px] text-[#888] dark:text-[#777]">
              ({openProblems.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Cluster these button */}
            <button
              id="survey-cluster-btn"
              onClick={handleTriggerCluster}
              disabled={openProblems.length < 5}
              title={
                openProblems.length < 5
                  ? 'Add at least 5 open problems to cluster'
                  : selectedProblemIds.length > 0
                  ? `Cluster ${selectedProblemIds.length} selected notes`
                  : 'Cluster all open problems'
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium border border-[#ececec] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] text-[#444] dark:text-[#bbb] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#282828] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2C5EA8] dark:text-[#7DB4F8]" />
              <span>
                {selectedProblemIds.length > 0
                  ? `Cluster (${selectedProblemIds.length})`
                  : 'Cluster these'}
              </span>
            </button>

            {/* + Add button (hidden if fifteen-note stop active) */}
            {!isFifteenNoteStop && !isAddingProblem && (
              <button
                id="survey-add-problem-btn"
                onClick={() => setIsAddingProblem(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list of cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 select-text">
          {/* THE FIFTEEN-NOTE STOP BANNER */}
          {isFifteenNoteStop && (
            <div
              id="fifteen-note-stop-card"
              className="rounded-[10px] border border-[#ffb000]/40 bg-[#fffdf5] dark:bg-[#221c0e] p-4 text-left space-y-2 shadow-xs"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#ffb000] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug">
                    15 open problems, no questions named yet.
                  </div>
                  <p className="text-[12px] text-[#666] dark:text-[#aaa] mt-1 leading-relaxed">
                    Write three candidate questions before adding more. They can be wrong — you can delete them tomorrow.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inline Add Form */}
          {isAddingProblem && (
            <form
              onSubmit={handleCreateProblem}
              className="rounded-[10px] border border-[#2C5EA8]/30 dark:border-[#7DB4F8]/30 bg-[#EFF5FF]/40 dark:bg-[#2C5EA8]/10 p-3.5 space-y-3 animate-in fade-in duration-100"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2C5EA8] dark:text-[#7DB4F8]">
                  What is still open here? *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. On-device INT4 quantization degrades attention map sparsity..."
                  value={newProblemText}
                  onChange={(e) => setNewProblemText(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#ececec] dark:border-[#333] rounded px-2.5 py-1.5 text-[13px] text-[#1a1a1a] dark:text-[#ededed] placeholder-[#999] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                  Source (optional citation)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lin et al. 2023, MLSys"
                  value={newProblemSource}
                  onChange={(e) => setNewProblemSource(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#ececec] dark:border-[#333] rounded px-2.5 py-1.5 text-[12px] text-[#1a1a1a] dark:text-[#ededed] placeholder-[#999] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingProblem(false)}
                  className="px-2.5 py-1 text-[12px] text-[#666] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProblemText.trim()}
                  className="px-3 py-1 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[12px] font-medium disabled:opacity-40 hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
                >
                  Add Problem
                </button>
              </div>
            </form>
          )}

          {/* Cards List */}
          {sortedProblems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#999] dark:text-[#666]">
              <HelpCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-[13px]">No open problems yet.</p>
              <p className="text-[12px] text-[#aaa] dark:text-[#555] mt-0.5">
                Add unsolved gaps from papers or highlight text in the Papers tab.
              </p>
            </div>
          ) : (
            sortedProblems.map((problem) => {
              const isSelected = selectedProblemIds.includes(problem.id);
              const isEditing = editingProblemId === problem.id;

              if (isEditing) {
                return (
                  <div
                    key={problem.id}
                    className="rounded-[10px] border border-[#2C5EA8] dark:border-[#7DB4F8] bg-white dark:bg-[#1c1c1c] p-3 space-y-2"
                  >
                    <input
                      type="text"
                      value={editProblemText}
                      onChange={(e) => setEditProblemText(e.target.value)}
                      className="w-full bg-[#f9f9f9] dark:bg-[#252525] border border-[#ececec] dark:border-[#333] rounded px-2.5 py-1.5 text-[13px] text-[#1a1a1a] dark:text-[#ededed] focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={editProblemSource}
                      placeholder="Source citation..."
                      onChange={(e) => setEditProblemSource(e.target.value)}
                      className="w-full bg-[#f9f9f9] dark:bg-[#252525] border border-[#ececec] dark:border-[#333] rounded px-2.5 py-1 text-[12px] text-[#1a1a1a] dark:text-[#ededed] focus:outline-hidden"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingProblemId(null)}
                        className="px-2 py-0.5 text-[11px] text-[#666] hover:text-[#1a1a1a] dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEditProblem(problem.id)}
                        className="px-2.5 py-0.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[11px] font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={problem.id}
                  id={`open-problem-${problem.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', problem.id);
                    e.dataTransfer.effectAllowed = 'copyMove';
                  }}
                  onClick={(e) => handleProblemClick(e, problem.id)}
                  className={`group relative rounded-[10px] p-3.5 transition-all duration-150 cursor-grab active:cursor-grabbing bg-white dark:bg-[#1a1a1a] ${
                    isSelected
                      ? 'border-2 border-[#2C5EA8] dark:border-[#7DB4F8] shadow-xs'
                      : 'border border-[#ececec] dark:border-[#282828] hover:border-[#dedede] dark:hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3 text-[#bbb] dark:text-[#555] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                        OPEN PROBLEM
                      </span>
                    </div>

                    {/* On hover actions: Edit, Remove */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditProblem(problem);
                        }}
                        className="text-[#666] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveOpenProblem(problem.id);
                        }}
                        className="text-[#ef4444] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* One line body text */}
                  <div className="text-[13px] text-[#1a1a1a] dark:text-[#ededed] font-normal leading-snug line-clamp-2">
                    {problem.text}
                  </div>

                  {/* Citation line */}
                  {problem.citation && (
                    <div className="text-[11px] text-[#888] dark:text-[#777] mt-1.5 font-mono truncate">
                      {problem.citation}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* RIGHT COLUMN: CANDIDATE QUESTIONS (50%) */}
      <section
        id="survey-right-col"
        aria-label="Candidate Questions"
        className="w-1/2 h-full flex flex-col bg-[#fcfcfc] dark:bg-[#121212] overflow-hidden"
      >
        {/* Column Header */}
        <div className="h-12 px-5 border-b border-[#ececec] dark:border-[#262626] flex items-center justify-between shrink-0 bg-white dark:bg-[#161616]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#f0f0f0]">
              CANDIDATE QUESTIONS
            </span>
            <span className="text-[12px] text-[#888] dark:text-[#777]">
              ({candidateQuestions.length})
            </span>
          </div>

          {!isAddingCandidate && (
            <button
              id="survey-new-candidate-btn"
              onClick={() => setIsAddingCandidate(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New candidate</span>
            </button>
          )}
        </div>

        {/* Scrollable list of candidate questions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
          {/* Inline Add Candidate Question */}
          {isAddingCandidate && (
            <form
              onSubmit={handleCreateCandidate}
              className="rounded-[10px] border border-[#6B4FBB]/30 dark:border-[#BCA8F7]/30 bg-[#F5F2FF]/40 dark:bg-[#6B4FBB]/10 p-3.5 space-y-3 animate-in fade-in duration-100"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                  Candidate Question *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Are TinyML latency numbers comparable across devices?"
                  value={newCandidateText}
                  onChange={(e) => setNewCandidateText(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#ececec] dark:border-[#333] rounded px-2.5 py-1.5 text-[13px] text-[#1a1a1a] dark:text-[#ededed] placeholder-[#999] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingCandidate(false)}
                  className="px-2.5 py-1 text-[12px] text-[#666] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCandidateText.trim()}
                  className="px-3 py-1 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[12px] font-medium disabled:opacity-40 hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
                >
                  Create Candidate
                </button>
              </div>
            </form>
          )}

          {candidateQuestions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#999] dark:text-[#666]">
              <HelpCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-[13px]">No candidate questions yet.</p>
              <p className="text-[12px] text-[#aaa] dark:text-[#555] mt-0.5 max-w-xs">
                Drag open problems here or click "+ New candidate" to formulate a research question.
              </p>
            </div>
          ) : (
            candidateQuestions.map((candidate) => {
              const isDragOver = dragOverCandidateId === candidate.id;
              const linkedProblems = candidate.openProblemIds
                .map((id) => openProblems.find((p) => p.id === id))
                .filter((p): p is OpenProblemNote => !!p);

              const isEditing = editingCandidateId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  id={`candidate-card-${candidate.id}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCandidateId(candidate.id);
                  }}
                  onDragLeave={() => {
                    setDragOverCandidateId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCandidateId(null);
                    const noteId = e.dataTransfer.getData('text/plain');
                    if (noteId) {
                      onLinkProblemToCandidate(candidate.id, noteId);
                    }
                  }}
                  className={`rounded-[10px] p-4 transition-all duration-200 bg-white dark:bg-[#1a1a1a] space-y-3 ${
                    isDragOver
                      ? 'border-2 border-dashed border-[#2C5EA8] dark:border-[#7DB4F8] bg-[#EFF5FF]/30 dark:bg-[#2C5EA8]/10 ring-2 ring-[#2C5EA8]/20'
                      : 'border border-[#ececec] dark:border-[#282828] hover:border-[#dedede] dark:hover:border-[#383838]'
                  }`}
                >
                  {/* Top row: CANDIDATE label & Promote button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                        CANDIDATE
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemoveCandidateQuestion(candidate.id)}
                        className="text-[11px] text-[#999] hover:text-[#ef4444] px-1.5 py-0.5 rounded cursor-pointer"
                        title="Delete candidate"
                      >
                        Delete
                      </button>
                      <button
                        id={`promote-btn-${candidate.id}`}
                        onClick={() => handleOpenPromote(candidate)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[12px] font-medium hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
                      >
                        <span>Promote</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question text (editable in place) */}
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={editCandidateText}
                        onChange={(e) => setEditCandidateText(e.target.value)}
                        className="w-full bg-[#f9f9f9] dark:bg-[#252525] border border-[#ececec] dark:border-[#333] rounded px-2.5 py-1.5 text-[14px] font-medium text-[#1a1a1a] dark:text-[#ededed] focus:outline-hidden"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCandidateId(null)}
                          className="px-2 py-0.5 text-[11px] text-[#666]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditCandidate(candidate.id)}
                          className="px-2.5 py-0.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[11px] font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingCandidateId(candidate.id);
                        setEditCandidateText(candidate.text);
                      }}
                      className="group flex items-start justify-between gap-2 cursor-pointer"
                      title="Click to edit question text"
                    >
                      <div className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ededed] leading-snug">
                        {candidate.text}
                      </div>
                      <Edit2 className="w-3.5 h-3.5 text-[#999] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>
                  )}

                  {/* Supported by N open problems */}
                  <div className="text-[11px] text-[#888] dark:text-[#777] font-medium pt-1 border-t border-[#f0f0f0] dark:border-[#262626]">
                    supported by {linkedProblems.length} open {linkedProblems.length === 1 ? 'problem' : 'problems'}
                  </div>

                  {/* Linked open problems list beneath */}
                  {linkedProblems.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {linkedProblems.map((prob) => (
                        <div
                          key={prob.id}
                          className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded bg-[#f9f9f9] dark:bg-[#222222] border border-[#f0f0f0] dark:border-[#2c2c2c] text-[12px] text-[#555] dark:text-[#bbb]"
                        >
                          <span className="leading-snug line-clamp-1 flex-1">
                            {prob.text}
                          </span>
                          <button
                            onClick={() => onUnlinkProblemFromCandidate(candidate.id, prob.id)}
                            title="Unlink from this candidate"
                            className="text-[#999] hover:text-[#ef4444] p-0.5 rounded cursor-pointer shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop hint if no notes linked */}
                  {linkedProblems.length === 0 && (
                    <div className="text-[11px] italic text-[#aaa] dark:text-[#666] py-1">
                      Drag open problems from the left onto this card.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* THE PROMOTE TEST MODAL */}
      {promotingCandidate && (
        <div
          id="promote-test-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            id="promote-test-modal"
            className="w-full max-w-lg rounded-[12px] border border-[#ececec] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-6 shadow-2xl space-y-5 select-none animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#282828] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                  PROMOTE TO QUESTION
                </span>
              </div>
              <button
                onClick={() => setPromotingCandidate(null)}
                className="text-[#888] hover:text-[#1a1a1a] dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Question (read-only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                Candidate Question
              </label>
              <div className="rounded-lg bg-[#f7f7f7] dark:bg-[#242424] border border-[#ececec] dark:border-[#333] p-3 text-[13px] font-medium text-[#1a1a1a] dark:text-[#ededed] leading-snug">
                {promotingCandidate.text}
              </div>
            </div>

            {/* Required field: Write a claim that answers this and could turn out to be false */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#1a1a1a] dark:text-[#ededed]">
                Write a claim that answers this and could turn out to be false. *
              </label>
              <textarea
                rows={3}
                autoFocus
                value={promoteClaimText}
                onChange={(e) => setPromoteClaimText(e.target.value)}
                placeholder="e.g. Cross-device cycle timer variance accounts for over 60% of reported latency discrepancies."
                className="w-full bg-[#fcfcfc] dark:bg-[#222222] border border-[#ececec] dark:border-[#333] rounded-lg p-2.5 text-[13px] text-[#1a1a1a] dark:text-[#ededed] placeholder-[#aaa] dark:placeholder-[#666] focus:outline-hidden resize-none leading-relaxed"
              />
            </div>

            {/* Two Checkboxes required */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[13px] text-[#2a2a2a] dark:text-[#d0d0d0]">
                <input
                  type="checkbox"
                  checked={box1Checked}
                  onChange={(e) => setBox1Checked(e.target.checked)}
                  className="mt-1 rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer"
                />
                <span>This claim could be false</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[13px] text-[#2a2a2a] dark:text-[#d0d0d0]">
                <input
                  type="checkbox"
                  checked={box2Checked}
                  onChange={(e) => setBox2Checked(e.target.checked)}
                  className="mt-1 rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer"
                />
                <span>I could tell within a year whether it is</span>
              </label>
            </div>

            {/* Actions: Cancel & Create Question */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f0f0] dark:border-[#282828]">
              <button
                type="button"
                onClick={() => setPromotingCandidate(null)}
                className="px-3 py-1.5 text-[13px] text-[#666] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="promote-confirm-create-btn"
                type="button"
                onClick={handleConfirmPromote}
                disabled={!promoteClaimText.trim() || !box1Checked || !box2Checked}
                className="px-4 py-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-lg text-[13px] font-medium disabled:opacity-30 disabled:pointer-events-none hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
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
