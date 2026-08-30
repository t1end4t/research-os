import React, { useState } from 'react';
import { SectionLabel } from '../ui/instrument';
import { DraftGapItem } from '../../utils/draftHelpers';
import { FileEdit, Check, Edit2 } from 'lucide-react';
import { Tooltip, ExplainerButton, GUIDANCE_COPY } from '../../guidance';

export interface DraftHeaderProps {
  manuscriptTitle: string;
  onUpdateManuscriptTitle: (newTitle: string) => void;
  standingCounts: {
    tentativeClaims: number;
    unplacedContradictions: number;
    unwrittenReasons: number;
    openGapsCount: number;
  };
  onSelectStandingFilter?: (filterType: 'tentative' | 'contrary' | 'unwritten' | 'gaps') => void;
}

export function DraftHeader({
  manuscriptTitle,
  onUpdateManuscriptTitle,
  standingCounts,
  onSelectStandingFilter,
}: DraftHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(manuscriptTitle);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateManuscriptTitle(tempTitle.trim());
    } else {
      setTempTitle(manuscriptTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      id="draft-surface-header"
      className="px-4 py-3 bg-surface border-b border-rule shrink-0 select-none flex flex-col gap-2 font-sans"
    >
      {/* Top row: Surface Name + Manuscript Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Surface badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-paper border border-rule font-mono text-[11px] font-semibold text-ink uppercase tracking-wider shrink-0">
            <FileEdit className="w-3 h-3 text-ink-muted" />
            <span>Draft</span>
          </div>

          <ExplainerButton explainerKey="draft_not_export" surfaceId="draft" />

          <div className="h-3 w-[1px] bg-rule shrink-0" />

          {/* Editable Manuscript Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 flex-1 max-w-xl">
              <input
                id="draft-manuscript-title-input"
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTempTitle(manuscriptTitle);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="w-full bg-paper border border-ink px-2 py-1 rounded-[2px] font-serif text-[16px] font-medium text-ink focus:outline-none"
                placeholder="Enter manuscript title..."
              />
              <button
                id="draft-save-title-btn"
                onClick={handleSaveTitle}
                className="p-1 rounded-[2px] bg-ink text-paper hover:bg-ink/90 cursor-pointer"
                title="Save title"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Tooltip content="Click to edit manuscript title">
              <button
                id="draft-edit-title-btn"
                onClick={() => {
                  setTempTitle(manuscriptTitle);
                  setIsEditingTitle(true);
                }}
                className="group inline-flex items-center gap-2 text-left hover:bg-paper px-2 py-0.5 -ml-2 rounded-[2px] transition-colors cursor-pointer min-w-0"
              >
                <h1 className="font-serif text-[17px] font-semibold text-ink tracking-tight truncate">
                  {manuscriptTitle || 'Untitled Manuscript'}
                </h1>
                <Edit2 className="w-3 h-3 text-ink-muted/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Short description */}
        <div className="hidden lg:block text-[12px] font-sans text-ink-muted/80 italic">
          Assemble the argument without hiding what remains unresolved.
        </div>
      </div>

      {/* Bottom row: Compact research-standing strip */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-rule/50 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-2 text-ink-muted">
          <span className="text-ink-muted/70 uppercase tracking-wider text-[10px] font-semibold">
            Standing:
          </span>

          {/* 1. Tentative claims */}
          <Tooltip content="Filter by tentative claims with weak or missing link status">
            <button
              id="draft-standing-tentative-btn"
              onClick={() => onSelectStandingFilter?.('tentative')}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] hover:bg-paper transition-colors cursor-pointer ${
                standingCounts.tentativeClaims > 0 ? 'text-weak font-medium' : 'text-ink-muted'
              }`}
            >
              <span>{standingCounts.tentativeClaims} tentative claim{standingCounts.tentativeClaims === 1 ? '' : 's'}</span>
            </button>
          </Tooltip>

          <span className="text-rule">·</span>

          {/* 2. Contradiction not placed */}
          <Tooltip content="Inspect unplaced findings that cut against current claims">
            <button
              id="draft-standing-contrary-btn"
              onClick={() => onSelectStandingFilter?.('contrary')}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] hover:bg-paper transition-colors cursor-pointer ${
                standingCounts.unplacedContradictions > 0 ? 'text-missing font-medium' : 'text-ink-muted'
              }`}
            >
              <span>{standingCounts.unplacedContradictions} contradiction not placed</span>
            </button>
          </Tooltip>

          <span className="text-rule">·</span>

          {/* 3. Reasons unwritten */}
          <Tooltip content="Inspect unwritten user reasons across claims and findings">
            <button
              id="draft-standing-unwritten-btn"
              onClick={() => onSelectStandingFilter?.('unwritten')}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] hover:bg-paper transition-colors cursor-pointer ${
                standingCounts.unwrittenReasons > 0 ? 'text-missing font-medium' : 'text-ink-muted'
              }`}
            >
              <span>{standingCounts.unwrittenReasons} reason{standingCounts.unwrittenReasons === 1 ? '' : 's'} unwritten</span>
            </button>
          </Tooltip>

          {standingCounts.openGapsCount > 0 && (
            <>
              <span className="text-rule">·</span>
              <Tooltip content="View all active manuscript assembly gaps">
                <button
                  id="draft-standing-gaps-btn"
                  onClick={() => onSelectStandingFilter?.('gaps')}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] hover:bg-paper text-ink transition-colors cursor-pointer font-medium"
                >
                  <span>{standingCounts.openGapsCount} open gap{standingCounts.openGapsCount === 1 ? '' : 's'}</span>
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
