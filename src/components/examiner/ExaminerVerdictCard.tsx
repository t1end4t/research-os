import React, { useState } from 'react';
import { ExaminerVerdictData } from './types';
import { ModelBlock } from '../ui/instrument';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExaminerVerdictCardProps {
  verdictData: ExaminerVerdictData;
  onWeakenClaim?: (claimId?: string) => void;
  onAddExperiment?: (claimId?: string) => void;
  onDismiss?: () => void;
}

export function ExaminerVerdictCard({
  verdictData,
  onWeakenClaim,
  onAddExperiment,
  onDismiss,
}: ExaminerVerdictCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="py-1 px-2.5 bg-surface/50 border border-rule text-[11px] font-mono text-ink-muted italic rounded-[2px]">
        Verdict dismissed by user.
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (verdictData.overallStatus) {
      case 'holds':
        return (
          <span className="font-mono text-[11px] font-bold text-holds uppercase tracking-wider">
            holds
          </span>
        );
      case 'weak':
        return (
          <span className="font-mono text-[11px] font-bold text-weak uppercase tracking-wider">
            weak
          </span>
        );
      case 'missing':
        return (
          <span className="font-mono text-[11px] font-bold text-missing uppercase tracking-wider">
            missing
          </span>
        );
      default:
        return (
          <span className="font-mono text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            unverified
          </span>
        );
    }
  };

  const getVerdictStyle = (v: 'pass' | 'partial' | 'mismatch') => {
    switch (v) {
      case 'pass':
        return 'text-holds font-medium';
      case 'partial':
        return 'text-weak font-medium';
      case 'mismatch':
        return 'text-missing font-bold';
      default:
        return 'text-ink-muted';
    }
  };

  const actions = verdictData.actions || ['weaken_claim', 'add_experiment', 'dismiss'];

  return (
    <div className="space-y-2">
      {/* Model Block wrapper with hatchet left border */}
      <div className="hatched-left-border pl-3 py-1 space-y-2 border-l border-rule">
        {/* Header line: Model ID + Overall Status + Preview marker */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-ink-muted font-medium">{verdictData.modelId || 'cx/gpt-5.6-sol'}</span>
            {verdictData.isPrewiredPreview && (
              <span className="px-1 py-0.2 bg-rule/20 text-ink-muted text-[9px] uppercase tracking-wider rounded-[2px]">
                preview · not wired
              </span>
            )}
          </div>
          {getStatusBadge()}
        </div>

        {/* 3-Axis Verdict Table */}
        <div className="border border-rule divide-y divide-rule/60 bg-surface/70 rounded-[2px] overflow-hidden text-[12px] font-mono">
          {verdictData.axes.map((axis) => (
            <div
              key={axis.label}
              className="grid grid-cols-[60px_72px_1fr] items-baseline px-2 py-1 gap-2"
            >
              <span className="text-ink-muted font-bold text-[10px] uppercase tracking-wider">
                {axis.label}
              </span>
              <span className={`text-[11px] uppercase tracking-tight ${getVerdictStyle(axis.verdict)}`}>
                {axis.verdict}
              </span>
              <span className="text-ink/90 text-[11px] font-sans truncate" title={axis.detail}>
                {axis.detail || '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Finding paragraph (clamped to 2 lines unless expanded) */}
        {verdictData.finding && (
          <div className="space-y-1">
            <p
              className={`text-[12px] font-serif text-ink leading-relaxed ${
                isExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {verdictData.finding}
            </p>
            {verdictData.finding.length > 90 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-0.5 text-[10px] font-mono text-ink-muted hover:text-ink cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-2.5 h-2.5" /> Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-2.5 h-2.5" /> More
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          {actions.includes('weaken_claim') && onWeakenClaim && (
            <button
              type="button"
              id="examiner-verdict-weaken-claim"
              onClick={() => onWeakenClaim(verdictData.claimId)}
              className="px-2 py-1 rounded-[2px] bg-surface border border-rule hover:border-ink hover:text-ink text-ink transition-colors cursor-pointer"
            >
              [ weaken claim ]
            </button>
          )}

          {actions.includes('add_experiment') && onAddExperiment && (
            <button
              type="button"
              id="examiner-verdict-add-experiment"
              onClick={() => onAddExperiment(verdictData.claimId)}
              className="px-2 py-1 rounded-[2px] bg-surface border border-rule hover:border-ink hover:text-ink text-ink transition-colors cursor-pointer"
            >
              [ add experiment ]
            </button>
          )}

          {actions.includes('dismiss') && (
            <button
              type="button"
              id="examiner-verdict-dismiss"
              onClick={() => {
                setIsDismissed(true);
                onDismiss?.();
              }}
              className="px-2 py-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
            >
              [ dismiss ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
