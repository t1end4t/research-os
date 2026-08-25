import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  AssistantContextInfo,
  AssistantThread,
} from '../types';
import {
  Pencil,
  X,
  Send,
  ChevronDown,
  Plus,
  MessageSquare,
  Check,
  Loader2,
} from 'lucide-react';

interface AssistantDockProps {
  dockWidth: number;
  context: AssistantContextInfo;
  activeThread: AssistantThread;
  allThreads: AssistantThread[];
  onSelectThread: (threadId: string) => void;
  onCreateNewThread: () => void;
  onSendMessage: (text: string, quotedSnippet?: string | null) => Promise<void>;
  isResponding: boolean;
  onUndoEdit: (messageId: string) => void;
  onAcceptProposal?: (proposal: import('../types').ClusteringProposal, messageId: string) => void;
  onRejectProposal?: (proposalId: string, messageId: string) => void;
  onClearContext: () => void;
  onClickContextChip: () => void;
  onCloseDock: () => void;
  quotedSnippet: string | null;
  onClearQuotedSnippet: () => void;
}

export function AssistantDock({
  dockWidth,
  context,
  activeThread,
  allThreads,
  onSelectThread,
  onCreateNewThread,
  onSendMessage,
  isResponding,
  onUndoEdit,
  onAcceptProposal,
  onRejectProposal,
  onClearContext,
  onClickContextChip,
  onCloseDock,
  quotedSnippet,
  onClearQuotedSnippet,
}: AssistantDockProps) {
  const [inputText, setInputText] = useState('');
  const [isThreadDropdownOpen, setIsThreadDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on message updates or thread switches
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeThread.messages]);

  // Focus textarea when quoted snippet changes
  useEffect(() => {
    if (quotedSnippet && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [quotedSnippet]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsThreadDropdownOpen(false);
      }
    };
    if (isThreadDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThreadDropdownOpen]);

  // Adjust textarea height up to 4 lines (max 96px)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 96);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isResponding) return;
    void onSendMessage(trimmed, quotedSnippet);
    setInputText('');
    onClearQuotedSnippet();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Suggested prompts per context kind
  const getSuggestedPrompts = () => {
    switch (context.kind) {
      case 'survey':
        return [
          'Are these one gap or several?',
          'Which notes seem to mix different assumptions?',
          'What distinction should I make explicit?',
        ];
      case 'whole_graph':
        return [
          'Which claim is most vulnerable?',
          'Where are the evidentiary gaps?',
          'Which claim appears broader than its evidence?',
        ];
      case 'claim':
        return [
          'Is this claim causal or correlational?',
          'Where does this claim exceed its evidence?',
          'What does the stated reason fail to establish?',
        ];
      case 'paper':
        return [
          'Does this paper support my selected claim?',
          'What does this passage not establish?',
          'Which assumption matters for my claim?',
        ];
      case 'experiment':
        return [
          'Does this experiment measure the claim?',
          'Is the experiment narrower than the claim?',
        ];
      default:
        return [
          'Which claim is most vulnerable?',
          'Where are the evidentiary gaps?',
          'Which claim appears broader than its evidence?',
        ];
    }
  };

  // Dynamic input placeholder
  const getInputPlaceholder = () => {
    switch (context.kind) {
      case 'survey':
        return 'Ask about open problems or survey clusters...';
      case 'whole_graph':
        return 'Ask about your argument structure...';
      case 'claim':
        return 'Ask about this claim or its supporting reason...';
      case 'paper':
        return 'Ask about this paper, or select text to quote...';
      case 'experiment':
        return 'Ask whether this experiment tests its claim...';
      default:
        return 'Ask about your argument structure...';
    }
  };

  const suggestedPrompts = getSuggestedPrompts();

  const handleSelectSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div
      id="assistant-dock-panel"
      className="h-full flex flex-col bg-[#fcfcfc] dark:bg-[#141414] overflow-hidden select-none"
    >
      {/* Header: "ASSISTANT" small uppercase muted on left, thread switcher & close x on right */}
      <div
        id="assistant-dock-header"
        className="h-11 px-4 border-b border-[#ececec] dark:border-[#262626] flex items-center justify-between shrink-0 bg-white dark:bg-[#181818]"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#999] dark:text-[#666]">
          ASSISTANT
        </span>

        <div className="flex items-center gap-1.5">
          {/* Thread Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="assistant-thread-switcher-btn"
              onClick={() => setIsThreadDropdownOpen(!isThreadDropdownOpen)}
              title="Switch Thread"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[#6b6b6b] dark:text-[#a0a0a0] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#262626] border border-[#ececec] dark:border-[#2a2a2a] transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 opacity-70" />
              <span>Threads</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Dropdown Menu */}
            {isThreadDropdownOpen && (
              <div
                id="assistant-thread-dropdown-menu"
                className="absolute right-0 top-8 w-72 max-h-80 overflow-y-auto bg-white dark:bg-[#1c1c1c] border border-[#ececec] dark:border-[#2e2e2e] rounded-lg p-1.5 shadow-xl z-50 divide-y divide-[#f0f0f0] dark:divide-[#282828] animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                  Active Threads
                </div>

                <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
                  {allThreads.map((t) => {
                    const isActive = t.id === activeThread.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectThread(t.id);
                          setIsThreadDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-[12px] flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#f0f0f0] dark:bg-[#282828] text-[#1a1a1a] dark:text-white font-medium'
                            : 'text-[#555] dark:text-[#bbb] hover:bg-[#f7f7f7] dark:hover:bg-[#222222] hover:text-[#1a1a1a] dark:hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="truncate text-[12px]">
                            {t.contextLabel}
                          </div>
                          <div className="text-[10px] text-[#999] dark:text-[#777]">
                            {dockWidth < 340 ? (
                              <span>{t.messages.length} msgs</span>
                            ) : (
                              <span>
                                {t.messages.length} messages • {t.lastUpdated}
                              </span>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-white shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <button
                    id="assistant-new-thread-btn"
                    onClick={() => {
                      onCreateNewThread();
                      setIsThreadDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded text-[12px] font-medium text-[#1a1a1a] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#282828] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New thread</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Close Dock X Button */}
          <button
            id="assistant-dock-close-btn"
            onClick={onCloseDock}
            title="Close Assistant (Cmd/Ctrl+J)"
            className="p-1 text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#262626] rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transcript Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 select-text"
      >
        {activeThread.messages.length === 0 ? (
          /* Empty State: SUGGESTED PROMPTS - reflows 2 per row above 520px, single list otherwise */
          <div className="h-full flex flex-col justify-center py-6 px-1">
            <div className="w-full space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#999] dark:text-[#666] mb-3 px-1">
                Suggested prompts
              </div>
              {dockWidth >= 520 ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestedPrompt(prompt)}
                      className="text-left px-3 py-3 rounded-lg border border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] hover:border-[#dedede] dark:hover:border-[#383838] hover:bg-[#f9f9f9] dark:hover:bg-[#222222] text-[13px] text-[#222] dark:text-[#dedede] hover:text-[#000] dark:hover:text-white transition-all cursor-pointer flex items-center justify-between group shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <span className="leading-snug">{prompt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full border-b border-[#ececec] dark:border-[#262626]">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestedPrompt(prompt)}
                      className="w-full text-left px-2 py-3 border-t border-[#ececec] dark:border-[#262626] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[13px] text-[#222] dark:text-[#dedede] hover:text-[#000] dark:hover:text-white transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <span className="leading-snug">{prompt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Transcript Messages */
          activeThread.messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div
                  key={msg.id}
                  className="group flex flex-col items-end w-full"
                >
                  <div className="max-w-[85%] rounded-xl bg-[#f0f0f0] dark:bg-[#252525] px-3.5 py-2.5 text-[13px] text-[#1a1a1a] dark:text-[#ededed] leading-relaxed break-words">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[#999] dark:text-[#666] opacity-0 group-hover:opacity-100 transition-opacity mt-1 pr-1 select-none">
                    {msg.timestamp}
                  </span>
                </div>
              );
            }

            if (msg.sender === 'edit_confirmation') {
              return (
                <div
                  key={msg.id}
                  className="group flex flex-col items-start w-full my-1"
                >
                  <div className="w-full max-w-[85%] flex items-center justify-between border-l-[3px] border-[#ffb000] bg-white dark:bg-[#1c1c1c] pl-3 pr-2 py-2 text-[12px] text-[#1a1a1a] dark:text-[#ededed] rounded-r border-y border-r border-[#ececec] dark:border-[#2a2a2a] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Pencil className="w-3.5 h-3.5 text-[#ffb000] shrink-0" />
                      <span className="truncate">{msg.text}</span>
                    </div>
                    {msg.undoAction && (
                      <button
                        onClick={() => onUndoEdit(msg.id)}
                        className="text-[11px] font-semibold text-[#6b6b6b] dark:text-[#a0a0a0] hover:text-[#1a1a1a] dark:hover:text-white hover:underline shrink-0 cursor-pointer ml-2"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-[#999] dark:text-[#666] opacity-0 group-hover:opacity-100 transition-opacity mt-1 pl-1 select-none">
                    {msg.timestamp}
                  </span>
                </div>
              );
            }

            if (msg.sender === 'clustering_proposal' && msg.proposals && msg.proposals.length > 0) {
              return (
                <div
                  key={msg.id}
                  className="group flex flex-col items-start w-full my-2 space-y-2.5"
                >
                  <div className="text-[13px] font-medium text-[#1a1a1a] dark:text-[#ededed]">
                    {msg.text}
                  </div>
                  <div className="w-full space-y-2">
                    {msg.proposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="w-full rounded-[10px] border border-[#ececec] dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] p-3 space-y-2 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[13px] font-semibold text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug">
                            {prop.groupName}
                          </div>
                        </div>

                        {/* Snippets list */}
                        <div className="space-y-1 pl-2 border-l-2 border-[#2C5EA8]/40 dark:border-[#7DB4F8]/40 my-1">
                          {prop.problemSnippets.map((snippet, sIdx) => (
                            <div
                              key={sIdx}
                              className="text-[11px] text-[#666] dark:text-[#aaa] leading-tight line-clamp-1"
                            >
                              • {snippet}
                            </div>
                          ))}
                        </div>

                        {/* Accept / Reject actions */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0f0f0] dark:border-[#282828]">
                          <button
                            onClick={() => onRejectProposal && onRejectProposal(prop.id, msg.id)}
                            className="px-2.5 py-1 text-[11px] text-[#888] hover:text-[#ef4444] rounded cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => onAcceptProposal && onAcceptProposal(prop, msg.id)}
                            className="px-3 py-1 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[11px] font-medium hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
                          >
                            Accept as candidate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#999] dark:text-[#666] opacity-0 group-hover:opacity-100 transition-opacity mt-1 pr-1 select-none">
                    {msg.timestamp}
                  </span>
                </div>
              );
            }

            // Assistant messages: left-aligned, plain text on background, 14px, line-height 1.6
            return (
              <div
                key={msg.id}
                className="group flex flex-col items-start w-full"
              >
                <div className="max-w-[85%] text-[14px] text-[#1a1a1a] dark:text-[#dedede] leading-[1.6] select-text whitespace-pre-line">
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#999] dark:text-[#666] opacity-0 group-hover:opacity-100 transition-opacity mt-1 pl-1 select-none">
                  {msg.modelId ? `${msg.timestamp} · ${msg.modelId}` : msg.timestamp}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input area pinned to bottom */}
      <div
        id="assistant-dock-bottom-area"
        className="p-3.5 border-t border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#181818] shrink-0 select-none"
      >
        {/* CONTEXT CHIP - directly above the input, truncates harder below 340px */}
        <div
          id="assistant-context-chip"
          className={`mb-2.5 flex items-center justify-between gap-1.5 px-2.5 py-1 rounded bg-[#f5f5f5] dark:bg-[#222222] text-[11px] text-[#6b6b6b] dark:text-[#a0a0a0] border border-[#e5e5e5] dark:border-[#333333] transition-colors ${
            dockWidth < 340 ? 'text-[10px] px-2 py-0.5' : ''
          }`}
        >
          <button
            onClick={onClickContextChip}
            title="Scroll view to this node"
            className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
          >
            <span className={`truncate ${dockWidth < 340 ? 'max-w-[190px]' : ''}`}>
              {context.label}
            </span>
          </button>
          {context.kind !== 'whole_graph' && (
            <button
              onClick={onClearContext}
              title="Clear back to whole-graph scope"
              className="p-0.5 hover:text-[#1a1a1a] dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 rounded shrink-0 cursor-pointer transition-colors ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quoted snippet if user selected "Ask" from doc in Papers tab */}
        {quotedSnippet && (
          <div className="mb-2 pl-2.5 border-l-2 border-[#ffb000] bg-stone-50 dark:bg-[#202020] py-1 px-2 rounded-r text-[11px] text-[#666] dark:text-[#a0a0a0] flex items-center justify-between">
            <span className="truncate italic">"{quotedSnippet}"</span>
            <button
              onClick={onClearQuotedSnippet}
              className="p-0.5 hover:text-[#1a1a1a] dark:hover:text-white text-[#999] ml-1 shrink-0 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input Bar: single line grows to max 4 lines */}
        <div className="relative flex items-center border border-[#ececec] dark:border-[#2a2a2a] rounded-lg bg-[#fcfcfc] dark:bg-[#1f1f1f] focus-within:border-[#dedede] dark:focus-within:border-[#404040] focus-within:bg-white dark:focus-within:bg-[#242424] transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getInputPlaceholder()}
            disabled={isResponding}
            className="w-full resize-none bg-transparent px-3 py-2 text-[13px] text-[#1a1a1a] dark:text-[#dedede] placeholder-[#999] dark:placeholder-[#666] focus:outline-hidden leading-normal max-h-24 select-text"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isResponding}
            title="Send (Enter)"
            className="p-1.5 mr-1 text-[#6b6b6b] dark:text-[#a0a0a0] hover:text-[#1a1a1a] dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
          >
            {isResponding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
