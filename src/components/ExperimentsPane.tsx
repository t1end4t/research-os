import React, { useState, useEffect } from 'react';
import {
  ExperimentGroup,
  ArtifactItem,
  ExperimentStatus,
  QuestionNode,
  ArtifactType,
} from '../types';
import { INITIAL_EXPERIMENTS_DATA } from '../data/experimentsData';
import { setResearchItemDragData } from '../researchItemDrag';
import { LinkStatusChip } from './LinkStatusChip';
import {
  Plus,
  X,
  Maximize2,
  Link2,
  FileSpreadsheet,
  LineChart,
  StickyNote,
  ChevronDown,
  Check,
  GripVertical,
} from 'lucide-react';

interface ExperimentsPaneProps {
  questions: QuestionNode[];
  selectedNodeId?: string | null;
  onSelectClaim?: (claimId: string) => void;
  onLinkArtifactToClaim?: (artifactId: string, claimId: string) => void;
}

export function ExperimentsPane({
  questions,
  selectedNodeId,
  onSelectClaim,
  onLinkArtifactToClaim,
}: ExperimentsPaneProps) {
  const [experimentsData, setExperimentsData] = useState<ExperimentGroup[]>(
    INITIAL_EXPERIMENTS_DATA
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | ExperimentStatus>('ALL');
  const [claimFilter, setClaimFilter] = useState<string>('all');
  const [flashingGroupId, setFlashingGroupId] = useState<string | null>(null);

  // Active artifact modal overlay state
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [detailFindingText, setDetailFindingText] = useState<string>('');
  const [isSavedFinding, setIsSavedFinding] = useState<boolean>(false);

  // Link to claim modal state
  const [linkingArtifact, setLinkingArtifact] = useState<ArtifactItem | null>(null);
  const [targetLinkClaimId, setTargetLinkClaimId] = useState<string>('c1');

  // Add Artifact modal state
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [newArtifactType, setNewArtifactType] = useState<ArtifactType>('PLOT');
  const [newArtifactTitle, setNewArtifactTitle] = useState<string>('');
  const [newArtifactCaption, setNewArtifactCaption] = useState<string>('');
  const [newArtifactNote, setNewArtifactNote] = useState<string>('');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArtifact(null);
        setLinkingArtifact(null);
        setAddingToGroupId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Flash heading and scroll to experiment group when selectedNodeId matches
  useEffect(() => {
    if (!selectedNodeId) return;

    const matchingGroup = experimentsData.find(
      (g) =>
        g.id === selectedNodeId ||
        g.claimId === selectedNodeId ||
        (selectedNodeId === 'e3' && g.claimId === 'c1') ||
        (selectedNodeId === 'e4' && g.claimId === 'c3') ||
        g.artifacts.some((a) => a.id === selectedNodeId)
    );

    if (matchingGroup) {
      setFlashingGroupId(matchingGroup.id);
      const el = document.getElementById(`experiment-group-${matchingGroup.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const timer = setTimeout(() => {
        setFlashingGroupId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, experimentsData]);

  // When an artifact is opened in detail overlay, load its finding summary
  useEffect(() => {
    if (selectedArtifact) {
      setDetailFindingText(selectedArtifact.findingSummary || '');
      setIsSavedFinding(false);
    }
  }, [selectedArtifact]);

  // Flatten all claims from questions
  const allClaims = questions.flatMap((q) => q.claims);

  // Filter groups
  const filteredGroups = experimentsData.filter((grp) => {
    if (statusFilter !== 'ALL' && grp.status !== statusFilter) {
      return false;
    }
    if (claimFilter !== 'all' && grp.claimId !== claimFilter) {
      return false;
    }
    return true;
  });

  // Save finding text
  const handleSaveFinding = () => {
    if (!selectedArtifact || !detailFindingText.trim()) return;

    setExperimentsData((prev) =>
      prev.map((grp) => ({
        ...grp,
        artifacts: grp.artifacts.map((art) =>
          art.id === selectedArtifact.id
            ? { ...art, findingSummary: detailFindingText.trim() }
            : art
        ),
      }))
    );

    setSelectedArtifact((prev) =>
      prev ? { ...prev, findingSummary: detailFindingText.trim() } : null
    );
    setIsSavedFinding(true);
    setTimeout(() => setIsSavedFinding(false), 2000);
  };

  // Perform Link to Claim
  const handleConfirmLink = () => {
    if (!linkingArtifact) return;

    const targetClaim = allClaims.find((c) => c.id === targetLinkClaimId);
    if (!targetClaim) return;

    setExperimentsData((prev) =>
      prev.map((grp) => ({
        ...grp,
        artifacts: grp.artifacts.map((art) =>
          art.id === linkingArtifact.id
            ? {
                ...art,
                claimId: targetClaim.id,
                claimText: targetClaim.text,
              }
            : art
        ),
      }))
    );

    if (onLinkArtifactToClaim) {
      onLinkArtifactToClaim(linkingArtifact.id, targetLinkClaimId);
    }

    setLinkingArtifact(null);
  };

  // Add Artifact Handler
  const handleCreateArtifact = () => {
    if (!addingToGroupId || !newArtifactTitle.trim()) return;

    const group = experimentsData.find((g) => g.id === addingToGroupId);
    if (!group) return;

    const nowStr = 'Today';
    const newArt: ArtifactItem = {
      id: `art-${Date.now()}`,
      type: newArtifactType,
      title: newArtifactTitle.trim(),
      caption: newArtifactCaption.trim() || newArtifactTitle.trim(),
      date: nowStr,
      claimId: group.claimId,
      claimText: group.claimText,
      findingSummary: '',
      noteContent:
        newArtifactType === 'NOTE'
          ? newArtifactNote.trim() || 'Custom experimental observation notes.'
          : undefined,
      plotPoints:
        newArtifactType === 'PLOT'
          ? [
              { x: 1, y: 12.0, y2: 15.0, label: 'Run 1' },
              { x: 2, y: 8.5, y2: 10.2, label: 'Run 2' },
              { x: 3, y: 4.1, y2: 6.8, label: 'Run 3' },
              { x: 4, y: 2.3, y2: 3.5, label: 'Run 4' },
            ]
          : undefined,
      plotLabels:
        newArtifactType === 'PLOT'
          ? { x: 'Iterations (x1000)', y: 'Loss Target' }
          : undefined,
      tableHeaders:
        newArtifactType === 'TABLE'
          ? ['Step', 'Target Sparsity', 'Recall Accuracy', 'Drift']
          : undefined,
      tableRows:
        newArtifactType === 'TABLE'
          ? [
              ['Trial-1', '0.05', '94.2%', '0.012'],
              ['Trial-2', '0.10', '91.8%', '0.025'],
              ['Trial-3', '0.20', '85.4%', '0.068'],
              ['Trial-4', '0.40', '71.0%', '0.142'],
            ]
          : undefined,
      totalRows: newArtifactType === 'TABLE' ? 16 : undefined,
    };

    setExperimentsData((prev) =>
      prev.map((g) =>
        g.id === addingToGroupId
          ? { ...g, artifacts: [...g.artifacts, newArt] }
          : g
      )
    );

    setAddingToGroupId(null);
    setNewArtifactTitle('');
    setNewArtifactCaption('');
    setNewArtifactNote('');
  };

  // Render Vector Plot preview
  const renderPlotPreview = (artifact: ArtifactItem, isFullSize = false) => {
    const points = artifact.plotPoints || [
      { x: 4, y: 14.2, y2: 18.5 },
      { x: 8, y: 9.8, y2: 13.1 },
      { x: 16, y: 5.4, y2: 8.9 },
      { x: 32, y: 3.1, y2: 5.2 },
      { x: 64, y: 2.2, y2: 3.7 },
    ];

    const width = isFullSize ? 480 : 220;
    const height = isFullSize ? 280 : 130;
    const pad = isFullSize ? 36 : 18;

    // SVG coordinates calculation
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const y2s = points.map((p) => p.y2 || p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys, ...y2s) * 1.1;

    const toSvgX = (x: number) => pad + ((x - minX) / (maxX - minX)) * (width - pad * 2);
    const toSvgY = (y: number) => height - pad - (y / maxY) * (height - pad * 2);

    const linePath1 = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`)
      .join(' ');

    const linePath2 = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y2 || p.y)}`)
      .join(' ');

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[#fcfcfc] dark:bg-[#1f1f1f] rounded-md">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[170px]"
        >
          {/* Subtle Gridlines */}
          <line
            x1={pad}
            y1={toSvgY(0)}
            x2={width - pad}
            y2={toSvgY(0)}
            stroke="currentColor"
            className="text-[#e5e5e5] dark:text-[#333333]"
            strokeWidth="1"
          />
          <line
            x1={pad}
            y1={toSvgY(maxY / 2)}
            x2={width - pad}
            y2={toSvgY(maxY / 2)}
            stroke="currentColor"
            className="text-[#f0f0f0] dark:text-[#2a2a2a]"
            strokeDasharray="2,2"
          />
          <line
            x1={pad}
            y1={pad}
            x2={pad}
            y2={height - pad}
            stroke="currentColor"
            className="text-[#e5e5e5] dark:text-[#333333]"
            strokeWidth="1"
          />

          {/* Primary Curve (Emerald) */}
          <path
            d={linePath1}
            fill="none"
            stroke="#10a37f"
            strokeWidth={isFullSize ? 2.5 : 2}
          />
          {/* Secondary Curve (Amber) */}
          <path
            d={linePath2}
            fill="none"
            stroke="#ffb000"
            strokeWidth={isFullSize ? 2 : 1.5}
            strokeDasharray="4,2"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y)}
                r={isFullSize ? 4 : 2.5}
                fill="#10a37f"
              />
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y2 || p.y)}
                r={isFullSize ? 3.5 : 2}
                fill="#ffb000"
              />
            </g>
          ))}

          {/* Labels if full size */}
          {isFullSize && (
            <>
              <text
                x={width / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#888"
                className="dark:fill-[#aaa]"
              >
                {artifact.plotLabels?.x || 'Expansion Factor'}
              </text>
              <text
                x={12}
                y={height / 2}
                textAnchor="middle"
                transform={`rotate(-90 12 ${height / 2})`}
                fontSize="10"
                fill="#888"
                className="dark:fill-[#aaa]"
              >
                {artifact.plotLabels?.y || 'MSE Error'}
              </text>
            </>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-[#777] dark:text-[#999] mt-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-[2px] bg-[#10a37f]" />
            <span>L0 = 32</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-[2px] bg-[#ffb000] border-t border-dashed" />
            <span>L0 = 64</span>
          </div>
        </div>
      </div>
    );
  };

  // Render Table Preview
  const renderTablePreview = (artifact: ArtifactItem, isFullSize = false) => {
    const headers = artifact.tableHeaders || ['Config', 'Expansion', 'L0', 'Score'];
    const rows = artifact.tableRows || [
      ['cfg-4k', '4x', '31.4', '0.342'],
      ['cfg-8k', '8x', '32.1', '0.215'],
      ['cfg-16k', '16x', '30.8', '0.118'],
      ['cfg-32k', '32x', '31.2', '0.064'],
    ];

    const displayRows = isFullSize ? rows : rows.slice(0, 4);

    return (
      <div className="w-full flex flex-col justify-between text-[11px] p-2 bg-[#fcfcfc] dark:bg-[#1f1f1f] rounded-md font-mono overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-[#2f2f2f] text-[#888] dark:text-[#777] text-[10px]">
              {headers.map((h, i) => (
                <th key={i} className="pb-1 font-semibold pr-2 truncate">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f2] dark:divide-[#282828] text-[#333] dark:text-[#d0d0d0]">
            {displayRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-white dark:hover:bg-[#252525] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-1 pr-2 truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Truncated note if not full size */}
        {!isFullSize && artifact.totalRows && artifact.totalRows > 4 && (
          <div className="pt-2 text-center text-[10px] text-[#999] dark:text-[#777] italic border-t border-[#f0f0f0] dark:border-[#2a2a2a] mt-1">
            +{artifact.totalRows - 4} more rows
          </div>
        )}
      </div>
    );
  };

  // Render Note Preview
  const renderNotePreview = (artifact: ArtifactItem, isFullSize = false) => {
    const text =
      artifact.noteContent ||
      'Feature activations converge toward near-orthogonal geometry without substantial weight interference across iterative trials.';

    return (
      <div className="w-full p-3 bg-[#fdfdfd] dark:bg-[#1f1f1f] rounded-md text-[12px] text-[#333] dark:text-[#dedede] leading-relaxed">
        <p className={isFullSize ? 'whitespace-pre-line' : 'line-clamp-5'}>
          {text}
        </p>
      </div>
    );
  };

  return (
    <div id="experiments-pane" className="flex flex-col h-full w-full bg-[#fcfcfc] dark:bg-[#141414] overflow-y-auto">
      {/* 1. FILTER ROW AT TOP MATCHING GRAPH FILTER BAR */}
      <div
        id="experiments-filter-bar"
        className="px-6 py-2.5 border-b border-[#ececec] dark:border-[#262626] bg-white/95 dark:bg-[#181818]/95 backdrop-blur-xs flex items-center justify-between sticky top-0 z-20 shrink-0"
      >
        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777] mr-1">
            Status:
          </span>
          {(['ALL', 'planned', 'running', 'done'] as const).map((st, i) => (
            <React.Fragment key={st}>
              {i > 0 && <span className="text-[#d1d1d1] dark:text-[#383838]">|</span>}
              <button
                onClick={() => setStatusFilter(st)}
                className={`transition-colors cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'font-semibold text-[#1a1a1a] dark:text-white'
                    : 'text-[#888] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Dropdown "by claim" */}
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
            By claim:
          </span>
          <select
            value={claimFilter}
            onChange={(e) => setClaimFilter(e.target.value)}
            className="bg-[#f7f7f7] dark:bg-[#202020] border border-[#ececec] dark:border-[#2e2e2e] rounded px-2.5 py-1 text-[12px] text-[#1a1a1a] dark:text-[#e0e0e0] focus:outline-hidden cursor-pointer"
          >
            <option value="all">All claims</option>
            {allClaims.map((c) => (
              <option key={c.id} value={c.id}>
                {c.text.length > 36 ? `${c.text.slice(0, 36)}...` : c.text}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. EXPERIMENT GROUPS CONTENT AREA */}
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-10">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-[#999] dark:text-[#777] text-[13px] italic">
            No experiments match the selected filters.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <section
              key={group.id}
              id={`experiment-group-${group.id}`}
              className="space-y-4"
            >
              {/* Group Heading: takes the experiment tint */}
              <div
                draggable
                onDragStart={(e) => {
                  setResearchItemDragData(e.dataTransfer, {
                    id: group.id,
                    type: 'EXPERIMENT',
                    label: `Experiment: ${group.name} (tests ${group.claimText})`,
                  });
                }}
                className={`group/exp-hdr flex items-center justify-between rounded-[10px] p-3 px-4 transition-all duration-200 border bg-[#FFF6EE] dark:bg-[#A45A1E]/12 cursor-grab active:cursor-grabbing ${
                  flashingGroupId === group.id
                    ? 'ring-2 ring-[#ffb000] border-[#ffb000]'
                    : 'border-[#F6E3D2] dark:border-[#A45A1E]/25 hover:border-[#A45A1E]/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <div
                    title="Drag experiment to Assistant panel"
                    className="opacity-40 group-hover/exp-hdr:opacity-100 cursor-grab active:cursor-grabbing text-[#A45A1E] dark:text-[#F4A86A] shrink-0"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A45A1E] dark:bg-[#F4A86A] shrink-0" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A45A1E] dark:text-[#F4A86A] shrink-0">
                    EXPERIMENT • TESTS:
                  </span>
                  <span className="text-[13px] text-[#1a1a1a] dark:text-[#ededed] font-medium truncate">
                    {group.claimText}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-white dark:bg-[#252525] text-[#666] dark:text-[#999] border border-[#F6E3D2] dark:border-[#333333]">
                    {group.status}
                  </span>
                  <LinkStatusChip status={group.claimStatus} />
                </div>
              </div>

              {/* Grid of Artifact Cards (min 240px, 16px gap) */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                {/* Populated Artifact Cards */}
                {group.artifacts.map((art) => (
                  <div
                    key={art.id}
                    id={`artifact-card-${art.id}`}
                    draggable
                    onDragStart={(e) => {
                      setResearchItemDragData(e.dataTransfer, {
                        id: art.id,
                        type: 'EXPERIMENT',
                        label: `${art.type}: ${art.title || art.caption}`,
                      });
                    }}
                    onClick={() => setSelectedArtifact(art)}
                    className="group relative bg-white dark:bg-[#1a1a1a] border border-[#ececec] dark:border-[#282828] hover:border-[#999] dark:hover:border-[#555] rounded-[10px] p-4 flex flex-col justify-between transition-all duration-150 cursor-grab active:cursor-grabbing min-h-[260px]"
                  >
                    {/* Top: 10px uppercase muted type label + hover actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[#888] dark:text-[#777]">
                        <div
                          title="Drag artifact to Assistant panel"
                          className="opacity-40 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-stone-400"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        {art.type === 'PLOT' && <LineChart className="w-3.5 h-3.5" />}
                        {art.type === 'TABLE' && (
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        )}
                        {art.type === 'NOTE' && <StickyNote className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                          {art.type}
                        </span>
                      </div>

                      {/* Top-Right Reveal Actions: "Open" and "Link to claim" */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity"
                      >
                        <button
                          onClick={() => setSelectedArtifact(art)}
                          className="text-[11px] font-medium text-[#1a1a1a] dark:text-white hover:underline cursor-pointer"
                        >
                          Open
                        </button>
                        <span className="text-[#ccc] dark:text-[#444]">|</span>
                        <button
                          onClick={() => {
                            setLinkingArtifact(art);
                            setTargetLinkClaimId(art.claimId);
                          }}
                          className="text-[11px] font-medium text-[#1a1a1a] dark:text-white hover:underline cursor-pointer"
                        >
                          Link to claim
                        </button>
                      </div>
                    </div>

                    {/* Body Preview */}
                    <div className="flex-1 flex flex-col justify-center my-1 overflow-hidden">
                      {art.type === 'PLOT' && renderPlotPreview(art)}
                      {art.type === 'TABLE' && renderTablePreview(art)}
                      {art.type === 'NOTE' && renderNotePreview(art)}
                    </div>

                    {/* Bottom: Caption line (12px) and Date (11px muted) */}
                    <div className="pt-2 border-t border-[#f5f5f5] dark:border-[#262626] space-y-1 mt-2">
                      <p className="text-[12px] text-[#2a2a2a] dark:text-[#dedede] leading-snug line-clamp-1">
                        {art.caption}
                      </p>
                      <div className="text-[11px] text-[#999] dark:text-[#777]">
                        {art.date}
                      </div>
                    </div>
                  </div>
                ))}

                {/* EMPTY EXPERIMENT STATE (Single dashed card, no fill, muted italic) */}
                {group.artifacts.length === 0 && (
                  <div
                    id={`empty-experiment-${group.id}`}
                    className="col-span-full border border-dashed border-[#d1d1d1] dark:border-[#383838] bg-transparent rounded-[10px] p-8 flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <span className="text-[13px] italic text-[#999] dark:text-[#777]">
                      no artifacts yet
                    </span>
                    <button
                      id={`add-artifact-btn-${group.id}`}
                      onClick={() => setAddingToGroupId(group.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white dark:bg-[#1e1e1e] hover:bg-[#f3f4f6] dark:hover:bg-[#282828] text-[#1a1a1a] dark:text-[#e0e0e0] border border-[#ececec] dark:border-[#2e2e2e] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add artifact</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {/* 3. ARTIFACT DETAIL OVERLAY (Centered overlay, not a new page) */}
      {selectedArtifact && (
        <div
          id="artifact-detail-overlay-backdrop"
          onClick={() => setSelectedArtifact(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
        >
          <div
            id="artifact-detail-modal"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] border border-[#ececec] dark:border-[#2a2a2a] rounded-xl max-w-4xl w-full max-h-[88vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-150"
          >
            {/* Left Column: Artifact at full size */}
            <div className="flex-1 p-6 md:p-8 bg-[#fafafa] dark:bg-[#161616] border-b md:border-b-0 md:border-r border-[#ececec] dark:border-[#262626] flex flex-col justify-center items-center overflow-y-auto">
              <div className="w-full space-y-4">
                <div className="flex items-center gap-2 text-[#888] dark:text-[#777]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                    {selectedArtifact.type} ARTIFACT
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1e1e1e] border border-[#ececec] dark:border-[#2e2e2e] rounded-xl p-4 shadow-2xs">
                  {selectedArtifact.type === 'PLOT' &&
                    renderPlotPreview(selectedArtifact, true)}
                  {selectedArtifact.type === 'TABLE' &&
                    renderTablePreview(selectedArtifact, true)}
                  {selectedArtifact.type === 'NOTE' &&
                    renderNotePreview(selectedArtifact, true)}
                </div>
              </div>
            </div>

            {/* Right Column: Narrow column with metadata & "What did this show?" */}
            <div className="w-full md:w-80 p-6 bg-white dark:bg-[#1a1a1a] flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-4">
                {/* Modal Close Button & Drag Handle */}
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec] dark:border-[#262626]">
                  <div
                    draggable
                    onDragStart={(e) => {
                      setResearchItemDragData(e.dataTransfer, {
                        id: selectedArtifact.id,
                        type: 'EXPERIMENT',
                        label: `${selectedArtifact.type}: ${selectedArtifact.title || selectedArtifact.caption}`,
                      });
                    }}
                    title="Drag artifact to Assistant panel"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-grab active:cursor-grabbing hover:bg-stone-200 dark:hover:bg-stone-700"
                  >
                    <GripVertical className="w-3 h-3 text-stone-400" />
                    <span>Drag to Dock</span>
                  </div>
                  <button
                    onClick={() => setSelectedArtifact(null)}
                    className="p-1 hover:text-[#1a1a1a] dark:hover:text-white text-[#888] dark:text-[#777] rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                    Caption
                  </span>
                  <p className="text-[13px] text-[#1a1a1a] dark:text-[#f0f0f0] leading-snug">
                    {selectedArtifact.caption}
                  </p>
                </div>

                {/* Claim it belongs to */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                    Belongs to Claim
                  </span>
                  <div className="p-2 bg-[#f8f8f8] dark:bg-[#222222] border border-[#ececec] dark:border-[#2e2e2e] rounded text-[12px] text-[#333] dark:text-[#cccccc] leading-snug">
                    {selectedArtifact.claimText}
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                    Date Recorded
                  </span>
                  <div className="text-[12px] text-[#666] dark:text-[#999]">
                    {selectedArtifact.date}
                  </div>
                </div>

                {/* Required field: "What did this show?" */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777] flex items-center justify-between">
                    <span>What did this show? *</span>
                    {isSavedFinding && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={4}
                    value={detailFindingText}
                    onChange={(e) => setDetailFindingText(e.target.value)}
                    placeholder="Describe the mechanistic finding or empirical proof..."
                    className="w-full bg-[#fcfcfc] dark:bg-[#202020] border border-[#ececec] dark:border-[#2e2e2e] focus:border-[#bbb] dark:focus:border-[#555] rounded-lg p-2.5 text-[12px] text-[#1a1a1a] dark:text-[#dedede] leading-relaxed resize-none focus:outline-hidden placeholder-[#aaa] dark:placeholder-[#666]"
                  />
                  <button
                    onClick={handleSaveFinding}
                    disabled={!detailFindingText.trim()}
                    className="w-full mt-2 py-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] hover:bg-[#333] dark:hover:bg-[#eee] disabled:opacity-30 disabled:pointer-events-none rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    Save Finding Note
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ececec] dark:border-[#262626] flex items-center justify-between text-[11px] text-[#999] dark:text-[#777]">
                <span>Press Esc to close</span>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="text-[#1a1a1a] dark:text-white hover:underline cursor-pointer font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LINK TO CLAIM MODAL */}
      {linkingArtifact && (
        <div
          onClick={() => setLinkingArtifact(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] border border-[#ececec] dark:border-[#2e2e2e] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#282828] pb-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-[#f0f0f0]">
                Link Artifact to Claim
              </span>
              <button
                onClick={() => setLinkingArtifact(null)}
                className="text-[#888] hover:text-[#1a1a1a] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-[#777] dark:text-[#888]">Artifact:</span>
              <div className="text-[13px] font-medium text-[#1a1a1a] dark:text-[#dedede]">
                {linkingArtifact.caption}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                Select Target Claim
              </label>
              <select
                value={targetLinkClaimId}
                onChange={(e) => setTargetLinkClaimId(e.target.value)}
                className="w-full bg-[#fcfcfc] dark:bg-[#222222] border border-[#ececec] dark:border-[#333333] rounded-lg p-2.5 text-[12px] text-[#1a1a1a] dark:text-[#dedede] focus:outline-hidden"
              >
                {allClaims.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.text}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f0f0] dark:border-[#282828]">
              <button
                onClick={() => setLinkingArtifact(null)}
                className="px-3 py-1.5 text-[12px] text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLink}
                className="px-4 py-1.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-lg text-[12px] font-medium hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
              >
                Link Artifact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD ARTIFACT MODAL */}
      {addingToGroupId && (
        <div
          onClick={() => setAddingToGroupId(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] border border-[#ececec] dark:border-[#2e2e2e] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#282828] pb-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-[#f0f0f0]">
                Add New Artifact
              </span>
              <button
                onClick={() => setAddingToGroupId(null)}
                className="text-[#888] hover:text-[#1a1a1a] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                Artifact Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PLOT', 'TABLE', 'NOTE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewArtifactType(t)}
                    className={`py-2 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer ${
                      newArtifactType === t
                        ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] border-[#1a1a1a] dark:border-white'
                        : 'bg-white dark:bg-[#202020] text-[#666] dark:text-[#aaa] border-[#ececec] dark:border-[#2e2e2e] hover:bg-[#f5f5f5] dark:hover:bg-[#282828]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                Title *
              </label>
              <input
                type="text"
                value={newArtifactTitle}
                onChange={(e) => setNewArtifactTitle(e.target.value)}
                placeholder="e.g. Subspace Projection Gradient Error"
                className="w-full bg-[#fcfcfc] dark:bg-[#222222] border border-[#ececec] dark:border-[#333333] rounded-lg p-2 text-[12px] text-[#1a1a1a] dark:text-[#dedede] placeholder-[#aaa] dark:placeholder-[#666] focus:outline-hidden"
              />
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                Caption
              </label>
              <input
                type="text"
                value={newArtifactCaption}
                onChange={(e) => setNewArtifactCaption(e.target.value)}
                placeholder="Short descriptive summary"
                className="w-full bg-[#fcfcfc] dark:bg-[#222222] border border-[#ececec] dark:border-[#333333] rounded-lg p-2 text-[12px] text-[#1a1a1a] dark:text-[#dedede] placeholder-[#aaa] dark:placeholder-[#666] focus:outline-hidden"
              />
            </div>

            {/* Note text if note */}
            {newArtifactType === 'NOTE' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                  Note Observation Content
                </label>
                <textarea
                  rows={3}
                  value={newArtifactNote}
                  onChange={(e) => setNewArtifactNote(e.target.value)}
                  placeholder="Enter observation notes..."
                  className="w-full bg-[#fcfcfc] dark:bg-[#222222] border border-[#ececec] dark:border-[#333333] rounded-lg p-2 text-[12px] text-[#1a1a1a] dark:text-[#dedede] placeholder-[#aaa] dark:placeholder-[#666] focus:outline-hidden resize-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f0f0] dark:border-[#282828]">
              <button
                onClick={() => setAddingToGroupId(null)}
                className="px-3 py-1.5 text-[12px] text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArtifact}
                disabled={!newArtifactTitle.trim()}
                className="px-4 py-1.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-lg text-[12px] font-medium disabled:opacity-30 disabled:pointer-events-none hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
              >
                Add Artifact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
