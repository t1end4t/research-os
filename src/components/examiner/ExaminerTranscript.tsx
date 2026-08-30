import React, { useEffect, useRef } from 'react';
import { ExaminerMessage, ExaminerContextData } from './types';
import { ExaminerVerdictCard } from './ExaminerVerdictCard';
import { ExaminerRefusalCard } from './ExaminerRefusalCard';
import { ExaminerConfirmationCard } from './ExaminerConfirmationCard';
import { Shield, EyeOff } from 'lucide-react';

interface ExaminerTranscriptProps {
  messages: ExaminerMessage[];
  context: ExaminerContextData;
  onlyMine?: boolean;
  onWeakenClaim?: (claimId?: string) => void;
  onAddExperiment?: (claimId?: string) => void;
  onDismissVerdict?: () => void;
  onUndoConfirmation?: (payload: any) => void;
}

export function ExaminerTranscript({
  messages,
  context,
  onlyMine = false,
  onWeakenClaim,
  onAddExperiment,
  onDismissVerdict,
  onUndoConfirmation,
}: ExaminerTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Model-produced message filter under Only mine
  const isModelProduced = (msg: ExaminerMessage) => {
    return msg.sender !== 'user';
  };

  const visibleMessages = onlyMine
    ? messages.filter((m) => !isModelProduced(m))
    : messages;

  const hiddenCount = messages.length - visibleMessages.length;

  const getEmptyStateMessage = () => {
    switch (context.kind) {
      case 'claim':
        return 'No checks yet for this claim.';
      case 'link':
        return 'No checks yet for this link.';
      case 'question':
        return 'No operations or checks yet for this question.';
      case 'passage':
        return 'No queries yet for this passage.';
      case 'experiment':
      case 'artifact':
        return 'No checks yet for this experiment.';
      case 'survey':
        return 'No clustering proposals yet for this survey pile.';
      case 'draft_section':
      case 'draft':
        return 'No checks yet for this draft section.';
      case 'whole_graph':
      default:
        return 'Select a claim, link, passage, or note. The Examiner works on what you have selected.';
    }
  };

  return (
    <div
      id="examiner-transcript-container"
      className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-[13px] bg-paper"
      role="log"
      aria-label="Examiner transcript"
    >
      {/* If Only mine is active and hides entries */}
      {onlyMine && hiddenCount > 0 && visibleMessages.length === 0 && (
        <div
          id="examiner-only-mine-notice"
          className="p-3 bg-surface border border-rule rounded-[2px] text-center space-y-1 my-4"
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-ink-muted">
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hidden by Only mine</span>
          </div>
          <p className="text-[12px] font-mono text-ink">
            {hiddenCount} model {hiddenCount === 1 ? 'entry' : 'entries'} in this thread hidden.
          </p>
        </div>
      )}

      {/* When thread is completely empty */}
      {messages.length === 0 && (
        <div
          id="examiner-empty-thread-state"
          className="flex flex-col items-center justify-center text-center p-6 my-auto min-h-[160px] text-ink-muted"
        >
          <p className="font-mono text-[11px] max-w-[260px] leading-relaxed">
            {getEmptyStateMessage()}
          </p>
        </div>
      )}

      {/* Messages */}
      {visibleMessages.map((msg) => {
        if (msg.sender === 'user') {
          return (
            <div
              key={msg.id}
              id={`examiner-msg-user-${msg.id}`}
              className="flex flex-col items-start gap-1 max-w-[95%] pl-1 py-1"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted">
                <span>You</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="font-serif text-[13px] text-ink leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          );
        }

        if (msg.sender === 'verdict' && msg.verdictData) {
          return (
            <div key={msg.id} id={`examiner-msg-verdict-${msg.id}`}>
              <ExaminerVerdictCard
                verdictData={msg.verdictData}
                onWeakenClaim={onWeakenClaim}
                onAddExperiment={onAddExperiment}
                onDismiss={onDismissVerdict}
              />
            </div>
          );
        }

        if (msg.sender === 'refusal' && msg.refusalData) {
          return (
            <div key={msg.id} id={`examiner-msg-refusal-${msg.id}`}>
              <ExaminerRefusalCard refusalData={msg.refusalData} />
            </div>
          );
        }

        if (msg.sender === 'edit_confirmation' && msg.confirmationData) {
          return (
            <div key={msg.id} id={`examiner-msg-confirmation-${msg.id}`}>
              <ExaminerConfirmationCard
                confirmationData={msg.confirmationData}
                onUndo={onUndoConfirmation}
              />
            </div>
          );
        }

        // Generic assistant text entry (with pinned model attribution)
        return (
          <div
            key={msg.id}
            id={`examiner-msg-assistant-${msg.id}`}
            className="hatched-left-border pl-3 py-1 space-y-1 border-l border-rule"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
              <span>{msg.modelId || 'cx/gpt-5.6-sol'}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div className="font-mono text-[12px] text-ink leading-relaxed whitespace-pre-wrap bg-surface/40 p-2 rounded-[2px] border border-rule/60">
              {msg.text}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
