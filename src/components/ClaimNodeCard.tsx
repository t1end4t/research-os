import { ClaimNode } from '../types';
import { EvidenceNodeCard } from './EvidenceNodeCard';
import { LinkStatusChip } from './LinkStatusChip';

interface ClaimNodeCardProps {
  key?: string;
  claim: ClaimNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  highlightedNodeId?: string | null;
}

export function ClaimNodeCard({
  claim,
  isSelected,
  onSelect,
  highlightedNodeId,
}: ClaimNodeCardProps) {
  const isClaimHighlighted = highlightedNodeId === claim.id;

  return (
    <div id={`claim-wrapper-${claim.id}`} className="space-y-3">
      {/* Claim Node Card */}
      <div
        id={`claim-node-${claim.id}`}
        onClick={() => onSelect(claim.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(claim.id);
          }
        }}
        className={`relative rounded-[10px] p-3 sm:p-4 transition-all duration-300 cursor-pointer text-left bg-[#EFF5FF] dark:bg-[#2C5EA8]/12 ${
          isClaimHighlighted
            ? 'border-2 border-[#ffb000] ring-2 ring-[#ffb000]'
            : isSelected
            ? 'border-2 border-[#ffb000]'
            : 'border border-[#DBE7F8] dark:border-[#2C5EA8]/25 hover:border-[#2C5EA8]/50'
        } ${claim.isRejected ? 'opacity-60 line-through decoration-stone-400' : ''}`}
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
      </div>

      {/* Link status chip above evidence group & Evidence Children with Notion-style indentation */}
      <div className="relative pl-7 ml-2.5">
        {/* Thin vertical nesting line down the left */}
        <div className="absolute left-[10px] -top-3 bottom-3 w-[1px] bg-[#ececec] dark:bg-[#282828]" />

        {/* Link status chip above evidence */}
        <div className="mb-2 flex items-center">
          <LinkStatusChip status={claim.linkStatus} />
        </div>

        {/* Evidence items list */}
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

