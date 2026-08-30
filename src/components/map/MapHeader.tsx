import React from 'react';
import { FilterStatus } from '../../types';
import { StandingSegment } from '../shell/StandingBar';
import { SectionLabel } from '../ui/instrument';

interface MapHeaderProps {
  filter: FilterStatus;
  standingFilter: StandingSegment;
  onFilterChange: (filter: FilterStatus) => void;
  onResetFilter: () => void;
  questionsCount: number;
  claimsCount: number;
  evidenceCount: number;
  weakCount: number;
  missingCount: number;
}

export function MapHeader({
  filter,
  standingFilter,
  onFilterChange,
  onResetFilter,
  questionsCount,
  claimsCount,
  evidenceCount,
  weakCount,
  missingCount,
}: MapHeaderProps) {
  const isSpecialStandingFilter =
    standingFilter === 'unwritten' ||
    standingFilter === 'open' ||
    standingFilter === 'holds';

  return (
    <header
      id="argument-map-header"
      className="px-6 py-3.5 border-b border-rule bg-surface/90 backdrop-blur-xs flex flex-col gap-2 shrink-0 z-30 select-none"
    >
      {/* Top row: Title and Counts summary */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-mono font-semibold uppercase tracking-[0.08em] text-ink">
              ARGUMENT MAP
            </h1>
            <span className="text-[11px] font-sans text-ink-muted">
              Where is the reasoning broken?
            </span>
          </div>
        </div>

        {/* Quiet mono summary */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
          <span>
            {questionsCount} {questionsCount === 1 ? 'question' : 'questions'}
          </span>
          <span className="text-rule">•</span>
          <span>
            {claimsCount} {claimsCount === 1 ? 'claim' : 'claims'}
          </span>
          <span className="text-rule">•</span>
          <span>
            {evidenceCount} {evidenceCount === 1 ? 'finding' : 'findings'}
          </span>
          {(weakCount > 0 || missingCount > 0) && (
            <>
              <span className="text-rule">•</span>
              <span className="text-weak font-medium">
                {weakCount > 0 && `${weakCount} weak`}
              </span>
              {weakCount > 0 && missingCount > 0 && <span className="text-rule">·</span>}
              <span className="text-missing font-medium">
                {missingCount > 0 && `${missingCount} missing`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom row: Filter toggle row */}
      <div className="flex items-center justify-between gap-4 flex-wrap pt-0.5">
        <div className="flex items-center gap-2">
          <SectionLabel mono className="text-[10px] text-ink-muted mr-1">
            Filter:
          </SectionLabel>

          <div
            role="group"
            aria-label="Map filters"
            className="inline-flex items-center p-0.5 rounded-[2px] bg-paper border border-rule gap-0.5"
          >
            <button
              id="filter-btn-all"
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 text-[11px] font-sans rounded-[2px] transition-colors cursor-pointer ${
                filter === 'all' && !isSpecialStandingFilter
                  ? 'bg-surface text-ink font-medium shadow-xs border border-rule/60'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All
            </button>

            <button
              id="filter-btn-weak"
              type="button"
              onClick={() => onFilterChange('weak')}
              className={`px-2.5 py-1 text-[11px] font-sans rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === 'weak' && !isSpecialStandingFilter
                  ? 'bg-surface text-weak font-medium shadow-xs border border-rule/60'
                  : 'text-ink-muted hover:text-weak'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-weak" />
              <span>Weak only</span>
            </button>

            <button
              id="filter-btn-missing"
              type="button"
              onClick={() => onFilterChange('missing')}
              className={`px-2.5 py-1 text-[11px] font-sans rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === 'missing' && !isSpecialStandingFilter
                  ? 'bg-surface text-missing font-medium shadow-xs border border-rule/60'
                  : 'text-ink-muted hover:text-missing'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-missing" />
              <span>Missing only</span>
            </button>
          </div>

          {/* Active Standing Bar Filter notification */}
          {isSpecialStandingFilter && (
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-[2px] bg-paper border border-rule text-[11px] font-mono text-ink">
              <span>
                Standing filter: <strong>{standingFilter}</strong>
              </span>
              <button
                type="button"
                onClick={onResetFilter}
                className="text-[10px] text-ink-muted hover:text-ink underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-holds" />
            <span>holds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] border-b-2 border-dashed border-weak" />
            <span>weak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] border-b-2 border-dotted border-missing" />
            <span>missing</span>
          </div>
        </div>
      </div>
    </header>
  );
}
