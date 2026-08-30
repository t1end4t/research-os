import React from 'react';
import {
  SlidersHorizontal,
  Search,
  X,
  Eye,
  Zap,
  Layers,
  RotateCcw,
} from 'lucide-react';

export interface GraphDisplayOptions {
  nodeScale: number;
  linkThickness: number;
  labelMode: 'all' | 'hover' | 'none';
  showParticles: boolean;
  showStarfield: boolean;
  centerGravity: number;
  repulsion: number;
  linkDistance: number;
  isPhysicsActive: boolean;
  showUnresolved: boolean;
  showCandidates: boolean;
  showLinkedOnly: boolean;
}

interface SurveyGraphHUDProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  options: GraphDisplayOptions;
  onOptionsChange: (updater: (prev: GraphDisplayOptions) => GraphDisplayOptions) => void;
  onResetForces: () => void;
  matchedCount?: number;
  totalNotes: number;
  candidateCount: number;
  unresolvedCount: number;
}

export function SurveyGraphHUD({
  isOpen,
  onToggleOpen,
  searchQuery,
  onSearchChange,
  options,
  onOptionsChange,
  onResetForces,
  matchedCount,
  candidateCount,
  unresolvedCount,
}: SurveyGraphHUDProps) {
  return (
    <div
      id="obsidian-graph-hud-container"
      className="absolute top-4 left-4 z-30 pointer-events-auto flex flex-col items-start gap-2"
    >
      {/* Floating HUD Toggle Button & Search Bar */}
      <div className="flex items-center gap-2">
        <button
          id="obsidian-graph-settings-toggle"
          type="button"
          onClick={onToggleOpen}
          aria-label="Toggle Graph Controls"
          title="Graph View Settings"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border transition-all shadow-2xs cursor-pointer ${
            isOpen
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
              : 'bg-white/90 dark:bg-[#18181b]/90 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-[#202024] hover:text-stone-950 dark:hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Graph Controls</span>
        </button>

        {/* Quick Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-stone-400 dark:text-stone-500 pointer-events-none" />
          <input
            id="obsidian-graph-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search findings..."
            className="w-40 focus:w-56 transition-all duration-200 pl-8 pr-7 py-1 text-xs rounded-lg bg-white/90 dark:bg-[#18181b]/90 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 placeholder:text-stone-400 dark:placeholder:text-stone-500 backdrop-blur-md shadow-2xs focus:outline-none focus:border-stone-400 dark:focus:border-stone-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {searchQuery && typeof matchedCount === 'number' && (
            <span className="absolute -top-2 right-1 px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs">
              {matchedCount}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Settings Panel (Obsidian style) */}
      {isOpen && (
        <div
          id="obsidian-graph-settings-panel"
          className="w-76 max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl bg-white/95 dark:bg-[#18181c]/95 backdrop-blur-xl border border-stone-200 dark:border-stone-800 shadow-xl p-3.5 text-stone-800 dark:text-stone-200 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-2">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Obsidian Graph Options</span>
            </div>
            <button
              type="button"
              onClick={onToggleOpen}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section: Filter Nodes */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              <Layers className="w-3 h-3" />
              <span>Node Visibility</span>
            </div>
            <div className="space-y-1 bg-stone-50 dark:bg-[#121215] p-2 rounded-lg border border-stone-100 dark:border-stone-800 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer py-0.5 hover:text-stone-900 dark:hover:text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6B4FBB]"></span>
                  Candidate Hubs ({candidateCount})
                </span>
                <input
                  type="checkbox"
                  checked={options.showCandidates}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showCandidates: e.target.checked }))
                  }
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 hover:text-stone-900 dark:hover:text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2C5EA8]"></span>
                  Unresolved Findings ({unresolvedCount})
                </span>
                <input
                  type="checkbox"
                  checked={options.showUnresolved}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showUnresolved: e.target.checked }))
                  }
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 hover:text-stone-900 dark:hover:text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                  Linked Findings Only
                </span>
                <input
                  type="checkbox"
                  checked={options.showLinkedOnly}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showLinkedOnly: e.target.checked }))
                  }
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Section: Display */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              <Eye className="w-3 h-3" />
              <span>Canvas Display</span>
            </div>
            <div className="space-y-2.5 bg-stone-50 dark:bg-[#121215] p-2 rounded-lg border border-stone-100 dark:border-stone-800 text-[11px]">
              {/* Node scale slider */}
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Node Size</span>
                  <span className="font-mono">{options.nodeScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={options.nodeScale}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, nodeScale: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-stone-200"
                />
              </div>

              {/* Text labels mode */}
              <div>
                <div className="text-[10px] mb-1 text-stone-600 dark:text-stone-400">
                  Label Mode
                </div>
                <div className="grid grid-cols-3 gap-1 bg-stone-200/60 dark:bg-stone-800/60 p-0.5 rounded-md text-[10px]">
                  {(['all', 'hover', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onOptionsChange((prev) => ({ ...prev, labelMode: mode }))}
                      className={`py-1 rounded font-medium capitalize transition-all cursor-pointer ${
                        options.labelMode === mode
                          ? 'bg-white dark:bg-[#18181b] text-stone-900 dark:text-white shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starfield toggle */}
              <label className="flex items-center justify-between cursor-pointer pt-0.5">
                <span className="text-[10px] text-stone-600 dark:text-stone-400">Background Dot Grid</span>
                <input
                  type="checkbox"
                  checked={options.showStarfield}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showStarfield: e.target.checked }))
                  }
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>

              {/* Particle Pulses */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[10px] text-stone-600 dark:text-stone-400">Link Pulses</span>
                <input
                  type="checkbox"
                  checked={options.showParticles}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showParticles: e.target.checked }))
                  }
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Section: Physics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                <span>Forces</span>
              </div>
              <button
                type="button"
                onClick={onResetForces}
                title="Reset forces to defaults"
                className="lowercase text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                reset
              </button>
            </div>

            <div className="space-y-2.5 bg-stone-50 dark:bg-[#121215] p-2 rounded-lg border border-stone-100 dark:border-stone-800 text-[11px]">
              {/* Physics toggle */}
              <div className="flex items-center justify-between pb-1 border-b border-stone-200/60 dark:border-stone-800/60">
                <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300">
                  Physics Engine
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOptionsChange((prev) => ({ ...prev, isPhysicsActive: !prev.isPhysicsActive }))
                  }
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    options.isPhysicsActive
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {options.isPhysicsActive ? 'Running' : 'Paused'}
                </button>
              </div>

              {/* Repulsion force */}
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Repulsion</span>
                  <span className="font-mono">{options.repulsion}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="100"
                  value={options.repulsion}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, repulsion: parseInt(e.target.value, 10) }))
                  }
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-stone-200"
                />
              </div>

              {/* Link Distance */}
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Link Distance</span>
                  <span className="font-mono">{options.linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={options.linkDistance}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, linkDistance: parseInt(e.target.value, 10) }))
                  }
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-stone-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
