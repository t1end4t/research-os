import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExaminerContextData,
  ExaminerMessage,
  ExaminerThread,
  ExaminerVerdictData,
  ExaminerConfirmationData,
} from './types';
import { ExaminerContextChip } from './ExaminerContextChip';
import { ExaminerOperations } from './ExaminerOperations';
import { ExaminerTranscript } from './ExaminerTranscript';
import { checkRefusal } from './examinerRefusalRules';
import {
  generateLinkCheckVerdict,
  generateVerdictExplanation,
  generateGraphEditConfirmation,
} from './examinerFixtures';
import {
  ChevronRight,
  Send,
  Loader2,
  ChevronDown,
  Layers,
} from 'lucide-react';

export interface ExaminerDockProps {
  isOpen: boolean;
  context: ExaminerContextData;
  activeSurface?: string; // 'graph' | 'survey' | 'detail' | 'papers' | 'experiments' | 'draft'
  onlyMine?: boolean;
  onCloseDock: () => void;
  onClearContext?: () => void;
  onClickContextChip?: () => void;
  onFocusReasonField?: () => void;
  onWeakenClaim?: (claimId?: string) => void;
  onAddExperiment?: (claimId?: string) => void;
  onUndoEdit?: (payload: any) => void;
  onSendMessage?: (message: string, context: ExaminerContextData) => Promise<{ text: string; modelId?: string } | void>;
}

export function ExaminerDock({
  isOpen,
  context,
  activeSurface = 'graph',
  onlyMine = false,
  onCloseDock,
  onClearContext,
  onClickContextChip,
  onFocusReasonField,
  onWeakenClaim,
  onAddExperiment,
  onUndoEdit,
  onSendMessage,
}: ExaminerDockProps) {
  // Dock width management
  const [dockWidth, setDockWidth] = useState<number>(() => {
    const saved = localStorage.getItem('instrument-examiner-dock-width');
    return saved ? Math.max(340, Math.min(680, parseInt(saved, 10))) : 380;
  });
  const [isDragging, setIsDragging] = useState(false);

  // Threads store isolated per context
  const [threads, setThreads] = useState<Record<string, ExaminerThread>>({});
  const [isThreadDropdownOpen, setIsThreadDropdownOpen] = useState(false);

  // Input state
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState<string>('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Derive thread key from context
  const currentThreadKey = context.id
    ? `${context.kind}:${context.id}`
    : `${context.kind}:global`;

  // Get active thread
  const activeThread: ExaminerThread = threads[currentThreadKey] || {
    id: currentThreadKey,
    contextKind: context.kind,
    contextId: context.id,
    contextLabel: context.label,
    messages: [],
    lastUpdated: 'Just now',
  };

  // Resizing logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = Math.max(340, Math.min(720, window.innerWidth - e.clientX));
      setDockWidth(newWidth);
      localStorage.setItem('instrument-examiner-dock-width', newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Helper to append a message to active thread
  const appendMessage = (msg: ExaminerMessage) => {
    setThreads((prev) => {
      const existing = prev[currentThreadKey] || {
        id: currentThreadKey,
        contextKind: context.kind,
        contextId: context.id,
        contextLabel: context.label,
        messages: [],
        lastUpdated: 'Just now',
      };
      return {
        ...prev,
        [currentThreadKey]: {
          ...existing,
          messages: [...existing.messages, msg],
          lastUpdated: 'Just now',
        },
      };
    });
  };

  // Handle operations execution from the Operations Row
  const handleExecuteOperation = async (opId: string) => {
    if (opId === 'op-link-check' || opId === 'op-claim-check-link') {
      setIsLoading(true);
      setLoadingStatusText('Checking link against Type, Scope, Target axes…');
      setTimeout(() => {
        const verdict = generateLinkCheckVerdict(context);
        appendMessage({
          id: `verdict-${Date.now()}`,
          sender: 'verdict',
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
          verdictData: verdict,
          isPrewiredPreview: true,
        });
        setIsLoading(false);
        setLoadingStatusText('');
      }, 550);
      return;
    }

    if (opId === 'op-link-explain-verdict' || opId === 'op-draft-explain-verdict') {
      setIsLoading(true);
      setLoadingStatusText('Explaining verdict…');
      setTimeout(() => {
        const explanation = generateVerdictExplanation(context);
        appendMessage({
          id: `expl-${Date.now()}`,
          sender: 'assistant',
          text: explanation,
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
        });
        setIsLoading(false);
        setLoadingStatusText('');
      }, 400);
      return;
    }

    if (opId === 'op-experiment-check-target') {
      setIsLoading(true);
      setLoadingStatusText('Checking measurement target against claim…');
      setTimeout(() => {
        const verdict = generateLinkCheckVerdict(context);
        appendMessage({
          id: `verdict-exp-${Date.now()}`,
          sender: 'verdict',
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
          verdictData: {
            ...verdict,
            axes: [
              {
                label: 'Type',
                verdict: 'pass',
                detail: 'empirical measurement matches experimental intervention',
              },
              {
                label: 'Scope',
                verdict: 'partial',
                detail: 'tested in simulation; in vivo validation planned',
              },
              {
                label: 'Target',
                verdict: 'pass',
                detail: 'measurement targets receptive field orientation distribution',
              },
            ],
            finding:
              'Measurement directly targets the orientation tuning distribution specified in the parent claim.',
          },
          isPrewiredPreview: true,
        });
        setIsLoading(false);
        setLoadingStatusText('');
      }, 500);
      return;
    }

    if (opId === 'op-survey-cluster') {
      setIsLoading(true);
      setLoadingStatusText('Proposing groupings from loose notes…');
      setTimeout(() => {
        appendMessage({
          id: `cluster-${Date.now()}`,
          sender: 'assistant',
          text: `Proposed clusters from ${(context.unclusteredNotesCount ?? 12)} unclustered notes:
1. Receptive field orientation & curvature tuning (4 notes)
2. Sparse coding efficiency & metabolic bounds (5 notes)
3. Biological plasticity & development timelines (3 notes)

Select candidates in the Survey tab to promote.`,
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
        });
        setIsLoading(false);
        setLoadingStatusText('');
      }, 600);
      return;
    }

    if (opId === 'op-passage-ask') {
      if (context.passageSnippet) {
        handleSendFreeTextMessage(`Explain this passage: "${context.passageSnippet.slice(0, 120)}…"`);
      }
      return;
    }

    if (opId === 'op-draft-check-links') {
      setIsLoading(true);
      setLoadingStatusText('Checking supporting links for draft section…');
      setTimeout(() => {
        appendMessage({
          id: `draft-chk-${Date.now()}`,
          sender: 'verdict',
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
          verdictData: {
            overallStatus: 'holds',
            modelId: 'cx/gpt-5.6-sol',
            isPrewiredPreview: true,
            axes: [
              { label: 'Type', verdict: 'pass', detail: 'claims in section match cited evidence' },
              { label: 'Scope', verdict: 'pass', detail: 'section scope aligns with findings' },
              { label: 'Target', verdict: 'pass', detail: 'placed artifacts test the assertions' },
            ],
            finding: 'All supporting links in this draft section hold.',
            actions: ['dismiss'],
          },
        });
        setIsLoading(false);
        setLoadingStatusText('');
      }, 500);
      return;
    }

    // Graph edits (rename, move, split, delete, add)
    if (opId.includes('rename') || opId.includes('split') || opId.includes('move') || opId.includes('delete') || opId.includes('add')) {
      const editType = opId.includes('rename')
        ? 'rename'
        : opId.includes('split')
        ? 'split'
        : opId.includes('move')
        ? 'move'
        : opId.includes('delete')
        ? 'delete'
        : 'add';

      const confirmation = generateGraphEditConfirmation(editType, context);
      appendMessage({
        id: `conf-${Date.now()}`,
        sender: 'edit_confirmation',
        timestamp: 'just now',
        modelId: 'cx/gpt-5.6-sol',
        confirmationData: confirmation,
      });
    }
  };

  // Handle free-text message submission
  const handleSendFreeTextMessage = async (customText?: string) => {
    const rawText = (customText ?? inputText).trim();
    if (!rawText || isLoading) return;

    // Post user message into thread
    const userMsg: ExaminerMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: 'just now',
    };
    appendMessage(userMsg);
    if (!customText) {
      setInputText('');
    }

    // 1. Refusal Check: Is user asking for a forbidden task?
    const refusal = checkRefusal(rawText);
    if (refusal) {
      // Immediate permanent refusal entry
      appendMessage({
        id: `refusal-${Date.now()}`,
        sender: 'refusal',
        timestamp: 'just now',
        modelId: 'cx/gpt-5.6-sol',
        refusalData: refusal,
      });
      return;
    }

    // 2. Link check via free-text
    if (/check (this )?(link|claim|evidence)/i.test(rawText)) {
      if (!context.userReason || context.userReason.trim().length === 0) {
        appendMessage({
          id: `refusal-${Date.now()}`,
          sender: 'refusal',
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
          refusalData: {
            declinedWhat: 'Checking link without user reason',
            declinedReason:
              'A link cannot be checked without a user-written reason. Commit your reason on the link first.',
          },
        });
        return;
      }
      setIsLoading(true);
      setLoadingStatusText('Checking link against Type, Scope, Target axes…');
      setTimeout(() => {
        const verdict = generateLinkCheckVerdict(context);
        appendMessage({
          id: `verdict-${Date.now()}`,
          sender: 'verdict',
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
          verdictData: verdict,
          isPrewiredPreview: true,
        });
        setIsLoading(false);
        setLoadingStatusText('');
      }, 550);
      return;
    }

    // 3. Dispatch to real `/api/assistant` if available
    setIsLoading(true);
    setLoadingStatusText('Querying Examiner instrument…');
    try {
      if (onSendMessage) {
        const res = await onSendMessage(rawText, context);
        if (res && res.text) {
          appendMessage({
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: res.text,
            timestamp: 'just now',
            modelId: res.modelId || 'cx/gpt-5.6-sol',
          });
        }
      } else {
        // Fallback local response
        appendMessage({
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: `Observing ${context.subjectType} (${context.subjectName}): reasoning structure evaluated.`,
          timestamp: 'just now',
          modelId: 'cx/gpt-5.6-sol',
        });
      }
    } catch (err: any) {
      appendMessage({
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `The assistant server did not respond. Check that it is running on 127.0.0.1. (${err?.message || 'Server offline'})`,
        timestamp: 'just now',
        modelId: 'cx/gpt-5.6-sol',
      });
    } finally {
      setIsLoading(false);
      setLoadingStatusText('');
    }
  };

  const getInputPlaceholder = () => {
    switch (context.kind) {
      case 'passage':
        return 'Ask about this passage, or instruct an edit…';
      case 'survey':
        return 'Ask about open problems, or instruct clustering…';
      case 'draft_section':
      case 'draft':
        return 'Ask about supporting links or draft drift…';
      case 'whole_graph':
      case 'question':
      case 'claim':
      default:
        return 'Ask about this selection, or instruct an edit…';
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      id="examiner-dock-panel"
      style={{ width: `${dockWidth}px` }}
      className="relative flex flex-col h-full bg-paper border-l border-rule select-text shrink-0 z-30 shadow-[-2px_0_8px_rgba(0,0,0,0.02)]"
      aria-label="Examiner Instrument Dock"
    >
      {/* Resizing Drag Handle */}
      <div
        id="examiner-dock-resize-handle"
        onMouseDown={handleMouseDown}
        title="Drag to resize Examiner dock"
        className={`absolute top-0 bottom-0 left-0 w-1.5 -ml-1 cursor-col-resize hover:bg-ink-muted/30 transition-colors z-40 ${
          isDragging ? 'bg-ink' : ''
        }`}
      />

      {/* 1. Header: Name, ⌘J, collapse control */}
      <header
        id="examiner-header"
        className="flex items-center justify-between px-3 py-2 border-b border-rule bg-paper shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className="font-sans text-[13px] font-bold tracking-tight text-ink">
            Examiner
          </span>
          <span className="font-mono text-[10px] text-ink-muted px-1 py-0.5 rounded-[2px] bg-surface border border-rule">
            cx/gpt-5.6-sol
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Thread Switcher Indicator */}
          <div className="relative">
            <button
              type="button"
              id="examiner-thread-switcher-toggle"
              onClick={() => setIsThreadDropdownOpen(!isThreadDropdownOpen)}
              title="View active threads for all contexts"
              className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-rule transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
            >
              <Layers className="w-3.5 h-3.5" />
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {isThreadDropdownOpen && (
              <div
                id="examiner-thread-dropdown-menu"
                className="absolute right-0 top-full mt-1 w-64 bg-paper border border-rule shadow-lg rounded-[2px] py-1 z-50 divide-y divide-rule/40 font-mono text-[11px]"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Isolated Threads ({Object.keys(threads).length})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-rule/20">
                  {Object.keys(threads).length === 0 ? (
                    <div className="p-2 text-ink-muted italic">No active threads yet.</div>
                  ) : (
                    (Object.values(threads) as ExaminerThread[]).map((t) => (
                      <div
                        key={t.id}
                        className={`p-2 hover:bg-surface transition-colors cursor-default ${
                          t.id === currentThreadKey ? 'bg-surface/80 font-bold' : ''
                        }`}
                      >
                        <div className="text-ink truncate">{t.contextLabel}</div>
                        <div className="text-[10px] text-ink-muted flex justify-between">
                          <span>{t.contextKind}</span>
                          <span>{t.messages.length} msgs</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="font-mono text-[10px] text-ink-muted bg-surface px-1.5 py-0.5 rounded-[2px] border border-rule select-none">
            ⌘J
          </span>

          <button
            type="button"
            id="examiner-collapse-button"
            onClick={onCloseDock}
            title="Collapse Examiner (⌘J)"
            aria-label="Collapse Examiner dock"
            className="p-1 text-ink-muted hover:text-ink hover:bg-surface rounded-[2px] border border-transparent hover:border-rule transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Context Chip */}
      <ExaminerContextChip
        context={context}
        onClickContextChip={onClickContextChip}
        onClearContext={onClearContext}
      />

      {/* 3. Permitted Operations Row */}
      <ExaminerOperations
        context={context}
        activeSurface={activeSurface}
        onExecuteOperation={handleExecuteOperation}
        onFocusReasonField={onFocusReasonField}
      />

      {/* 4. Transcript */}
      <ExaminerTranscript
        messages={activeThread.messages}
        context={context}
        onlyMine={onlyMine}
        onWeakenClaim={onWeakenClaim}
        onAddExperiment={onAddExperiment}
        onDismissVerdict={() => {}}
        onUndoConfirmation={onUndoEdit}
      />

      {/* Loading In-flight Indicator */}
      {isLoading && (
        <div
          id="examiner-loading-indicator"
          className="px-3 py-1.5 bg-surface border-t border-rule flex items-center gap-2 font-mono text-[11px] text-ink-muted"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-ink" />
          <span>{loadingStatusText || 'Working…'}</span>
        </div>
      )}

      {/* 5. Secondary Input */}
      <footer
        id="examiner-input-footer"
        className="p-2.5 border-t border-rule bg-paper shrink-0 space-y-1.5"
      >
        <div className="relative">
          <textarea
            ref={inputRef}
            id="examiner-secondary-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendFreeTextMessage();
              }
            }}
            placeholder={getInputPlaceholder()}
            rows={2}
            className="w-full resize-none rounded-[2px] bg-surface p-2 pr-8 font-sans text-[12px] text-ink placeholder:text-ink-muted/70 border border-rule focus:border-ink focus:outline-none transition-colors leading-relaxed"
          />

          <button
            type="button"
            id="examiner-send-button"
            onClick={() => handleSendFreeTextMessage()}
            disabled={!inputText.trim() || isLoading}
            title="Send query (Enter)"
            aria-label="Send query"
            className="absolute bottom-2.5 right-2 p-1 rounded-[2px] bg-paper border border-rule hover:border-ink hover:text-ink text-ink-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </aside>
  );
}
