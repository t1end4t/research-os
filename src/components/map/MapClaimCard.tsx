import React from 'react';
import { MapClaimNode } from './mapLayout';
import { SectionLabel, StatusBar } from '../ui/instrument';

interface MapClaimCardProps {
  key?: React.Key;
  node: MapClaimNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  isActivePath: boolean;
  onSelect: (node: MapClaimNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function MapClaimCard({
  node,
  isSelected,
  isHovered,
  isDimmed,
  isActivePath,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
}: MapClaimCardProps) {
  return (
    <div
      id={`map-node-claim-${node.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Claim: ${node.text}. Status: ${node.linkStatus}. ${node.evidenceCount} findings.`}
      aria-selected={isSelected}
      onClick={() => onSelect(node)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
      className={`group select-none cursor-pointer rounded-[2px] p-2.5 pl-4 text-left transition-all duration-150 flex flex-col justify-between overflow-hidden bg-surface border ${
        isSelected
          ? 'border-ink ring-2 ring-ink z-20 shadow-xs'
          : isHovered || isActivePath
            ? 'border-ink-muted/80 z-10'
            : 'border-rule hover:border-ink-muted/60'
      } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
    >
      {/* Signature Fault Line: 3px left status bar directly meeting incoming edge */}
      <StatusBar status={node.linkStatus} />

      {/* Header row: type label + status text + optional model/rejected marker */}
      <div className="flex items-center justify-between gap-1.5 leading-none">
        <div className="flex items-center gap-2">
          <SectionLabel mono className="text-[10px] text-ink-muted">
            CLAIM
          </SectionLabel>
          <span
            className={`text-[10px] font-mono uppercase tracking-tight ${
              node.linkStatus === 'holds'
                ? 'text-holds'
                : node.linkStatus === 'weak'
                  ? 'text-weak font-medium'
                  : 'text-missing font-medium'
            }`}
          >
            • {node.linkStatus}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {node.isRejected && (
            <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-paper border border-rule text-ink-muted line-through">
              REJECTED
            </span>
          )}
          {node.isModelProduced && (
            <span className="text-[9px] font-mono text-ink-muted border border-dashed border-rule px-1 py-0.2">
              [model]
            </span>
          )}
        </div>
      </div>

      {/* Claim wording in user-authored serif typeface */}
      <p
        className={`font-serif text-[13px] leading-snug text-ink line-clamp-2 my-auto font-normal ${
          node.isRejected ? 'opacity-50 line-through' : ''
        }`}
      >
        {node.text}
      </p>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted pt-1 border-t border-rule/40">
        <span>
          {node.evidenceCount === 0
            ? 'no findings'
            : `${node.evidenceCount} ${node.evidenceCount === 1 ? 'finding' : 'findings'}`}
        </span>
        <span className="text-ink-muted/70">
          {node.claim.check?.reasonText ? 'reason logged' : '! reason unwritten'}
        </span>
      </div>
    </div>
  );
}
