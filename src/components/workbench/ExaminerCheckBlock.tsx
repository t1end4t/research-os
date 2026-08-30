import React from 'react';
import { ExaminerCheckResult } from '../../types';
import { ModelBlock } from '../ui/instrument';
import { AlertCircle } from 'lucide-react';
import { Term, Tooltip, GUIDANCE_COPY } from '../../guidance';

interface ExaminerCheckBlockProps {
  checkResult: ExaminerCheckResult;
  isStale?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function ExaminerCheckBlock({
  checkResult,
  isStale = false,
  className = '',
  actions,
}: ExaminerCheckBlockProps) {
  const stale = isStale || checkResult.isStale;

  const getVerdictStyle = (verdict: 'pass' | 'partial' | 'mismatch') => {
    switch (verdict) {
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

  const getVerdictSymbol = (verdict: 'pass' | 'partial' | 'mismatch') => {
    switch (verdict) {
      case 'pass':
        return 'PASS';
      case 'partial':
        return 'PARTIAL';
      case 'mismatch':
        return 'MISMATCH';
      default:
        return 'UNVERIFIED';
    }
  };

  const renderAxisLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (lower === 'type') return <Term name="type">TYPE</Term>;
    if (lower === 'scope') return <Term name="scope">SCOPE</Term>;
    if (lower === 'target') return <Term name="target">TARGET</Term>;
    return <span>{label}</span>;
  };

  return (
    <ModelBlock
      modelId={checkResult.modelId || 'cx/gpt-5.6-sol'}
      badge="EXAMINER"
      className={`mt-2.5 space-y-2.5 ${className}`}
    >
      {/* Stale Warning if checked against earlier text/reason */}
      {stale && (
        <Tooltip content={GUIDANCE_COPY.terms.stale_reference}>
          <div
            id="examiner-stale-warning"
            className="flex items-center gap-1.5 px-2 py-1 bg-weak/10 border border-weak/40 text-weak rounded-[2px] text-[11px] font-sans cursor-help"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {checkResult.staleNote ||
                'Checked against an earlier version of this reason or claim.'}
            </span>
          </div>
        </Tooltip>
      )}

      {/* 3-Axis Table */}
      <div className="border border-rule/50 divide-y divide-rule/40 bg-surface/50 rounded-[2px] overflow-hidden text-[12px] font-mono">
        {checkResult.axes.map((axis) => (
          <div
            key={axis.label}
            className="grid grid-cols-[68px_82px_1fr] items-baseline px-2.5 py-1.5 gap-2"
          >
            <span className="text-ink-muted font-bold text-[11px] tracking-wider uppercase">
              {renderAxisLabel(axis.label)}
            </span>
            <span
              className={`text-[11px] tracking-tight uppercase ${getVerdictStyle(
                axis.verdict
              )}`}
            >
              {getVerdictSymbol(axis.verdict)}
            </span>
            <span className="text-ink/90 font-mono text-[12px] leading-snug">
              {axis.detail}
            </span>
          </div>
        ))}
      </div>

      {/* Finding Summary */}
      {checkResult.finding && (
        <div className="text-[12px] text-ink-muted font-mono leading-relaxed pt-0.5">
          <span className="text-ink-muted/80">finding: </span>
          <span className="text-ink">{checkResult.finding}</span>
        </div>
      )}

      {/* Optional action buttons beneath check */}
      {actions && (
        <div className="pt-2 border-t border-rule/40 flex flex-wrap items-center gap-2 font-sans">
          {actions}
        </div>
      )}
    </ModelBlock>
  );
}
