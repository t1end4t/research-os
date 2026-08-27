import { useEffect, useRef } from 'react';
import { Pencil, X } from 'lucide-react';
import { EvidenceDraft } from '../graphEdits';
import { setResearchItemDragData } from '../researchItemDrag';
import { EvidenceKind, QuestionNode } from '../types';
import { ClaimNodeCard } from './ClaimNodeCard';
import { ManualGraphEditor } from './ManualGraphEditor';

interface GraphPaneProps {
  questions: QuestionNode[];
  selectedNodeId?: string | null;
  selectedClaimId: string | null;
  selectedQuestionId?: string | null;
  editingNodeId: string | null;
  editingEvidenceKind?: EvidenceKind;
  onSelectClaim: (id: string) => void;
  onSelectQuestion: (id: string) => void;
  onToggleEdit: (id: string) => void;
  onUpdateQuestion: (id: string, text: string, tags: string[]) => void;
  onAddClaim: (questionId: string, text: string, userReason: string) => void;
  onUpdateClaim: (id: string, text: string) => void;
  onAddEvidence: (claimId: string, draft: EvidenceDraft) => void;
  highlightedNodeId?: string | null;
}

export function GraphPane({
  questions,
  selectedNodeId,
  selectedClaimId,
  selectedQuestionId,
  editingNodeId,
  editingEvidenceKind,
  onSelectClaim,
  onSelectQuestion,
  onToggleEdit,
  onUpdateQuestion,
  onAddClaim,
  onUpdateClaim,
  onAddEvidence,
  highlightedNodeId,
}: GraphPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedNodeId) return;
    const element = document.getElementById(`claim-node-${selectedNodeId}`) ||
      document.getElementById(`question-node-${selectedNodeId}`) ||
      document.getElementById(`question-section-${selectedNodeId}`) ||
      document.getElementById(`evidence-node-${selectedNodeId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedNodeId]);

  return (
    <div
      ref={containerRef}
      id="graph-pane"
      className="h-full overflow-y-auto p-6 bg-white dark:bg-[#141414] space-y-8"
    >
      <div className="max-w-xl space-y-8">
        {questions.map((question) => {
          const isQuestionSelected = selectedQuestionId === question.id || selectedNodeId === question.id;
          const isEditingQuestion = editingNodeId === question.id;

          return (
            <div key={question.id} id={`question-section-${question.id}`} className="space-y-4">
              <div
                id={`question-node-${question.id}`}
                className={`relative rounded-[10px] p-3.5 sm:p-4 transition-all duration-200 text-left bg-[#F5F2FF] dark:bg-[#6B4FBB]/12 ${
                  isQuestionSelected
                    ? 'border-2 border-[#ffb000] ring-1 ring-[#ffb000]'
                    : 'border border-[#E4DCFA] dark:border-[#6B4FBB]/25 hover:border-[#6B4FBB]/50'
                }`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    setResearchItemDragData(event.dataTransfer, {
                      id: question.id,
                      type: 'QUESTION',
                      label: question.text,
                    })
                  }
                  onClick={() => onSelectQuestion(question.id)}
                  className="w-full cursor-grab active:cursor-grabbing pr-8 text-left"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7] shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                      QUESTION
                    </span>
                  </div>
                  <h1 className="text-[15px] font-medium text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug">
                    {question.text}
                  </h1>
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded border border-[#E4DCFA] dark:border-[#6B4FBB]/40 text-[#6B4FBB] dark:text-[#BCA8F7] leading-none font-normal"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={isEditingQuestion ? 'Close question editor' : 'Edit question'}
                  onClick={() => onToggleEdit(question.id)}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-[#6B4FBB] dark:text-[#BCA8F7] hover:bg-[#6B4FBB]/10"
                >
                  {isEditingQuestion ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                </button>
                {isEditingQuestion && (
                  <ManualGraphEditor
                    question={question}
                    onUpdateQuestion={onUpdateQuestion}
                    onAddClaim={onAddClaim}
                    onUpdateClaim={onUpdateClaim}
                    onAddEvidence={onAddEvidence}
                  />
                )}
              </div>

              {question.claims.length > 0 ? (
                <div className="relative pl-7 ml-2.5 space-y-4">
                  <div className="absolute left-[10px] -top-3 bottom-3 w-[1px] bg-[#ececec] dark:bg-[#282828]" />
                  {question.claims.map((claim) => (
                    <ClaimNodeCard
                      key={claim.id}
                      claim={claim}
                      isSelected={claim.id === selectedClaimId}
                      isEditing={editingNodeId === claim.id}
                      initialEvidenceKind={editingNodeId === claim.id ? editingEvidenceKind : undefined}
                      onSelect={onSelectClaim}
                      onToggleEdit={onToggleEdit}
                      onUpdateQuestion={onUpdateQuestion}
                      onAddClaim={onAddClaim}
                      onUpdateClaim={onUpdateClaim}
                      onAddEvidence={onAddEvidence}
                      highlightedNodeId={highlightedNodeId}
                    />
                  ))}
                </div>
              ) : (
                <div className="relative pl-7 ml-2.5">
                  <div className="absolute left-[10px] -top-3 bottom-3 w-[1px] bg-[#ececec] dark:bg-[#282828]" />
                  <button
                    type="button"
                    onClick={() => onToggleEdit(question.id)}
                    className="w-full rounded-lg border border-dashed border-[#d1d1d1] dark:border-[#333333] p-3 text-left text-[12px] text-[#a1a1a1] dark:text-[#666666] italic cursor-pointer hover:border-[#aaa] transition-colors"
                  >
                    no claims yet — edit question to add one
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
