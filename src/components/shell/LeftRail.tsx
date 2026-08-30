import React from 'react';
import {
  Compass,
  GitBranch,
  BookOpen,
  FlaskConical,
  FileEdit,
} from 'lucide-react';
import { AppTab } from '../../types';

export type PipelineStage = 'survey' | 'map' | 'papers' | 'experiments' | 'draft';

export interface LeftRailProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export function LeftRail({ activeTab, onSelectTab }: LeftRailProps) {
  // Map AppTab to PipelineStage
  const currentStage: PipelineStage =
    activeTab === 'survey'
      ? 'survey'
      : activeTab === 'graph' || activeTab === 'detail'
      ? 'map'
      : activeTab === 'papers'
      ? 'papers'
      : activeTab === 'experiments'
      ? 'experiments'
      : activeTab === 'draft'
      ? 'draft'
      : 'map';

  const stages: Array<{
    id: PipelineStage;
    key: string;
    num: string;
    label: string;
    targetTab: AppTab;
    icon: React.ReactNode;
    disabled?: boolean;
    badge?: string;
  }> = [
    {
      id: 'survey',
      key: 'S',
      num: '01',
      label: 'Survey',
      targetTab: 'survey',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'map',
      key: 'M',
      num: '02',
      label: 'Map',
      targetTab: 'graph',
      icon: <GitBranch className="w-4 h-4" />,
    },
    {
      id: 'papers',
      key: 'P',
      num: '03',
      label: 'Papers',
      targetTab: 'papers',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'experiments',
      key: 'E',
      num: '04',
      label: 'Experiments',
      targetTab: 'experiments',
      icon: <FlaskConical className="w-4 h-4" />,
    },
    {
      id: 'draft',
      key: 'D',
      num: '05',
      label: 'Draft',
      targetTab: 'draft',
      icon: <FileEdit className="w-4 h-4" />,
    },
  ];

  return (
    <nav
      id="instrument-left-rail"
      aria-label="Research Pipeline"
      className="w-14 bg-surface border-r border-rule flex flex-col items-center py-3 select-none shrink-0 z-20"
    >
      {/* Pipeline Sequence */}
      <div className="flex flex-col items-center gap-2 w-full px-1.5 relative">
        {/* Subtle connecting rail spine */}
        <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[1px] bg-rule/70 pointer-events-none" />

        {stages.map((stage) => {
          const isActive = currentStage === stage.id;
          const isDisabled = stage.disabled;

          return (
            <button
              key={stage.id}
              id={`pipeline-stage-${stage.id}`}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  onSelectTab(stage.targetTab);
                }
              }}
              title={
                isDisabled
                  ? `${stage.label} — ${stage.badge}`
                  : `Stage ${stage.num}: ${stage.label}`
              }
              aria-label={`Pipeline Stage ${stage.num}: ${stage.label}${
                isDisabled ? ' (not yet implemented)' : ''
              }`}
              aria-current={isActive ? 'page' : undefined}
              className={`relative z-10 group flex flex-col items-center justify-center w-11 py-2 rounded-[2px] transition-colors ${
                isDisabled
                  ? 'opacity-35 cursor-not-allowed bg-surface'
                  : isActive
                  ? 'bg-paper text-ink border border-rule shadow-[0_1px_1px_rgba(0,0,0,0.03)] cursor-default'
                  : 'hover:bg-paper/80 text-ink-muted hover:text-ink cursor-pointer'
              }`}
            >
              {/* Active pip indicator on left */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 bg-ink rounded-r-[1px]" />
              )}

              {/* Number/Key */}
              <span className="font-mono text-[9px] text-ink-muted/80 leading-none mb-1">
                {stage.key}
              </span>

              {/* Icon */}
              <div
                className={`transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-muted group-hover:text-ink'
                }`}
              >
                {stage.icon}
              </div>

              {/* Label */}
              <span
                className={`text-[9px] font-mono tracking-tight uppercase mt-1 leading-none ${
                  isActive ? 'text-ink font-semibold' : 'text-ink-muted group-hover:text-ink'
                }`}
              >
                {stage.label}
              </span>

              {/* "not yet" pill for disabled draft stage */}
              {stage.badge && (
                <span className="text-[7px] font-mono text-ink-muted/70 scale-90 -mt-0.5 whitespace-nowrap">
                  {stage.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
