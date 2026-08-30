import React from 'react';
import { MapGhostNode } from './mapLayout';
import { SectionLabel, StatusBar } from '../ui/instrument';
import { Term } from '../../guidance';

interface MapGhostCardProps {
  key?: React.Key;
  node: MapGhostNode;
  isHovered: boolean;
  isDimmed: boolean;
  isActivePath: boolean;
  onSelectParent: (node: MapGhostNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function MapGhostCard({
  node,
  isHovered,
  isDimmed,
  isActivePath,
  onSelectParent,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
}: MapGhostCardProps) {
  return (
    <div
      id={`map-node-ghost-${node.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${node.title}: ${node.message}. Click to focus parent ${node.parentType.toLowerCase()}.`}
      onClick={() => onSelectParent(node)}
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
      className={`group select-none cursor-pointer rounded-[2px] p-2.5 pl-4 text-left transition-all duration-150 flex flex-col justify-between overflow-hidden bg-paper/40 border border-dashed border-missing/60 hover:border-missing hover:bg-surface ${
        isHovered || isActivePath ? 'z-10 bg-surface' : ''
      } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
    >
      {/* 3px Red Left Bar representing the missing link */}
      <StatusBar status="missing" />

      {/* Header */}
      <div className="flex items-center justify-between leading-none">
        <SectionLabel mono className="text-[10px] text-missing font-medium">
          <Term name="ghost">{node.title}</Term>
        </SectionLabel>
        <span className="text-[9px] font-mono text-missing/80 uppercase">
          structural void
        </span>
      </div>

      {/* Empty space message */}
      <p className="font-serif italic text-[13px] leading-snug text-ink-muted/90 my-auto font-normal">
        {node.message}
      </p>

      {/* Quiet Hint */}
      <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted/70 pt-0.5 border-t border-rule/30">
        <span>click to inspect parent</span>
        <span className="text-missing font-mono text-[10px]">unsupported</span>
      </div>
    </div>
  );
}
