import { Pencil, X } from 'lucide-react';
import { EvidenceDraft } from '../graphEdits';
import { setResearchItemDragData } from '../researchItemDrag';
import { ClaimNode, EvidenceKind } from '../types';
import { EvidenceNodeCard } from './EvidenceNodeCard';
import { LinkStatusChip } from './LinkStatusChip';
import { ManualGraphEditor } from './ManualGraphEditor';

interface ClaimNodeCardProps {
  key?: string;
  claim: ClaimNode;
  isSelected: boolean;
  isEditing: boolean;
  initialEvidenceKind?: EvidenceKind;
  onSelect: (id: string) => void;
  onToggleEdit: (id: string) => void;
  onUpdateQuestion: (id: string, text: string, tags: string[]) => void;
  onAddClaim: (questionId: string, text: string, userReason: string) => void;
  onUpdateClaim: (id: string, text: string) => void;
  onAddEvidence: (claimId: string, draft: EvidenceDraft) => void;
  highlightedNodeId?: string | null;
}

export function ClaimNodeCard({
  claim,
  isSelected,
  isEditing,
  initialEvidenceKind,
  onSelect,
  onToggleEdit,
  onUpdateQuestion,
  onAddClaim,
  onUpdateClaim,
  onAddEvidence,
  highlightedNodeId,
}: ClaimNodeCardProps) {
  const isClaimHighlighted = highlightedNodeId === claim.id;

  return (
    <div id={`claim-wrapper-${claim.id}`} className="space-y-3">
      <div
        id={`claim-node-${claim.id}`}
        className={`relative rounded-[10px] p-3 sm:p-4 transition-all duration-300 text-left bg-[#EFF5FF] dark:bg-[#2C5EA8]/12 ${
          isClaimHighlighted
            ? 'border-2 border-[#ffb000] ring-2 ring-[#ffb000]'
            : isSelected
              ? 'border-2 border-[#ffb000]'
              : 'border border-[#DBE7F8] dark:border-[#2C5EA8]/25 hover:border-[#2C5EA8]/50'
        }`}
      >
        <button
          type="button"
          draggable
          onDragStart={(event) =>
            setResearchItemDragData(event.dataTransfer, {
              id: claim.id,
              type: 'CLAIM',
              label: claim.text,
            })
          }
          onClick={() => onSelect(claim.id)}
          className={`w-full cursor-grab active:cursor-grabbing pr-8 text-left ${claim.isRejected ? 'opacity-60 line-through decoration-stone-400' : ''}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2C5EA8] dark:bg-[#7DB4F8] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C5EA8] dark:text-[#7DB4F8]">
                CLAIM
              </span>
            </div>
            {claim.isRejected && (
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-[#fef2f2] dark:bg-[#381a1a] text-[#ef4444] font-semibold no-underline">
                REJECTED
              </span>
            )}
          </div>
          <p className="text-[14px] text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug">
            {claim.text}
          </p>
        </button>
        <button
          type="button"
          aria-label={isEditing ? 'Close claim editor' : 'Edit claim'}
          onClick={() => onToggleEdit(claim.id)}
          className="absolute right-3 top-3 rounded-md p-1.5 text-[#2C5EA8] dark:text-[#7DB4F8] hover:bg-[#2C5EA8]/10"
        >
          {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </button>
        {isEditing && (
          <ManualGraphEditor
            claim={claim}
            initialEvidenceKind={initialEvidenceKind}
            onUpdateQuestion={onUpdateQuestion}
            onAddClaim={onAddClaim}
            onUpdateClaim={onUpdateClaim}
            onAddEvidence={onAddEvidence}
          />
        )}
      </div>

      <div className="relative pl-7 ml-2.5">
        <div className="absolute left-[10px] -top-3 bottom-3 w-[1px] bg-[#ececec] dark:bg-[#282828]" />
        <div className="mb-2 flex items-center">
          <LinkStatusChip status={claim.linkStatus} />
        </div>
        {claim.evidence && claim.evidence.length > 0 ? (
          <div className="space-y-2.5">
            {claim.evidence.map((item) => (
              <EvidenceNodeCard
                key={item.id}
                evidence={item}
                isHighlighted={highlightedNodeId === item.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#d1d1d1] dark:border-[#333333] bg-transparent p-3 text-[12px] text-[#a1a1a1] dark:text-[#666666] italic">
            no evidence connected yet
          </div>
        )}
      </div>
    </div>
  );
}
