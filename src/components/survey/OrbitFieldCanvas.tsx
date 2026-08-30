import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CandidateQuestion,
  OpenProblemNote,
} from '../../types';
import {
  SURVEY_NOTE_WIDTH,
  SURVEY_NOTE_HEIGHT,
  getSurveyFieldSize,
} from '../../surveyLayout';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network,
  CircleDotDashed,
  Edit2,
  Trash2,
  Unlink,
  Check,
  X,
  ArrowRight,
  Plus,
  GripHorizontal,
} from 'lucide-react';

interface OrbitFieldCanvasProps {
  openProblems: OpenProblemNote[];
  candidateQuestions: CandidateQuestion[];
  selectedProblemIds: string[];
  lastSelectedId: string | null;
  onSelectProblem: (event: React.MouseEvent, id: string) => void;
  onUpdateOpenProblem: (id: string, text: string, citation?: string) => void;
  onRemoveOpenProblem: (id: string) => void;
  onUpdateCandidateQuestion: (id: string, text: string) => void;
  onRemoveCandidateQuestion: (id: string) => void;
  onLinkProblemToCandidate: (candidateId: string, problemId: string) => void;
  onUnlinkProblemFromCandidate: (candidateId: string, problemId: string) => void;
  onOpenPromoteModal: (candidate: CandidateQuestion) => void;
  onTriggerCluster: () => void;
  isDarkMode: boolean;
}

interface CustomPosition {
  x: number;
  y: number;
}

export function OrbitFieldCanvas({
  openProblems,
  candidateQuestions,
  selectedProblemIds,
  onSelectProblem,
  onUpdateOpenProblem,
  onRemoveOpenProblem,
  onUpdateCandidateQuestion,
  onRemoveCandidateQuestion,
  onLinkProblemToCandidate,
  onUnlinkProblemFromCandidate,
  onOpenPromoteModal,
  isDarkMode,
}: OrbitFieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom Transformation State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Custom dragged positions for notes and systems
  const [customPositions, setCustomPositions] = useState<Record<string, CustomPosition>>({});

  // Active dragging states
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    type: 'note' | 'hub';
    systemKey: string;
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  } | null>(null);

  const [hoveredProblemId, setHoveredProblemId] = useState<string | null>(null);
  const [dragOverCandidateId, setDragOverCandidateId] = useState<string | null>(null);

  // In-place editing state
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editProblemText, setEditProblemText] = useState('');
  const [editProblemSource, setEditProblemSource] = useState('');
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editCandidateText, setEditCandidateText] = useState('');

  // Partition problems
  const linkedProblemIds = useMemo(
    () => new Set(candidateQuestions.flatMap((c) => c.openProblemIds)),
    [candidateQuestions]
  );
  const unresolvedProblems = useMemo(
    () => openProblems.filter((p) => !linkedProblemIds.has(p.id)),
    [openProblems, linkedProblemIds]
  );

  // Center / Fit view
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 50, y: 50 });
    setCustomPositions({});
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.orbit-node-card') ||
      target.closest('.orbit-hub-card')
    ) {
      return;
    }
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  // Direct element dragging listener on window
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({
          x: panStartRef.current.startPanX + dx,
          y: panStartRef.current.startPanY + dy,
        });
      } else if (draggingItem) {
        const dx = (e.clientX - draggingItem.startX) / zoom;
        const dy = (e.clientY - draggingItem.startY) / zoom;
        const newX = draggingItem.initialPosX + dx;
        const newY = draggingItem.initialPosY + dy;

        setCustomPositions((prev) => ({
          ...prev,
          [`${draggingItem.systemKey}:${draggingItem.id}`]: { x: newX, y: newY },
        }));
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setDraggingItem(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, draggingItem, zoom]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(1.8, Math.max(0.4, +(z + zoomDelta).toFixed(2))));
    }
  };

  const handleStartEditProblem = (problem: OpenProblemNote) => {
    setEditingProblemId(problem.id);
    setEditProblemText(problem.text);
    setEditProblemSource(problem.citation || '');
  };

  const handleSaveEditProblem = (id: string) => {
    if (!editProblemText.trim()) return;
    onUpdateOpenProblem(id, editProblemText.trim(), editProblemSource.trim() || undefined);
    setEditingProblemId(null);
  };

  const handleSaveEditCandidate = (id: string) => {
    if (!editCandidateText.trim()) return;
    onUpdateCandidateQuestion(id, editCandidateText.trim());
    setEditingCandidateId(null);
  };

  // Start direct-manipulation dragging of a card
  const handleStartCardDrag = (
    e: React.MouseEvent,
    id: string,
    systemKey: string,
    currentX: number,
    currentY: number
  ) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }
    e.stopPropagation();
    setDraggingItem({
      id,
      type: 'note',
      systemKey,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: currentX,
      initialPosY: currentY,
    });
  };

  // Render a Single Orbital Field System (Candidate Question Hub or Unresolved Swarm)
  const renderOrbitalSystem = (candidate?: CandidateQuestion, systemIndex: number = 0) => {
    const systemKey = candidate ? candidate.id : 'unresolved';
    const problems = candidate
      ? candidate.openProblemIds
          .map((id) => openProblems.find((problem) => problem.id === id))
          .filter((problem): problem is OpenProblemNote => Boolean(problem))
      : unresolvedProblems;

    const fieldSize = getSurveyFieldSize(problems.length);
    const center = fieldSize / 2;
    const isDragOver = candidate ? dragOverCandidateId === candidate.id : false;
    const isEditingCandidate = candidate ? editingCandidateId === candidate.id : false;

    // Fixed radial distribution
    const NOTES_PER_RING = 6;
    const ringCount = Math.max(1, Math.ceil(problems.length / NOTES_PER_RING));
    const rings = Array.from({ length: ringCount }, (_, r) => 220 + r * 125);

    // Compute positions for all notes in this field
    const notePositions = problems.map((problem, index) => {
      const ring = Math.floor(index / NOTES_PER_RING);
      const ringStart = ring * NOTES_PER_RING;
      const notesInRing = Math.min(NOTES_PER_RING, problems.length - ringStart);
      const positionInRing = index - ringStart;
      const radius = 220 + ring * 125;

      const angle = -Math.PI / 2 + (Math.PI * 2 * positionInRing) / Math.max(1, notesInRing);
      const defaultLeft = center + Math.cos(angle) * radius - SURVEY_NOTE_WIDTH / 2;
      const defaultTop = center + Math.sin(angle) * radius - SURVEY_NOTE_HEIGHT / 2;

      const customPos = customPositions[`${systemKey}:${problem.id}`];
      const left = customPos ? customPos.x : defaultLeft;
      const top = customPos ? customPos.y : defaultTop;

      return {
        problem,
        left,
        top,
        centerX: left + SURVEY_NOTE_WIDTH / 2,
        centerY: top + SURVEY_NOTE_HEIGHT / 2,
        ring,
      };
    });

    return (
      <div
        key={systemKey}
        id={`orbit-system-${systemKey}`}
        className="relative shrink-0 rounded-[28px] border border-stone-200/80 dark:border-stone-800/80 bg-white/40 dark:bg-[#141416]/40 backdrop-blur-xs transition-colors"
        style={{
          width: fieldSize,
          height: fieldSize,
        }}
        onDragOver={
          candidate
            ? (event) => {
                event.preventDefault();
                setDragOverCandidateId(candidate.id);
              }
            : undefined
        }
        onDragLeave={candidate ? () => setDragOverCandidateId(null) : undefined}
        onDrop={
          candidate
            ? (event) => {
                event.preventDefault();
                setDragOverCandidateId(null);
                const problemId = event.dataTransfer.getData('text/plain');
                if (problemId) onLinkProblemToCandidate(candidate.id, problemId);
              }
            : undefined
        }
      >
        {/* System Header Tag */}
        <div className="absolute left-5 top-4 z-20 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
          <span
            className={`w-2 h-2 rounded-full ${
              candidate ? 'bg-[#6B4FBB] dark:bg-[#BCA8F7]' : 'bg-[#2C5EA8] dark:bg-[#7DB4F8]'
            }`}
          />
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            {candidate ? 'Candidate Hub' : 'Unresolved Swarm'}
          </span>
          <span className="text-stone-400 dark:text-stone-500">· {problems.length} findings</span>
        </div>

        {/* Concentric Orbit Track Lines & Direct Dynamic Tethers (SVG) */}
        <svg
          viewBox={`0 0 ${fieldSize} ${fieldSize}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`glow-${systemKey}`} cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={candidate ? (isDarkMode ? '#6B4FBB' : '#8B5CF6') : isDarkMode ? '#2C5EA8' : '#3B82F6'}
                stopOpacity={isDragOver ? 0.2 : 0.05}
              />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Gravity Well Glow */}
          <circle cx={center} cy={center} r={fieldSize * 0.42} fill={`url(#glow-${systemKey})`} />

          {/* Concentric Orbit Track Rings */}
          {rings.map((radius, rIndex) => (
            <g key={`ring-${rIndex}`}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)'}
                strokeWidth={isDragOver ? 2 : 1}
                strokeDasharray={candidate ? '4, 6' : '2, 8'}
              />
              {[0, 90, 180, 270].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const mx = center + Math.cos(rad) * radius;
                const my = center + Math.sin(rad) * radius;
                return (
                  <circle
                    key={`tick-${rIndex}-${deg}`}
                    cx={mx}
                    cy={my}
                    r={1.5}
                    fill={isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'}
                  />
                );
              })}
            </g>
          ))}

          {/* Dynamic Vector Tether Lines to each Node Center */}
          {notePositions.map(({ problem, centerX, centerY }) => {
            const isHovered = hoveredProblemId === problem.id;
            const isSelected = selectedProblemIds.includes(problem.id);
            const isBeingDragged = draggingItem?.id === problem.id;

            return (
              <g key={`tether-${problem.id}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={centerX}
                  y2={centerY}
                  stroke={
                    isSelected
                      ? '#eab308'
                      : isHovered || isBeingDragged
                      ? candidate
                        ? isDarkMode
                          ? '#BCA8F7'
                          : '#6B4FBB'
                        : isDarkMode
                        ? '#7DB4F8'
                        : '#2C5EA8'
                      : isDarkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.07)'
                  }
                  strokeWidth={isHovered || isSelected || isBeingDragged ? 2 : 1}
                  strokeDasharray={candidate ? (isSelected ? 'none' : '3, 4') : '2, 6'}
                />
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={isHovered || isBeingDragged ? 4 : 2.5}
                  fill={
                    candidate
                      ? isDarkMode
                        ? '#BCA8F7'
                        : '#6B4FBB'
                      : isDarkMode
                      ? '#7DB4F8'
                      : '#2C5EA8'
                  }
                />
              </g>
            );
          })}
        </svg>

        {/* Central Core Hub (Candidate Question or Unresolved Anchor) */}
        <div
          id={candidate ? `candidate-hub-${candidate.id}` : 'unresolved-hub'}
          className={`orbit-hub-card absolute z-20 flex w-64 -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border transition-all duration-150 ${
            candidate
              ? isDragOver
                ? 'border-[#6B4FBB] ring-4 ring-[#6B4FBB]/15 bg-white dark:bg-[#1a1a20] shadow-xl'
                : 'border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-[#17171a]/95 shadow-md hover:shadow-lg'
              : 'border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/90 dark:bg-[#151518]/90'
          }`}
          style={{ left: center, top: center }}
        >
          {candidate ? (
            isEditingCandidate ? (
              <div className="space-y-2 p-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                  Edit Candidate
                </div>
                <textarea
                  autoFocus
                  rows={3}
                  value={editCandidateText}
                  onChange={(event) => setEditCandidateText(event.target.value)}
                  className="w-full resize-none rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#121215] px-2.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#6B4FBB]"
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingCandidateId(null)}
                    className="rounded px-2 py-1 text-[11px] text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEditCandidate(candidate.id)}
                    className="rounded bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 px-3.5 py-2">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#6B4FBB] dark:text-[#BCA8F7]">
                    <Network className="h-3 w-3" />
                    <span>Candidate Hub</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCandidateId(candidate.id);
                        setEditCandidateText(candidate.text);
                      }}
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer"
                      title="Edit candidate"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCandidateQuestion(candidate.id)}
                      className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete candidate"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="p-3.5 space-y-2.5">
                  <p className="text-xs font-medium leading-relaxed text-stone-900 dark:text-stone-100">
                    {candidate.text}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/60">
                    <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                      {problems.length} {problems.length === 1 ? 'finding' : 'findings'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenPromoteModal(candidate)}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Promote</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </>
            )
          ) : (
            <div className="p-4 text-center space-y-1.5">
              <CircleDotDashed className="mx-auto h-4 w-4 text-stone-400 dark:text-stone-500" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Unresolved Orbit
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                Drag findings onto a candidate hub to cluster.
              </p>
            </div>
          )}
        </div>

        {/* Orbiting Problem Finding Cards (Freely Draggable and Droppable) */}
        {notePositions.map(({ problem, left, top }) => {
          const isSelected = selectedProblemIds.includes(problem.id);
          const isEditing = editingProblemId === problem.id;
          const isHovered = hoveredProblemId === problem.id;
          const isBeingDragged = draggingItem?.id === problem.id;

          return (
            <div
              key={`${systemKey}-${problem.id}`}
              id={`orbit-problem-${systemKey}-${problem.id}`}
              draggable={!isEditing}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', problem.id);
                event.dataTransfer.effectAllowed = 'copyMove';
              }}
              onMouseDown={(e) =>
                !isEditing && handleStartCardDrag(e, problem.id, systemKey, left, top)
              }
              onMouseEnter={() => setHoveredProblemId(problem.id)}
              onMouseLeave={() => setHoveredProblemId(null)}
              onClick={(event) => onSelectProblem(event, problem.id)}
              className={`orbit-node-card group absolute z-10 rounded-xl bg-white dark:bg-[#18181b] transition-shadow cursor-grab active:cursor-grabbing select-text ${
                isSelected
                  ? 'border-2 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : isHovered || isBeingDragged
                  ? 'border border-stone-400 dark:border-stone-600 shadow-md ring-1 ring-stone-400/20'
                  : 'border border-stone-200 dark:border-stone-800 shadow-2xs'
              } ${isBeingDragged ? 'opacity-90 scale-102 z-30' : ''}`}
              style={{
                left,
                top,
                width: SURVEY_NOTE_WIDTH,
                minHeight: SURVEY_NOTE_HEIGHT,
              }}
            >
              {isEditing ? (
                <div className="p-2.5 space-y-2">
                  <textarea
                    autoFocus
                    rows={3}
                    value={editProblemText}
                    onChange={(event) => setEditProblemText(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="w-full resize-none rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#121215] px-2 py-1.5 text-[11px] text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#2C5EA8]"
                  />
                  <input
                    value={editProblemSource}
                    onChange={(event) => setEditProblemSource(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Source citation"
                    className="w-full rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#121215] px-2 py-1 text-[10px] text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingProblemId(null);
                      }}
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSaveEditProblem(problem.id);
                      }}
                      className="rounded bg-stone-900 p-1 text-white dark:bg-stone-100 dark:text-stone-900"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 px-2.5 py-1.5">
                    <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#2C5EA8] dark:text-[#7DB4F8]">
                      <GripHorizontal className="h-2.5 w-2.5 text-stone-400 dark:text-stone-500" />
                      Finding
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {candidate && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onUnlinkProblemFromCandidate(candidate.id, problem.id);
                          }}
                          className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer"
                          title="Unlink from candidate"
                        >
                          <Unlink className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStartEditProblem(problem);
                        }}
                        className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer"
                        title="Edit note"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveOpenProblem(problem.id);
                        }}
                        className="rounded p-0.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="line-clamp-3 text-[11px] font-normal leading-relaxed text-stone-800 dark:text-stone-200">
                      {problem.text}
                    </p>
                    {problem.citation && (
                      <p className="mt-1 truncate font-mono text-[9px] text-stone-400 dark:text-stone-500">
                        {problem.citation}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id="orbit-field-canvas-container"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      className={`relative h-full w-full overflow-hidden select-none bg-[#fafafa] dark:bg-[#101014] ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Background Dot Matrix */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(${isDarkMode ? '#555' : '#aaa'} 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Floating Canvas Controls Overlay (Minimalist Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-xl border border-stone-200/90 dark:border-stone-800/90 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md p-1 shadow-sm text-stone-600 dark:text-stone-300">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (Ctrl + Wheel Up)"
          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <span className="font-mono text-[10px] px-1 text-stone-400 dark:text-stone-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (Ctrl + Wheel Down)"
          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <div className="h-3.5 w-px bg-stone-200 dark:bg-stone-800 mx-0.5" />

        <button
          type="button"
          onClick={handleResetView}
          title="Reset View & Positions"
          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Orbit Canvas Content Space */}
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="flex items-start gap-12 p-8 min-w-max">
          {/* 1. Unresolved Problems Orbit Swarm */}
          {unresolvedProblems.length > 0 && renderOrbitalSystem(undefined, 0)}

          {/* 2. Candidate Question Systems */}
          {candidateQuestions.map((candidate, idx) =>
            renderOrbitalSystem(candidate, idx + 1)
          )}

          {/* Empty State */}
          {openProblems.length === 0 && candidateQuestions.length === 0 && (
            <div className="flex h-80 w-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 text-center dark:border-stone-800 dark:bg-[#17171a]/60 p-6">
              <CircleDotDashed className="h-8 w-8 text-stone-400 dark:text-stone-600" />
              <p className="mt-3 text-xs font-semibold text-stone-700 dark:text-stone-300">
                No research problems yet
              </p>
              <p className="mt-1 max-w-xs text-[11px] text-stone-500 dark:text-stone-400">
                Click "+ Open Problem" above to add an unresolved finding from literature.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
