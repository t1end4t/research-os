import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { SectionLabel } from '../ui/instrument';

export interface TopBarProps {
  workspacePath?: string;
  selectedTag: string;
  allTags: string[];
  onSelectTag: (tag: string) => void;
  onlyMine: boolean;
  onToggleOnlyMine: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
}

export function TopBar({
  workspacePath = 'v1-sparse',
  selectedTag,
  allTags,
  onSelectTag,
  onlyMine,
  onToggleOnlyMine,
  darkMode,
  onToggleDarkMode,
  isAssistantOpen,
  onToggleAssistant,
}: TopBarProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac');
  const shortcutHint = isMac ? '⌘J' : 'Ctrl+J';

  // Format workspace folder name
  const workspaceFolder = workspacePath
    ? workspacePath.split('/').filter(Boolean).pop() || workspacePath
    : 'v1-sparse';

  return (
    <header
      id="instrument-top-bar"
      className="h-10 px-3 bg-surface border-b border-rule flex items-center justify-between shrink-0 select-none z-30 font-sans"
    >
      {/* Left: Wordmark & Workspace & Tags */}
      <div className="flex items-center gap-4">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-semibold tracking-[0.05em] text-ink uppercase">
            INSTRUMENT
          </span>
        </div>

        <div className="h-3 w-[1px] bg-rule" />

        {/* Workspace Selector */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted">
          <span className="text-ink-muted/70">workspace:</span>
          <button
            title={`Active workspace directory: ${workspacePath}`}
            className="inline-flex items-center gap-1 font-mono text-ink hover:text-ink font-medium px-1.5 py-0.5 rounded-[2px] hover:bg-paper transition-colors cursor-pointer"
          >
            <span>{workspaceFolder}</span>
            <span className="text-[9px] text-ink-muted">▾</span>
          </button>
        </div>

        <div className="h-3 w-[1px] bg-rule" />

        {/* Tag Filter (The ONLY project-level grouping) */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="font-mono text-ink-muted/70">tag:</span>
          <div className="relative inline-block">
            <select
              id="tag-filter-select"
              value={selectedTag}
              onChange={(e) => onSelectTag(e.target.value)}
              aria-label="Filter questions by tag"
              className="appearance-none bg-surface hover:bg-paper border border-rule/80 text-ink font-mono text-[11px] rounded-[2px] pl-2 pr-5 py-0.5 focus:border-ink cursor-pointer transition-colors"
            >
              <option value="all">all</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-ink-muted font-mono">
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* Right: Only mine toggle + Theme + ⌘J dock toggle */}
      <div className="flex items-center gap-3">
        {/* "Only mine" toggle: hides model-produced assertions */}
        <button
          id="only-mine-toggle-btn"
          onClick={onToggleOnlyMine}
          title="Toggle view: hide all model-produced check results and proposals"
          aria-pressed={onlyMine}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors border cursor-pointer ${
            onlyMine
              ? 'bg-ink text-paper border-ink font-medium'
              : 'bg-surface text-ink-muted hover:text-ink border-rule/80 hover:bg-paper'
          }`}
        >
          <span>only mine</span>
          <span className="text-[10px]">{onlyMine ? '●' : '○'}</span>
        </button>

        <div className="h-3 w-[1px] bg-rule" />

        {/* ⌘J Assistant Dock Toggle Hint / Button */}
        <button
          id="toggle-dock-btn"
          onClick={onToggleAssistant}
          title={`Toggle Examiner Dock (${shortcutHint})`}
          aria-label="Toggle Examiner Dock"
          aria-pressed={isAssistantOpen}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors border cursor-pointer ${
            isAssistantOpen
              ? 'bg-ink text-paper border-ink'
              : 'bg-surface text-ink-muted hover:text-ink border-rule hover:bg-paper'
          }`}
        >
          <span className="font-semibold">{shortcutHint}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-paper border border-transparent hover:border-rule transition-colors cursor-pointer"
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
}
