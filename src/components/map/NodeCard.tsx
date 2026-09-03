import React from 'react';
import { LayoutNode } from './computeLayout';
import { Tag, FileText, FlaskConical, Brain, AlertCircle, Ban, HelpCircle } from 'lucide-react';

interface NodeCardProps {
  node: LayoutNode;
  zoomLevel: 'shape' | 'structure' | 'working';
  isSelected: boolean;
  isDimmed: boolean;
  onClick: () => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  zoomLevel,
  isSelected,
  isDimmed,
  onClick
}) => {
  // GHOST node: soft unfilled dashed absence, not a normal card
  if (node.isGhost) {
    return (
      <div
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height
        }}
        className={`absolute border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 rounded-2xl p-3 flex items-center justify-center select-none transition-all ${
          isDimmed ? 'opacity-30' : 'opacity-85'
        }`}
      >
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 italic tracking-wide">
          [Absence: {node.title}]
        </span>
      </div>
    );
  }

  // Card color styling per node type with pristine light and dark modes
  let typeContainerStyles = '';
  let badgeStyles = '';
  let selectedRing = '';

  if (node.type === 'question') {
    typeContainerStyles =
      'bg-white dark:bg-slate-900 border-indigo-200/90 dark:border-indigo-800/60 text-slate-900 dark:text-slate-100 shadow-sm hover:border-indigo-400/80 dark:hover:border-indigo-600';
    badgeStyles =
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60';
    selectedRing = 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/15 border-indigo-400';
  } else if (node.type === 'claim') {
    typeContainerStyles =
      'bg-white dark:bg-slate-900 border-amber-200/90 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 shadow-sm hover:border-amber-400/80 dark:hover:border-amber-600';
    badgeStyles =
      'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60';
    selectedRing = 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/15 border-amber-400';
  } else {
    // Evidence
    typeContainerStyles =
      'bg-white dark:bg-slate-900 border-emerald-200/90 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100 shadow-sm hover:border-emerald-400/80 dark:hover:border-emerald-600';
    badgeStyles =
      'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
    selectedRing = 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/15 border-emerald-400';
  }

  return (
    <div
      id={`node-${node.id}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height
      }}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute cursor-pointer border rounded-2xl transition-all duration-200 select-none overflow-hidden ${typeContainerStyles} ${
        isSelected
          ? selectedRing
          : 'hover:shadow-md'
      } ${isDimmed ? 'opacity-25 scale-[0.99]' : 'opacity-100 scale-100'}`}
    >
      {/* SHAPE Zoom Level: Minimalist abstract colorful block */}
      {zoomLevel === 'shape' ? (
        <div className="w-full h-full p-2.5 flex flex-col justify-between">
          <div
            className={`w-14 h-2 rounded-full ${
              node.type === 'question'
                ? 'bg-indigo-400/80'
                : node.type === 'claim'
                ? 'bg-amber-400/80'
                : 'bg-emerald-400/80'
            }`}
          />
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      ) : (
        /* STRUCTURE and WORKING Zoom Levels */
        <div className="p-3.5 flex flex-col justify-between h-full">
          {/* Header Row: Type tag & identifiers */}
          <div className="flex items-center justify-between gap-1 mb-1 shrink-0">
            <span
              className={`font-mono text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${badgeStyles}`}
            >
              {node.type}
            </span>

            {node.tags && node.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {node.tags.map(t => (
                  <span
                    key={t}
                    className="font-mono text-[9px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/50"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {node.rejected && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 font-mono text-[9px] uppercase font-semibold flex items-center gap-1">
                <Ban className="w-2.5 h-2.5" />
                Rejected
              </span>
            )}
          </div>

          {/* Body Content based on Node Type */}
          {node.type === 'question' && (
            <div className="flex-1 flex items-center min-h-0 pt-0.5">
              <h3 className="font-serif text-[15px] sm:text-[16px] font-semibold leading-snug line-clamp-3 text-slate-900 dark:text-slate-100">
                {node.title}
              </h3>
            </div>
          )}

          {node.type === 'claim' && (
            <div className="flex-1 flex flex-col justify-center min-h-0 pt-0.5">
              <p
                className={`font-serif text-[14px] leading-relaxed line-clamp-3 text-slate-900 dark:text-slate-100 ${
                  node.rejected ? 'line-through opacity-60 text-slate-400' : ''
                }`}
              >
                {node.title}
              </p>
            </div>
          )}

          {node.type === 'evidence' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 pt-0.5">
              <p className="font-sans text-[12px] font-medium leading-snug line-clamp-2 text-slate-900 dark:text-slate-100">
                {node.title}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 shrink-0">
                <span className="truncate max-w-[150px] font-mono text-slate-600 dark:text-slate-400" title={node.citation}>
                  {node.citation}
                </span>
                <span className="capitalize px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200/70 dark:border-emerald-800/60 font-mono font-medium shrink-0">
                  {node.form}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
