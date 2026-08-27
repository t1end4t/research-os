import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ClaimNode, EvidenceKind, ExperimentStatus, QuestionNode } from '../types';
import { canCreateClaim, canCreateEvidence, EvidenceDraft, splitTags } from '../graphEdits';

interface ManualGraphEditorProps {
  question?: QuestionNode;
  claim?: ClaimNode;
  initialEvidenceKind?: EvidenceKind;
  onUpdateQuestion: (id: string, text: string, tags: string[]) => void;
  onAddClaim: (questionId: string, text: string, userReason: string) => void;
  onUpdateClaim: (id: string, text: string) => void;
  onAddEvidence: (claimId: string, draft: EvidenceDraft) => void;
}

const fieldClass =
  'w-full rounded-lg border border-stone-200 dark:border-[#333] bg-white dark:bg-[#222] px-3 py-2 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-700';

export function ManualGraphEditor({
  question,
  claim,
  initialEvidenceKind,
  onUpdateQuestion,
  onAddClaim,
  onUpdateClaim,
  onAddEvidence,
}: ManualGraphEditorProps) {
  const [nodeText, setNodeText] = useState('');
  const [questionTags, setQuestionTags] = useState('');
  const [childText, setChildText] = useState('');
  const [childReason, setChildReason] = useState('');
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind>(initialEvidenceKind || 'paper');
  const [evidenceCitation, setEvidenceCitation] = useState('');
  const [experimentStatus, setExperimentStatus] = useState<ExperimentStatus>('planned');

  useEffect(() => {
    setNodeText(claim?.text || question?.text || '');
    setQuestionTags(question?.tags?.join(', ') || '');
  }, [claim, question]);

  useEffect(() => {
    if (initialEvidenceKind) setEvidenceKind(initialEvidenceKind);
  }, [initialEvidenceKind]);

  const handleUpdateNode = (event: FormEvent) => {
    event.preventDefault();
    if (claim && nodeText.trim()) {
      onUpdateClaim(claim.id, nodeText);
    } else if (question && nodeText.trim()) {
      onUpdateQuestion(question.id, nodeText, splitTags(questionTags));
    }
  };

  const handleAddChild = (event: FormEvent) => {
    event.preventDefault();
    if (claim) {
      const draft: EvidenceDraft = {
        kind: evidenceKind,
        title: childText,
        userReason: childReason,
        citation: evidenceCitation,
        status: experimentStatus,
      };
      if (!canCreateEvidence(draft)) return;
      onAddEvidence(claim.id, draft);
    } else if (question && canCreateClaim({ text: childText, userReason: childReason })) {
      onAddClaim(question.id, childText, childReason);
    } else {
      return;
    }

    setChildText('');
    setChildReason('');
    setEvidenceCitation('');
  };

  return (
    <div className="mt-3 space-y-4 border-t border-stone-200/70 dark:border-white/10 pt-3">
      <form onSubmit={handleUpdateNode} className="space-y-2">
        <textarea
          id="manual-node-text"
          aria-label={claim ? 'Claim text' : 'Question text'}
          className={fieldClass}
          rows={2}
          value={nodeText}
          onChange={(event) => setNodeText(event.target.value)}
        />
        {!claim && (
          <input
            aria-label="Question tags"
            className={fieldClass}
            value={questionTags}
            onChange={(event) => setQuestionTags(event.target.value)}
            placeholder="tags, comma separated"
          />
        )}
        <button
          disabled={!nodeText.trim()}
          className="rounded-lg bg-stone-900 dark:bg-white px-3 py-2 text-xs font-medium text-white dark:text-stone-900 disabled:opacity-40"
        >
          Save
        </button>
      </form>

      <form onSubmit={handleAddChild} className="space-y-2 border-t border-stone-200/70 dark:border-white/10 pt-3">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Add {claim ? 'evidence finding' : 'claim'}
        </div>
        {claim && (
          <div className="grid grid-cols-2 gap-2">
            <select
              id="manual-evidence-kind"
              aria-label="Evidence kind"
              className={fieldClass}
              value={evidenceKind}
              onChange={(event) => setEvidenceKind(event.target.value as EvidenceKind)}
            >
              <option value="paper">Paper finding</option>
              <option value="experiment">Experiment</option>
            </select>
            {evidenceKind === 'experiment' ? (
              <select
                aria-label="Experiment status"
                className={fieldClass}
                value={experimentStatus}
                onChange={(event) => setExperimentStatus(event.target.value as ExperimentStatus)}
              >
                <option value="planned">Planned</option>
                <option value="running">Running</option>
                <option value="done">Done</option>
              </select>
            ) : (
              <input
                aria-label="Evidence source or citation"
                className={fieldClass}
                value={evidenceCitation}
                onChange={(event) => setEvidenceCitation(event.target.value)}
                placeholder="source / citation"
              />
            )}
          </div>
        )}
        <textarea
          aria-label={claim ? 'Evidence finding' : 'Claim text'}
          className={fieldClass}
          rows={2}
          value={childText}
          onChange={(event) => setChildText(event.target.value)}
          placeholder={claim ? 'Finding, not paper title' : 'Claim that answers this question'}
        />
        <textarea
          aria-label="User reason"
          className={fieldClass}
          rows={2}
          value={childReason}
          onChange={(event) => setChildReason(event.target.value)}
          placeholder={claim ? 'Why does this finding support the claim?' : 'Why does this claim answer the question?'}
        />
        <button
          disabled={
            claim
              ? !canCreateEvidence({ kind: evidenceKind, title: childText, userReason: childReason })
              : !canCreateClaim({ text: childText, userReason: childReason })
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-white px-3 py-2 text-xs font-medium text-white dark:text-stone-900 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Add {claim ? 'evidence' : 'claim'}
        </button>
      </form>
    </div>
  );
}
