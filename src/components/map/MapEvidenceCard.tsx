import React from 'react';
import { MapEvidenceNode } from './mapLayout';
import { SectionLabel, StatusBar } from '../ui/instrument';

interface MapEvidenceCardProps {
  key?: React.Key;
  node: MapEvidenceNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  isActivePath: boolean;
  onSelect: (node: MapEvidenceNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function MapEvidenceCard({
  node,
  isSelected,
  isHovered,
  isDimmed,
  isActivePath,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
}: MapEvidenceCardProps) {
  const isPaper = node.kind === 'paper';
  const typeBadge = isPaper ? 'PAPER FINDING' : 'EXPERIMENT FINDING';

  return (
    <div
      id={`map-node-evidence-${node.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${typeBadge}: ${node.findingText}. Source: ${node.sourceTitle}. Status: ${node.linkStatus}.`}
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

      {/* Top Header: Kind + Status + Reason warning */}
      <div className="flex items-center justify-between gap-1.5 leading-none">
        <div className="flex items-center gap-1.5">
          <SectionLabel mono className="text-[10px] text-ink-muted">
            {typeBadge}
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

        {node.isReasonMissing && (
          <span className="text-[9px] font-mono text-missing bg-missing/5 border border-dashed border-missing/40 px-1 py-0.2 rounded-[2px] leading-none">
            ! reason unwritten
          </span>
        )}
      </div>

      {/* Finding text in user-authored serif typeface (This is the finding, not the paper!) */}
      <p className="font-serif text-[13px] leading-snug text-ink line-clamp-2 my-auto font-normal">
        {node.findingText}
      </p>

      {/* Bottom secondary sans source citation */}
      <div className="flex items-center justify-between text-[11px] font-sans text-ink-muted/80 pt-1 border-t border-rule/40 leading-none truncate">
        <span className="truncate max-w-[260px] font-normal" title={node.sourceTitle}>
          {node.sourceTitle}
        </span>
        {node.evidence.status && (
          <span className="text-[10px] font-mono uppercase px-1 py-0.2 bg-paper border border-rule rounded-[2px] text-ink-muted shrink-0">
            {node.evidence.status}
          </span>
        )}
      </div>
    </div>
  );
}
