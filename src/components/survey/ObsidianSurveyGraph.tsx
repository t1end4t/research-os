import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Play,
  Pause,
  Plus,
  Compass,
} from 'lucide-react';
import { CandidateQuestion, OpenProblemNote } from '../../types';
import { GraphDisplayOptions } from './SurveyGraphHUD';

export interface ObsidianGraphNode {
  id: string;
  type: 'candidate' | 'problem';
  text: string;
  citation?: string;
  candidateId?: string; // If problem, which candidate it belongs to
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pinned?: boolean;
}

export interface ObsidianGraphLink {
  sourceId: string;
  targetId: string;
  source: ObsidianGraphNode;
  target: ObsidianGraphNode;
}

interface Particle {
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
}

interface ObsidianSurveyGraphProps {
  openProblems: OpenProblemNote[];
  candidateQuestions: CandidateQuestion[];
  selectedNodeId: string | null;
  onSelectNode: (node: { type: 'problem' | 'candidate'; id: string } | null) => void;
  onLinkProblemToCandidate: (candidateId: string, problemId: string) => void;
  onQuickAddProblem?: () => void;
  searchQuery: string;
  options: GraphDisplayOptions;
  onOptionsChange: (updater: (prev: GraphDisplayOptions) => GraphDisplayOptions) => void;
  isDarkMode: boolean;
}

export function ObsidianSurveyGraph({
  openProblems,
  candidateQuestions,
  selectedNodeId,
  onSelectNode,
  onLinkProblemToCandidate,
  onQuickAddProblem,
  searchQuery,
  options,
  onOptionsChange,
  isDarkMode,
}: ObsidianSurveyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera & Viewport Transformation
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Nodes & Physics State
  const nodesRef = useRef<Map<string, ObsidianGraphNode>>(new Map());
  const linksRef = useRef<ObsidianGraphLink[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isDraggingCanvasRef = useRef(false);
  const isDraggingNodeRef = useRef(false);
  const draggedNodeIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    nodeX: 0,
    nodeY: 0,
  });
  const panStartRef = useRef<{ mouseX: number; mouseY: number; origX: number; origY: number }>({
    mouseX: 0,
    mouseY: 0,
    origX: 0,
    origY: 0,
  });
  const hoveredNodeIdRef = useRef<string | null>(null);
  const dropTargetCandidateIdRef = useRef<string | null>(null);

  // Tooltip & cursor states
  const [hoveredNode, setHoveredNode] = useState<ObsidianGraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Synchronize Nodes and Links when props change
  useEffect(() => {
    const existingNodes = nodesRef.current;
    const newNodes = new Map<string, ObsidianGraphNode>();

    // Candidate Question Nodes
    candidateQuestions.forEach((candidate, index) => {
      const existing = existingNodes.get(candidate.id);
      const angle = (index / Math.max(1, candidateQuestions.length)) * Math.PI * 2;
      const dist = 180 + (index % 3) * 60;
      const initialX = existing ? existing.x : Math.cos(angle) * dist;
      const initialY = existing ? existing.y : Math.sin(angle) * dist;

      newNodes.set(candidate.id, {
        id: candidate.id,
        type: 'candidate',
        text: candidate.text,
        x: initialX,
        y: initialY,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: 26,
        pinned: existing?.pinned || false,
      });
    });

    // Open Problem Nodes
    const candidateMap = new Map<string, string>();
    candidateQuestions.forEach((candidate) => {
      candidate.openProblemIds.forEach((pid) => candidateMap.set(pid, candidate.id));
    });

    openProblems.forEach((problem, index) => {
      const existing = existingNodes.get(problem.id);
      const parentCandidateId = candidateMap.get(problem.id);
      let initialX = existing?.x;
      let initialY = existing?.y;

      if (initialX === undefined || initialY === undefined) {
        if (parentCandidateId && newNodes.has(parentCandidateId)) {
          const parent = newNodes.get(parentCandidateId)!;
          const offsetAngle = (index * 1.3) % (Math.PI * 2);
          const offsetDist = 90 + (index % 4) * 25;
          initialX = parent.x + Math.cos(offsetAngle) * offsetDist;
          initialY = parent.y + Math.sin(offsetAngle) * offsetDist;
        } else {
          const angle = (index / Math.max(1, openProblems.length)) * Math.PI * 2 + Math.PI / 4;
          const dist = 320 + (index % 5) * 45;
          initialX = Math.cos(angle) * dist;
          initialY = Math.sin(angle) * dist;
        }
      }

      newNodes.set(problem.id, {
        id: problem.id,
        type: 'problem',
        text: problem.text,
        citation: problem.citation,
        candidateId: parentCandidateId,
        x: initialX,
        y: initialY,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: 14,
        pinned: existing?.pinned || false,
      });
    });

    nodesRef.current = newNodes;

    // Build Links (from Problem to Candidate)
    const links: ObsidianGraphLink[] = [];
    candidateQuestions.forEach((candidate) => {
      const targetNode = newNodes.get(candidate.id);
      if (!targetNode) return;
      candidate.openProblemIds.forEach((problemId) => {
        const sourceNode = newNodes.get(problemId);
        if (sourceNode) {
          links.push({
            sourceId: problemId,
            targetId: candidate.id,
            source: sourceNode,
            target: targetNode,
          });
        }
      });
    });
    linksRef.current = links;

    // Initialize Particles
    if (particlesRef.current.length === 0 || particlesRef.current.length !== links.length * 2) {
      const newParticles: Particle[] = [];
      links.forEach((link) => {
        newParticles.push({
          sourceId: link.sourceId,
          targetId: link.targetId,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.004,
        });
        newParticles.push({
          sourceId: link.sourceId,
          targetId: link.targetId,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.003,
        });
      });
      particlesRef.current = newParticles;
    }
  }, [openProblems, candidateQuestions]);

  // Center Graph on Initial Load
  const centerGraph = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const getNodes = (): ObsidianGraphNode[] => Array.from(nodesRef.current.values()) as ObsidianGraphNode[];
    const nodes = getNodes();
    if (nodes.length === 0) {
      setTransform({ x: width / 2, y: height / 2, scale: 1 });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const graphWidth = Math.max(300, maxX - minX + 160);
    const graphHeight = Math.max(300, maxY - minY + 160);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scaleX = (width * 0.8) / graphWidth;
    const scaleY = (height * 0.8) / graphHeight;
    const fitScale = Math.min(1.4, Math.max(0.4, Math.min(scaleX, scaleY)));

    setTransform({
      x: width / 2 - centerX * fitScale,
      y: height / 2 - centerY * fitScale,
      scale: fitScale,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(centerGraph, 100);
    return () => clearTimeout(timer);
  }, [centerGraph]);

  // Main Canvas Render & Physics Simulation Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background clearing
      ctx.clearRect(0, 0, width, height);

      const currentTransform = transformRef.current;
      const { x: panX, y: panY, scale: zoom } = currentTransform;

      // 1. Draw Starfield & Dynamic Grid Coordinate Space
      if (options.showStarfield) {
        const gridSpacing = 40 * zoom;
        const startX = (panX % gridSpacing + gridSpacing) % gridSpacing;
        const startY = (panY % gridSpacing + gridSpacing) % gridSpacing;

        ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
        for (let x = startX; x < width; x += gridSpacing) {
          for (let y = startY; y < height; y += gridSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // World Transformation Matrix
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // --- Physics Simulation Step ---
      const nodes = Array.from(nodesRef.current.values()) as ObsidianGraphNode[];
      const links = linksRef.current;

      if (options.isPhysicsActive) {
        const repulsionStrength = options.repulsion * 1.5;
        const linkDistance = options.linkDistance;
        const gravityStrength = options.centerGravity * 0.08;
        const damping = 0.88;

        // Repulsion between nodes
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy + 100;
            const dist = Math.sqrt(distSq);
            const force = repulsionStrength / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (!n1.pinned && n1.id !== draggedNodeIdRef.current) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (!n2.pinned && n2.id !== draggedNodeIdRef.current) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        // Spring Attraction along links
        links.forEach((link) => {
          const n1 = link.source;
          const n2 = link.target;
          if (!n1 || !n2) return;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const diff = dist - linkDistance;
          const springForce = diff * 0.04;
          const fx = (dx / dist) * springForce;
          const fy = (dy / dist) * springForce;

          if (!n1.pinned && n1.id !== draggedNodeIdRef.current) {
            n1.vx += fx;
            n1.vy += fy;
          }
          if (!n2.pinned && n2.id !== draggedNodeIdRef.current) {
            n2.vx -= fx;
            n2.vy -= fy;
          }
        });

        // Center Gravity (pull gently to world origin)
        nodes.forEach((n) => {
          if (n.pinned || n.id === draggedNodeIdRef.current) return;
          const distFromCenter = Math.sqrt(n.x * n.x + n.y * n.y) || 1;
          n.vx -= (n.x / distFromCenter) * (distFromCenter * gravityStrength);
          n.vy -= (n.y / distFromCenter) * (distFromCenter * gravityStrength);

          // Apply velocity and damping
          n.vx *= damping;
          n.vy *= damping;
          n.x += n.vx;
          n.y += n.vy;
        });
      }

      // Filter Visibility & Search match check
      const query = searchQuery.trim().toLowerCase();
      const isSearching = query.length > 0;
      const hoveredId = hoveredNodeIdRef.current;
      const selectedId = selectedNodeId;
      const activeId = hoveredId || selectedId;

      // Find neighborhood of active node
      const neighborIds = new Set<string>();
      if (activeId) {
        neighborIds.add(activeId);
        links.forEach((l) => {
          if (l.sourceId === activeId) neighborIds.add(l.targetId);
          if (l.targetId === activeId) neighborIds.add(l.sourceId);
        });
      }

      // --- 2. Draw Links (Edges) ---
      links.forEach((link) => {
        const source = link.source;
        const target = link.target;
        if (!source || !target) return;

        // Filter check
        if (!options.showCandidates && target.type === 'candidate') return;
        if (!options.showUnresolved && source.type === 'problem' && !source.candidateId) return;

        const isHighlighted =
          activeId && (neighborIds.has(source.id) && neighborIds.has(target.id));
        const isDimmed =
          (activeId && !isHighlighted) ||
          (isSearching &&
            !source.text.toLowerCase().includes(query) &&
            !target.text.toLowerCase().includes(query));

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = isDarkMode ? '#c084fc' : '#9333ea';
          ctx.lineWidth = Math.max(2, options.linkThickness * 1.8);
          ctx.shadowColor = isDarkMode ? 'rgba(192, 132, 252, 0.6)' : 'rgba(147, 51, 234, 0.4)';
          ctx.shadowBlur = 8;
        } else {
          ctx.strokeStyle = isDarkMode
            ? isDimmed
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(192, 132, 252, 0.25)'
            : isDimmed
            ? 'rgba(0, 0, 0, 0.04)'
            : 'rgba(147, 51, 234, 0.2)';
          ctx.lineWidth = Math.max(1, options.linkThickness);
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // --- 3. Draw Traveling Link Particles ---
      if (options.showParticles && links.length > 0) {
        particlesRef.current.forEach((particle) => {
          const source = nodesRef.current.get(particle.sourceId);
          const target = nodesRef.current.get(particle.targetId);
          if (!source || !target) return;

          particle.progress += particle.speed;
          if (particle.progress > 1) particle.progress = 0;

          const px = source.x + (target.x - source.x) * particle.progress;
          const py = source.y + (target.y - source.y) * particle.progress;

          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = isDarkMode ? '#a855f7' : '#7c3aed';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // --- 4. Draw Drop-Target Linking Ring (Magnetic Ring) ---
      const dropTargetCandidateId = dropTargetCandidateIdRef.current;
      if (dropTargetCandidateId && nodesRef.current.has(dropTargetCandidateId)) {
        const dropNode = nodesRef.current.get(dropTargetCandidateId)!;
        const pulseRadius = dropNode.radius * options.nodeScale + 14 + Math.sin(Date.now() * 0.008) * 4;

        ctx.beginPath();
        ctx.arc(dropNode.x, dropNode.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- 5. Draw Nodes ---
      nodes.forEach((node) => {
        // Visibility Filter Checks
        if (node.type === 'candidate' && !options.showCandidates) return;
        if (node.type === 'problem' && !node.candidateId && !options.showUnresolved) return;
        if (options.showLinkedOnly && node.type === 'problem' && !node.candidateId) return;

        const isCandidate = node.type === 'candidate';
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeIdRef.current === node.id;
        const isNeighbor = activeId && neighborIds.has(node.id);
        const matchesSearch = !isSearching || node.text.toLowerCase().includes(query);
        const isDimmed = (activeId && !isNeighbor && !isSelected) || (isSearching && !matchesSearch);

        const nodeRadius = (node.radius * options.nodeScale) * (isCandidate ? 1.0 : 0.85);

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.2 : 1.0;

        // Outer Glow / Selection Halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? 'rgba(234, 179, 8, 0.35)'
            : isDarkMode
            ? 'rgba(168, 85, 247, 0.35)'
            : 'rgba(147, 51, 234, 0.25)';
          ctx.fill();
        }

        // Base Node Fill
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);

        if (isCandidate) {
          // Candidate Hub gradient
          const grad = ctx.createRadialGradient(
            node.x - nodeRadius * 0.3,
            node.y - nodeRadius * 0.3,
            nodeRadius * 0.1,
            node.x,
            node.y,
            nodeRadius
          );
          if (isDarkMode) {
            grad.addColorStop(0, '#c084fc');
            grad.addColorStop(1, '#7e22ce');
          } else {
            grad.addColorStop(0, '#a855f7');
            grad.addColorStop(1, '#6b21a8');
          }
          ctx.fillStyle = grad;
          ctx.shadowColor = isDarkMode ? 'rgba(168, 85, 247, 0.6)' : 'rgba(107, 33, 168, 0.4)';
          ctx.shadowBlur = isSelected ? 16 : 8;
        } else {
          // Open Problem Node
          const isLinked = Boolean(node.candidateId);
          if (isLinked) {
            ctx.fillStyle = isDarkMode ? '#06b6d4' : '#0891b2'; // Cyan/Teal
          } else {
            ctx.fillStyle = isDarkMode ? '#f59e0b' : '#d97706'; // Amber / Loose
          }
          ctx.shadowBlur = isSelected ? 10 : 3;
          ctx.shadowColor = ctx.fillStyle;
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Border Stroke
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        if (isSelected) {
          ctx.strokeStyle = '#eab308'; // Gold ring
          ctx.lineWidth = 2.5;
        } else if (isHovered) {
          ctx.strokeStyle = isDarkMode ? '#ffffff' : '#18181b';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();

        // Node Inner Icon / Dot for Candidate Hub
        if (isCandidate) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // --- 6. Draw Node Label (Obsidian Style) ---
        const shouldShowLabel =
          options.labelMode === 'all' ||
          (options.labelMode === 'hover' && (isHovered || isSelected || isNeighbor)) ||
          isCandidate;

        if (shouldShowLabel) {
          ctx.font = isCandidate
            ? '600 11px system-ui, -apple-system, sans-serif'
            : '500 10px system-ui, -apple-system, sans-serif';

          const maxChars = isCandidate ? 36 : 28;
          const displayLabel =
            node.text.length > maxChars ? `${node.text.slice(0, maxChars)}…` : node.text;

          const textMetrics = ctx.measureText(displayLabel);
          const labelWidth = textMetrics.width;
          const labelHeight = 16;
          const labelX = node.x - labelWidth / 2;
          const labelY = node.y + nodeRadius + 14;

          // Label Background Pill
          ctx.fillStyle = isDarkMode ? 'rgba(20, 20, 26, 0.85)' : 'rgba(255, 255, 255, 0.92)';
          ctx.beginPath();
          ctx.roundRect(labelX - 6, labelY - 11, labelWidth + 12, labelHeight, 4);
          ctx.fill();

          ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Label Text
          ctx.fillStyle = isCandidate
            ? isDarkMode
              ? '#e9d5ff'
              : '#581c87'
            : isDarkMode
            ? '#f4f4f5'
            : '#27272a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(displayLabel, node.x, labelY - 2);
        }

        ctx.restore();
      });

      // --- 7. Draw Minimap (Obsidian Style Radar in bottom right) ---
      const minimapSize = 130;
      const minimapMargin = 16;
      const minimapX = width - minimapSize - minimapMargin;
      const minimapY = height - minimapSize - minimapMargin;

      ctx.save();
      ctx.fillStyle = isDarkMode ? 'rgba(20, 20, 24, 0.8)' : 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(minimapX, minimapY, minimapSize, minimapSize, 12);
      ctx.fill();
      ctx.stroke();

      // Find overall bounds for minimap projection
      let bMinX = -500,
        bMaxX = 500,
        bMinY = -500,
        bMaxY = 500;
      nodes.forEach((n) => {
        if (n.x < bMinX) bMinX = n.x;
        if (n.x > bMaxX) bMaxX = n.x;
        if (n.y < bMinY) bMinY = n.y;
        if (n.y > bMaxY) bMaxY = n.y;
      });

      const spanX = Math.max(100, bMaxX - bMinX + 200);
      const spanY = Math.max(100, bMaxY - bMinY + 200);
      const mapScale = (minimapSize - 24) / Math.max(spanX, spanY);
      const mapCenterX = minimapX + minimapSize / 2;
      const mapCenterY = minimapY + minimapSize / 2;

      // Draw node dots in minimap
      nodes.forEach((n) => {
        const mx = mapCenterX + (n.x - (bMinX + bMaxX) / 2) * mapScale;
        const my = mapCenterY + (n.y - (bMinY + bMaxY) / 2) * mapScale;

        ctx.beginPath();
        ctx.arc(mx, my, n.type === 'candidate' ? 3 : 1.8, 0, Math.PI * 2);
        ctx.fillStyle =
          n.type === 'candidate' ? '#a855f7' : n.candidateId ? '#06b6d4' : '#f59e0b';
        ctx.fill();
      });

      // Viewport Rect in Minimap
      const vpWorldLeft = (-panX) / zoom;
      const vpWorldTop = (-panY) / zoom;
      const vpWorldRight = (width - panX) / zoom;
      const vpWorldBottom = (height - panY) / zoom;

      const vpMinX = mapCenterX + (vpWorldLeft - (bMinX + bMaxX) / 2) * mapScale;
      const vpMinY = mapCenterY + (vpWorldTop - (bMinY + bMaxY) / 2) * mapScale;
      const vpWidth = (vpWorldRight - vpWorldLeft) * mapScale;
      const vpHeight = (vpWorldBottom - vpWorldTop) * mapScale;

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vpMinX, vpMinY, vpWidth, vpHeight);

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [options, isDarkMode, searchQuery, selectedNodeId]);

  // Coordinate Conversion Helpers
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const { x: panX, y: panY, scale: zoom } = transformRef.current;
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom,
    };
  }, []);

  const getNodeAtScreenPos = useCallback(
    (screenX: number, screenY: number): ObsidianGraphNode | null => {
      const world = screenToWorld(screenX, screenY);
      const nodes = Array.from(nodesRef.current.values()) as ObsidianGraphNode[];

      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = world.x - node.x;
        const dy = world.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = (node.radius * options.nodeScale) + 6;
        if (dist <= hitRadius) {
          return node;
        }
      }
      return null;
    },
    [screenToWorld, options.nodeScale]
  );

  // Mouse / Pointer Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedNode = getNodeAtScreenPos(mouseX, mouseY);

    if (clickedNode) {
      // Begin Dragging Node
      isDraggingNodeRef.current = true;
      draggedNodeIdRef.current = clickedNode.id;
      dragStartPosRef.current = {
        mouseX,
        mouseY,
        nodeX: clickedNode.x,
        nodeY: clickedNode.y,
      };
    } else {
      // Begin Canvas Panning
      isDraggingCanvasRef.current = true;
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        origX: transformRef.current.x,
        origY: transformRef.current.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingNodeRef.current && draggedNodeIdRef.current) {
      // Dragging node
      const draggedNode = nodesRef.current.get(draggedNodeIdRef.current);
      if (draggedNode) {
        const world = screenToWorld(mouseX, mouseY);
        draggedNode.x = world.x;
        draggedNode.y = world.y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;

        // If dragged node is an Open Problem, check if hovering over a candidate to link
        if (draggedNode.type === 'problem') {
          const hoveredCandidate = getNodeAtScreenPos(mouseX, mouseY);
          if (hoveredCandidate && hoveredCandidate.type === 'candidate') {
            dropTargetCandidateIdRef.current = hoveredCandidate.id;
          } else {
            dropTargetCandidateIdRef.current = null;
          }
        }
      }
    } else if (isDraggingCanvasRef.current) {
      // Panning Canvas
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setTransform({
        ...transformRef.current,
        x: panStartRef.current.origX + dx,
        y: panStartRef.current.origY + dy,
      });
    } else {
      // Hover detection
      const hovered = getNodeAtScreenPos(mouseX, mouseY);
      hoveredNodeIdRef.current = hovered ? hovered.id : null;
      setHoveredNode(hovered);
      if (hovered) {
        setTooltipPos({ x: e.clientX, y: e.clientY });
      } else {
        setTooltipPos(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingNodeRef.current && draggedNodeIdRef.current) {
      const draggedId = draggedNodeIdRef.current;
      const draggedNode = nodesRef.current.get(draggedId);

      const dragDist = Math.hypot(
        mouseX - dragStartPosRef.current.mouseX,
        mouseY - dragStartPosRef.current.mouseY
      );

      // If dragged onto a candidate node, execute linking!
      if (dropTargetCandidateIdRef.current && draggedNode && draggedNode.type === 'problem') {
        onLinkProblemToCandidate(dropTargetCandidateIdRef.current, draggedNode.id);
        dropTargetCandidateIdRef.current = null;
      } else if (dragDist < 5) {
        // Simple click selection
        if (draggedNode) {
          onSelectNode({ type: draggedNode.type, id: draggedNode.id });
        }
      }

      isDraggingNodeRef.current = false;
      draggedNodeIdRef.current = null;
    } else if (isDraggingCanvasRef.current) {
      const panDist = Math.hypot(
        e.clientX - panStartRef.current.mouseX,
        e.clientY - panStartRef.current.mouseY
      );
      if (panDist < 4) {
        // Click on empty space deselects
        onSelectNode(null);
      }
      isDraggingCanvasRef.current = false;
    }
  };

  // Zoom via Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const current = transformRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(3.5, Math.max(0.18, current.scale * zoomFactor));

    // Zoom towards mouse location
    const worldMouseX = (mouseX - current.x) / current.scale;
    const worldMouseY = (mouseY - current.y) / current.scale;

    setTransform({
      scale: newScale,
      x: mouseX - worldMouseX * newScale,
      y: mouseY - worldMouseY * newScale,
    });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clicked = getNodeAtScreenPos(mouseX, mouseY);
    if (!clicked && onQuickAddProblem) {
      onQuickAddProblem();
    }
  };

  // On-screen Zoom Control Handlers
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const current = transformRef.current;
    const newScale = Math.min(3.5, current.scale * 1.25);

    setTransform({
      scale: newScale,
      x: width / 2 - ((width / 2 - current.x) / current.scale) * newScale,
      y: height / 2 - ((height / 2 - current.y) / current.scale) * newScale,
    });
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const current = transformRef.current;
    const newScale = Math.max(0.18, current.scale * 0.8);

    setTransform({
      scale: newScale,
      x: width / 2 - ((width / 2 - current.x) / current.scale) * newScale,
      y: height / 2 - ((height / 2 - current.y) / current.scale) * newScale,
    });
  };

  return (
    <div
      ref={containerRef}
      id="obsidian-survey-graph-container"
      className="relative w-full h-full overflow-hidden bg-[#fafafa] dark:bg-[#0f0f13] select-none"
    >
      <canvas
        ref={canvasRef}
        id="obsidian-survey-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Canvas Navigation Toolbar (Bottom-Left) */}
      <div
        id="obsidian-graph-toolbar"
        className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-[#18181f]/90 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-xl"
      >
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom in (+)"
          className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom out (-)"
          className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-stone-200 dark:bg-stone-800 my-auto" />
        <button
          type="button"
          onClick={centerGraph}
          title="Fit view / Center graph"
          className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            onOptionsChange((prev) => ({ ...prev, isPhysicsActive: !prev.isPhysicsActive }))
          }
          title={options.isPhysicsActive ? 'Freeze physics' : 'Unfreeze physics simulation'}
          className={`p-1.5 rounded-xl transition-colors ${
            options.isPhysicsActive
              ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          {options.isPhysicsActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Canvas Quick Tooltip on Hover */}
      {hoveredNode && tooltipPos && (
        <div
          id="obsidian-graph-hover-tooltip"
          className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full -mt-3 rounded-xl bg-stone-900/95 dark:bg-[#1c1c24]/95 backdrop-blur-md px-3 py-2 text-white shadow-2xl border border-stone-700/50 text-[11px] space-y-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-300">
            {hoveredNode.type === 'candidate' ? '🟣 Candidate Question' : '🟢 Open Problem Note'}
          </div>
          <p className="line-clamp-3 leading-snug font-medium">{hoveredNode.text}</p>
          {hoveredNode.citation && (
            <p className="text-[10px] text-stone-400 font-mono italic">
              Source: {hoveredNode.citation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
