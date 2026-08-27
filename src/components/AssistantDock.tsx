import React, { useState, useRef, useEffect } from 'react';
import {
  type DraggableResearchItem,
  getResearchItemDragData,
  hasResearchItemDragData,
} from '../researchItemDrag';
import {
  ChatMessage,
  AssistantContextInfo,
  AssistantThread,
} from '../types';
import {
  Pencil,
  X,
  ChevronDown,
  Plus,
  MessageSquare,
  Check,
  Loader2,
  ArrowUp,
  ArrowUpRight,
  CircleHelp,
  FileText,
  FlaskConical,
  GitBranch,
  Network,
  Search,
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
  onDropResearchItem: (item: DraggableResearchItem) => void;
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
  onDropResearchItem,
}: AssistantDockProps) {
  const [inputText, setInputText] = useState('');
  const [isThreadDropdownOpen, setIsThreadDropdownOpen] = useState(false);
  const [isResearchItemDragOver, setIsResearchItemDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragDepthRef = useRef(0);
  const isQuestionContext = context.kind === 'whole_graph' && context.id !== 'whole_graph';
  const contextVisual = isQuestionContext
    ? {
        label: 'Question',
        icon: CircleHelp,
        accent: 'text-[#6B4FBB] dark:text-[#BCA8F7]',
        surface: 'bg-[#F5F2FF] dark:bg-[#6B4FBB]/12',
        border: 'border-[#E4DCFA] dark:border-[#6B4FBB]/30',
      }
    : context.kind === 'claim'
      ? {
          label: 'Claim',
          icon: GitBranch,
          accent: 'text-[#2C5EA8] dark:text-[#7DB4F8]',
          surface: 'bg-[#EFF5FF] dark:bg-[#2C5EA8]/12',
          border: 'border-[#DBE7F8] dark:border-[#2C5EA8]/30',
        }
      : context.kind === 'paper'
        ? {
            label: 'Paper',
            icon: FileText,
            accent: 'text-[#2A6E77] dark:text-[#6CD0DE]',
            surface: 'bg-[#F1F8F9] dark:bg-[#2A6E77]/12',
            border: 'border-[#D5EAED] dark:border-[#2A6E77]/30',
          }
        : context.kind === 'experiment'
          ? {
              label: 'Experiment',
              icon: FlaskConical,
              accent: 'text-[#A45A1E] dark:text-[#F4A86A]',
              surface: 'bg-[#FFF6EE] dark:bg-[#A45A1E]/12',
              border: 'border-[#F6E3D2] dark:border-[#A45A1E]/30',
            }
          : context.kind === 'survey'
            ? {
                label: 'Survey',
                icon: Search,
                accent: 'text-[#9A6700] dark:text-[#F4C96B]',
                surface: 'bg-[#FFF9E8] dark:bg-[#9A6700]/12',
                border: 'border-[#F1E4B7] dark:border-[#9A6700]/30',
              }
            : {
                label: 'Whole graph',
                icon: Network,
                accent: 'text-[#525252] dark:text-[#D4D4D4]',
                surface: 'bg-[#F5F5F4] dark:bg-[#242424]',
                border: 'border-[#E7E5E4] dark:border-[#343434]',
              };
  const ContextIcon = contextVisual.icon;
  const contextTitle = context.label.replace(/^(question|claim|paper):\s*/i, '');

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
    if (isQuestionContext) {
      return [
        'Which claim least answers this question?',
        'Where is this question still unsupported?',
        'Which claim is broader than this question?',
      ];
    }
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
          'What does this paper actually establish?',
          'What does this passage not establish?',
          'Which assumption does this result depend on?',
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
    if (isQuestionContext) return 'Ask about this question and its claims...';
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

  const getEmptyStateCopy = () => {
    if (isQuestionContext) {
      return {
        title: 'Inspect this question',
        description: 'Check whether its claims answer it directly, completely, and at the right scope.',
      };
    }
    switch (context.kind) {
      case 'claim':
        return {
          title: 'Inspect this claim',
          description: 'Check the link from this claim to its question, or where its evidence falls short.',
        };
      case 'paper':
        return {
          title: 'Read against the argument',
          description: 'Ask about a passage, an assumption, or the limits of what this paper establishes.',
        };
      case 'experiment':
        return {
          title: 'Inspect this experiment',
          description: 'Check whether its design and measurements actually test the linked claim.',
        };
      case 'survey':
        return {
          title: 'Structure the open problems',
          description: 'Check distinctions and clusters without inventing a research question for you.',
        };
      default:
        return {
          title: 'Inspect the argument',
          description: 'Find unsupported claims, scope mismatches, and links that need a clearer reason.',
        };
    }
  };

  const emptyStateCopy = getEmptyStateCopy();

  const handleSelectSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasResearchItemDragData(event.dataTransfer)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsResearchItemDragOver(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasResearchItemDragData(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasResearchItemDragData(event.dataTransfer)) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsResearchItemDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsResearchItemDragOver(false);
    const item = getResearchItemDragData(event.dataTransfer);
    if (!item) return;
    onDropResearchItem(item);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div
      id="assistant-dock-panel"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-full flex flex-col bg-[#fcfcfc] dark:bg-[#141414] overflow-hidden select-none"
    >
      {isResearchItemDragOver && (
        <div className="absolute inset-2 z-[60] pointer-events-none flex items-center justify-center rounded-xl border-2 border-dashed border-[#2C5EA8] bg-[#EFF5FF]/95 dark:bg-[#16243a]/95 text-center shadow-lg">
          <div>
            <div className="text-[13px] font-semibold text-[#2C5EA8] dark:text-[#7DB4F8]">
              Drop into assistant
            </div>
            <div className="mt-1 text-[11px] text-[#6b6b6b] dark:text-[#a0a0a0]">
              Switch context, then type your question
            </div>
          </div>
        </div>
      )}
      <div
        id="assistant-dock-header"
        className="shrink-0 border-b border-[#e8e8e6] bg-white px-3.5 pb-3 pt-2.5 dark:border-[#292929] dark:bg-[#171717]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a8a87] dark:text-[#777]">
            Assistant
          </span>

          <div className="flex items-center gap-1">
            <div className="relative" ref={dropdownRef}>
              <button
                id="assistant-thread-switcher-btn"
                onClick={() => setIsThreadDropdownOpen(!isThreadDropdownOpen)}
                title="Switch thread"
                className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-[#737373] transition-colors hover:border-[#e5e5e5] hover:bg-[#f5f5f4] hover:text-[#1a1a1a] dark:text-[#8f8f8f] dark:hover:border-[#303030] dark:hover:bg-[#222] dark:hover:text-white"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {dockWidth >= 320 && <span>Threads</span>}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {isThreadDropdownOpen && (
                <div
                  id="assistant-thread-dropdown-menu"
                  className="absolute right-0 top-8 z-50 max-h-80 w-72 divide-y divide-[#f0f0f0] overflow-y-auto rounded-xl border border-[#e5e5e5] bg-white p-1.5 shadow-xl dark:divide-[#282828] dark:border-[#303030] dark:bg-[#1d1d1d]"
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                    Active threads
                  </div>

                  <div className="max-h-56 space-y-0.5 overflow-y-auto py-1">
                    {allThreads.map((thread) => {
                      const isActive = thread.id === activeThread.id;
                      return (
                        <button
                          key={thread.id}
                          onClick={() => {
                            onSelectThread(thread.id);
                            setIsThreadDropdownOpen(false);
                          }}
                          className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors ${
                            isActive
                              ? 'bg-[#f1f1ef] font-medium text-[#1a1a1a] dark:bg-[#292929] dark:text-white'
                              : 'text-[#555] hover:bg-[#f7f7f6] hover:text-[#1a1a1a] dark:text-[#bbb] dark:hover:bg-[#242424] dark:hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="truncate">{thread.contextLabel}</div>
                            <div className="mt-0.5 text-[10px] text-[#999] dark:text-[#777]">
                              {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'} · {thread.lastUpdated}
                            </div>
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
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
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f1f1ef] dark:text-white dark:hover:bg-[#292929]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New thread</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              id="assistant-dock-close-btn"
              onClick={onCloseDock}
              title="Close Assistant (Cmd/Ctrl+J)"
              className="cursor-pointer rounded-md p-1.5 text-[#8a8a87] transition-colors hover:bg-[#f1f1ef] hover:text-[#1a1a1a] dark:text-[#777] dark:hover:bg-[#252525] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`mt-2.5 flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${contextVisual.surface} ${contextVisual.border}`}>
          <button
            type="button"
            onClick={onClickContextChip}
            title="Show this context"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-black/15 ${contextVisual.accent}`}>
              <ContextIcon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className={`block text-[9px] font-bold uppercase tracking-[0.14em] ${contextVisual.accent}`}>
                {contextVisual.label}
              </span>
              <span className="block truncate text-[12px] font-medium text-[#242424] dark:text-[#e7e7e7]">
                {contextTitle}
              </span>
            </span>
          </button>
          {(context.kind !== 'whole_graph' || isQuestionContext) && (
            <button
              type="button"
              onClick={onClearContext}
              title="Clear to whole graph"
              className="cursor-pointer rounded-md p-1 text-[#8a8a87] transition-colors hover:bg-white/70 hover:text-[#1a1a1a] dark:text-[#777] dark:hover:bg-black/15 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto bg-[#fafaf9] p-4 select-text dark:bg-[#121212]"
      >
        {activeThread.messages.length === 0 ? (
          <div className="mx-auto w-full max-w-xl px-1 pb-8 pt-5">
            <div className="mb-7 flex items-start gap-3">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${contextVisual.surface} ${contextVisual.border} ${contextVisual.accent}`}>
                <ContextIcon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1f1f1f] dark:text-[#ededed]">
                  {emptyStateCopy.title}
                </h2>
                <p className="mt-1 max-w-md text-[12px] leading-relaxed text-[#72726f] dark:text-[#8d8d8d]">
                  {emptyStateCopy.description}
                </p>
              </div>
            </div>

            <div className="mb-2.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#92928f] dark:text-[#666]">
              Suggested prompts
            </div>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSelectSuggestedPrompt(prompt)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#e7e7e4] bg-white px-3.5 py-3 text-left text-[13px] text-[#2b2b2b] shadow-[0_1px_2px_rgba(0,0,0,0.025)] transition-all hover:-translate-y-px hover:border-[#d7d7d3] hover:shadow-[0_5px_18px_rgba(0,0,0,0.06)] dark:border-[#292929] dark:bg-[#191919] dark:text-[#d8d8d8] dark:hover:border-[#393939] dark:hover:bg-[#1d1d1d]"
                >
                  <span className="leading-snug">{prompt}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#a0a09c] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-[#5f5f5f]" />
                </button>
              ))}
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

      <div
        id="assistant-dock-bottom-area"
        className="shrink-0 border-t border-[#e8e8e6] bg-white p-3 select-none dark:border-[#292929] dark:bg-[#151515]"
      >
        <div className="overflow-hidden rounded-2xl border border-[#dededb] bg-[#fcfcfb] shadow-[0_5px_22px_rgba(0,0,0,0.055)] transition-all focus-within:border-[#bdbdb8] focus-within:bg-white focus-within:shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:border-[#303030] dark:bg-[#1c1c1c] dark:shadow-[0_8px_28px_rgba(0,0,0,0.22)] dark:focus-within:border-[#454545] dark:focus-within:bg-[#1f1f1f]">
          {quotedSnippet && (
            <div className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-lg border-l-2 border-[#ffb000] bg-[#f6f6f4] px-2.5 py-2 text-[11px] text-[#666] dark:bg-[#242424] dark:text-[#a0a0a0]">
              <span className="truncate italic">“{quotedSnippet}”</span>
              <button
                type="button"
                onClick={onClearQuotedSnippet}
                title="Remove quoted passage"
                className="shrink-0 cursor-pointer rounded p-0.5 text-[#999] transition-colors hover:bg-white hover:text-[#1a1a1a] dark:hover:bg-[#303030] dark:hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getInputPlaceholder()}
            disabled={isResponding}
            className="max-h-24 min-h-[58px] w-full resize-none bg-transparent px-3.5 pb-2 pt-3 text-[13px] leading-relaxed text-[#1a1a1a] placeholder-[#9a9a96] focus:outline-hidden disabled:opacity-60 dark:text-[#dedede] dark:placeholder-[#656565]"
          />

          <div className="flex items-center justify-between px-2.5 pb-2.5 pl-3.5">
            <span className="text-[10px] text-[#9a9a96] dark:text-[#5f5f5f]">
              {dockWidth < 350 ? 'Enter to send' : 'Enter to send · Shift+Enter for a new line'}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!inputText.trim() || isResponding}
              title="Send (Enter)"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#1f1f1f] text-white shadow-sm transition-all hover:-translate-y-px hover:bg-black disabled:cursor-default disabled:opacity-25 disabled:hover:translate-y-0 dark:bg-[#ededed] dark:text-[#171717] dark:hover:bg-white"
            >
              {isResponding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
