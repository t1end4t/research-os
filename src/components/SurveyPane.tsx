import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  Pencil,
  Trash2,
  GripVertical,
  CornerDownRight,
  Sparkles,
  Check,
  ArrowRight,
  Tag,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote, ClusteringProposal } from '../types';
import { setResearchItemDragData } from '../researchItemDrag';

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
  onPromoteCandidate: (
    candidate: CandidateQuestion,
    claimText: string,
    tags?: string[],
    falsificationCondition?: string
  ) => string | void;
  onClusterNotes: (selectedProblemIds: string[]) => void;
  onlyMine?: boolean;
  activeProjectTag?: string;
  onNavigateToMap?: (questionId?: string) => void;
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
  onlyMine = false,
  activeProjectTag = 'all',
  onNavigateToMap,
}: SurveyPaneProps) {
  // ─── Composer Form State ───────────────────────────────────────────
  const [obsText, setObsText] = useState('');
  const [obsSource, setObsSource] = useState('');
  const obsInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Editing Note / Candidate Modals ───────────────────────────────
  const [editingNote, setEditingNote] = useState<OpenProblemNote | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteSource, setEditNoteSource] = useState('');

  const [isCreatingCandidate, setIsCreatingCandidate] = useState(false);
  const [newCandidateWording, setNewCandidateWording] = useState('');
  const [newCandidateSelectedNotes, setNewCandidateSelectedNotes] = useState<string[]>([]);

  const [editingCandidate, setEditingCandidate] = useState<CandidateQuestion | null>(null);
  const [editCandidateText, setEditCandidateText] = useState('');

  // ─── Promotion Test Modal State ────────────────────────────────────
  const [promotingCandidate, setPromotingCandidate] = useState<CandidateQuestion | null>(null);
  const [promoteClaimText, setPromoteClaimText] = useState('');
  const [boxFalsifiable, setBoxFalsifiable] = useState(false);
  const [falsificationCondition, setFalsificationCondition] = useState('');
  const [boxSettledInYear, setBoxSettledInYear] = useState(false);
  const [promoteTags, setPromoteTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // ─── Post-Promotion Feedback Banner ────────────────────────────────
  const [promotedSuccessInfo, setPromotedSuccessInfo] = useState<{
    questionId: string;
    questionText: string;
  } | null>(null);

  // ─── Drag and Drop ────────────────────────────────────────────────
  const [draggedProblemId, setDraggedProblemId] = useState<string | null>(null);
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);

  // ─── Assign Dropdown per note ─────────────────────────────────────
  const [assignDropdownNoteId, setAssignDropdownNoteId] = useState<string | null>(null);
  const assignDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
        setAssignDropdownNoteId(null);
      }
    };
    if (assignDropdownNoteId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [assignDropdownNoteId]);

  // ─── Reviewable Model Clustering Proposals ─────────────────────────
  const [proposals, setProposals] = useState<ClusteringProposal[]>([
    {
      id: 'prop-natural-images',
      groupName: 'Does sparse coding depend on natural image statistics?',
      sharedObservation: 'These notes all observe that only natural images were tested.',
      workingPhrase: 'Does sparse coding depend on natural image statistics?',
      problemIds: ['op-1', 'op-7', 'op-11'],
      problemSnippets: [
        'On-device INT4 quantization degrades attention map sparsity unpredictably across transformer layers.',
        'Weight pruning masks derived from static saliency metrics fail to predict runtime throughput on systolic arrays.',
        'Quantized activation outlier suppression algorithms increase static SRAM overhead beyond savings.',
      ],
      modelId: 'cx/gpt-5.6-sol',
    },
  ]);

  // ─── Note Categorization & Hard Stop Logic ────────────────────────
  // A note belongs to at most one candidate.
  // We map problemId -> candidate it belongs to
  const problemToCandidateMap = useMemo(() => {
    const map = new Map<string, CandidateQuestion>();
    candidateQuestions.forEach((cq) => {
      cq.openProblemIds.forEach((pid) => {
        if (!map.has(pid)) {
          map.set(pid, cq);
        }
      });
    });
    return map;
  }, [candidateQuestions]);

  const looseNotes = useMemo(() => {
    return openProblems.filter((p) => !problemToCandidateMap.has(p.id));
  }, [openProblems, problemToCandidateMap]);

  const clusteredNotes = useMemo(() => {
    return openProblems.filter((p) => problemToCandidateMap.has(p.id));
  }, [openProblems, problemToCandidateMap]);

  const looseCount = looseNotes.length;
  const clusteredCount = clusteredNotes.length;
  const candidateCount = candidateQuestions.length;

  // HARD STOP: "At 15 loose notes with fewer than 3 candidates: no new notes until three candidates exist."
  const isHardStopActive = looseCount >= 15 && candidateCount < 3;

  // Format date helper
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // ─── Note Submission Handler ───────────────────────────────────────
  const handleSubmitNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isHardStopActive) return;

    const trimmedText = obsText.trim();
    const trimmedSource = obsSource.trim();

    if (!trimmedText || !trimmedSource) return;

    onAddOpenProblem(trimmedText, trimmedSource);
    setObsText('');
    setObsSource('');

    // Immediately refocus observation field for rapid sequential capture
    if (obsInputRef.current) {
      obsInputRef.current.focus();
    }
  };

  // ─── Candidate Creation Handlers ──────────────────────────────────
  const handleOpenCreateCandidate = () => {
    setNewCandidateWording('');
    setNewCandidateSelectedNotes([]);
    setIsCreatingCandidate(true);
  };

  const handleCommitCreateCandidate = () => {
    const trimmed = newCandidateWording.trim();
    if (!trimmed) return;

    onAddCandidateQuestion(trimmed, newCandidateSelectedNotes);
    setIsCreatingCandidate(false);
    setNewCandidateWording('');
    setNewCandidateSelectedNotes([]);
  };

  // ─── Model Proposal Actions ───────────────────────────────────────
  const handleAcceptProposal = (proposal: ClusteringProposal) => {
    // Per brief: "Accepting a grouping creates a candidate with those notes and opens its wording field for the user to write. Do not create the candidate with the model's phrase already committed as the user's wording."
    setNewCandidateWording(''); // User must write their own wording
    setNewCandidateSelectedNotes(proposal.problemIds);
    setIsCreatingCandidate(true);
    setProposals((prev) => prev.filter((p) => p.id !== proposal.id));
  };

  const handleRejectProposal = (proposalId: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  };

  const handleTriggerExaminerClustering = () => {
    if (looseNotes.length === 0) return;
    const sampleNotes = looseNotes.slice(0, Math.min(4, looseNotes.length));
    const newProposal: ClusteringProposal = {
      id: `prop-${Date.now()}`,
      groupName: 'How do memory footprint and quantization affect transformer latency on microcontrollers?',
      sharedObservation: 'These loose notes identify memory hierarchy bottlenecks during edge execution.',
      workingPhrase: 'How do memory footprint and quantization affect transformer latency on microcontrollers?',
      problemIds: sampleNotes.map((n) => n.id),
      problemSnippets: sampleNotes.map((n) => n.text),
      modelId: 'cx/gpt-5.6-sol',
    };
    setProposals((prev) => [newProposal, ...prev]);
  };

  // ─── Promotion Test Modal Handlers ────────────────────────────────
  const handleOpenPromoteModal = (candidate: CandidateQuestion) => {
    setPromotingCandidate(candidate);
    setPromoteClaimText('');
    setBoxFalsifiable(false);
    setFalsificationCondition('');
    setBoxSettledInYear(false);
    const initialTags = activeProjectTag && activeProjectTag !== 'all' ? [activeProjectTag] : ['tinyml'];
    setPromoteTags(initialTags);
    setNewTagInput('');
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !promoteTags.includes(trimmed)) {
      setPromoteTags([...promoteTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setPromoteTags(promoteTags.filter((t) => t !== tagToRemove));
  };

  const isPromoteValid =
    promoteClaimText.trim().length > 0 &&
    boxFalsifiable &&
    falsificationCondition.trim().length > 0 &&
    boxSettledInYear;

  const getMissingPromotionReason = (): string => {
    if (!promoteClaimText.trim()) return 'Write a claim that answers it';
    if (!boxFalsifiable) return 'Confirm claim could be false';
    if (!falsificationCondition.trim()) return 'Specify what would show claim false';
    if (!boxSettledInYear) return 'Confirm settled within a year';
    return '';
  };

  const handleCommitPromotion = () => {
    if (!promotingCandidate || !isPromoteValid) return;

    const newQId = onPromoteCandidate(
      promotingCandidate,
      promoteClaimText.trim(),
      promoteTags,
      falsificationCondition.trim()
    );

    const questionText = promotingCandidate.text;
    const finalId = typeof newQId === 'string' ? newQId : `q-${Date.now()}`;

    setPromotedSuccessInfo({
      questionId: finalId,
      questionText,
    });

    setPromotingCandidate(null);
  };

  // ─── Demonstration State Presets ──────────────────────────────────
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);

  const handleApplyPreset = (preset: 'default' | '13loose' | '15sealed' | '15cleared') => {
    setIsDemoMenuOpen(false);
    if (preset === '13loose') {
      // 13 loose notes, 2 candidates
      while (candidateQuestions.length > 2) {
        onRemoveCandidateQuestion(candidateQuestions[candidateQuestions.length - 1].id);
      }
      const needed = 13 - looseCount;
      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          onAddOpenProblem(
            `Demonstration note #${i + 1}: Unresolved timing jitter in low-power oscillator wakes.`,
            'Demo Setup 2024'
          );
        }
      }
    } else if (preset === '15sealed') {
      // 15 loose notes, 2 candidates -> Seals composer
      while (candidateQuestions.length > 2) {
        onRemoveCandidateQuestion(candidateQuestions[candidateQuestions.length - 1].id);
      }
      const needed = 15 - looseCount;
      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          onAddOpenProblem(
            `Demonstration note #${i + 1}: Memory access contention on scratchpad SRAM.`,
            'Demo Setup 2024'
          );
        }
      }
    } else if (preset === '15cleared') {
      // 15 loose notes, 3 candidates -> Stop cleared!
      if (candidateQuestions.length < 3) {
        onAddCandidateQuestion('Does scratchpad contention bound multi-core inference throughput?', []);
      }
    }
  };

  return (
    <div
      id="survey-pane-container"
      className="h-full w-full flex flex-col bg-paper text-ink overflow-hidden select-text"
    >
      {/* ─── Top Survey Header ──────────────────────────────────────── */}
      <header
        id="survey-header"
        className="shrink-0 px-6 py-3.5 border-b border-rule bg-paper flex items-center justify-between gap-4 z-10"
      >
        <div className="flex items-baseline gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase text-ink">
              SURVEY
            </span>
          </div>
          <span className="font-serif italic text-[15px] text-ink-muted">
            What is still open here?
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Propose clusters button */}
          <button
            id="btn-propose-clusters-header"
            onClick={handleTriggerExaminerClustering}
            title="Ask the Examiner to propose groupings from your loose notes"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-sans font-medium text-ink bg-surface border border-rule rounded-[2px] hover:border-ink-muted transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-ink-muted" />
            <span>Propose clusters</span>
          </button>

          {/* + Candidate Question button */}
          <button
            id="btn-add-candidate-header"
            onClick={handleOpenCreateCandidate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-sans font-medium text-ink bg-surface border border-rule rounded-[2px] hover:border-ink-muted transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Candidate question</span>
          </button>

          {/* Demonstration States Dropdown for testing */}
          <div className="relative">
            <button
              id="btn-demo-states-menu"
              onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-ink-muted hover:text-ink bg-surface/70 border border-rule rounded-[2px] hover:border-ink-muted transition-colors cursor-pointer"
              title="Quickly view required testing states"
            >
              <span>State test presets</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isDemoMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-64 bg-surface border border-rule shadow-lg rounded-[2px] p-1.5 z-50 flex flex-col gap-1 text-[12px] font-sans"
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted border-b border-rule">
                  Test & Verification States
                </div>
                <button
                  onClick={() => handleApplyPreset('13loose')}
                  className="w-full text-left px-2 py-1.5 rounded-[2px] hover:bg-paper text-ink transition-colors flex items-center justify-between"
                >
                  <span>13 loose · 2 candidates</span>
                  <span className="font-mono text-[10px] text-ink-muted">Approaching limit</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('15sealed')}
                  className="w-full text-left px-2 py-1.5 rounded-[2px] hover:bg-paper text-ink transition-colors flex items-center justify-between"
                >
                  <span>15 loose · 2 candidates</span>
                  <span className="font-mono text-[10px] text-missing font-bold">Sealed Stop</span>
                </button>
                <button
                  onClick={() => handleApplyPreset('15cleared')}
                  className="w-full text-left px-2 py-1.5 rounded-[2px] hover:bg-paper text-ink transition-colors flex items-center justify-between"
                >
                  <span>15 loose · 3 candidates</span>
                  <span className="font-mono text-[10px] text-holds font-bold">Stop Cleared</span>
                </button>
                <button
                  onClick={() => {
                    handleTriggerExaminerClustering();
                    setIsDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-[2px] hover:bg-paper text-ink transition-colors flex items-center justify-between border-t border-rule mt-0.5 pt-1.5"
                >
                  <span>Generate Model Proposal</span>
                  <Sparkles className="w-3 h-3 text-ink-muted" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Promoted Success Notice Banner ─────────────────────────── */}
      {promotedSuccessInfo && (
        <div
          id="promoted-success-banner"
          className="shrink-0 px-6 py-2.5 bg-[#EEF5F0] dark:bg-[#1A2E22] border-b border-holds/40 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2 text-ink">
            <span className="font-mono font-bold text-holds uppercase tracking-wider text-[11px]">
              ✓ PROMOTED TO QUESTION
            </span>
            <span className="font-serif italic text-[14px]">
              "{promotedSuccessInfo.questionText}"
            </span>
            <span className="text-ink-muted text-[11px] font-sans">
              (Unwritten reason registered on Map)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToMap && (
              <button
                id="btn-view-promoted-on-map"
                onClick={() => onNavigateToMap(promotedSuccessInfo.questionId)}
                className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-holds hover:underline cursor-pointer"
              >
                <span>View on Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setPromotedSuccessInfo(null)}
              className="text-ink-muted hover:text-ink p-1 rounded-[2px] cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Two-Column Surface ────────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rule overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════
            LEFT COLUMN: OPEN PROBLEMS PILE (Raw Material)
            ═══════════════════════════════════════════════════════════════ */}
        <section
          id="open-problems-column"
          aria-label="Open Problems Pile"
          className="h-full flex flex-col min-h-0 bg-paper/40 overflow-hidden"
        >
          {/* Left Column Header */}
          <div className="shrink-0 px-5 py-3 border-b border-rule bg-paper/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
                OPEN PROBLEMS
              </span>
              <span className="text-rule font-mono text-[10px]">·</span>
              <span className="font-mono text-[12px] font-bold text-ink">
                {looseCount} loose
              </span>
              <span className="text-rule font-mono text-[10px]">·</span>
              <span className="font-mono text-[12px] text-ink-muted">
                {clusteredCount} clustered
              </span>
            </div>

            {/* Approaching threshold indicator */}
            {looseCount >= 13 && !isHardStopActive && (
              <span className="font-mono text-[10px] text-weak tracking-tight font-medium">
                {looseCount} loose · {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'}
              </span>
            )}
          </div>

          {/* Persistent Note Composer / Sealed Box */}
          <div className="shrink-0 p-4 border-b border-rule bg-surface/50">
            {isHardStopActive ? (
              /* ─── SEALED COMPOSER (HARD STOP) ─────────────────────────── */
              <div
                id="composer-hard-stop-box"
                className="p-4 bg-paper border border-missing/60 rounded-[2px] flex flex-col gap-3.5 select-none"
              >
                <div className="flex items-center justify-between border-b border-missing/30 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-missing shrink-0" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-missing">
                      CAPTURE CLOSED
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-ink">
                    {looseCount} loose notes, {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'}.
                  </span>
                </div>

                <p className="font-serif text-[14px] leading-relaxed text-ink">
                  Group these notes into at least 3 candidate questions before writing another.
                  The pile is large enough to show a pattern — find it.
                </p>

                <div className="flex justify-end pt-1">
                  <button
                    id="btn-hardstop-propose-clusters"
                    onClick={handleTriggerExaminerClustering}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-sans font-medium text-ink bg-surface border border-rule rounded-[2px] hover:border-ink-muted active:bg-paper transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Propose clusters from my notes</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ─── ACTIVE PERSISTENT COMPOSER ─────────────────────────── */
              <form
                id="open-problem-composer-form"
                onSubmit={handleSubmitNote}
                className="flex flex-col gap-2 bg-surface p-3 border border-rule rounded-[2px]"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted uppercase tracking-wider">
                  <span>Fast Note Capture</span>
                  <span>Enter to commit</span>
                </div>

                {/* Field 1: Observation (User Serif) */}
                <input
                  id="input-problem-observation"
                  ref={obsInputRef}
                  type="text"
                  placeholder="What is still open here? *"
                  value={obsText}
                  onChange={(e) => setObsText(e.target.value)}
                  className="w-full bg-paper border border-rule px-3 py-1.5 text-[15px] font-serif text-ink placeholder:text-ink-muted/60 placeholder:font-serif rounded-[2px] focus:border-ink focus:outline-none"
                />

                {/* Field 2: Source (Secondary Sans) + Submit */}
                <div className="flex items-center gap-2">
                  <input
                    id="input-problem-source"
                    type="text"
                    placeholder="Source (e.g. Olshausen & Field 1996, talk, meeting) *"
                    value={obsSource}
                    onChange={(e) => setObsSource(e.target.value)}
                    className="flex-1 bg-paper border border-rule px-2.5 py-1 text-[12px] font-sans text-ink placeholder:text-ink-muted/60 rounded-[2px] focus:border-ink focus:outline-none"
                  />

                  <button
                    id="btn-submit-open-problem"
                    type="submit"
                    disabled={!obsText.trim() || !obsSource.trim()}
                    className="inline-flex items-center justify-center px-3 py-1 text-[12px] font-sans font-medium text-paper bg-ink rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition-colors cursor-pointer shrink-0"
                  >
                    Add note
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Open Problems Scrollable Pile */}
          <div
            id="open-problems-pile-list"
            className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3"
          >
            {openProblems.length === 0 ? (
              /* ─── EMPTY STATE: NOTHING OPEN YET ──────────────────────── */
              <div
                id="empty-open-problems-state"
                className="my-auto p-6 bg-surface/40 border border-dashed border-rule rounded-[2px] text-center flex flex-col items-center gap-3"
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  NOTHING OPEN YET
                </span>
                <p className="font-sans text-[13px] text-ink-muted max-w-md">
                  Write what a paper left unresolved. One line, with its source.
                </p>
                <blockquote className="font-serif italic text-[14px] text-ink/80 border-l-2 border-rule pl-3 max-w-md text-left mt-1">
                  “Nobody has tested whether sparse coding holds under non-natural image statistics.”
                  <footer className="font-sans not-italic text-[11px] text-ink-muted mt-1">
                    — Olshausen & Field 1996, discussion
                  </footer>
                </blockquote>
              </div>
            ) : (
              openProblems.map((note) => {
                const assignedCandidate = problemToCandidateMap.get(note.id);
                const isLoose = !assignedCandidate;

                return (
                  <div
                    key={note.id}
                    id={`open-problem-card-${note.id}`}
                    draggable={isLoose}
                    onDragStart={(e) => {
                      setDraggedProblemId(note.id);
                      setResearchItemDragData(e.dataTransfer, {
                        type: 'SURVEY',
                        id: note.id,
                        label: note.text,
                      });
                      e.dataTransfer.setData('text/plain', note.id);
                    }}
                    onDragEnd={() => setDraggedProblemId(null)}
                    className={`relative p-3 rounded-[2px] transition-all flex flex-col gap-2 ${
                      isLoose
                        ? 'bg-surface border border-dashed border-rule hover:border-ink-muted shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                        : 'bg-paper/70 border border-rule/50 opacity-85'
                    }`}
                  >
                    {/* Top Row: State indicator & timestamp & actions */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1.5">
                        {isLoose ? (
                          <>
                            <div className="cursor-grab active:cursor-grabbing text-ink-muted hover:text-ink">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
                              LOOSE
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                            <CornerDownRight className="w-3 h-3 text-ink-muted shrink-0" />
                            <span className="font-sans text-[11px] truncate max-w-[220px]">
                              Clustered in:{' '}
                              <strong className="font-medium text-ink">
                                {assignedCandidate.text}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-ink-muted/70">
                          {formatDate(note.createdAt)}
                        </span>

                        {/* Quick Assign / Reassign Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setAssignDropdownNoteId(
                                assignDropdownNoteId === note.id ? null : note.id
                              )
                            }
                            className="text-[11px] font-sans text-ink-muted hover:text-ink px-1.5 py-0.5 rounded-[2px] border border-rule hover:bg-surface transition-colors cursor-pointer"
                            title="Assign to candidate question"
                          >
                            {isLoose ? '+ Group' : 'Move'}
                          </button>

                          {assignDropdownNoteId === note.id && (
                            <div
                              ref={assignDropdownRef}
                              className="absolute right-0 mt-1 w-60 bg-surface border border-rule shadow-md rounded-[2px] p-1.5 z-40 flex flex-col gap-1 text-[12px] font-sans"
                            >
                              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted border-b border-rule">
                                Assign to Candidate
                              </div>
                              {candidateQuestions.length === 0 ? (
                                <div className="p-2 text-[11px] text-ink-muted italic">
                                  No candidates exist yet. Create one first.
                                </div>
                              ) : (
                                candidateQuestions.map((cq) => {
                                  const isCurrent = assignedCandidate?.id === cq.id;
                                  return (
                                    <button
                                      key={cq.id}
                                      onClick={() => {
                                        onLinkProblemToCandidate(cq.id, note.id);
                                        setAssignDropdownNoteId(null);
                                      }}
                                      className={`w-full text-left px-2 py-1.5 rounded-[2px] transition-colors flex items-center justify-between ${
                                        isCurrent
                                          ? 'bg-paper text-ink font-medium'
                                          : 'hover:bg-paper text-ink'
                                      }`}
                                    >
                                      <span className="truncate pr-2">{cq.text}</span>
                                      {isCurrent && <Check className="w-3 h-3 text-holds" />}
                                    </button>
                                  );
                                })
                              )}
                              {!isLoose && (
                                <button
                                  onClick={() => {
                                    if (assignedCandidate) {
                                      onUnlinkProblemFromCandidate(
                                        assignedCandidate.id,
                                        note.id
                                      );
                                    }
                                    setAssignDropdownNoteId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-[2px] text-missing hover:bg-paper border-t border-rule mt-0.5 pt-1.5 transition-colors"
                                >
                                  Return to loose
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Edit Note */}
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setEditNoteText(note.text);
                            setEditNoteSource(note.citation || '');
                          }}
                          className="text-ink-muted hover:text-ink p-1 rounded-[2px] cursor-pointer"
                          title="Edit note"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>

                        {/* Delete Note (Only allowed when loose!) */}
                        <button
                          onClick={() => {
                            if (isLoose) {
                              onRemoveOpenProblem(note.id);
                            }
                          }}
                          disabled={!isLoose}
                          className={`p-1 rounded-[2px] transition-colors ${
                            isLoose
                              ? 'text-ink-muted hover:text-missing cursor-pointer'
                              : 'text-ink-muted/30 cursor-not-allowed'
                          }`}
                          title={
                            isLoose
                              ? 'Delete loose note'
                              : 'Remove note from candidate first to delete'
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Note Observation Text (User Serif) */}
                    <div className="font-serif text-[15px] leading-relaxed text-ink">
                      {note.text}
                    </div>

                    {/* Source Citation (Secondary Sans) */}
                    {note.citation && (
                      <div className="font-sans text-xs text-ink-muted flex items-center gap-1.5">
                        <span className="text-rule">Source:</span>
                        <span>{note.citation}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT COLUMN: CANDIDATE QUESTIONS (Formed Material)
            ═══════════════════════════════════════════════════════════════ */}
        <section
          id="candidate-questions-column"
          aria-label="Candidate Questions"
          className="h-full flex flex-col min-h-0 bg-paper/20 overflow-hidden"
        >
          {/* Right Column Header */}
          <div className="shrink-0 px-5 py-3 border-b border-rule bg-paper/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
                CANDIDATE QUESTIONS
              </span>
              <span className="text-rule font-mono text-[10px]">·</span>
              <span className="font-mono text-[12px] font-bold text-ink">
                {candidateCount}
              </span>
            </div>

            <button
              id="btn-add-candidate-column-header"
              onClick={handleOpenCreateCandidate}
              className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-ink-muted hover:text-ink px-2 py-0.5 rounded-[2px] border border-rule hover:bg-surface transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New candidate</span>
            </button>
          </div>

          {/* Right Column Scrollable List */}
          <div
            id="candidate-questions-list"
            className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4"
          >
            {/* ─── Model Clustering Proposals (Reviewable) ─────────────── */}
            {!onlyMine && proposals.length > 0 && (
              <div className="flex flex-col gap-3">
                {proposals.map((prop) => (
                  <div
                    key={prop.id}
                    id={`clustering-proposal-${prop.id}`}
                    className="relative pl-4 pr-3 py-3 bg-surface border border-rule rounded-[2px] font-mono text-[13px] text-ink leading-relaxed hatched-left-border flex flex-col gap-2.5"
                  >
                    {/* Proposal Header */}
                    <div className="flex items-center justify-between border-b border-rule/60 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-[0.08em] text-ink font-bold">
                          PROPOSED GROUPING
                        </span>
                        <span className="text-rule">·</span>
                        <span className="text-[11px] font-mono text-ink-muted">
                          {prop.problemIds.length} notes
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-muted/80">
                        [{prop.modelId || 'cx/gpt-5.6-sol'}]
                      </span>
                    </div>

                    {/* Shared observation explanation */}
                    {prop.sharedObservation && (
                      <p className="font-sans text-[13px] text-ink italic">
                        {prop.sharedObservation}
                      </p>
                    )}

                    {/* Notes contained in proposal */}
                    <ul className="flex flex-col gap-1 my-1 pl-2 border-l border-rule/60">
                      {prop.problemSnippets.map((snip, idx) => (
                        <li
                          key={idx}
                          className="font-serif text-[13px] text-ink-muted leading-snug"
                        >
                          · {snip}
                        </li>
                      ))}
                    </ul>

                    {/* Working phrase explanation */}
                    <div className="p-2 bg-paper/60 border border-rule/50 rounded-[2px] text-[12px] font-sans text-ink">
                      <span className="font-mono text-[10px] uppercase text-ink-muted block mb-0.5">
                        Model Working Phrase:
                      </span>
                      <p className="font-serif italic text-ink">{prop.workingPhrase || prop.groupName}</p>
                      <span className="font-mono text-[10px] text-ink-muted block mt-1">
                        You will need to write the candidate's wording yourself.
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRejectProposal(prop.id)}
                        className="px-2.5 py-1 text-[11px] font-sans text-ink-muted hover:text-ink bg-transparent border border-transparent hover:border-rule rounded-[2px] transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAcceptProposal(prop)}
                        className="px-3 py-1 text-[11px] font-sans font-medium text-paper bg-ink rounded-[2px] hover:bg-ink/90 transition-colors cursor-pointer"
                      >
                        Accept grouping
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Candidate Questions List ──────────────────────────── */}
            {candidateQuestions.length === 0 && proposals.length === 0 ? (
              /* Empty candidate state */
              <div
                id="empty-candidates-state"
                className="my-auto p-6 bg-surface/40 border border-dashed border-rule rounded-[2px] text-center flex flex-col items-center gap-3"
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  NO CANDIDATES YET
                </span>
                <p className="font-sans text-[13px] text-ink-muted max-w-md">
                  Group notes that observe the same gap. Drag one onto another,
                  or ask the examiner to propose groupings from what you have written.
                </p>
                <button
                  onClick={handleOpenCreateCandidate}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-sans font-medium text-ink bg-surface border border-rule rounded-[2px] hover:border-ink-muted transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create candidate question</span>
                </button>
              </div>
            ) : (
              candidateQuestions.map((candidate) => {
                const linkedNotes = candidate.openProblemIds
                  .map((pid) => openProblems.find((p) => p.id === pid))
                  .filter((p): p is OpenProblemNote => !!p);

                const isDragTarget = dragOverCandidateId === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    id={`candidate-question-card-${candidate.id}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCandidateId(candidate.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverCandidateId === candidate.id) {
                        setDragOverCandidateId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverCandidateId(null);
                      const problemId = draggedProblemId || e.dataTransfer.getData('text/plain');
                      if (problemId) {
                        onLinkProblemToCandidate(candidate.id, problemId);
                      }
                    }}
                    className={`relative p-4 rounded-[2px] bg-surface border transition-all flex flex-col gap-3 ${
                      isDragTarget
                        ? 'border-ink shadow-md bg-paper'
                        : 'border-rule hover:border-ink-muted/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    }`}
                  >
                    {/* Card Header: Label, note count, actions */}
                    <div className="flex items-center justify-between border-b border-rule/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                          CANDIDATE
                        </span>
                        <span className="text-rule font-mono text-[10px]">·</span>
                        <span className="font-mono text-[11px] text-ink font-medium">
                          {linkedNotes.length} {linkedNotes.length === 1 ? 'note' : 'notes'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCandidate(candidate);
                            setEditCandidateText(candidate.text);
                          }}
                          className="text-ink-muted hover:text-ink p-1 rounded-[2px] cursor-pointer"
                          title="Edit candidate wording"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onRemoveCandidateQuestion(candidate.id)}
                          className="text-ink-muted hover:text-missing p-1 rounded-[2px] cursor-pointer"
                          title="Delete candidate (releases notes back to loose)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Candidate Question Wording (User Serif) */}
                    <div className="font-serif text-[16px] font-medium leading-snug text-ink">
                      {candidate.text}
                    </div>

                    {/* Linked Notes Compact Listing */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="font-mono text-[10px] uppercase text-ink-muted tracking-wider">
                        Contained observations:
                      </span>
                      {linkedNotes.length === 0 ? (
                        <div className="p-2.5 bg-paper/50 border border-dashed border-rule rounded-[2px] text-[11px] font-sans text-ink-muted italic">
                          Drop loose notes here to attach them to this candidate question.
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-1.5">
                          {linkedNotes.map((ln) => (
                            <li
                              key={ln.id}
                              className="group flex items-start justify-between gap-2 p-1.5 bg-paper/60 border border-rule/40 rounded-[2px] text-xs"
                            >
                              <div className="flex flex-col">
                                <span className="font-serif text-[13px] text-ink leading-snug">
                                  {ln.text}
                                </span>
                                {ln.citation && (
                                  <span className="font-sans text-[10px] text-ink-muted mt-0.5">
                                    — {ln.citation}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() =>
                                  onUnlinkProblemFromCandidate(candidate.id, ln.id)
                                }
                                className="text-ink-muted hover:text-missing opacity-50 group-hover:opacity-100 p-0.5 rounded-[2px] transition-opacity cursor-pointer shrink-0"
                                title="Remove note from candidate (returns to loose)"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Promotion Action Footer */}
                    <div className="flex items-center justify-end pt-2 border-t border-rule/40">
                      <button
                        id={`btn-test-promotion-${candidate.id}`}
                        onClick={() => handleOpenPromoteModal(candidate)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-sans font-medium text-ink bg-surface border border-rule rounded-[2px] hover:border-ink-muted hover:bg-paper active:bg-paper transition-colors cursor-pointer"
                      >
                        <span>Test for promotion</span>
                        <ArrowRight className="w-3 h-3 text-ink-muted" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: EDIT OPEN PROBLEM NOTE
          ═══════════════════════════════════════════════════════════════ */}
      {editingNote && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 select-text"
        >
          <div className="w-full max-w-lg bg-surface border border-rule shadow-xl rounded-[2px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                EDIT OPEN PROBLEM NOTE
              </span>
              <button
                onClick={() => setEditingNote(null)}
                className="text-ink-muted hover:text-ink p-1 rounded-[2px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-ink-muted uppercase">
                  Observation *
                </span>
                <textarea
                  rows={3}
                  value={editNoteText}
                  onChange={(e) => setEditNoteText(e.target.value)}
                  className="bg-paper border border-rule p-2.5 font-serif text-[15px] text-ink rounded-[2px] focus:border-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-ink-muted uppercase">
                  Source *
                </span>
                <input
                  type="text"
                  value={editNoteSource}
                  onChange={(e) => setEditNoteSource(e.target.value)}
                  className="bg-paper border border-rule p-2 text-xs font-sans text-ink rounded-[2px] focus:border-ink focus:outline-none"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                onClick={() => setEditingNote(null)}
                className="px-3 py-1.5 text-xs font-sans text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editNoteText.trim()) {
                    onUpdateOpenProblem(
                      editingNote.id,
                      editNoteText.trim(),
                      editNoteSource.trim()
                    );
                    setEditingNote(null);
                  }
                }}
                disabled={!editNoteText.trim() || !editNoteSource.trim()}
                className="px-4 py-1.5 text-xs font-sans font-medium text-paper bg-ink rounded-[2px] disabled:opacity-40"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: CREATE CANDIDATE QUESTION
          ═══════════════════════════════════════════════════════════════ */}
      {isCreatingCandidate && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 select-text"
        >
          <div className="w-full max-w-lg bg-surface border border-rule shadow-xl rounded-[2px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                CREATE CANDIDATE QUESTION
              </span>
              <button
                onClick={() => setIsCreatingCandidate(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-[2px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-ink-muted uppercase">
                  Candidate Question Wording (Write in your own words) *
                </span>
                <textarea
                  rows={3}
                  placeholder="e.g. Does sparse coding depend on natural image statistics?"
                  value={newCandidateWording}
                  onChange={(e) => setNewCandidateWording(e.target.value)}
                  className="bg-paper border border-rule p-2.5 font-serif text-[16px] text-ink rounded-[2px] focus:border-ink focus:outline-none"
                  autoFocus
                />
              </label>

              {/* Attach loose notes selector */}
              {looseNotes.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">
                    Attach Loose Notes ({newCandidateSelectedNotes.length} selected):
                  </span>
                  <div className="max-h-36 overflow-y-auto border border-rule rounded-[2px] p-2 bg-paper flex flex-col gap-1.5">
                    {looseNotes.map((ln) => {
                      const isChecked = newCandidateSelectedNotes.includes(ln.id);
                      return (
                        <label
                          key={ln.id}
                          className="flex items-start gap-2 text-xs font-serif text-ink cursor-pointer hover:bg-surface p-1 rounded-[2px]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewCandidateSelectedNotes(
                                  newCandidateSelectedNotes.filter((id) => id !== ln.id)
                                );
                              } else {
                                setNewCandidateSelectedNotes([
                                  ...newCandidateSelectedNotes,
                                  ln.id,
                                ]);
                              }
                            }}
                            className="mt-0.5"
                          />
                          <span className="leading-snug">{ln.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                onClick={() => setIsCreatingCandidate(false)}
                className="px-3 py-1.5 text-xs font-sans text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                id="btn-commit-create-candidate"
                onClick={handleCommitCreateCandidate}
                disabled={!newCandidateWording.trim()}
                className="px-4 py-1.5 text-xs font-sans font-medium text-paper bg-ink rounded-[2px] disabled:opacity-40"
              >
                Create candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 3: EDIT CANDIDATE QUESTION WORDING
          ═══════════════════════════════════════════════════════════════ */}
      {editingCandidate && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 select-text"
        >
          <div className="w-full max-w-lg bg-surface border border-rule shadow-xl rounded-[2px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                EDIT CANDIDATE WORDING
              </span>
              <button
                onClick={() => setEditingCandidate(null)}
                className="text-ink-muted hover:text-ink p-1 rounded-[2px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-ink-muted uppercase">
                Candidate Question *
              </span>
              <textarea
                rows={3}
                value={editCandidateText}
                onChange={(e) => setEditCandidateText(e.target.value)}
                className="bg-paper border border-rule p-2.5 font-serif text-[16px] text-ink rounded-[2px] focus:border-ink focus:outline-none"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3 py-1.5 text-xs font-sans text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editCandidateText.trim()) {
                    onUpdateCandidateQuestion(
                      editingCandidate.id,
                      editCandidateText.trim()
                    );
                    setEditingCandidate(null);
                  }
                }}
                disabled={!editCandidateText.trim()}
                className="px-4 py-1.5 text-xs font-sans font-medium text-paper bg-ink rounded-[2px] disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 4: THE PROMOTION TEST PANEL (Strict Human Authoring)
          ═══════════════════════════════════════════════════════════════ */}
      {promotingCandidate && (
        <div
          id="promotion-test-modal"
          className="fixed inset-0 bg-ink/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 select-text overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-surface border border-rule shadow-2xl rounded-[2px] p-6 flex flex-col gap-5 my-8">
            {/* Header */}
            <div className="flex flex-col gap-1 pb-3 border-b border-rule">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                  PROMOTE TO QUESTION
                </span>
                <button
                  onClick={() => setPromotingCandidate(null)}
                  className="text-ink-muted hover:text-ink p-1 rounded-[2px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2">
                <span className="font-mono text-[10px] uppercase text-ink-muted tracking-wider block">
                  CANDIDATE
                </span>
                <div className="font-serif text-[17px] font-medium text-ink mt-0.5 leading-snug">
                  {promotingCandidate.text}
                </div>
                <span className="font-sans text-xs text-ink-muted mt-1 block">
                  {promotingCandidate.openProblemIds.length}{' '}
                  {promotingCandidate.openProblemIds.length === 1 ? 'note' : 'notes'} will move with
                  this question as provenance.
                </span>
              </div>
            </div>

            {/* Section: Write a claim that answers it */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                  WRITE A CLAIM THAT ANSWERS IT *
                </span>
                <span className="font-serif italic text-xs text-ink-muted">
                  A question you cannot answer yet is not ready to be a question.
                </span>
              </div>

              <textarea
                id="textarea-promote-claim"
                rows={3}
                placeholder="Write your preliminary claim hypothesis answering this question..."
                value={promoteClaimText}
                onChange={(e) => setPromoteClaimText(e.target.value)}
                className="w-full bg-paper border border-rule p-3 font-serif text-[15px] leading-relaxed text-ink rounded-[2px] focus:border-ink focus:outline-none"
                autoFocus
              />
            </div>

            {/* Checkbox 1: Falsifiability Test */}
            <div className="p-3.5 bg-paper/60 border border-rule rounded-[2px] flex flex-col gap-2.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="checkbox-promote-falsifiable"
                  type="checkbox"
                  checked={boxFalsifiable}
                  onChange={(e) => setBoxFalsifiable(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="font-sans text-sm font-semibold text-ink">
                    This claim could be false.
                  </span>
                  <span className="font-sans text-xs text-ink-muted">
                    Name what would show it false. If nothing could, it is not a claim.
                  </span>
                </div>
              </label>

              {boxFalsifiable && (
                <div className="pl-7 pt-1">
                  <input
                    id="input-falsification-condition"
                    type="text"
                    placeholder="State what observation or measurement would falsify this claim... *"
                    value={falsificationCondition}
                    onChange={(e) => setFalsificationCondition(e.target.value)}
                    className="w-full bg-surface border border-rule px-3 py-1.5 text-xs font-sans text-ink rounded-[2px] focus:border-ink focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Checkbox 2: Scope Settled in a Year */}
            <div className="p-3.5 bg-paper/60 border border-rule rounded-[2px]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="checkbox-promote-settled"
                  type="checkbox"
                  checked={boxSettledInYear}
                  onChange={(e) => setBoxSettledInYear(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="font-sans text-sm font-semibold text-ink">
                    This could be settled within a year.
                  </span>
                  <span className="font-sans text-xs text-ink-muted">
                    With the methods and access you actually have.
                  </span>
                </div>
              </label>
            </div>

            {/* Tags Section */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-mono text-[10px] uppercase text-ink-muted tracking-wider">
                TAGS (inherits active filter):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {promoteTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-rule rounded-[2px] font-mono text-[11px] text-ink"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-ink-muted hover:text-ink cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="+ add tag"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="w-24 bg-paper border border-rule px-1.5 py-0.5 text-[11px] font-mono rounded-[2px] focus:border-ink focus:outline-none"
                  />
                  {newTagInput && (
                    <button
                      onClick={handleAddTag}
                      className="text-[11px] font-mono px-1 bg-surface border border-rule rounded-[2px]"
                    >
                      add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Permanent Notice & Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-rule">
              <span className="font-mono text-[11px] text-ink-muted/80">
                Promotion is permanent. There is no demote.
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setPromotingCandidate(null)}
                  className="px-3 py-1.5 text-xs font-sans text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="btn-confirm-promote"
                  onClick={handleCommitPromotion}
                  disabled={!isPromoteValid}
                  title={!isPromoteValid ? `Cannot promote: ${getMissingPromotionReason()}` : undefined}
                  className={`px-4 py-1.5 text-xs font-sans font-medium rounded-[2px] transition-colors ${
                    isPromoteValid
                      ? 'bg-ink text-paper hover:bg-ink/90 cursor-pointer shadow-sm'
                      : 'bg-rule/60 text-ink-muted/60 cursor-not-allowed'
                  }`}
                >
                  {isPromoteValid ? 'Promote' : `Promote (${getMissingPromotionReason()})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
