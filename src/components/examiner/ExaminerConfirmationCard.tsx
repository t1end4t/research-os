import React, { useState } from 'react';
import { ExaminerConfirmationData } from './types';
import { RotateCcw } from 'lucide-react';

interface ExaminerConfirmationCardProps {
  confirmationData: ExaminerConfirmationData;
  onUndo?: (payload: any) => void;
}

export function ExaminerConfirmationCard({
  confirmationData,
  onUndo,
}: ExaminerConfirmationCardProps) {
  const [isUndone, setIsUndone] = useState(confirmationData.isUndone || false);

  const handleUndo = () => {
    setIsUndone(true);
    onUndo?.(confirmationData.undoPayload);
  };

  return (
    <div
      id="examiner-confirmation-card"
      className="hatched-left-border pl-3 py-1 space-y-1 border-l border-rule"
    >
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-ink-muted font-medium">
          {confirmationData.modelId || 'cx/gpt-5.6-sol'}
        </span>
        {confirmationData.isPrewiredPreview && (
          <span className="px-1 py-0.2 bg-rule/20 text-ink-muted text-[9px] uppercase tracking-wider rounded-[2px]">
            preview · not wired
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-2 bg-surface/80 border border-rule rounded-[2px] text-[12px] font-mono">
        <span className={`text-ink ${isUndone ? 'line-through text-ink-muted' : ''}`}>
          {confirmationData.actionDescription}
        </span>

        {isUndone ? (
          <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider shrink-0">
            (undone)
          </span>
        ) : (
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-ink-muted hover:text-ink hover:bg-paper border border-transparent hover:border-rule transition-colors cursor-pointer text-[11px] shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>[ undo ]</span>
          </button>
        )}
      </div>
    </div>
  );
}
