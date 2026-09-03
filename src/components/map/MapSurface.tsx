import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { computeMapLayout, LayoutEdge, LayoutNode } from './computeLayout';
import { NodeCard } from './NodeCard';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  GripVertical,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const MapSurface: React.FC = () => {
  const {
    questions,
    claims,
    evidence,
    links,
    activeTag,
    linkStatusFilter,
    selectedNodeId,
    setSelectedNodeId,
    selectedLinkId,
    setSelectedLinkId,
    clearSelection,
    setActiveContext
  } = useWorkspace();

  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState<number>(0.95);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute Layout deterministically
  const layout = useMemo(() => {
    return computeMapLayout(
      questions,
      claims,
      evidence,
      links,
      activeTag,
      linkStatusFilter
    );
  }, [questions, claims, evidence, links, activeTag, linkStatusFilter]);

  // Determine Semantic Zoom level:
  // - SHAPE: scale < 0.55
  // - STRUCTURE: 0.55 <= scale <= 1.3
  // - WORKING: scale > 1.3
  const zoomLevel: 'shape' | 'structure' | 'working' = useMemo(() => {
    if (scale < 0.55) return 'shape';
    if (scale <= 1.3) return 'structure';
    return 'working';
  }, [scale]);

  // Fit to screen
  const handleFit = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 80;
    const scaleX = (clientWidth - padding * 2) / layout.bounds.width;
    const scaleY = (clientHeight - padding * 2) / layout.bounds.height;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.2);
    
    setScale(fitScale);
    setOffset({
      x: (clientWidth - layout.bounds.width * fitScale) / 2,
      y: (clientHeight - layout.bounds.height * fitScale) / 2
    });
  }, [layout.bounds]);

  // Initial fit on mount
  useEffect(() => {
    handleFit();
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.35), 2.2);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered around mouse
    setOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / scale),
      y: mouseY - (mouseY - prev.y) * (newScale / scale)
    }));
    setScale(newScale);
  };

  // Handle Edge Click
  const handleEdgeClick = (edge: LayoutEdge) => {
    if (edge.linkId) {
      setSelectedLinkId(edge.linkId);
      setSelectedNodeId(null);
    }
  };

  // Send Edge to Assistant Dock
  const handleSendEdgeToDock = (edge: LayoutEdge, e: React.MouseEvent) => {
    e.stopPropagation();
    if (edge.linkId) {
      setSelectedLinkId(edge.linkId);
      setActiveContext({
        type: 'link',
        id: edge.linkId,
        label: `Link: ${edge.sourceId} → ${edge.targetId}`,
        secondaryLabel: edge.userReason ? `Reason: "${edge.userReason.slice(0, 35)}..."` : 'No user reason',
        metadata: { linkId: edge.linkId }
      });
    }
  };

  // Handle Node Click
  const handleNodeClick = (node: LayoutNode) => {
    setSelectedNodeId(node.id);
    setSelectedLinkId(null);
    setActiveContext({
      type: 'node',
      id: node.id,
      label: `${node.type.toUpperCase()}: ${node.title.slice(0, 30)}...`,
      secondaryLabel: `Type: ${node.type}`
    });
  };

  // Check if edge is selected or connected to selected node
  const isEdgeSelected = (edge: LayoutEdge) => {
    if (selectedLinkId && edge.linkId === selectedLinkId) return true;
    if (selectedNodeId && (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId)) return true;
    return false;
  };

  // Check if node is dimmed
  const isNodeDimmed = (node: LayoutNode) => {
    if (!selectedNodeId && !selectedLinkId) return false;
    if (selectedNodeId) {
      if (node.id === selectedNodeId) return false;
      // Is connected to selected node?
      const isConnected = layout.edges.some(
        e => (e.sourceId === selectedNodeId && e.targetId === node.id) ||
             (e.targetId === selectedNodeId && e.sourceId === node.id)
      );
      return !isConnected;
    }
    if (selectedLinkId) {
      const activeEdge = layout.edges.find(e => e.linkId === selectedLinkId);
      if (activeEdge) {
        return node.id !== activeEdge.sourceId && node.id !== activeEdge.targetId;
      }
    }
    return false;
  };

  return (
    <div
      id="map-canvas-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={() => clearSelection()}
      className="relative flex-1 h-full w-full overflow-hidden bg-[var(--color-surface)] select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Subtle Dot Matrix Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(var(--color-rule) 1px, transparent 1px)',
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      />

      {/* Transform Container holding Nodes and SVG Edges */}
      <div
        id="map-canvas-viewport"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: layout.bounds.width,
          height: layout.bounds.height
        }}
        className="absolute transition-transform duration-75 ease-out"
      >
        {/* SVG Edges Layer */}
        <svg
          id="map-svg-edges"
          className="absolute inset-0 pointer-events-none overflow-visible w-full h-full"
        >
          {layout.edges.map(edge => {
            const selected = isEdgeSelected(edge);

            // Edge stroke styling based on strict spec:
            // - holds: 1px solid, 50% opacity green
            // - weak: 2px solid amber, clearly visible
            // - missing: 2px dashed '6 4' red, visually loudest
            // - unchecked: 1px neutral dotted
            let strokeColor = 'var(--color-rule)';
            let strokeWidth = 1.5;
            let strokeDasharray = '';
            let opacity = 0.85;

            if (edge.status === 'holds') {
              strokeColor = 'var(--color-holds)';
              strokeWidth = selected ? 2.5 : 1.5;
              opacity = selected ? 1 : 0.65;
            } else if (edge.status === 'weak') {
              strokeColor = 'var(--color-weak)';
              strokeWidth = selected ? 3 : 2;
              opacity = 1;
            } else if (edge.status === 'missing') {
              strokeColor = 'var(--color-missing)';
              strokeWidth = selected ? 3 : 2.2;
              strokeDasharray = '6 4';
              opacity = 1;
            } else if (edge.isGhost) {
              strokeColor = 'var(--color-rule)';
              strokeDasharray = '4 4';
              opacity = 0.5;
            }

            return (
              <g key={edge.id} className="cursor-pointer">
                {/* Transparent 14px hit area for easy clicking */}
                <path
                  d={edge.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  className="pointer-events-auto"
                  onClick={e => {
                    e.stopPropagation();
                    handleEdgeClick(edge);
                  }}
                />

                {/* Visible orthogonal elbow edge */}
                <path
                  d={edge.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  opacity={opacity}
                  className="transition-all duration-150 pointer-events-none"
                />
              </g>
            );
          })}
        </svg>

        {/* Edge Midpoint Grip / Status Chips */}
        {layout.edges.map(edge => {
          if (edge.isGhost) return null;
          const isSelected = selectedLinkId === edge.linkId;

          let statusDot = 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950';
          let statusText = 'text-emerald-700 dark:text-emerald-300';
          if (edge.status === 'weak') {
            statusDot = 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-950';
            statusText = 'text-amber-700 dark:text-amber-300';
          } else if (edge.status === 'missing') {
            statusDot = 'bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-950';
            statusText = 'text-rose-700 dark:text-rose-300';
          }

          return (
            <div
              key={`mid-${edge.id}`}
              style={{
                left: edge.midpoint.x,
                top: edge.midpoint.y
              }}
              onClick={e => {
                e.stopPropagation();
                handleEdgeClick(edge);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer border transition-all duration-200 select-none shadow-xs ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-105'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 hover:border-slate-400 hover:shadow-sm'
              }`}
              title={`Edge: ${edge.status} (Click to inspect, send grip to assistant)`}
            >
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span className={`font-mono text-[9px] uppercase tracking-wider font-semibold ${statusText}`}>
                {edge.status}
              </span>

              {/* Grip icon for Assistant Dock */}
              <button
                onClick={e => handleSendEdgeToDock(edge, e)}
                title="Send link to Assistant"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 dark:text-slate-500 ml-0.5 transition-colors"
              >
                <GripVertical className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}

        {/* Node Cards Layer */}
        {layout.nodes.map(node => (
          <NodeCard
            key={node.id}
            node={node}
            zoomLevel={zoomLevel}
            isSelected={selectedNodeId === node.id}
            isDimmed={isNodeDimmed(node)}
            onClick={() => handleNodeClick(node)}
          />
        ))}
      </div>

      {/* Floating Zoom & Semantic Level HUD (Bottom-Left) - Soft, elegant floating pill */}
      <div
        id="map-zoom-controls"
        className="absolute bottom-5 left-5 z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-md select-none"
      >
        <button
          onClick={() => setScale(prev => Math.max(prev * 0.85, 0.35))}
          title="Zoom out (-)"
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 px-1 min-w-[38px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={() => setScale(prev => Math.min(prev * 1.15, 2.2))}
          title="Zoom in (+)"
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <button
          onClick={handleFit}
          title="Fit view to graph"
          className="px-2 py-0.5 rounded-full font-mono text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase font-semibold transition-colors"
        >
          Fit
        </button>

        <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Semantic Zoom Level Badge */}
        <span className="font-mono text-[9px] uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-semibold tracking-wider">
          {zoomLevel}
        </span>
      </div>

      {/* Decorative Column Headers Overlay at top */}
      <div className="absolute top-3 left-8 z-10 flex items-center gap-10 pointer-events-none">
        <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/70 dark:border-indigo-800/60 rounded-full px-3 py-0.5 shadow-2xs">
          1. Questions
        </span>
        <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/70 border border-amber-200/70 dark:border-amber-800/60 rounded-full px-3 py-0.5 shadow-2xs ml-16">
          2. Claims
        </span>
        <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-800/60 rounded-full px-3 py-0.5 shadow-2xs ml-16">
          3. Findings / Evidence
        </span>
      </div>
    </div>
  );
};
