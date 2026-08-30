import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Check,
  Trash2,
  Unlink,
  Link2,
  ArrowRight,
  GitBranch,
  BookOpen,
  CircleDotDashed,
  Calendar,
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote } from '../../types';
import { SectionLabel, Button } from '../ui/instrument';

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
  const [linkTargetProblemId, setLinkTargetProblemId] = useState('');

  useEffect(() => {
    setIsEditing(false);
    if (selectedNode?.type === 'problem') {
      setEditText(selectedNode.problem.text);
      setEditCitation(selectedNode.problem.citation || '');
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
      id="survey-node-inspector"
      aria-label="Survey Node Inspector"
      className="absolute top-4 right-4 z-30 w-84 max-h-[calc(100vh-140px)] flex flex-col rounded-[2px] bg-surface border border-rule shadow-lg overflow-hidden animate-in fade-in duration-150"
    >
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-rule bg-paper">
        <div className="flex items-center gap-2">
          {isProblem ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase tracking-wider bg-surface border border-rule text-ink">
              <CircleDotDashed className="w-3 h-3 text-ink-muted" />
              Open Problem
            </span>
          ) : (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase tracking-wider bg-surface border border-rule text-ink">
              <GitBranch className="w-3 h-3 text-ink-muted" />
              Candidate Question
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              title="Edit text"
              aria-label="Edit text"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
            title="Close inspector"
            aria-label="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-ink text-xs">
        {/* Editing Mode */}
        {isEditing ? (
          <div className="space-y-3 bg-paper p-3 rounded-[2px] border border-rule">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted mb-1">
                {isProblem ? 'Open Problem Question' : 'Candidate Question'}
              </label>
              <textarea
                rows={4}
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full resize-none rounded-[2px] border border-rule bg-surface p-2 text-xs text-ink font-serif focus:outline-none focus:border-ink"
              />
            </div>

            {isProblem && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Source / Citation
                </label>
                <input
                  type="text"
                  value={editCitation}
                  onChange={(e) => setEditCitation(e.target.value)}
                  placeholder="e.g. Olshausen & Field 1996"
                  className="w-full rounded-[2px] border border-rule bg-surface px-2 py-1.5 text-xs text-ink font-mono focus:outline-none focus:border-ink"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-ink-muted hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="font-serif text-[13px] leading-relaxed text-ink">
                {isProblem ? problem?.text : candidate?.text}
              </p>

              {isProblem && problem?.citation && (
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-paper px-2 py-1 rounded-[2px] border border-rule/60 w-fit">
                  <BookOpen className="w-3 h-3 text-ink-muted" />
                  <span className="font-mono">{problem.citation}</span>
                </div>
              )}
            </div>

            {/* Timestamps & Metadata */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted pt-1 border-t border-rule/60">
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
        <div className="pt-2 border-t border-rule space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-ink-muted uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-ink-muted" />
              <span>Cluster Connections</span>
            </div>
            <span className="text-[10px] font-mono normal-case text-ink-muted">
              {isProblem
                ? linkedCandidate
                  ? '1 linked candidate'
                  : 'unlinked'
                : `${linkedProblems.length} linked notes`}
            </span>
          </div>

          {/* If Open Problem: Show linked candidate or allow selecting one */}
          {isProblem && problem && (
            <div className="space-y-2 bg-paper p-2.5 rounded-[2px] border border-rule">
              {linkedCandidate ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-ink-muted uppercase font-semibold">
                    Current Candidate
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-[2px] bg-surface border border-rule">
                    <button
                      type="button"
                      onClick={() => onSelectNodeById('candidate', linkedCandidate.id)}
                      className="text-left font-serif text-[12px] text-ink hover:underline line-clamp-2 cursor-pointer"
                    >
                      {linkedCandidate.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUnlinkProblemFromCandidate(linkedCandidate.id, problem.id)}
                      title="Unlink from candidate"
                      aria-label="Unlink from candidate"
                      className="p-1 rounded-[2px] text-ink-muted hover:text-missing hover:bg-paper transition-colors shrink-0 cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-weak font-medium">
                    This problem is loose (unclustered).
                  </div>
                  {candidateQuestions.length > 0 ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-ink-muted font-semibold block">
                        Link to Candidate Question:
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleLinkProblemToNewCandidate(e.target.value);
                        }}
                        className="w-full text-xs rounded-[2px] border border-rule bg-surface px-2 py-1.5 text-ink focus:outline-none focus:border-ink"
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
                    <p className="text-[10px] font-sans text-ink-muted italic">
                      Create a candidate question to link this note.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* If Candidate Question: List linked problems + allow adding unlinked ones */}
          {!isProblem && candidate && (
            <div className="space-y-2 bg-paper p-2.5 rounded-[2px] border border-rule">
              {linkedProblems.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {linkedProblems.map((lp) => (
                    <div
                      key={lp.id}
                      className="flex items-start justify-between gap-2 p-2 rounded-[2px] bg-surface border border-rule hover:border-ink-muted transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectNodeById('problem', lp.id)}
                        className="text-left font-serif text-[11px] leading-relaxed text-ink hover:underline line-clamp-2 cursor-pointer"
                      >
                        {lp.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnlinkProblemFromCandidate(candidate.id, lp.id)}
                        title="Unlink note"
                        aria-label="Unlink note"
                        className="p-1 rounded-[2px] text-ink-muted hover:text-missing hover:bg-paper transition-colors shrink-0 cursor-pointer"
                      >
                        <Unlink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-sans text-ink-muted italic py-1">
                  No open problems linked yet. Drag problems onto this node or link below.
                </p>
              )}

              {/* Link more notes */}
              {availableUnlinkedProblems.length > 0 && (
                <div className="pt-2 border-t border-rule flex gap-1.5">
                  <select
                    value={linkTargetProblemId}
                    onChange={(e) => setLinkTargetProblemId(e.target.value)}
                    className="flex-1 text-xs rounded-[2px] border border-rule bg-surface px-2 py-1 text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="">+ Link another problem note...</option>
                    {availableUnlinkedProblems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.text.length > 36 ? `${p.text.slice(0, 36)}...` : p.text}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!linkTargetProblemId}
                    onClick={handleAddProblemToCandidate}
                    className="px-2.5 py-1 bg-ink text-paper rounded-[2px] disabled:opacity-30 text-xs font-mono font-medium cursor-pointer"
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
          <div className="pt-2 border-t border-rule">
            <button
              id={`promote-btn-${candidate.id}`}
              type="button"
              onClick={() => onOpenPromoteModal(candidate)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[2px] bg-ink hover:bg-ink/90 active:bg-ink text-paper font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Promote to Question Node</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Danger zone: Delete note */}
        <div className="pt-2 border-t border-rule flex justify-between items-center text-ink-muted">
          <span className="text-[10px] font-mono">ID: {isProblem ? problem?.id : candidate?.id}</span>
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
            className="flex items-center gap-1 text-[11px] font-mono text-missing hover:underline px-1 py-0.5 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
