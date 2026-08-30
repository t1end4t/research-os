import React from 'react';
import { StatusDot } from '../ui/instrument';
import { Tooltip, ExplainerButton, GUIDANCE_COPY } from '../../guidance';

export type StandingSegment =
  | 'all'
  | 'holds'
  | 'weak'
  | 'unsupported'
  | 'unwritten'
  | 'open';

export interface StandingCounts {
  holds: number;
  weak: number;
  unsupported: number;
  unwrittenReasons: number;
  openQuestions: number;
}

export interface StandingBarProps {
  counts: StandingCounts;
  activeSegment: StandingSegment;
  onSelectSegment: (segment: StandingSegment) => void;
}

export function StandingBar({
  counts,
  activeSegment,
  onSelectSegment,
}: StandingBarProps) {
  const segments: Array<{
    id: StandingSegment;
    label: string;
    count: number;
    colorType?: 'holds' | 'weak' | 'missing';
    tooltipText: string;
  }> = [
    {
      id: 'holds',
      label: 'holds',
      count: counts.holds,
      colorType: 'holds',
      tooltipText: GUIDANCE_COPY.computed.standing_holds,
    },
    {
      id: 'weak',
      label: 'weak',
      count: counts.weak,
      colorType: 'weak',
      tooltipText: GUIDANCE_COPY.computed.standing_weak,
    },
    {
      id: 'unsupported',
      label: 'unsupported',
      count: counts.unsupported,
      colorType: 'missing',
      tooltipText: GUIDANCE_COPY.computed.standing_unsupported,
    },
    {
      id: 'unwritten',
      label: 'reasons unwritten',
      count: counts.unwrittenReasons,
      tooltipText: GUIDANCE_COPY.computed.standing_unwritten,
    },
    {
      id: 'open',
      label: 'open questions',
      count: counts.openQuestions,
      tooltipText: GUIDANCE_COPY.computed.standing_open,
    },
  ];

  return (
    <div
      id="instrument-standing-bar"
      className="h-9 px-3 bg-paper border-b border-rule flex items-center justify-between select-none z-20 font-sans text-xs"
    >
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {/* STANDING Marker */}
        <div className="flex items-center gap-2 pr-2 border-r border-rule">
          <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-ink uppercase">
            STANDING
          </span>
        </div>

        {/* Segments */}
        <div className="flex items-center gap-1">
          {segments.map((seg, idx) => {
            const isSelected = activeSegment === seg.id;
            return (
              <React.Fragment key={seg.id}>
                {idx > 0 && <span className="text-rule font-mono text-[10px] mx-0.5">·</span>}
                <Tooltip content={seg.tooltipText}>
                  <button
                    id={`standing-filter-${seg.id}`}
                    onClick={() =>
                      onSelectSegment(isSelected ? 'all' : seg.id)
                    }
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface border border-rule font-medium shadow-[0_1px_1px_rgba(0,0,0,0.03)]'
                        : 'hover:bg-surface/60 border border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {seg.colorType && (
                      <StatusDot status={seg.colorType} size="sm" />
                    )}
                    <span
                      className={`font-mono text-[12px] font-semibold ${
                        seg.colorType === 'holds'
                          ? 'text-holds'
                          : seg.colorType === 'weak'
                          ? 'text-weak'
                          : seg.colorType === 'missing'
                          ? 'text-missing'
                          : isSelected
                          ? 'text-ink'
                          : 'text-ink-muted'
                      }`}
                    >
                      {seg.count}
                    </span>
                    <span
                      className={`font-sans text-[11px] ${
                        isSelected ? 'text-ink font-medium' : 'text-ink-muted'
                      }`}
                    >
                      {seg.label}
                    </span>
                  </button>
                </Tooltip>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right controls: Filter reset and Explainer */}
      <div className="flex items-center gap-2 shrink-0">
        {activeSegment !== 'all' && (
          <button
            onClick={() => onSelectSegment('all')}
            className="text-[11px] font-mono text-ink-muted hover:text-ink px-1.5 py-0.5 rounded-[2px] hover:bg-surface border border-rule transition-colors cursor-pointer"
          >
            [reset filter]
          </button>
        )}
        <ExplainerButton explainerKey="standing_bar" />
      </div>
    </div>
  );
}
