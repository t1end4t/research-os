import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/instrument';
import { Check, X } from 'lucide-react';

interface InlineReasonEditorProps {
  initialValue?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  label?: string;
}

export function InlineReasonEditor({
  initialValue = '',
  placeholder = 'Why does this finding support the claim?',
  onSave,
  onCancel,
  label = 'YOUR REASON (USER-AUTHORED)',
}: InlineReasonEditorProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave(value.trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      id="workbench-inline-reason-editor"
      className="p-3 bg-paper border border-ink/80 rounded-[2px] space-y-2.5 shadow-xs"
    >
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-ink font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-ink-muted text-[10px]">
          ⌘ + Enter to save · Esc to cancel
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={placeholder}
        className="w-full p-2 bg-surface border border-rule rounded-[2px] font-serif text-[15px] leading-relaxed text-ink focus:border-ink transition-colors resize-y"
      />

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-mono text-ink-muted">
          {value.trim().length === 0
            ? '! Empty reason will prevent checking link'
            : '✓ Reason committed by you'}
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="quiet"
            onClick={onCancel}
            className="flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onSave(value.trim())}
            className="flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Commit Reason
          </Button>
        </div>
      </div>
    </div>
  );
}
