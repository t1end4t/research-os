import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleDot,
  Edit3,
  FolderInput,
  Layers3,
  MoveUpRight,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { CandidateQuestion, ClusteringProposal, OpenProblemNote } from '../types';
import { setResearchItemDragData } from '../researchItemDrag';
import { Tooltip } from '../guidance';

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

type SurveySelection =
  | { type: 'note'; id: string }
  | { type: 'candidate'; id: string }
  | null;

const SURVEY_DRAG_TYPE = 'application/x-instrument-survey-note';
const SURVEY_MODEL_ID = 'cx/gpt-5.6-sol';

function clampTextStyle(lines = 2): React.CSSProperties {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  };
}

function FifteenSegmentRing({ count, sealed }: { count: number; sealed: boolean }) {
  return (
    <div
      className={`relative h-7 w-7 shrink-0 rounded-full transition-all ${
        sealed ? 'shadow-[0_0_18px_rgba(136,124,255,0.22)]' : ''
      }`}
      role="img"
      aria-label={`${Math.min(count, 15)} of 15 loose observation slots filled`}
    >
      {Array.from({ length: 15 }, (_, index) => (
        <span
          key={index}
          className={`absolute left-1/2 top-1/2 h-[5px] w-[1.5px] origin-[50%_12px] rounded-full transition-colors ${
            index < Math.min(count, 15)
              ? sealed
                ? 'bg-[#A69BFF]'
                : 'bg-[#76808D]'
              : 'bg-[#303844]'
          }`}
          style={{ transform: `translate(-50%, -12px) rotate(${index * 24}deg)` }}
        />
      ))}
      <span
        className={`absolute inset-[7px] rounded-full border ${
          sealed ? 'border-[#8277D7]/70 bg-[#665CC0]/20' : 'border-[#303844] bg-[#11151B]'
        }`}
      />
    </div>
  );
}

interface ObservationCardProps {
  key?: React.Key;
  note: OpenProblemNote;
  grouped?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  compact?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUngroup?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
}

function ObservationCard({
  note,
  grouped = false,
  selected = false,
  highlighted = false,
  compact = false,
  onSelect,
  onEdit,
  onDelete,
  onUngroup,
  onDragStart,
}: ObservationCardProps) {
  if (compact) {
    return (
      <div
        data-selected={selected}
        draggable
        onDragStart={onDragStart}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.();
        }}
        className={`survey-grouped-card group relative min-h-[54px] cursor-grab rounded-lg border px-2.5 py-2 text-left shadow-[0_5px_14px_rgba(0,0,0,0.16)] active:cursor-grabbing ${
          selected
            ? 'border-[#9388F2] bg-[#7770BD]/20 shadow-[0_0_0_2px_rgba(147,136,242,0.14)]'
            : 'border-[#494766]/85 bg-[#151525]/90 hover:border-[#716C94] hover:bg-[#1A192C]'
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8D84DC]" />
          <p className="text-[11px] leading-[1.45] text-[#CBD1DB]" style={clampTextStyle(2)}>
            {note.text}
          </p>
        </div>
        {onUngroup && (
          <Tooltip content="Return to loose observations">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onUngroup();
              }}
              className="absolute right-1.5 top-1.5 rounded-md p-1 text-[#7E8792] opacity-0 transition-all hover:bg-[#252B36] hover:text-[#EEF1F4] group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Return observation to loose field"
            >
              <MoveUpRight className="h-3 w-3" />
            </button>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div
      data-selected={selected}
      draggable
      onDragStart={onDragStart}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      className={`survey-observation-card group relative h-[94px] w-[176px] cursor-grab rounded-[10px] border bg-[#141A22] px-3.5 py-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-[border-color,background-color,box-shadow,transform] duration-200 active:cursor-grabbing ${
        selected
          ? 'z-20 border-[#9187E7] bg-[#171C27] shadow-[0_0_0_3px_rgba(145,135,231,0.14),0_18px_38px_rgba(0,0,0,0.32)]'
          : 'border-[#303A46] hover:z-10 hover:-translate-y-0.5 hover:border-[#53606D] hover:bg-[#19212A]'
      } ${
        highlighted
          ? 'animate-pulse border-[#A99FFF] shadow-[0_0_0_4px_rgba(169,159,255,0.12),0_20px_44px_rgba(0,0,0,0.3)]'
          : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`h-2 w-2 rounded-full ${
            grouped ? 'bg-[#8C82DC]' : 'border border-[#687381] bg-transparent'
          }`}
          aria-label={grouped ? 'Grouped observation' : 'Loose observation'}
        />
        <div className="flex items-center gap-0.5">
          {note.citation && (
            <Tooltip content={note.citation} placement="bottom">
              <span className="inline-flex rounded p-1 text-[#697482] transition-colors group-hover:text-[#A7B0BB]">
                <BookOpen className="h-3 w-3" />
              </span>
            </Tooltip>
          )}
          <div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Tooltip content="Inspect and move">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect?.();
                }}
                className="rounded p-1 text-[#78828E] hover:bg-[#252C36] hover:text-[#EEF1F4]"
                aria-label="Inspect observation"
              >
                <FolderInput className="h-3 w-3" />
              </button>
            </Tooltip>
            <Tooltip content="Edit observation">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.();
                }}
                className="rounded p-1 text-[#78828E] hover:bg-[#252C36] hover:text-[#EEF1F4]"
                aria-label="Edit observation"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            </Tooltip>
            <Tooltip content="Delete observation">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.();
                }}
                className="rounded p-1 text-[#78828E] hover:bg-[#3A2227] hover:text-[#E59B9B]"
                aria-label="Delete observation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      <p className="text-[13px] leading-[1.48] text-[#DDE2E8]" style={clampTextStyle(2)}>
        {note.text}
      </p>
    </div>
  );
}

interface CandidateIslandProps {
  candidate: CandidateQuestion;
  notes: OpenProblemNote[];
  selected: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onSelectNote: (id: string) => void;
  onDragStartNote: (event: React.DragEvent<HTMLDivElement>, note: OpenProblemNote) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onUngroup: (noteId: string) => void;
}

function CandidateIsland({
  candidate,
  notes,
  selected,
  dragOver,
  onSelect,
  onSelectNote,
  onDragStartNote,
  onDrop,
  onUngroup,
}: CandidateIslandProps) {
  const visibleNotes = notes.slice(0, 6);
  const hiddenCount = Math.max(0, notes.length - visibleNotes.length);

  return (
    <section
      data-selected={selected}
      data-drag-over={dragOver}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={onDrop}
      className={`survey-candidate-island relative w-[372px] rounded-[18px] border px-4 pb-4 pt-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition-[border-color,background-color,box-shadow,transform] duration-200 ${
        dragOver
          ? 'scale-[1.012] border-[#A69BFF] bg-[#302C55]/80 shadow-[0_0_0_4px_rgba(166,155,255,0.12),0_28px_70px_rgba(0,0,0,0.3)]'
          : selected
          ? 'border-[#8D83E2] bg-[#25233E]/90 shadow-[0_0_0_3px_rgba(141,131,226,0.12),0_28px_70px_rgba(0,0,0,0.28)]'
          : 'border-[#45435F]/80 bg-[#242238]/80 hover:border-[#646083] hover:bg-[#292641]/85'
      }`}
    >
      <span className="absolute right-4 top-4 rounded-full border border-[#5A5675] bg-[#171625]/70 px-2 py-0.5 text-[11px] text-[#A8A4BD]">
        {notes.length}
      </span>
      <h2 className="max-w-[300px] pr-6 text-[17px] font-medium leading-[1.38] text-[#F0EFF8]">
        {candidate.text}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {visibleNotes.map((note) => (
          <ObservationCard
            key={note.id}
            note={note}
            grouped
            compact
            onSelect={() => onSelectNote(note.id)}
            onUngroup={() => onUngroup(note.id)}
            onDragStart={(event) => onDragStartNote(event, note)}
          />
        ))}
        {notes.length === 0 && (
          <div className="col-span-2 h-16 rounded-xl border border-dashed border-[#55516D] bg-[#161522]/25" />
        )}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="min-h-[54px] rounded-lg border border-[#444159] bg-[#15141F]/55 text-[11px] text-[#AAA7BB] hover:border-[#686383] hover:text-[#E4E1F2]"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </section>
  );
}

function ProposalIsland({
  proposal,
  notes,
  focused,
  onReview,
  onReject,
}: {
  proposal: ClusteringProposal;
  notes: OpenProblemNote[];
  focused: boolean;
  onReview: () => void;
  onReject: () => void;
}) {
  return (
    <section
      data-focused={focused}
      onClick={(event) => event.stopPropagation()}
      className={`survey-proposal-island w-[236px] rounded-[16px] border border-dashed px-3.5 py-4 backdrop-blur-sm transition-all ${
        focused
          ? 'border-[#B2AAFF] bg-[#756CC4]/18 shadow-[0_0_0_4px_rgba(178,170,255,0.1),0_24px_60px_rgba(0,0,0,0.3)]'
          : 'border-[#68617F] bg-[#4A456B]/10 shadow-[0_18px_50px_rgba(0,0,0,0.18)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-[#D9D5ED]">Proposed cluster.</div>
          <div className="mt-0.5 text-[11px] text-[#8F8AA2]">{notes.length} notes</div>
        </div>
        <Sparkles className="h-4 w-4 text-[#8F88BD]" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {notes.slice(0, 4).map((note) => (
          <div
            key={note.id}
            className="survey-proposal-note min-h-[46px] rounded-lg border border-dashed border-[#514B68]/80 bg-[#15141F]/42 px-2 py-1.5 text-[10px] leading-[1.4] text-[#9994A8]"
            style={clampTextStyle(2)}
          >
            {note.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onReview}
          className="rounded-lg border border-[#615C7B] bg-[#28253D] px-2.5 py-1.5 text-[11px] font-medium text-[#E6E2F4] hover:border-[#8E86BA] hover:bg-[#312D4B]"
        >
          Review
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg px-2 py-1.5 text-[11px] text-[#9A95A8] hover:bg-[#211F2D] hover:text-[#D5D0E0]"
        >
          Reject
        </button>
      </div>
      <div className="mt-3 font-mono text-[9px] text-[#6F6A80]">{proposal.modelId || SURVEY_MODEL_ID}</div>
    </section>
  );
}

function FloatingPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      onClick={(event) => event.stopPropagation()}
      className="survey-floating-panel absolute right-5 top-5 z-40 flex max-h-[calc(100%-40px)] w-[328px] flex-col overflow-hidden rounded-xl border border-[#343D48] bg-[#11161D]/98 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-[#28303A] px-4 py-3">
        <h3 className="text-[13px] font-medium text-[#E8EBEF]">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[#7E8893] hover:bg-[#222932] hover:text-[#F0F2F4]"
          aria-label="Close inspector"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

function NoteInspector({
  note,
  membership,
  candidates,
  onClose,
  onSave,
  onMove,
  onDelete,
}: {
  note: OpenProblemNote;
  membership?: CandidateQuestion;
  candidates: CandidateQuestion[];
  onClose: () => void;
  onSave: (text: string, citation: string) => void;
  onMove: (candidateId: string | null) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [source, setSource] = useState(note.citation || '');

  useEffect(() => {
    setEditing(false);
    setText(note.text);
    setSource(note.citation || '');
  }, [note]);

  return (
    <FloatingPanel title="Observation" onClose={onClose}>
      {editing ? (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-[#8B95A1]">What is still open here?</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-lg border border-[#303945] bg-[#0B0F14] px-3 py-2.5 text-[13px] leading-relaxed text-[#E5E9ED] outline-none focus:border-[#7C73C9]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-[#8B95A1]">Source</span>
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="w-full rounded-lg border border-[#303945] bg-[#0B0F14] px-3 py-2 text-[12px] text-[#E5E9ED] outline-none focus:border-[#7C73C9]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-[11px] text-[#8F98A3] hover:bg-[#202730] hover:text-[#E7EAED]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!text.trim() || !source.trim()}
              onClick={() => {
                onSave(text.trim(), source.trim());
                setEditing(false);
              }}
              className="rounded-lg bg-[#E7E9ED] px-3 py-1.5 text-[11px] font-medium text-[#11151A] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[14px] leading-[1.65] text-[#E1E5E9]">{note.text}</p>
          {note.citation && (
            <div className="survey-source-box mt-5 rounded-lg border border-[#28313B] bg-[#0D1218] p-3">
              <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#A4ADB7]">
                <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#687481]" />
                <span>{note.citation}</span>
              </div>
            </div>
          )}
          <label className="mt-5 block">
            <span className="mb-1.5 block text-[11px] text-[#7F8995]">Current question</span>
            <div className="relative">
              <select
                value={membership?.id || ''}
                onChange={(event) => onMove(event.target.value || null)}
                className="w-full appearance-none rounded-lg border border-[#303945] bg-[#0D1218] px-3 py-2 pr-8 text-[12px] text-[#D8DDE2] outline-none focus:border-[#746BC1]"
              >
                <option value="">Loose observations</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.text}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#687481]" />
            </div>
          </label>
          <div className="mt-6 flex items-center justify-between border-t border-[#28303A] pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-[#A77D82] hover:bg-[#2C1B20] hover:text-[#E6A8AE]"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#333C47] bg-[#171D25] px-2.5 py-1.5 text-[11px] text-[#D7DCE1] hover:border-[#56606D] hover:bg-[#1C232C]"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
          </div>
        </>
      )}
    </FloatingPanel>
  );
}

function CandidateInspector({
  candidate,
  notes,
  onClose,
  onSave,
  onRemove,
  onPromote,
  onSelectNote,
}: {
  candidate: CandidateQuestion;
  notes: OpenProblemNote[];
  onClose: () => void;
  onSave: (text: string) => void;
  onRemove: () => void;
  onPromote: () => void;
  onSelectNote: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(candidate.text);

  useEffect(() => {
    setEditing(false);
    setText(candidate.text);
  }, [candidate]);

  return (
    <FloatingPanel title="Candidate question" onClose={onClose}>
      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            autoFocus
            className="w-full resize-none rounded-lg border border-[#3C4053] bg-[#0B0F14] px-3 py-2.5 text-[14px] leading-relaxed text-[#F0EFF8] outline-none focus:border-[#8E83E3]"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-[11px] text-[#8F98A3] hover:bg-[#202730] hover:text-[#E7EAED]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => {
                onSave(text.trim());
                setEditing(false);
              }}
              className="rounded-lg bg-[#E8E6F2] px-3 py-1.5 text-[11px] font-medium text-[#171522] disabled:opacity-35"
            >
              Save wording
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[17px] font-medium leading-[1.5] text-[#F0EFF7]">{candidate.text}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#3A4050] bg-[#171C25] px-2.5 py-1.5 text-[11px] text-[#CDD2D8] hover:border-[#606879]"
          >
            <Edit3 className="h-3 w-3" />
            Edit wording
          </button>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-[#7F8995]">Contained observations</span>
              <span className="text-[11px] text-[#777F8B]">{notes.length}</span>
            </div>
            <div className="space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelectNote(note.id)}
                  className="w-full rounded-lg border border-[#303445] bg-[#181724] px-3 py-2 text-left text-[11px] leading-[1.5] text-[#C5C4CF] hover:border-[#5B5774] hover:bg-[#1D1B2B]"
                >
                  {note.text}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[#28303A] pt-4">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-[#A77D82] hover:bg-[#2C1B20] hover:text-[#E6A8AE]"
            >
              <Trash2 className="h-3 w-3" />
              Delete island
            </button>
            <button
              type="button"
              onClick={onPromote}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#615B83] bg-[#2B2844] px-3 py-1.5 text-[11px] font-medium text-[#E8E5F4] hover:border-[#8D84BE] hover:bg-[#343052]"
            >
              Test for promotion
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </FloatingPanel>
  );
}

function CandidateComposer({
  title,
  notes,
  selectedIds,
  requireFixedSelection = false,
  modelId,
  onToggleNote,
  onCancel,
  onSubmit,
  onReject,
}: {
  title: string;
  notes: OpenProblemNote[];
  selectedIds: string[];
  requireFixedSelection?: boolean;
  modelId?: string;
  onToggleNote: (id: string) => void;
  onCancel: () => void;
  onSubmit: (wording: string) => void;
  onReject?: () => void;
}) {
  const [wording, setWording] = useState('');

  useEffect(() => setWording(''), [title, selectedIds.join('|')]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#06080B]/58 p-6 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="survey-modal w-full max-w-[520px] rounded-2xl border border-[#3A4350] bg-[#11161D] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.62)]"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[15px] font-medium text-[#EEF0F3]">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-[#7D8792] hover:bg-[#232A33] hover:text-white"
            aria-label="Close candidate editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-[11px] text-[#89939E]">Write the candidate question</span>
          <textarea
            autoFocus
            value={wording}
            onChange={(event) => setWording(event.target.value)}
            rows={3}
            placeholder="The question must be yours."
            className="w-full resize-none rounded-xl border border-[#343E49] bg-[#0A0E13] px-3.5 py-3 text-[15px] leading-relaxed text-[#EFF1F3] outline-none placeholder:text-[#505A65] focus:border-[#867CDD]"
          />
        </label>
        <div className="mt-4 grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {notes.map((note) => {
            const selected = selectedIds.includes(note.id);
            return (
              <button
                key={note.id}
                type="button"
                disabled={requireFixedSelection}
                onClick={() => onToggleNote(note.id)}
                className={`relative min-h-[58px] rounded-lg border px-2.5 py-2 text-left text-[11px] leading-[1.45] transition-colors ${
                  selected
                    ? 'border-[#736BBC] bg-[#292640] text-[#E0DEEC]'
                    : 'border-[#2C3540] bg-[#0D1218] text-[#909AA5] hover:border-[#4B5663]'
                } ${requireFixedSelection ? 'cursor-default' : ''}`}
              >
                <span style={clampTextStyle(2)}>{note.text}</span>
                {selected && <Check className="absolute right-2 top-2 h-3 w-3 text-[#9B92EA]" />}
              </button>
            );
          })}
        </div>
        {modelId && <div className="mt-3 font-mono text-[9px] text-[#686375]">{modelId}</div>}
        <div className="mt-5 flex items-center justify-between border-t border-[#28303A] pt-4">
          {onReject ? (
            <button
              type="button"
              onClick={onReject}
              className="rounded-lg px-2.5 py-1.5 text-[11px] text-[#A08E94] hover:bg-[#2A1D22] hover:text-[#E1A9B0]"
            >
              Reject grouping
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-[11px] text-[#8D97A2] hover:bg-[#222932] hover:text-[#E6E9EC]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!wording.trim() || selectedIds.length === 0}
              onClick={() => onSubmit(wording.trim())}
              className="rounded-lg bg-[#E8E9EE] px-3.5 py-1.5 text-[11px] font-medium text-[#11151A] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Create island
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PromotionDialog({
  candidate,
  activeProjectTag,
  onCancel,
  onPromote,
}: {
  candidate: CandidateQuestion;
  activeProjectTag: string;
  onCancel: () => void;
  onPromote: (claim: string, tags: string[], falsificationCondition: string) => void;
}) {
  const [claim, setClaim] = useState('');
  const [falsifiable, setFalsifiable] = useState(false);
  const [falsificationCondition, setFalsificationCondition] = useState('');
  const [settledInYear, setSettledInYear] = useState(false);
  const [tags, setTags] = useState<string[]>(
    activeProjectTag && activeProjectTag !== 'all' ? [activeProjectTag] : ['tinyml']
  );
  const [tagInput, setTagInput] = useState('');
  const valid =
    claim.trim().length > 0 &&
    falsifiable &&
    falsificationCondition.trim().length > 0 &&
    settledInYear;

  const addTag = () => {
    const nextTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (nextTag && !tags.includes(nextTag)) setTags((current) => [...current, nextTag]);
    setTagInput('');
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05070A]/72 p-5 backdrop-blur-[3px]"
      onClick={onCancel}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="survey-modal max-h-[calc(100vh-40px)] w-full max-w-[620px] overflow-y-auto rounded-2xl border border-[#39424D] bg-[#11161D] p-5 shadow-[0_36px_110px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-[11px] text-[#7F8994]">Promotion test</div>
            <h3 className="mt-1 max-w-[500px] text-[18px] font-medium leading-[1.45] text-[#EDF0F2]">
              {candidate.text}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-[#7E8792] hover:bg-[#222932] hover:text-white"
            aria-label="Close promotion test"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[11px] text-[#89939E]">Write a claim that answers it</span>
          <textarea
            value={claim}
            onChange={(event) => setClaim(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-[#343E49] bg-[#0A0E13] px-3.5 py-3 text-[14px] leading-relaxed text-[#EFF1F3] outline-none focus:border-[#7E75D2]"
          />
        </label>
        <div className="mt-4 space-y-3">
          <label className="block rounded-xl border border-[#2F3843] bg-[#0D1218] p-3.5">
            <span className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={falsifiable}
                onChange={(event) => setFalsifiable(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-[13px] font-medium text-[#E0E4E8]">This claim could be false.</span>
                <span className="mt-0.5 block text-[11px] text-[#7F8994]">Commit to what would count against it.</span>
              </span>
            </span>
            {falsifiable && (
              <input
                autoFocus
                value={falsificationCondition}
                onChange={(event) => setFalsificationCondition(event.target.value)}
                placeholder="What result would show the claim is false?"
                className="mt-3 w-full rounded-lg border border-[#343D48] bg-[#090D12] px-3 py-2 text-[12px] text-[#E5E8EB] outline-none placeholder:text-[#58626D] focus:border-[#776FC6]"
              />
            )}
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-[#2F3843] bg-[#0D1218] p-3.5">
            <input
              type="checkbox"
              checked={settledInYear}
              onChange={(event) => setSettledInYear(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-[13px] font-medium text-[#E0E4E8]">This could be settled within a year.</span>
              <span className="mt-0.5 block text-[11px] text-[#7F8994]">With the methods and access you actually have.</span>
            </span>
          </label>
        </div>
        <div className="mt-4">
          <span className="text-[11px] text-[#7F8994]">Tags</span>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-[#38414C] bg-[#171D24] px-2.5 py-1 text-[10px] text-[#C5CBD1]"
              >
                {tag}
                <button type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag"
              className="w-24 rounded-full border border-[#343D48] bg-[#0A0E13] px-2.5 py-1 text-[10px] text-[#D9DDE1] outline-none focus:border-[#6F67B8]"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-[#28303A] pt-4">
          <span className="text-[10px] text-[#6F7984]">Promotion is one-way.</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-[11px] text-[#8E98A3] hover:bg-[#222932] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => onPromote(claim.trim(), tags, falsificationCondition.trim())}
              className="rounded-lg bg-[#E8E9ED] px-4 py-1.5 text-[11px] font-medium text-[#11151A] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Promote
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ObservationComposer({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (text: string, source: string) => void;
}) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const valid = text.trim().length > 0 && source.trim().length > 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit(text.trim(), source.trim());
      }}
      className="survey-floating-panel absolute right-0 top-10 z-[60] w-[330px] rounded-xl border border-[#37404B] bg-[#11161D] p-3.5 shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
    >
      <textarea
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="What is still open here?"
        className="w-full resize-none rounded-lg border border-[#303945] bg-[#0A0E13] px-3 py-2.5 text-[13px] leading-relaxed text-[#E7EAED] outline-none placeholder:text-[#5D6772] focus:border-[#746BC2]"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder="Source"
          className="min-w-0 flex-1 rounded-lg border border-[#303945] bg-[#0A0E13] px-3 py-2 text-[11px] text-[#DCE0E4] outline-none placeholder:text-[#5D6772] focus:border-[#746BC2]"
        />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2 py-2 text-[10px] text-[#7E8893] hover:bg-[#222932] hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid}
          className="rounded-lg bg-[#E7E9EC] px-3 py-2 text-[10px] font-medium text-[#11151A] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Add observation
        </button>
      </div>
    </form>
  );
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
  const [selection, setSelection] = useState<SurveySelection>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [candidateComposerOpen, setCandidateComposerOpen] = useState(false);
  const [candidateSelectedIds, setCandidateSelectedIds] = useState<string[]>([]);
  const [reviewingProposalId, setReviewingProposalId] = useState<string | null>(null);
  const [draggedProblemId, setDraggedProblemId] = useState<string | null>(null);
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);
  const [looseDropActive, setLooseDropActive] = useState(false);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<{ text: string; source: string } | null>(
    null
  );
  const [promotingCandidate, setPromotingCandidate] = useState<CandidateQuestion | null>(null);
  const [promotedInfo, setPromotedInfo] = useState<{ id: string; text: string } | null>(null);
  const [proposals, setProposals] = useState<ClusteringProposal[]>([
    {
      id: 'prop-natural-images',
      groupName: '',
      problemIds: ['op-1', 'op-7', 'op-11'],
      problemSnippets: [],
      modelId: SURVEY_MODEL_ID,
    },
  ]);
  const composerRef = useRef<HTMLDivElement | null>(null);

  const problemToCandidateMap = useMemo(() => {
    const map = new Map<string, CandidateQuestion>();
    [...candidateQuestions]
      .sort((first, second) => first.createdAt - second.createdAt)
      .forEach((candidate) => {
        candidate.openProblemIds.forEach((problemId) => {
          if (!map.has(problemId)) map.set(problemId, candidate);
        });
      });
    return map;
  }, [candidateQuestions]);

  const looseNotes = useMemo(
    () => openProblems.filter((note) => !problemToCandidateMap.has(note.id)),
    [openProblems, problemToCandidateMap]
  );
  const groupedNotes = useMemo(
    () => openProblems.filter((note) => problemToCandidateMap.has(note.id)),
    [openProblems, problemToCandidateMap]
  );
  const chronologicalCandidates = useMemo(
    () => [...candidateQuestions].sort((first, second) => first.createdAt - second.createdAt),
    [candidateQuestions]
  );
  const isHardStopActive = looseNotes.length >= 15 && candidateQuestions.length < 3;
  const notesForCandidate = (candidateId: string) =>
    openProblems.filter((note) => problemToCandidateMap.get(note.id)?.id === candidateId);

  const visibleProposals = useMemo(
    () =>
      proposals
        .map((proposal) => ({
          ...proposal,
          problemIds: proposal.problemIds.filter((id) => looseNotes.some((note) => note.id === id)),
        }))
        .filter((proposal) => proposal.problemIds.length > 0),
    [looseNotes, proposals]
  );
  const fieldHeight = Math.max(
    820,
    138 + Math.ceil(Math.max(1, looseNotes.length) / 3) * 114,
    142 + visibleProposals.length * 250,
    142 + chronologicalCandidates.length * 268
  );

  const reviewingProposal = visibleProposals.find(
    (proposal) => proposal.id === reviewingProposalId
  );
  const selectedNote =
    selection?.type === 'note' ? openProblems.find((note) => note.id === selection.id) : undefined;
  const selectedCandidate =
    selection?.type === 'candidate'
      ? candidateQuestions.find((candidate) => candidate.id === selection.id)
      : undefined;

  useEffect(() => {
    if (!pendingHighlight) return;
    const created = openProblems.find(
      (note) => note.text === pendingHighlight.text && note.citation === pendingHighlight.source
    );
    if (!created) return;
    setHighlightedNoteId(created.id);
    setPendingHighlight(null);
    const timeout = window.setTimeout(() => setHighlightedNoteId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [openProblems, pendingHighlight]);

  useEffect(() => {
    if (!composerOpen) return;
    const closeComposer = (event: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        setComposerOpen(false);
      }
    };
    document.addEventListener('mousedown', closeComposer);
    return () => document.removeEventListener('mousedown', closeComposer);
  }, [composerOpen]);

  const startNoteDrag = (event: React.DragEvent<HTMLDivElement>, note: OpenProblemNote) => {
    setDraggedProblemId(note.id);
    setResearchItemDragData(event.dataTransfer, { id: note.id, type: 'SURVEY', label: note.text });
    event.dataTransfer.setData(SURVEY_DRAG_TYPE, note.id);
    event.dataTransfer.effectAllowed = 'copyMove';
  };

  const getDraggedNoteId = (event: React.DragEvent) =>
    event.dataTransfer.getData(SURVEY_DRAG_TYPE) || draggedProblemId;

  const moveNote = (problemId: string, targetCandidateId: string | null) => {
    candidateQuestions.forEach((candidate) => {
      if (candidate.openProblemIds.includes(problemId) && candidate.id !== targetCandidateId) {
        onUnlinkProblemFromCandidate(candidate.id, problemId);
      }
    });
    if (targetCandidateId) {
      const target = candidateQuestions.find((candidate) => candidate.id === targetCandidateId);
      if (target && !target.openProblemIds.includes(problemId)) {
        onLinkProblemToCandidate(targetCandidateId, problemId);
      }
    }
  };

  const handleCandidateDrop = (event: React.DragEvent<HTMLDivElement>, candidateId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const problemId = getDraggedNoteId(event);
    if (problemId) moveNote(problemId, candidateId);
    setDraggedProblemId(null);
    setDragOverCandidateId(null);
    setLooseDropActive(false);
  };

  const handleLooseDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const problemId = getDraggedNoteId(event);
    if (problemId) moveNote(problemId, null);
    setDraggedProblemId(null);
    setDragOverCandidateId(null);
    setLooseDropActive(false);
  };

  const openCandidateComposer = (selectedIds: string[] = []) => {
    setCandidateSelectedIds(selectedIds);
    setCandidateComposerOpen(true);
  };

  const triggerProposal = () => {
    if (looseNotes.length === 0) return;
    onClusterNotes(looseNotes.map((note) => note.id));
    const selected = looseNotes.slice(0, Math.min(4, looseNotes.length));
    setProposals((current) => [
      {
        id: `prop-${Date.now()}`,
        groupName: '',
        problemIds: selected.map((note) => note.id),
        problemSnippets: selected.map((note) => note.text),
        modelId: SURVEY_MODEL_ID,
      },
      ...current,
    ]);
  };

  return (
    <div className="survey-surface flex h-full w-full flex-col overflow-hidden bg-[#0B0D10] font-sans text-[#E7EAED]">
      <header className="survey-header relative z-50 flex h-[62px] shrink-0 items-center justify-between border-b border-[#242B34] bg-[#0B0D10] px-6">
        <h1 className="text-[16px] font-semibold tracking-[-0.01em] text-[#F1F3F5]">Survey</h1>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-[12px] text-[#929BA5]">
            <span>{looseNotes.length} loose</span>
            <FifteenSegmentRing count={looseNotes.length} sealed={isHardStopActive} />
          </div>
          <span className="text-[12px] text-[#7F8893]">{groupedNotes.length} grouped</span>
          <div className="relative" ref={composerRef}>
            <button
              type="button"
              disabled={isHardStopActive}
              onClick={() => setComposerOpen((open) => !open)}
              className="survey-add-button inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#343C47] bg-[#151A21] px-3 text-[11px] font-medium text-[#E2E6EA] shadow-sm hover:border-[#515B68] hover:bg-[#192029] disabled:cursor-not-allowed disabled:border-[#292E36] disabled:bg-[#101318] disabled:text-[#555D66]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add observation
            </button>
            {composerOpen && !isHardStopActive && (
              <ObservationComposer
                onCancel={() => setComposerOpen(false)}
                onSubmit={(text, source) => {
                  setPendingHighlight({ text, source });
                  onAddOpenProblem(text, source);
                  setComposerOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </header>

      <div
        className="survey-canvas relative min-h-0 flex-1 overflow-auto bg-[#0B0D10]"
        onClick={() => setSelection(null)}
      >
        <div
          id="survey-cluster-field"
          aria-label="Survey cluster field"
          className="relative min-w-[1368px] overflow-hidden"
          style={{ height: fieldHeight }}
          onDragOver={(event) => {
            if (!draggedProblemId) return;
            event.preventDefault();
            setLooseDropActive(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setLooseDropActive(false);
          }}
          onDrop={handleLooseDrop}
        >
          <div
            className={`survey-lane survey-loose-field pointer-events-none absolute bottom-6 left-6 top-5 w-[612px] rounded-[24px] border transition-all duration-200 ${
              isHardStopActive
                ? 'border-[#4A465B]/55 bg-[#171622]/25 shadow-[inset_0_0_90px_rgba(72,66,105,0.16)]'
                : looseDropActive
                ? 'border-dashed border-[#8177C8]/65 bg-[#26233B]/15'
                : 'border-[#171D24]/65 bg-[radial-gradient(ellipse_at_top_left,rgba(35,43,52,0.22),transparent_68%)]'
            }`}
          />

          <div className="survey-lane survey-candidate-field pointer-events-none absolute bottom-6 left-[926px] top-5 w-[418px] rounded-[24px] border" />

          <div className="survey-lane-header absolute left-10 top-8 w-[560px]" data-kind="observation">
            <div>
              <div className="survey-lane-title">
                <span className="survey-lane-dot" />
                Open problems
              </div>
              <p>Unresolved observations, kept separate until a pattern is defensible.</p>
            </div>
            <span className="survey-lane-count">{looseNotes.length}</span>
          </div>

          <div className="survey-bridge-caption absolute left-[676px] top-8 flex w-[198px] items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" />
            <span>Assistant proposal</span>
            <span className="survey-lane-count">{visibleProposals.length}</span>
          </div>

          <div className="survey-bridge-line absolute left-[618px] top-[226px] w-[308px]" aria-hidden="true" />

          <div className="survey-lane-header absolute left-[946px] top-8 w-[278px]" data-kind="candidate">
            <div>
              <div className="survey-lane-title">
                <span className="survey-lane-dot" />
                Candidate questions
              </div>
              <p>Accepted structures that may become real questions.</p>
            </div>
            <span className="survey-lane-count">{chronologicalCandidates.length}</span>
          </div>

          <div className={isHardStopActive ? 'opacity-45 transition-opacity duration-300' : ''}>
            {looseNotes.map((note, index) => {
              const column = index % 3;
              const row = Math.floor(index / 3);
              const left = 42 + column * 190;
              const top = 104 + row * 114;
              return (
                <div key={note.id} className="absolute" style={{ left, top }}>
                  <ObservationCard
                    note={note}
                    selected={selection?.type === 'note' && selection.id === note.id}
                    highlighted={highlightedNoteId === note.id}
                    onSelect={() => setSelection({ type: 'note', id: note.id })}
                    onEdit={() => setSelection({ type: 'note', id: note.id })}
                    onDelete={() => {
                      onRemoveOpenProblem(note.id);
                      if (selection?.type === 'note' && selection.id === note.id) setSelection(null);
                    }}
                    onDragStart={(event) => startNoteDrag(event, note)}
                  />
                </div>
              );
            })}
          </div>

          {chronologicalCandidates.map((candidate, index) => {
            const top = 104 + index * 268;
            return (
              <div
                key={candidate.id}
                className="absolute"
                style={{ left: 948, top }}
                onDragEnter={() => setDragOverCandidateId(candidate.id)}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragOverCandidateId(null);
                  }
                }}
              >
                <CandidateIsland
                  candidate={candidate}
                  notes={notesForCandidate(candidate.id)}
                  selected={selection?.type === 'candidate' && selection.id === candidate.id}
                  dragOver={dragOverCandidateId === candidate.id}
                  onSelect={() => setSelection({ type: 'candidate', id: candidate.id })}
                  onSelectNote={(id) => setSelection({ type: 'note', id })}
                  onDragStartNote={startNoteDrag}
                  onDrop={(event) => handleCandidateDrop(event, candidate.id)}
                  onUngroup={(noteId) => moveNote(noteId, null)}
                />
              </div>
            );
          })}

          {!onlyMine &&
            visibleProposals.map((proposal, index) => {
              const notes = proposal.problemIds
                .map((id) => openProblems.find((note) => note.id === id))
                .filter((note): note is OpenProblemNote => Boolean(note));
              return (
                <div
                  key={proposal.id}
                  className="absolute"
                  style={{ left: 654, top: 104 + index * 250 }}
                >
                  <ProposalIsland
                    proposal={proposal}
                    notes={notes}
                    focused={reviewingProposalId === proposal.id}
                    onReview={() => setReviewingProposalId(proposal.id)}
                    onReject={() => {
                      setProposals((current) => current.filter((item) => item.id !== proposal.id));
                      if (reviewingProposalId === proposal.id) setReviewingProposalId(null);
                    }}
                  />
                </div>
              );
            })}

          <div className="survey-field-actions absolute right-9 top-[30px] flex items-center gap-2">
            {!onlyMine && (
              <Tooltip content="Ask the assistant to propose clusters" placement="left">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    triggerProposal();
                  }}
                  disabled={looseNotes.length === 0}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#303844] bg-[#10151B] text-[#77818D] shadow-lg hover:border-[#55516C] hover:bg-[#171B26] hover:text-[#A9A1E1] disabled:opacity-30"
                  aria-label="Propose clusters"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            )}
            <Tooltip content="Create a candidate question" placement="left">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openCandidateComposer();
                }}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#3B3B50] bg-[#171625] text-[#8882A7] shadow-lg hover:border-[#686184] hover:bg-[#232139] hover:text-[#D7D2EC]"
                aria-label="Create candidate question"
              >
                <Layers3 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>

          {isHardStopActive && (
            <div
              className="absolute left-[356px] top-[72px] z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[#554F70] bg-[#171622]/95 px-3 py-2 shadow-[0_16px_44px_rgba(0,0,0,0.34)]"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[#645D86] bg-[#292541] text-[#A59CE7]">
                <CircleDot className="h-3.5 w-3.5" />
              </span>
              <button
                type="button"
                onClick={() => {
                  if (visibleProposals[0]) setReviewingProposalId(visibleProposals[0].id);
                  else openCandidateComposer();
                }}
                className="text-[11px] font-medium text-[#D7D3E8] hover:text-white"
              >
                Create or review candidate questions
              </button>
            </div>
          )}

          {selectedNote && (
            <NoteInspector
              note={selectedNote}
              membership={problemToCandidateMap.get(selectedNote.id)}
              candidates={chronologicalCandidates}
              onClose={() => setSelection(null)}
              onSave={(text, source) => onUpdateOpenProblem(selectedNote.id, text, source)}
              onMove={(candidateId) => moveNote(selectedNote.id, candidateId)}
              onDelete={() => {
                onRemoveOpenProblem(selectedNote.id);
                setSelection(null);
              }}
            />
          )}

          {selectedCandidate && (
            <CandidateInspector
              candidate={selectedCandidate}
              notes={notesForCandidate(selectedCandidate.id)}
              onClose={() => setSelection(null)}
              onSave={(text) => onUpdateCandidateQuestion(selectedCandidate.id, text)}
              onRemove={() => {
                onRemoveCandidateQuestion(selectedCandidate.id);
                setSelection(null);
              }}
              onPromote={() => setPromotingCandidate(selectedCandidate)}
              onSelectNote={(id) => setSelection({ type: 'note', id })}
            />
          )}

          {candidateComposerOpen && (
            <CandidateComposer
              title="Form a candidate question"
              notes={looseNotes}
              selectedIds={candidateSelectedIds}
              onToggleNote={(id) =>
                setCandidateSelectedIds((current) =>
                  current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
                )
              }
              onCancel={() => setCandidateComposerOpen(false)}
              onSubmit={(wording) => {
                onAddCandidateQuestion(wording, candidateSelectedIds);
                setCandidateComposerOpen(false);
                setCandidateSelectedIds([]);
              }}
            />
          )}

          {reviewingProposal && (
            <CandidateComposer
              title="Review proposed cluster"
              notes={reviewingProposal.problemIds
                .map((id) => openProblems.find((note) => note.id === id))
                .filter((note): note is OpenProblemNote => Boolean(note))}
              selectedIds={reviewingProposal.problemIds}
              requireFixedSelection
              modelId={reviewingProposal.modelId || SURVEY_MODEL_ID}
              onToggleNote={() => undefined}
              onCancel={() => setReviewingProposalId(null)}
              onReject={() => {
                setProposals((current) =>
                  current.filter((proposal) => proposal.id !== reviewingProposal.id)
                );
                setReviewingProposalId(null);
              }}
              onSubmit={(wording) => {
                onAddCandidateQuestion(wording, reviewingProposal.problemIds);
                setProposals((current) =>
                  current.filter((proposal) => proposal.id !== reviewingProposal.id)
                );
                setReviewingProposalId(null);
              }}
            />
          )}

          {promotedInfo && (
            <div
              className="absolute bottom-5 left-5 z-40 flex items-center gap-3 rounded-xl border border-[#384248] bg-[#11181B]/95 px-3 py-2.5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Check className="h-3.5 w-3.5 text-[#7FB18E]" />
              <span className="max-w-64 truncate text-[11px] text-[#C9D0D4]">
                Promoted: {promotedInfo.text}
              </span>
              {onNavigateToMap && (
                <button
                  type="button"
                  onClick={() => onNavigateToMap(promotedInfo.id)}
                  className="text-[11px] font-medium text-[#A9B6C0] hover:text-white"
                >
                  View
                </button>
              )}
              <button
                type="button"
                onClick={() => setPromotedInfo(null)}
                className="rounded p-0.5 text-[#67727C] hover:text-white"
                aria-label="Dismiss promotion notice"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {promotingCandidate && (
        <PromotionDialog
          candidate={promotingCandidate}
          activeProjectTag={activeProjectTag}
          onCancel={() => setPromotingCandidate(null)}
          onPromote={(claim, tags, falsificationCondition) => {
            const questionId = onPromoteCandidate(
              promotingCandidate,
              claim,
              tags,
              falsificationCondition
            );
            setPromotedInfo({
              id: typeof questionId === 'string' ? questionId : `q-${Date.now()}`,
              text: promotingCandidate.text,
            });
            setPromotingCandidate(null);
            setSelection(null);
          }}
        />
      )}
    </div>
  );
}
