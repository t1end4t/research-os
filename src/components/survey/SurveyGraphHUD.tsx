import React from 'react';
import {
  SlidersHorizontal,
  Search,
  X,
  Eye,
  Zap,
  Layers,
  Sparkles,
  Info,
  CircleDot,
  Network,
  RotateCcw,
  Check,
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
  totalNotes,
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
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-md cursor-pointer ${
            isOpen
              ? 'bg-[#1e1e24]/90 dark:bg-[#1a1a20]/95 text-white border-purple-500/40 ring-2 ring-purple-500/20'
              : 'bg-white/90 dark:bg-[#18181b]/90 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-[#202024] hover:text-stone-950 dark:hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Graph Settings</span>
        </button>

        {/* Quick Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-stone-400 dark:text-stone-500 pointer-events-none" />
          <input
            id="obsidian-graph-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search graph..."
            className="w-44 focus:w-60 transition-all duration-200 pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white/90 dark:bg-[#18181b]/90 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 placeholder:text-stone-400 dark:placeholder:text-stone-500 backdrop-blur-md shadow-md focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
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
            <span className="absolute -top-2 right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-600 text-white shadow-sm">
              {matchedCount}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Settings Panel (Obsidian style) */}
      {isOpen && (
        <div
          id="obsidian-graph-settings-panel"
          className="w-80 max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl bg-white/95 dark:bg-[#141418]/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800/90 shadow-2xl p-4 text-stone-800 dark:text-stone-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Obsidian Graph
              </h3>
            </div>
            <button
              type="button"
              onClick={onToggleOpen}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section: Filter Nodes */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Filters</span>
            </div>
            <div className="space-y-1.5 bg-stone-50 dark:bg-[#1c1c22] p-2.5 rounded-xl border border-stone-100 dark:border-stone-800/60 text-xs">
              <label className="flex items-center justify-between cursor-pointer py-0.5 hover:text-purple-600 dark:hover:text-purple-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Candidate Questions ({candidateCount})
                </span>
                <input
                  type="checkbox"
                  checked={options.showCandidates}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showCandidates: e.target.checked }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 hover:text-purple-600 dark:hover:text-purple-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Unresolved Problems ({unresolvedCount})
                </span>
                <input
                  type="checkbox"
                  checked={options.showUnresolved}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showUnresolved: e.target.checked }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 hover:text-purple-600 dark:hover:text-purple-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  Linked Notes Only
                </span>
                <input
                  type="checkbox"
                  checked={options.showLinkedOnly}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showLinkedOnly: e.target.checked }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500/20"
                />
              </label>
            </div>
          </div>

          {/* Section: Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5" />
              <span>Display</span>
            </div>
            <div className="space-y-3 bg-stone-50 dark:bg-[#1c1c22] p-2.5 rounded-xl border border-stone-100 dark:border-stone-800/60 text-xs">
              {/* Node scale slider */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-stone-600 dark:text-stone-400">
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
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Link thickness slider */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Link Thickness</span>
                  <span className="font-mono">{options.linkThickness.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={options.linkThickness}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, linkThickness: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Text labels mode */}
              <div>
                <div className="text-[11px] mb-1.5 text-stone-600 dark:text-stone-400">
                  Node Labels
                </div>
                <div className="grid grid-cols-3 gap-1 bg-stone-200/70 dark:bg-stone-800/80 p-0.5 rounded-lg text-[10px]">
                  {(['all', 'hover', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onOptionsChange((prev) => ({ ...prev, labelMode: mode }))}
                      className={`py-1 rounded-md font-medium capitalize transition-all ${
                        options.labelMode === mode
                          ? 'bg-white dark:bg-[#121216] text-purple-600 dark:text-purple-300 shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starfield / Grid toggle */}
              <label className="flex items-center justify-between cursor-pointer pt-1">
                <span className="text-[11px] text-stone-600 dark:text-stone-300">Cosmic Starfield</span>
                <input
                  type="checkbox"
                  checked={options.showStarfield}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showStarfield: e.target.checked }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500/20"
                />
              </label>

              {/* Animated Link Particles */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-stone-600 dark:text-stone-300">Link Pulses</span>
                <input
                  type="checkbox"
                  checked={options.showParticles}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, showParticles: e.target.checked }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500/20"
                />
              </label>
            </div>
          </div>

          {/* Section: Forces / Physics Simulation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Forces</span>
              </div>
              <button
                type="button"
                onClick={onResetForces}
                title="Reset forces to defaults"
                className="text-[10px] lowercase text-stone-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                reset
              </button>
            </div>

            <div className="space-y-3 bg-stone-50 dark:bg-[#1c1c22] p-2.5 rounded-xl border border-stone-100 dark:border-stone-800/60 text-xs">
              {/* Physics toggle */}
              <div className="flex items-center justify-between pb-1 border-b border-stone-200/50 dark:border-stone-800/50">
                <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                  Physics Engine
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOptionsChange((prev) => ({ ...prev, isPhysicsActive: !prev.isPhysicsActive }))
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    options.isPhysicsActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {options.isPhysicsActive ? 'Running' : 'Frozen'}
                </button>
              </div>

              {/* Repulsion force */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Node Repulsion</span>
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
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Link Distance */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Link Distance</span>
                  <span className="font-mono">{options.linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={options.linkDistance}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({ ...prev, linkDistance: parseInt(e.target.value, 10) }))
                  }
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Center Gravity */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-stone-600 dark:text-stone-400">
                  <span>Center Gravity</span>
                  <span className="font-mono">{options.centerGravity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.3"
                  step="0.01"
                  value={options.centerGravity}
                  onChange={(e) =>
                    onOptionsChange((prev) => ({
                      ...prev,
                      centerGravity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="pt-1 border-t border-stone-100 dark:border-stone-800/80 text-[11px] space-y-1 text-stone-500 dark:text-stone-400">
            <div className="font-semibold text-stone-700 dark:text-stone-300 text-[10px] uppercase tracking-wider mb-1.5">
              Node Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20"></span>
              <span>Candidate Question (Hub)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 ring-2 ring-cyan-500/20"></span>
              <span>Clustered Problem (Linked)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
              <span>Unresolved Problem (Loose)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
