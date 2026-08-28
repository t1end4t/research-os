import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Check,
  Trash2,
  Unlink,
  Link2,
  ArrowRight,
  Sparkles,
  BookOpen,
  CircleDotDashed,
  Network,
  Calendar,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote } from '../../types';

interface SurveyNodeInspectorProps {
  selectedNode:
    | { type: 'problem'; problem: OpenProblemNote; linkedCandidate?: CandidateQuestion }
    | { type: 'candidate'; candidate: CandidateQuestion; linkedProblems: OpenProblemNote[] }
    | null;
  onClose: () => void;
  candidateQuestions: CandidateQuestion[];
  allOpenProblems: OpenProblemNote[];
  onUpdateOpenProblem: (id: string, text: string, citation?: string) => void;
  onRemoveOpenProblem: (id: string) => void;
  onUpdateCandidateQuestion: (id: string, text: string) => void;
  onRemoveCandidateQuestion: (id: string) => void;
  onLinkProblemToCandidate: (candidateId: string, problemId: string) => void;
  onUnlinkProblemFromCandidate: (candidateId: string, problemId: string) => void;
  onOpenPromoteModal: (candidate: CandidateQuestion) => void;
  onSelectNodeById: (type: 'problem' | 'candidate', id: string) => void;
}

export function SurveyNodeInspector({
  selectedNode,
  onClose,
  candidateQuestions,
  allOpenProblems,
  onUpdateOpenProblem,
  onRemoveOpenProblem,
  onUpdateCandidateQuestion,
  onRemoveCandidateQuestion,
  onLinkProblemToCandidate,
  onUnlinkProblemFromCandidate,
  onOpenPromoteModal,
  onSelectNodeById,
}: SurveyNodeInspectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editCitation, setEditCitation] = useState('');
  const [linkTargetCandidateId, setLinkTargetCandidateId] = useState('');
  const [linkTargetProblemId, setLinkTargetProblemId] = useState('');

  useEffect(() => {
    setIsEditing(false);
    if (selectedNode?.type === 'problem') {
      setEditText(selectedNode.problem.text);
      setEditCitation(selectedNode.problem.citation || '');
      setLinkTargetCandidateId(selectedNode.linkedCandidate?.id || '');
    } else if (selectedNode?.type === 'candidate') {
      setEditText(selectedNode.candidate.text);
      setEditCitation('');
      setLinkTargetProblemId('');
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const isProblem = selectedNode.type === 'problem';
  const problem = isProblem ? selectedNode.problem : null;
  const candidate = !isProblem ? selectedNode.candidate : null;
  const linkedCandidate = isProblem ? selectedNode.linkedCandidate : null;
  const linkedProblems = !isProblem ? selectedNode.linkedProblems : [];

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (isProblem && problem) {
      onUpdateOpenProblem(problem.id, editText.trim(), editCitation.trim() || undefined);
    } else if (candidate) {
      onUpdateCandidateQuestion(candidate.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleLinkProblemToNewCandidate = (targetCandidateId: string) => {
    if (!problem || !targetCandidateId) return;
    onLinkProblemToCandidate(targetCandidateId, problem.id);
  };

  const handleAddProblemToCandidate = () => {
    if (!candidate || !linkTargetProblemId) return;
    onLinkProblemToCandidate(candidate.id, linkTargetProblemId);
    setLinkTargetProblemId('');
  };

  const availableUnlinkedProblems = allOpenProblems.filter(
    (p) => !candidate?.openProblemIds.includes(p.id)
  );

  return (
    <aside
      id="obsidian-node-inspector"
      aria-label="Node Inspector"
      className="absolute top-4 right-4 z-30 w-88 max-h-[calc(100vh-140px)] flex flex-col rounded-2xl bg-white/95 dark:bg-[#15151a]/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800/90 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Inspector Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/70 dark:bg-[#1a1a22]/70">
        <div className="flex items-center gap-2">
          {isProblem ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <CircleDotDashed className="w-3 h-3" />
              Open Problem
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
              <Network className="w-3 h-3" />
              Candidate Question
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-md text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800"
              title="Edit text"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800"
            title="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-stone-800 dark:text-stone-200 custom-scrollbar text-xs">
        {/* Editing Mode */}
        {isEditing ? (
          <div className="space-y-3 bg-stone-50 dark:bg-[#1a1a22] p-3 rounded-xl border border-stone-200/70 dark:border-stone-800/80">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                {isProblem ? 'Open Problem Question' : 'Candidate Question'}
              </label>
              <textarea
                rows={4}
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full resize-none rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121216] px-2.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {isProblem && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Source / Citation
                </label>
                <input
                  type="text"
                  value={editCitation}
                  onChange={(e) => setEditCitation(e.target.value)}
                  placeholder="e.g. Olshausen & Field 1996"
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121216] px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-xs"
              >
                <Check className="w-3 h-3" />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium leading-relaxed text-stone-900 dark:text-stone-100 selection:bg-purple-500/20">
                {isProblem ? problem?.text : candidate?.text}
              </p>

              {isProblem && problem?.citation && (
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800/60 px-2 py-1 rounded-lg w-fit">
                  <BookOpen className="w-3 h-3 text-stone-400" />
                  <span className="font-mono">{problem.citation}</span>
                </div>
              )}
            </div>

            {/* Timestamps & Metadata */}
            <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800/80">
              <Calendar className="w-3 h-3" />
              <span>
                Created{' '}
                {new Date(
                  (isProblem ? problem?.createdAt : candidate?.createdAt) || Date.now()
                ).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        )}

        {/* Section: Relationships & Clustering */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Cluster Connections</span>
            </div>
            <span className="text-[10px] font-normal lowercase text-stone-400">
              {isProblem
                ? linkedCandidate
                  ? '1 linked candidate'
                  : 'unlinked'
                : `${linkedProblems.length} linked notes`}
            </span>
          </div>

          {/* If Open Problem: Show linked candidate or allow selecting one */}
          {isProblem && problem && (
            <div className="space-y-2 bg-stone-50 dark:bg-[#1a1a22] p-2.5 rounded-xl border border-stone-100 dark:border-stone-800/80">
              {linkedCandidate ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">
                    Current Candidate
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#121216] border border-purple-500/30">
                    <button
                      type="button"
                      onClick={() => onSelectNodeById('candidate', linkedCandidate.id)}
                      className="text-left font-medium text-purple-700 dark:text-purple-300 hover:underline line-clamp-2 text-xs"
                    >
                      {linkedCandidate.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUnlinkProblemFromCandidate(linkedCandidate.id, problem.id)}
                      title="Unlink from candidate"
                      className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    This problem is free-floating (unresolved).
                  </div>
                  {candidateQuestions.length > 0 ? (
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-semibold block">
                        Link to Candidate Question:
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleLinkProblemToNewCandidate(e.target.value);
                        }}
                        className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121216] px-2 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Candidate Question...</option>
                        {candidateQuestions.map((cq) => (
                          <option key={cq.id} value={cq.id}>
                            {cq.text}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-400">
                      Create a candidate question to link this note.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* If Candidate Question: List linked problems + allow adding unlinked ones */}
          {!isProblem && candidate && (
            <div className="space-y-2 bg-stone-50 dark:bg-[#1a1a22] p-2.5 rounded-xl border border-stone-100 dark:border-stone-800/80">
              {linkedProblems.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                  {linkedProblems.map((lp) => (
                    <div
                      key={lp.id}
                      className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#121216] border border-stone-200/60 dark:border-stone-800/60 hover:border-purple-500/40 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectNodeById('problem', lp.id)}
                        className="text-left text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 hover:text-purple-600 dark:hover:text-purple-400 line-clamp-2"
                      >
                        {lp.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnlinkProblemFromCandidate(candidate.id, lp.id)}
                        title="Unlink note"
                        className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                      >
                        <Unlink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 italic py-1">
                  No open problems linked yet. Drag problems onto this node or link below.
                </p>
              )}

              {/* Link more notes */}
              {availableUnlinkedProblems.length > 0 && (
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 flex gap-1.5">
                  <select
                    value={linkTargetProblemId}
                    onChange={(e) => setLinkTargetProblemId(e.target.value)}
                    className="flex-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121216] px-2 py-1 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">+ Link another problem note...</option>
                    {availableUnlinkedProblems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.text.length > 40 ? `${p.text.slice(0, 40)}...` : p.text}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!linkTargetProblemId}
                    onClick={handleAddProblemToCandidate}
                    className="px-2.5 py-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg disabled:opacity-30 text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Candidate Question Promotion Action */}
        {!isProblem && candidate && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <button
              id={`promote-btn-${candidate.id}`}
              type="button"
              onClick={() => onOpenPromoteModal(candidate)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium text-xs shadow-md transition-all cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>Promote to Question Node</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Danger zone: Delete note */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex justify-between items-center text-stone-400">
          <span className="text-[10px]">ID: {isProblem ? problem?.id : candidate?.id}</span>
          <button
            type="button"
            onClick={() => {
              if (isProblem && problem) {
                onRemoveOpenProblem(problem.id);
                onClose();
              } else if (candidate) {
                onRemoveCandidateQuestion(candidate.id);
                onClose();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-red-500/80 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
