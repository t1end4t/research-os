import React from 'react';
import { MapQuestionNode } from './mapLayout';
import { SectionLabel } from '../ui/instrument';

interface MapQuestionCardProps {
  key?: React.Key;
  node: MapQuestionNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  isActivePath: boolean;
  onSelect: (node: MapQuestionNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function MapQuestionCard({
  node,
  isSelected,
  isHovered,
  isDimmed,
  isActivePath,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
}: MapQuestionCardProps) {
  const unresolvedLabel =
    node.unresolvedCount > 0
      ? `${node.unresolvedCount} unresolved`
      : 'all hold';

  return (
    <div
      id={`map-node-question-${node.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Question: ${node.text}. ${node.claimsCount} claims, ${unresolvedLabel}.`}
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
      className={`group select-none cursor-pointer rounded-[2px] p-3 text-left transition-all duration-150 flex flex-col justify-between overflow-hidden bg-surface border ${
        isSelected
          ? 'border-ink ring-2 ring-ink z-20 shadow-xs'
          : isHovered || isActivePath
            ? 'border-ink-muted/80 bg-surface z-10'
            : 'border-rule hover:border-ink-muted/60'
      } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
    >
      {/* Top row: Type label and Tag chips */}
      <div className="flex items-center justify-between gap-1.5 leading-none">
        <SectionLabel mono className="text-[10px] text-ink-muted">
          QUESTION
        </SectionLabel>

        {node.tags && node.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden">
            {node.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-1.5 py-0.2 text-ink-muted bg-paper border border-rule rounded-[2px] truncate max-w-[80px]"
              >
                #{tag}
              </span>
            ))}
            {node.tags.length > 2 && (
              <span className="text-[10px] font-mono text-ink-muted/70">
                +{node.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Question Text in Serif User-authored typeface */}
      <p className="font-serif text-[14px] leading-snug text-ink line-clamp-2 my-auto font-normal">
        {node.text}
      </p>

      {/* Bottom metadata: Quiet structural counts */}
      <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted pt-1 border-t border-rule/50">
        <span>
          {node.claimsCount} {node.claimsCount === 1 ? 'claim' : 'claims'}
        </span>
        <span className="text-[10px] text-ink-muted">
          {node.unresolvedCount > 0 ? (
            <span>
              {node.weakCount > 0 && `${node.weakCount}w`}
              {node.weakCount > 0 && node.missingCount > 0 && ' · '}
              {node.missingCount > 0 && `${node.missingCount}m`}
            </span>
          ) : (
            <span className="text-ink-muted/60">0 broken</span>
          )}
        </span>
      </div>
    </div>
  );
}
