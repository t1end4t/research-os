import React from 'react';
import { ExaminerRefusalData } from './types';
import { ShieldAlert } from 'lucide-react';

interface ExaminerRefusalCardProps {
  refusalData: ExaminerRefusalData;
}

export function ExaminerRefusalCard({ refusalData }: ExaminerRefusalCardProps) {
  return (
    <div
      id="examiner-refusal-card"
      className="hatched-left-border pl-3 py-1 space-y-1.5 border-l border-rule"
    >
      <div className="flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-missing font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Declined</span>
        </div>
        <span className="text-ink-muted text-[10px]">
          {refusalData.modelId || 'cx/gpt-5.6-sol'}
        </span>
      </div>

      <p className="font-mono text-[12px] text-ink leading-relaxed bg-surface/60 p-2 border border-rule rounded-[2px]">
        {refusalData.declinedReason}
      </p>
    </div>
  );
}
