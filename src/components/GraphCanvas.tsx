import React, { useState, useRef, useMemo, useCallback } from 'react';
import { setResearchItemDragData } from '../researchItemDrag';
import { QuestionNode, FilterStatus, LinkStatus } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GraphCanvasProps {
  questions: QuestionNode[];
  selectedNodeId?: string | null;
  onSelectNode: (node: {
    id: string;
    type: 'QUESTION' | 'CLAIM' | 'PAPER' | 'EXPERIMENT' | 'GHOST';
    questionId: string;
    claimId?: string;
    evidenceId?: string;
  }) => void;
  filter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

interface LayoutNode {
  id: string;
  type: 'QUESTION' | 'CLAIM' | 'PAPER' | 'EXPERIMENT' | 'GHOST';
  text: string;
  fullText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  questionId: string;
  claimId?: string;
  evidenceId?: string;
  linkStatus?: LinkStatus;
  statusText?: string;
  parentId?: string;
  childrenIds: string[];
  tags?: string[];
}

interface LayoutEdge {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  busX: number;
  status: LinkStatus;
  questionId: string;
  claimId?: string;
}

interface EmptyStub {
  questionId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Helper: build orthogonal elbow connector with 6px rounded corners
function buildElbowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  busX: number,
  r = 6
): string {
  if (Math.abs(y2 - y1) < 1) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  const radius = Math.min(
    r,
    Math.abs(busX - x1) / 2,
    Math.abs(x2 - busX) / 2,
    Math.abs(y2 - y1) / 2
  );
  if (y2 > y1) {
    // Turning downwards from parent, then right into child
    return `M ${x1} ${y1} L ${busX - radius} ${y1} Q ${busX} ${y1}, ${busX} ${y1 + radius} L ${busX} ${y2 - radius} Q ${busX} ${y2}, ${busX + radius} ${y2} L ${x2} ${y2}`;
  } else {
    // Turning upwards from parent, then right into child
    return `M ${x1} ${y1} L ${busX - radius} ${y1} Q ${busX} ${y1}, ${busX} ${y1 - radius} L ${busX} ${y2 + radius} Q ${busX} ${y2}, ${busX + radius} ${y2} L ${x2} ${y2}`;
  }
}

export function GraphCanvas({
  questions,
  selectedNodeId,
  onSelectNode,
  filter,
  onFilterChange,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 40, y: 40 });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    type: string;
    status?: string;
    x: number;
    y: number;
  } | null>(null);

  // Filter questions and subtrees based on FilterStatus
  const filteredQuestions = useMemo(() => {
    if (filter === 'all') return questions;

    return questions
      .map((q) => {
        if (filter === 'weak') {
          const matchingClaims = q.claims.filter((c) => c.linkStatus === 'weak');
          if (matchingClaims.length === 0) return null;
          return { ...q, claims: matchingClaims };
        }
        if (filter === 'missing') {
          const matchingClaims = q.claims.filter((c) => c.linkStatus === 'missing');
          if (matchingClaims.length === 0) return null;
          return { ...q, claims: matchingClaims };
        }
        return q;
      })
      .filter((q): q is QuestionNode => q !== null);
  }, [questions, filter]);

  // Compute Layout: Card nodes + Orthogonal Elbow Routing + Tight Spacing
  const { nodes, edges, emptyStubs, bounds } = useMemo(() => {
    const nodesList: LayoutNode[] = [];
    const edgesList: LayoutEdge[] = [];
    const stubsList: EmptyStub[] = [];

    // Column X positions with 80px column gaps
    // QUESTION: width 260 -> right = 300
    // CLAIM: x = 380 (gap 80), width 240 -> right = 620
    // EVIDENCE: x = 700 (gap 80), width 220 -> right = 920
    const COL1_X = 40;
    const COL1_W = 260;
    const COL1_H = 86;

    const COL2_X = 380;
    const COL2_W = 240;
    const COL2_H = 72;

    const COL3_X = 700;
    const COL3_W = 220;
    const COL3_H = 72;

    // Spacing
    const SIBLING_GAP = 16; // 16px between sibling cards
    const QUESTION_GAP = 64; // 64px between separate question subtrees

    let currentY = 40;
    const minX = COL1_X;
    const maxX = COL3_X + COL3_W;

    filteredQuestions.forEach((q) => {
      // EMPTY QUESTION (e.g. Q3 with no claims)
      if (q.claims.length === 0) {
        const qY = currentY;
        const qNode: LayoutNode = {
          id: q.id,
          type: 'QUESTION',
          text: q.text,
          fullText: q.text,
          x: COL1_X,
          y: qY,
          width: COL1_W,
          height: COL1_H,
          questionId: q.id,
          childrenIds: [],
          tags: q.tags,
        };
        nodesList.push(qNode);

        // Draw short dotted red stub 60px to its right ending in hollow dashed circle labelled "no claims"
        const stubStartX = COL1_X + COL1_W;
        const stubCenterY = qY + COL1_H / 2;
        stubsList.push({
          questionId: q.id,
          x1: stubStartX,
          y1: stubCenterY,
          x2: stubStartX + 60,
          y2: stubCenterY,
        });

        currentY += COL1_H + QUESTION_GAP;
        return;
      }

      // QUESTION WITH CLAIMS
      const claimPositions: { id: string; y: number }[] = [];
      const claimChildIds: string[] = [];

      q.claims.forEach((claim) => {
        claimChildIds.push(claim.id);
        const evidenceChildrenIds: string[] = [];

        if (!claim.evidence || claim.evidence.length === 0) {
          // GHOST CARD for claim without evidence
          const ghostY = currentY;
          const ghostId = `ghost-${claim.id}`;
          evidenceChildrenIds.push(ghostId);

          nodesList.push({
            id: ghostId,
            type: 'GHOST',
            text: 'no evidence yet',
            fullText: 'No evidence attached',
            x: COL3_X,
            y: ghostY,
            width: COL3_W,
            height: COL3_H,
            questionId: q.id,
            claimId: claim.id,
            parentId: claim.id,
            linkStatus: claim.linkStatus,
            childrenIds: [],
          });

          // Single child -> claim aligns vertically with ghost
          claimPositions.push({ id: claim.id, y: ghostY });

          // Edge Claim -> Ghost
          const cRightX = COL2_X + COL2_W;
          const cCenterY = ghostY + COL2_H / 2;
          const gLeftX = COL3_X;
          const gCenterY = ghostY + COL3_H / 2;
          const busX = Math.round((cRightX + gLeftX) / 2);

          edgesList.push({
            id: `edge-${claim.id}-${ghostId}`,
            sourceId: claim.id,
            targetId: ghostId,
            x1: cRightX,
            y1: cCenterY,
            x2: gLeftX,
            y2: gCenterY,
            busX,
            status: claim.linkStatus,
            questionId: q.id,
            claimId: claim.id,
          });

          currentY += COL3_H + SIBLING_GAP;
        } else {
          // Process Evidence Items
          const evYPositions: number[] = [];
          claim.evidence.forEach((ev) => {
            const evY = currentY;
            evYPositions.push(evY);
            const isPaper = ev.kind === 'paper';
            const displayTitle = ev.title || ev.placeholderText || 'untitled';
            evidenceChildrenIds.push(ev.id);

            nodesList.push({
              id: ev.id,
              type: isPaper ? 'PAPER' : 'EXPERIMENT',
              text: displayTitle,
              fullText: ev.citation ? `${displayTitle} (${ev.citation})` : displayTitle,
              x: COL3_X,
              y: evY,
              width: COL3_W,
              height: COL3_H,
              questionId: q.id,
              claimId: claim.id,
              evidenceId: ev.id,
              parentId: claim.id,
              linkStatus: claim.linkStatus,
              statusText: ev.status,
              childrenIds: [],
            });

            currentY += COL3_H + SIBLING_GAP;
          });

          // Center Claim against evidence children span
          const minEvY = Math.min(...evYPositions);
          const maxEvY = Math.max(...evYPositions);
          const claimY = (minEvY + maxEvY) / 2;
          claimPositions.push({ id: claim.id, y: claimY });

          // Shared bus for all children of this claim
          const cRightX = COL2_X + COL2_W;
          const cCenterY = claimY + COL2_H / 2;
          const targetLeftX = COL3_X;
          const claimBusX = Math.round((cRightX + targetLeftX) / 2);

          claim.evidence.forEach((ev, idx) => {
            const evCenterY = evYPositions[idx] + COL3_H / 2;
            edgesList.push({
              id: `edge-${claim.id}-${ev.id}`,
              sourceId: claim.id,
              targetId: ev.id,
              x1: cRightX,
              y1: cCenterY,
              x2: targetLeftX,
              y2: evCenterY,
              busX: claimBusX,
              status: claim.linkStatus,
              questionId: q.id,
              claimId: claim.id,
            });
          });
        }

        // Add Claim Card Node
        const claimY = claimPositions.find((p) => p.id === claim.id)?.y ?? currentY;
        nodesList.push({
          id: claim.id,
          type: 'CLAIM',
          text: claim.text,
          fullText: claim.text,
          x: COL2_X,
          y: claimY,
          width: COL2_W,
          height: COL2_H,
          questionId: q.id,
          claimId: claim.id,
          parentId: q.id,
          linkStatus: claim.linkStatus,
          childrenIds: evidenceChildrenIds,
        });
      });

      // Question Y sits vertically centered against the span of its claims
      const minClaimY = Math.min(...claimPositions.map((p) => p.y));
      const maxClaimY = Math.max(...claimPositions.map((p) => p.y));
      const questionY = (minClaimY + maxClaimY) / 2 + (COL2_H - COL1_H) / 2;

      nodesList.push({
        id: q.id,
        type: 'QUESTION',
        text: q.text,
        fullText: q.text,
        x: COL1_X,
        y: questionY,
        width: COL1_W,
        height: COL1_H,
        questionId: q.id,
        childrenIds: claimChildIds,
        tags: q.tags,
      });

      // Edges Question -> Claims using shared bus
      const qRightX = COL1_X + COL1_W;
      const qCenterY = questionY + COL1_H / 2;
      const targetClaimLeftX = COL2_X;
      const questionBusX = Math.round((qRightX + targetClaimLeftX) / 2);

      q.claims.forEach((claim) => {
        const cPos = claimPositions.find((p) => p.id === claim.id);
        const cY = cPos ? cPos.y : questionY;
        const cCenterY = cY + COL2_H / 2;
        edgesList.push({
          id: `edge-${q.id}-${claim.id}`,
          sourceId: q.id,
          targetId: claim.id,
          x1: qRightX,
          y1: qCenterY,
          x2: targetClaimLeftX,
          y2: cCenterY,
          busX: questionBusX,
          status: claim.linkStatus,
          questionId: q.id,
          claimId: claim.id,
        });
      });

      currentY += QUESTION_GAP;
    });

    const minY = 30;
    const maxY = Math.max(currentY, 500);

    return {
      nodes: nodesList,
      edges: edgesList,
      emptyStubs: stubsList,
      bounds: { minX, maxX, minY, maxY },
    };
  }, [filteredQuestions]);

  // Compute Highlighted Subtree on Hover
  const activeComponentIds = useMemo(() => {
    if (!hoveredNodeId) return null;

    const set = new Set<string>();
    const nodeMap = new Map<string, LayoutNode>(nodes.map((n) => [n.id, n]));
    const target = nodeMap.get(hoveredNodeId);
    if (!target) return null;

    set.add(target.id);

    // Add ancestors
    let curr: LayoutNode | undefined = target;
    while (curr && curr.parentId) {
      set.add(curr.parentId);
      curr = nodeMap.get(curr.parentId);
    }

    // Add descendants recursively
    const addDescendants = (nId: string) => {
      const n = nodeMap.get(nId);
      if (!n) return;
      n.childrenIds.forEach((cId) => {
        set.add(cId);
        addDescendants(cId);
      });
    };
    addDescendants(target.id);

    return set;
  }, [hoveredNodeId, nodes]);

  // Fit to screen calculation
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 1000;
    const height = rect.height || 700;

    const graphWidth = bounds.maxX - bounds.minX + 80;
    const graphHeight = bounds.maxY - bounds.minY + 80;

    const scaleX = width / graphWidth;
    const scaleY = height / graphHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY) * 0.92, 0.4), 1.2);

    const newPanX = 40;
    const newPanY = 40;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [bounds]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 2.2);

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Status Bar Color helper
  const getStatusBarColor = (status?: LinkStatus) => {
    if (status === 'holds') return '#10a37f';
    if (status === 'weak') return '#ffb000';
    if (status === 'missing') return '#ef4444';
    return 'transparent';
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-[#fafaf9] dark:bg-[#101010] overflow-hidden select-none">
      {/* Top Filter Bar: Plain text toggles on Left + Inline Legend on Right */}
      <div
        id="graph-canvas-filter-bar"
        className="px-6 py-2.5 border-b border-[#ececec] dark:border-[#262626] bg-white/95 dark:bg-[#181818]/95 backdrop-blur-xs flex items-center justify-between z-20 shrink-0"
      >
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#999] dark:text-[#666] mr-1">
            Filter:
          </span>
          <button
            onClick={() => onFilterChange('all')}
            className={`transition-colors cursor-pointer ${
              filter === 'all'
                ? 'font-semibold text-[#1a1a1a] dark:text-white'
                : 'text-[#888] dark:text-[#777] hover:text-[#1a1a1a] dark:hover:text-white'
            }`}
          >
            All
          </button>
          <span className="text-[#d1d1d1] dark:text-[#333]">|</span>
          <button
            onClick={() => onFilterChange('weak')}
            className={`transition-colors cursor-pointer ${
              filter === 'weak'
                ? 'font-semibold text-[#d97706] dark:text-amber-400'
                : 'text-[#888] dark:text-[#777] hover:text-[#d97706] dark:hover:text-amber-400'
            }`}
          >
            Weak only
          </button>
          <span className="text-[#d1d1d1] dark:text-[#333]">|</span>
          <button
            onClick={() => onFilterChange('missing')}
            className={`transition-colors cursor-pointer ${
              filter === 'missing'
                ? 'font-semibold text-[#dc2626] dark:text-rose-400'
                : 'text-[#888] dark:text-[#777] hover:text-[#dc2626] dark:hover:text-rose-400'
            }`}
          >
            Missing only
          </button>
        </div>

        {/* Legend: Inline, borderless, top-right */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Row 1: Edge Status Legend */}
          <div className="flex items-center gap-4 text-[11px] text-[#777] dark:text-[#888]">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] bg-[#10a37f]" />
              <span>holds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-[2px] border-b-2 border-dashed border-[#ffb000]"
                style={{ borderBottomWidth: 2 }}
              />
              <span>weak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-[1.5px] border-b-2 border-dotted border-[#ef4444]"
                style={{ borderBottomWidth: 1.5 }}
              />
              <span>missing</span>
            </div>
          </div>

          {/* Row 2: Node Type Legend: four small dots with type names, 11px muted */}
          <div className="flex items-center gap-3.5 text-[11px] text-[#888] dark:text-[#777]">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7]" />
              <span>Question</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2C5EA8] dark:bg-[#7DB4F8]" />
              <span>Claim</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A6E77] dark:bg-[#6CD0DE]" />
              <span>Paper</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A45A1E] dark:bg-[#F4A86A]" />
              <span>Experiment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 w-full h-full cursor-${
          isDragging ? 'grabbing' : 'grab'
        } overflow-hidden bg-[#fafaf9] dark:bg-[#101010]`}
      >
        <svg
          id="epistemic-graph-svg"
          className="w-full h-full absolute inset-0 pointer-events-auto"
        >
          {/* Canvas Transform Root */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. EDGES LAYER */}
            <g id="edges-layer">
              {edges.map((edge) => {
                const isActive =
                  !activeComponentIds ||
                  (activeComponentIds.has(edge.sourceId) &&
                    activeComponentIds.has(edge.targetId));
                // Supporting role: 50% opacity by default, 12.5% when dimmed
                const opacity = isActive ? 0.5 : 0.125;

                // Orthogonal elbow connector with 6px rounded corners
                const pathD = buildElbowPath(
                  edge.x1,
                  edge.y1,
                  edge.x2,
                  edge.y2,
                  edge.busX,
                  6
                );

                let strokeColor = '#10a37f';
                let strokeDash = 'none';

                if (edge.status === 'weak') {
                  strokeColor = '#ffb000';
                  strokeDash = '4,3';
                } else if (edge.status === 'missing') {
                  strokeColor = '#ef4444';
                  strokeDash = '2,2';
                }

                return (
                  <path
                    key={edge.id}
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={1.5}
                    strokeDasharray={strokeDash}
                    className="transition-opacity duration-150"
                    style={{ opacity }}
                  />
                );
              })}

              {/* Empty Question Stubs */}
              {emptyStubs.map((stub) => {
                const isActive =
                  !activeComponentIds || activeComponentIds.has(stub.questionId);
                const opacity = isActive ? 0.5 : 0.125;

                return (
                  <g key={`stub-${stub.questionId}`} style={{ opacity }}>
                    <line
                      x1={stub.x1}
                      y1={stub.y1}
                      x2={stub.x2}
                      y2={stub.y2}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="2,2"
                    />
                    <circle
                      cx={stub.x2 + 4}
                      cy={stub.y2}
                      r={4.5}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={1.2}
                      strokeDasharray="2,2"
                    />
                    <text
                      x={stub.x2 + 14}
                      y={stub.y2 + 4}
                      fill="#ef4444"
                      fontSize={11}
                      fontStyle="italic"
                      className="select-none font-sans"
                    >
                      no claims
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 2. CARD NODES LAYER */}
            <g id="nodes-layer">
              {nodes.map((node) => {
                const isActive =
                  !activeComponentIds || activeComponentIds.has(node.id);
                const opacity = isActive ? 1.0 : 0.25;
                const isHovered = hoveredNodeId === node.id;
                const isSelected = selectedNodeId === node.id;
                const statusBarColor = getStatusBarColor(node.linkStatus);
                const isDraggable =
                  node.type === 'QUESTION' || node.type === 'CLAIM' || node.type === 'PAPER';

                let nodeTypeClasses = '';
                if (node.type === 'GHOST') {
                  nodeTypeClasses = 'bg-transparent border-dashed border-[#d1d5db] dark:border-[#383838]';
                } else if (node.type === 'QUESTION') {
                  nodeTypeClasses = isSelected
                    ? 'bg-[#F5F2FF] dark:bg-[#6B4FBB]/12 border-[#ffb000] ring-2 ring-[#ffb000]'
                    : isHovered
                    ? 'bg-[#F5F2FF] dark:bg-[#6B4FBB]/12 border-[#6B4FBB] dark:border-[#BCA8F7]/60'
                    : 'bg-[#F5F2FF] dark:bg-[#6B4FBB]/12 border-[#E4DCFA] dark:border-[#6B4FBB]/25';
                } else if (node.type === 'CLAIM') {
                  nodeTypeClasses = isSelected
                    ? 'bg-[#EFF5FF] dark:bg-[#2C5EA8]/12 border-[#ffb000] ring-2 ring-[#ffb000]'
                    : isHovered
                    ? 'bg-[#EFF5FF] dark:bg-[#2C5EA8]/12 border-[#2C5EA8] dark:border-[#7DB4F8]/60'
                    : 'bg-[#EFF5FF] dark:bg-[#2C5EA8]/12 border-[#DBE7F8] dark:border-[#2C5EA8]/25';
                } else if (node.type === 'PAPER') {
                  nodeTypeClasses = isSelected
                    ? 'bg-[#F1F8F9] dark:bg-[#2A6E77]/12 border-[#ffb000] ring-2 ring-[#ffb000]'
                    : isHovered
                    ? 'bg-[#F1F8F9] dark:bg-[#2A6E77]/12 border-[#2A6E77] dark:border-[#6CD0DE]/60'
                    : 'bg-[#F1F8F9] dark:bg-[#2A6E77]/12 border-[#D5EAED] dark:border-[#2A6E77]/25';
                } else if (node.type === 'EXPERIMENT') {
                  nodeTypeClasses = isSelected
                    ? 'bg-[#FFF6EE] dark:bg-[#A45A1E]/12 border-[#ffb000] ring-2 ring-[#ffb000]'
                    : isHovered
                    ? 'bg-[#FFF6EE] dark:bg-[#A45A1E]/12 border-[#A45A1E] dark:border-[#F4A86A]/60'
                    : 'bg-[#FFF6EE] dark:bg-[#A45A1E]/12 border-[#F6E3D2] dark:border-[#A45A1E]/25';
                }

                return (
                  <foreignObject
                    key={node.id}
                    id={`canvas-node-${node.id}`}
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    className="overflow-visible"
                    style={{ opacity }}
                  >
                    <div
                      draggable={isDraggable}
                      onDragStart={(event) => {
                        if (!isDraggable) return;
                        event.stopPropagation();
                        setTooltip(null);
                        setResearchItemDragData(event.dataTransfer, {
                          id: node.id,
                          type: node.type,
                          label: node.fullText,
                        });
                      }}
                      onMouseDown={(event) => {
                        if (isDraggable) event.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode({
                          id: node.id,
                          type: node.type,
                          questionId: node.questionId,
                          claimId: node.claimId,
                          evidenceId: node.evidenceId,
                        });
                      }}
                      onMouseEnter={(e) => {
                        setHoveredNodeId(node.id);
                        setTooltip({
                          text: node.fullText,
                          type: node.type,
                          status: node.linkStatus,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e) => {
                        setTooltip((prev) =>
                          prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                        );
                      }}
                      onMouseLeave={() => {
                        setHoveredNodeId(null);
                        setTooltip(null);
                      }}
                      className={`w-full h-full relative rounded-[10px] border transition-colors duration-150 overflow-hidden select-none px-3.5 py-2.5 flex flex-col justify-center ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${nodeTypeClasses}`}
                    >
                      {/* Left-edge 3px link status bar inside rounded border */}
                      {node.type !== 'QUESTION' && node.linkStatus && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ backgroundColor: statusBarColor }}
                        />
                      )}

                      {/* QUESTION CARD */}
                      {node.type === 'QUESTION' && (
                        <div className="flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6B4FBB] dark:bg-[#BCA8F7] shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7] leading-none">
                              QUESTION
                            </span>
                          </div>
                          <div className="text-[13px] font-medium text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug line-clamp-2">
                            {node.text}
                          </div>
                          {node.tags && node.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {node.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[11px] px-1.5 py-0.5 rounded border border-[#E4DCFA] dark:border-[#6B4FBB]/40 text-[#6B4FBB] dark:text-[#BCA8F7] leading-none font-normal"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CLAIM CARD */}
                      {node.type === 'CLAIM' && (
                        <div className="flex flex-col justify-center pl-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2C5EA8] dark:bg-[#7DB4F8] shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C5EA8] dark:text-[#7DB4F8] leading-none">
                              CLAIM
                            </span>
                          </div>
                          <div className="text-[12px] font-normal text-[#1a1a1a] dark:text-[#dedede] leading-snug line-clamp-2">
                            {node.text}
                          </div>
                        </div>
                      )}

                      {/* PAPER CARD */}
                      {node.type === 'PAPER' && (
                        <div className="flex flex-col justify-center pl-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2A6E77] dark:bg-[#6CD0DE] shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A6E77] dark:text-[#6CD0DE] leading-none">
                              PAPER
                            </span>
                          </div>
                          <div className="text-[12px] font-normal text-[#1a1a1a] dark:text-[#dedede] leading-tight line-clamp-2">
                            {node.text}
                          </div>
                        </div>
                      )}

                      {/* EXPERIMENT CARD */}
                      {node.type === 'EXPERIMENT' && (
                        <div className="flex flex-col justify-center pl-1">
                          <div className="flex items-center justify-between leading-none mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A45A1E] dark:bg-[#F4A86A] shrink-0" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A45A1E] dark:text-[#F4A86A]">
                                EXPERIMENT
                              </span>
                            </div>
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/80 dark:bg-[#252525] text-[#666] dark:text-[#999] border border-[#F6E3D2] dark:border-[#A45A1E]/30 leading-none">
                              {node.statusText || 'planned'}
                            </span>
                          </div>
                          <div className="text-[12px] font-normal text-[#1a1a1a] dark:text-[#dedede] leading-tight line-clamp-2">
                            {node.text}
                          </div>
                        </div>
                      )}

                      {/* GHOST CARD */}
                      {node.type === 'GHOST' && (
                        <div className="text-[12px] italic text-[#888888] dark:text-[#666666] text-center">
                          {node.text}
                        </div>
                      )}
                    </div>
                  </foreignObject>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Floating Tooltip with full text on hover */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded bg-[#1a1a1a] dark:bg-[#252525] text-white text-[12px] shadow-lg max-w-xs leading-snug border border-stone-800"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                {tooltip.type}
              </span>
              {tooltip.status && (
                <span className="text-[10px] font-mono uppercase text-[#ffb000]">
                  • {tooltip.status}
                </span>
              )}
            </div>
            <div>{tooltip.text}</div>
          </div>
        )}

        {/* Zoom and Fit to Screen Controls: Bottom-Right */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-[#1c1c1c]/90 backdrop-blur-xs border border-[#ececec] dark:border-[#2e2e2e] rounded-lg p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] text-[#999] dark:text-[#777] px-2 font-mono">
            {Math.round(zoom * 100)}%
          </div>
          <div className="w-[1px] h-4 bg-[#ececec] dark:bg-[#2e2e2e]" />
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 2.2))}
            title="Zoom in"
            aria-label="Zoom in"
            className="p-1.5 text-[#6b6b6b] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#282828] rounded cursor-pointer transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
            title="Zoom out"
            aria-label="Zoom out"
            className="p-1.5 text-[#6b6b6b] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#282828] rounded cursor-pointer transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-[#ececec] dark:bg-[#2e2e2e]" />
          <button
            id="fit-to-screen-btn"
            onClick={handleFitToScreen}
            title="Fit to screen"
            aria-label="Fit to screen"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#6b6b6b] dark:text-[#999] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#282828] rounded cursor-pointer transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

