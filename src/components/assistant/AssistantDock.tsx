import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  X,
  Send,
  Sparkles,
  Bot,
  CornerDownLeft,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  ShieldAlert,
  GripHorizontal
} from 'lucide-react';

export const AssistantDock: React.FC = () => {
  const {
    isDockOpen,
    setIsDockOpen,
    dockWidth,
    setDockWidth,
    activeContext,
    setActiveContext,
    threads,
    sendAssistantMessage,
    links
  } = useWorkspace();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Get active thread
  const contextKey = activeContext ? activeContext.id : 'global-graph';
  const messages = threads[contextKey] || [];

  // Find if context is a link
  const currentContextLink = activeContext?.type === 'link'
    ? links.find(l => l.id === activeContext.id || l.id === activeContext.metadata?.linkId)
    : null;

  // Auto-scroll transcript on new message
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Handle Resize by dragging left edge
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      const minW = 300;
      const maxW = Math.floor(window.innerWidth * 0.5);
      setDockWidth(Math.min(Math.max(newWidth, minW), maxW));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setDockWidth]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendAssistantMessage(contextKey, inputMessage.trim());
    setInputMessage('');
  };

  if (!isDockOpen) return null;

  return (
    <aside
      id="instrument-assistant-dock"
      style={{ width: `${dockWidth}px` }}
      className="relative h-full border-l border-[var(--color-rule)] bg-[var(--color-surface)] flex flex-col shrink-0 select-none z-30 transition-all duration-75"
    >
      {/* Resizing Handle on Left Edge */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Drag to resize dock"
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-[var(--color-ink)]/20 transition-colors z-40 -translate-x-1/2"
      />

      {/* Dock Top Header */}
      <div className="h-12 border-b border-[var(--color-rule)] bg-[var(--color-paper)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-900 dark:text-slate-100">
            Assistant Dock
          </span>
          <span className="font-mono text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/50">
            cx/gpt-5.6-sol
          </span>
        </div>

        <button
          id="assistant-dock-close-btn"
          onClick={() => setIsDockOpen(false)}
          title="Close Assistant Dock (Ctrl/Cmd+J)"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Context Chip Area (Isolated Thread Representation) */}
      <div className="px-4 py-3 border-b border-[var(--color-rule)] bg-[var(--color-surface)] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Explicit Context & Thread
          </span>
          {activeContext?.type !== 'graph' && (
            <button
              onClick={() =>
                setActiveContext({
                  type: 'graph',
                  id: 'global-graph',
                  label: 'Global Graph',
                  secondaryLabel: 'Argument tree'
                })
              }
              className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Reset to Graph
            </button>
          )}
        </div>

        {/* Current Active Context Chip */}
        <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-200/50">
              {activeContext?.type || 'graph'}
            </span>
            <span className="font-sans text-xs text-slate-900 dark:text-slate-100 font-semibold truncate">
              {activeContext?.label || 'Global Graph'}
            </span>
          </div>
          {activeContext?.secondaryLabel && (
            <span className="font-mono text-[9px] text-slate-400 ml-2 shrink-0 truncate max-w-[120px]">
              {activeContext.secondaryLabel}
            </span>
          )}
        </div>

        {/* Missing Reason Refusal Warning Banner if Link Dropped without reason */}
        {currentContextLink && !currentContextLink.userReason && (
          <div className="mt-1 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
            <span>
              Uncommitted Link: This relation has no user reason. The assistant refuses to check uncommitted reasoning and is strictly forbidden from writing it.
            </span>
          </div>
        )}
      </div>

      {/* Transcript Area (Isolated Per Context) */}
      <div
        id="assistant-transcript-list"
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[var(--color-surface)] font-mono text-xs select-text"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 gap-2.5">
            <Sparkles className="w-8 h-8 text-indigo-400/50" />
            <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              Thread for {activeContext?.label || 'context'}.
            </p>
            <p className="text-[11px] font-sans text-slate-500 max-w-xs">
              Ask questions about consistency, check link relations, or test edge hypotheses.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isModel = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 ${
                  isModel ? 'items-start' : 'items-end'
                }`}
              >
                {/* Message Author & Provenance Tag */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  {isModel ? (
                    <>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        [cx/gpt-5.6-sol]
                      </span>
                      <span>•</span>
                      <span>model</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">user</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed shadow-xs ${
                    isModel
                      ? msg.isRefusal
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-tl-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                      : 'bg-indigo-600 text-white rounded-tr-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-mono text-[12px]">
                    {msg.content}
                  </p>

                  {/* Structured Action with Confirmation and Undo link */}
                  {msg.structuredAction && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Operation executed: {msg.structuredAction.type}
                      </span>
                      {msg.structuredAction.undoAvailable && (
                        <button
                          onClick={() => alert('Undo: Previous relation state restored.')}
                          className="font-mono underline text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          Undo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Input Box Area */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-[var(--color-rule)] bg-[var(--color-paper)] flex flex-col gap-2.5 shrink-0"
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Target Context: <strong className="text-slate-600 dark:text-slate-300">{activeContext?.label || 'Global'}</strong></span>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">Pinned: cx/gpt-5.6-sol</span>
        </div>

        <div className="relative flex items-center">
          <textarea
            rows={2}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask about link reasoning, paper passage, or check consistency..."
            className="w-full p-3 pr-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none shadow-2xs"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            title="Send (Enter)"
            className="absolute right-3 bottom-3 p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-xs"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
