import React, { useState } from 'react';
import {
  DraftSection,
  DraftPlacedReference,
  DraftPlacedArtifact,
  QuestionNode,
  ClaimNode,
  EvidenceItem,
  ExperimentGroup,
  ArtifactItem,
} from '../../types';
import {
  SectionAnalysis,
  findClaimById,
  findEvidenceById,
  findArtifactById,
  getNextAnchorCode,
} from '../../utils/draftHelpers';
import {
  hasResearchItemDragData,
  getResearchItemDragData,
} from '../../researchItemDrag';
import { SectionLabel, StatusDot, Button } from '../ui/instrument';
import {
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  MoveVertical,
  ExternalLink,
  Clock,
  AlertCircle,
  GripVertical,
  MessageSquare,
  Image as ImageIcon,
  Table as TableIcon,
  StickyNote,
  ChevronDown,
  ArrowRight,
  BookOpen,
  FlaskConical,
} from 'lucide-react';

export interface DraftSectionEditorProps {
  section: DraftSection;
  allSections: DraftSection[];
  analysis?: SectionAnalysis;
  questions: QuestionNode[];
  experiments: ExperimentGroup[];
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onUpdateSectionPurpose: (sectionId: string, purpose: string) => void;
  onUpdateSectionProse: (sectionId: string, prose: string) => void;
  onAddReference: (
    sectionId: string,
    targetType: 'claim' | 'evidence',
    targetId: string,
    version?: number | string
  ) => void;
  onRemoveReference: (sectionId: string, refId: string) => void;
  onMoveReferenceToSection: (sourceSectionId: string, targetSectionId: string, refId: string) => void;
  onAddArtifact: (sectionId: string, artifactId: string, artifactType: 'PLOT' | 'TABLE' | 'NOTE') => void;
  onRemoveArtifact: (sectionId: string, placedId: string) => void;
  onUpdateArtifactCaption: (sectionId: string, placedId: string, caption: string) => void;
  onMoveArtifact: (sectionId: string, placedId: string, direction: 'up' | 'down') => void;
  onSelectAnchorInLedger: (anchorCode: string, targetId: string, targetType: 'claim' | 'evidence' | 'artifact') => void;
  onOpenWorkbenchForClaim?: (claimId: string) => void;
  onOpenPaper?: (paperId: string) => void;
  onReviewDrift?: (ref: DraftPlacedReference, claim: ClaimNode) => void;
}

export function DraftSectionEditor({
  section,
  allSections,
  analysis,
  questions,
  experiments,
  onUpdateSectionTitle,
  onUpdateSectionPurpose,
  onUpdateSectionProse,
  onAddReference,
  onRemoveReference,
  onMoveReferenceToSection,
  onAddArtifact,
  onRemoveArtifact,
  onUpdateArtifactCaption,
  onMoveArtifact,
  onSelectAnchorInLedger,
  onOpenWorkbenchForClaim,
  onOpenPaper,
  onReviewDrift,
}: DraftSectionEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [movingRefId, setMovingRefId] = useState<string | null>(null);

  // Drag over drop handler for research items
  const handleDragOver = (e: React.DragEvent) => {
    if (hasResearchItemDragData(e.dataTransfer)) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const item = getResearchItemDragData(e.dataTransfer);
    if (!item) return;

    if (item.type === 'CLAIM') {
      const claim = findClaimById(questions, item.id);
      onAddReference(section.id, 'claim', item.id, claim?.version ?? 1);
    } else if (item.type === 'EVIDENCE' || item.type === 'PAPER') {
      onAddReference(section.id, 'evidence', item.id);
    } else if (item.type === 'ARTIFACT' || item.type === 'EXPERIMENT') {
      // Find artifact to determine type
      const found = findArtifactById(experiments, item.id);
      if (found) {
        onAddArtifact(section.id, found.artifact.id, found.artifact.type);
      }
    }
  };

  // Render SVG Vector Plot preview inside section figure
  const renderPlotBlock = (artifact: ArtifactItem) => {
    const points = artifact.plotPoints || [
      { x: 0.5, y: 12.0, y2: 14.5 },
      { x: 1.0, y: 32.5, y2: 38.0 },
      { x: 2.0, y: 48.0, y2: 52.0 },
      { x: 4.0, y: 28.0, y2: 44.0 },
      { x: 8.0, y: 8.5, y2: 24.0 },
    ];

    const width = 480;
    const height = 160;
    const pad = 24;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const y2s = points.map((p) => p.y2 || p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys, ...y2s) * 1.15;

    const toSvgX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2);
    const toSvgY = (y: number) => height - pad - (y / maxY) * (height - pad * 2);

    const linePath1 = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`)
      .join(' ');

    const linePath2 = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y2 || p.y)}`)
      .join(' ');

    return (
      <div className="w-full bg-paper border border-rule/70 rounded-[2px] p-3 my-2 flex flex-col items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg h-auto">
          <line
            x1={pad}
            y1={toSvgY(0)}
            x2={width - pad}
            y2={toSvgY(0)}
            stroke="currentColor"
            className="text-rule"
            strokeWidth="1"
          />
          <line
            x1={pad}
            y1={pad}
            x2={pad}
            y2={height - pad}
            stroke="currentColor"
            className="text-rule"
            strokeWidth="1"
          />
          <path d={linePath1} fill="none" stroke="currentColor" className="text-ink" strokeWidth="2" />
          <path
            d={linePath2}
            fill="none"
            stroke="currentColor"
            className="text-ink-muted/70"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={toSvgX(p.x)}
              cy={toSvgY(p.y)}
              r="3.5"
              fill="currentColor"
              className="text-ink"
            />
          ))}
        </svg>
        <div className="flex items-center justify-between w-full max-w-lg text-[10px] font-mono text-ink-muted mt-1 px-1">
          <span>{artifact.plotLabels?.x || 'X Axis'}</span>
          <span>{artifact.plotLabels?.y || 'Y Axis'}</span>
        </div>
      </div>
    );
  };

  // Render Table artifact preview
  const renderTableBlock = (artifact: ArtifactItem) => {
    const headers = artifact.tableHeaders || ['Parameter', 'Model Value', 'V1 Reference', 'Verdict'];
    const rows = artifact.tableRows || [
      ['Aspect Ratio', '1.82 ± 0.31', '1.95 ± 0.44', 'Pass'],
      ['Orient. Bandwidth', '38.4°', '41.2°', 'Pass'],
      ['Spatial Freq. Peak', '1.85 cpd', '2.10 cpd', 'Partial'],
      ['High-Freq Cutoff', '3.40 cpd', '5.80 cpd', 'Mismatch'],
    ];

    return (
      <div className="w-full bg-paper border border-rule/70 rounded-[2px] my-2 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-surface border-b border-rule text-[10px] text-ink-muted uppercase">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-2.5 py-1.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/40 text-ink">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-surface/50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-2.5 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Note artifact preview
  const renderNoteBlock = (artifact: ArtifactItem) => {
    return (
      <div className="w-full bg-paper border border-rule/70 rounded-[2px] p-3 my-2 font-mono text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">
        {artifact.noteContent || artifact.caption}
      </div>
    );
  };

  const isPurposeUnwritten = !section.purpose || section.purpose.trim() === '';

  return (
    <div
      id={`draft-section-editor-${section.id}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-paper overflow-y-auto font-sans relative transition-colors ${
        isDragOver ? 'bg-rule/10 ring-2 ring-inset ring-ink' : ''
      }`}
    >
      {/* Drop overlay prompt when dragging */}
      {isDragOver && (
        <div className="absolute inset-0 bg-paper/85 z-40 flex items-center justify-center pointer-events-none select-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-ink rounded-[2px] font-mono text-xs font-medium text-ink shadow-md">
            <Plus className="w-4 h-4 text-ink" />
            <span>Drop to place reference into this section</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Section Header & Title input */}
        <div className="flex flex-col gap-1 pb-3 border-b border-rule">
          <SectionLabel mono className="text-ink-muted">
            SECTION EDIT
          </SectionLabel>
          <input
            id="draft-section-title-input"
            type="text"
            value={section.title}
            onChange={(e) => onUpdateSectionTitle(section.id, e.target.value)}
            placeholder="Section Title..."
            className="w-full bg-transparent font-serif text-2xl sm:text-3xl font-semibold text-ink focus:outline-none border-b border-transparent focus:border-rule pb-1 transition-colors"
          />
        </div>

        {/* Section Purpose Field: "What must this section establish?" */}
        <div
          id="draft-section-purpose-container"
          className={`p-3.5 rounded-[2px] border transition-colors ${
            isPurposeUnwritten
              ? 'bg-surface border-dashed border-missing/60'
              : 'bg-surface border-rule'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="draft-section-purpose-input"
              className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5"
            >
              <span>What must this section establish?</span>
            </label>
            {isPurposeUnwritten && (
              <span className="text-[10px] font-mono text-missing uppercase tracking-wider font-semibold">
                Purpose unwritten
              </span>
            )}
          </div>
          <textarea
            id="draft-section-purpose-input"
            rows={2}
            value={section.purpose}
            onChange={(e) => onUpdateSectionPurpose(section.id, e.target.value)}
            placeholder="State the job this section must do."
            className="w-full bg-paper border border-rule/80 focus:border-ink rounded-[2px] p-2 font-serif text-sm text-ink leading-relaxed focus:outline-none resize-y"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-ink-muted">
            <span>Written only by the user. Defines the argument boundary for this section.</span>
          </div>
        </div>

        {/* Support Margin & Placed Claims/Evidence Strip */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel mono className="text-ink">
              PLACED SUPPORT REFERENCES ({section.placedReferences?.length || 0})
            </SectionLabel>
            <span className="text-[11px] font-mono text-ink-muted">
              Drag claims/findings from right ledger or drop here
            </span>
          </div>

          {(!section.placedReferences || section.placedReferences.length === 0) ? (
            <div className="p-3 bg-surface/50 border border-dashed border-rule rounded-[2px] text-center text-xs font-sans text-ink-muted italic">
              No claim is connected to this section. Drag a claim or finding from the Support Ledger.
            </div>
          ) : (
            <div className="space-y-2">
              {section.placedReferences.map((ref) => {
                if (ref.targetType === 'claim') {
                  const claim = findClaimById(questions, ref.targetId);
                  const currentVer = claim?.version ?? 1;
                  const placedVer = typeof ref.placedVersion === 'number' ? ref.placedVersion : currentVer;
                  const isStale = placedVer < currentVer;

                  return (
                    <div
                      key={ref.id}
                      id={`draft-ref-card-${ref.id}`}
                      className={`relative bg-surface border rounded-[2px] p-3 flex flex-col gap-2 transition-colors ${
                        isStale ? 'border-weak/80 bg-weak/5' : 'border-rule'
                      }`}
                    >
                      {/* Top row: Anchor Code + Claim Tag + Link Status + Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Anchor chip */}
                          <button
                            id={`draft-anchor-btn-${ref.anchorCode}`}
                            onClick={() =>
                              onSelectAnchorInLedger(ref.anchorCode, ref.targetId, 'claim')
                            }
                            className="px-1.5 py-0.5 rounded-[2px] bg-paper border border-rule font-mono text-[11px] font-bold text-ink hover:border-ink cursor-pointer"
                            title={`Anchor ${ref.anchorCode} - click to view in ledger`}
                          >
                            {ref.anchorCode}
                          </button>
                          <span className="text-[10px] font-mono uppercase font-semibold text-ink-muted">
                            CLAIM REFERENCE
                          </span>
                          {claim && <StatusDot status={claim.linkStatus} size="sm" />}
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          {/* Move to another section */}
                          <div className="relative inline-block">
                            <select
                              aria-label="Move reference to section"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onMoveReferenceToSection(section.id, e.target.value, ref.id);
                                }
                              }}
                              className="appearance-none bg-paper border border-rule hover:border-ink text-ink text-[10px] font-mono rounded-[2px] px-2 py-0.5 cursor-pointer"
                            >
                              <option value="">Move to...</option>
                              {allSections
                                .filter((s) => s.id !== section.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.title}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Open in workbench */}
                          {claim && onOpenWorkbenchForClaim && (
                            <button
                              onClick={() => onOpenWorkbenchForClaim(claim.id)}
                              className="p-1 hover:bg-paper rounded text-ink-muted hover:text-ink cursor-pointer"
                              title="Open claim in Workbench"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Remove from section */}
                          <button
                            onClick={() => onRemoveReference(section.id, ref.id)}
                            className="p-1 hover:bg-paper hover:text-missing rounded text-ink-muted cursor-pointer"
                            title="Remove reference from draft (does not delete claim from graph)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Claim Text */}
                      <p className="font-serif text-sm text-ink leading-relaxed font-medium">
                        {claim ? claim.text : `[Claim ${ref.targetId} not found]`}
                      </p>

                      {/* Version drift warning if applicable */}
                      {isStale && claim && (
                        <div className="flex items-center justify-between p-2 bg-paper border border-weak/60 rounded-[2px] text-xs font-mono">
                          <div className="flex items-center gap-1.5 text-weak font-medium">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Changed since added (placed v{placedVer}, graph is v{currentVer})
                            </span>
                          </div>
                          {onReviewDrift && (
                            <button
                              onClick={() => onReviewDrift(ref, claim)}
                              className="text-[11px] underline text-ink hover:text-ink-muted cursor-pointer"
                            >
                              Review drift
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else if (ref.targetType === 'evidence') {
                  const found = findEvidenceById(questions, ref.targetId);
                  const ev = found?.evidence;
                  const parentClaim = found?.parentClaim;

                  return (
                    <div
                      key={ref.id}
                      id={`draft-ref-card-${ref.id}`}
                      className="bg-surface border border-rule rounded-[2px] p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            id={`draft-anchor-btn-${ref.anchorCode}`}
                            onClick={() =>
                              onSelectAnchorInLedger(ref.anchorCode, ref.targetId, 'evidence')
                            }
                            className="px-1.5 py-0.5 rounded-[2px] bg-paper border border-rule font-mono text-[11px] font-bold text-ink hover:border-ink cursor-pointer"
                            title={`Anchor ${ref.anchorCode} - click to view in ledger`}
                          >
                            {ref.anchorCode}
                          </button>
                          <span className="text-[10px] font-mono uppercase font-semibold text-ink-muted">
                            FINDING
                          </span>
                          {ev && <StatusDot status={ev.linkStatus || 'holds'} size="sm" />}
                          {ev?.citation && (
                            <span className="text-[10px] font-mono text-ink-muted">
                              {ev.citation}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Move to another section */}
                          <div className="relative inline-block">
                            <select
                              aria-label="Move reference to section"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onMoveReferenceToSection(section.id, e.target.value, ref.id);
                                }
                              }}
                              className="appearance-none bg-paper border border-rule hover:border-ink text-ink text-[10px] font-mono rounded-[2px] px-2 py-0.5 cursor-pointer"
                            >
                              <option value="">Move to...</option>
                              {allSections
                                .filter((s) => s.id !== section.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.title}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {ev?.paperId && onOpenPaper && (
                            <button
                              onClick={() => onOpenPaper(ev.paperId!)}
                              className="p-1 hover:bg-paper rounded text-ink-muted hover:text-ink cursor-pointer"
                              title="Open source paper in reader"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onRemoveReference(section.id, ref.id)}
                            className="p-1 hover:bg-paper hover:text-missing rounded text-ink-muted cursor-pointer"
                            title="Remove reference from draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="font-serif text-sm text-ink leading-relaxed">
                        {ev ? ev.title : `[Evidence ${ref.targetId} not found]`}
                      </p>

                      {ev?.userReason ? (
                        <div className="text-[11px] font-mono text-ink-muted bg-paper p-1.5 rounded-[2px] border border-rule/50">
                          <span className="font-semibold text-ink-muted/70">Reason: </span>
                          <span>{ev.userReason}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-missing bg-paper p-1.5 rounded-[2px] border border-dashed border-missing/40">
                          Reason unwritten — cannot be checked.
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Quiet Prose-Writing Surface */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel mono className="text-ink">
              SECTION PROSE (USER-AUTHORED)
            </SectionLabel>
            <span className="text-[11px] font-sans text-ink-muted/80 italic">
              No AI writing or autocompletion
            </span>
          </div>

          <div className="relative flex gap-3">
            {/* Support Margin beside prose */}
            <div
              id="draft-support-margin"
              className="w-10 pt-3 flex flex-col items-center gap-2 select-none border-r border-rule/40 pr-2 shrink-0"
              title="Support anchors placed in this section"
            >
              {section.placedReferences?.map((ref) => (
                <button
                  key={ref.id}
                  onClick={() =>
                    onSelectAnchorInLedger(ref.anchorCode, ref.targetId, ref.targetType)
                  }
                  className="w-7 h-6 rounded-[2px] bg-surface hover:bg-paper border border-rule font-mono text-[10px] font-bold text-ink hover:border-ink cursor-pointer flex items-center justify-center transition-colors"
                  title={`Anchor ${ref.anchorCode} (${ref.targetType}) - click to inspect`}
                >
                  {ref.anchorCode}
                </button>
              ))}
              {section.placedArtifacts?.map((art) => (
                <button
                  key={art.id}
                  onClick={() =>
                    onSelectAnchorInLedger(art.anchorCode, art.artifactId, 'artifact')
                  }
                  className="w-7 h-6 rounded-[2px] bg-surface hover:bg-paper border border-rule font-mono text-[10px] font-bold text-ink hover:border-ink cursor-pointer flex items-center justify-center transition-colors"
                  title={`Anchor ${art.anchorCode} (${art.artifactType}) - click to inspect`}
                >
                  {art.anchorCode}
                </button>
              ))}
            </div>

            {/* Main Textarea for Prose */}
            <div className="flex-1">
              <textarea
                id="draft-section-prose-textarea"
                rows={10}
                value={section.prose}
                onChange={(e) => onUpdateSectionProse(section.id, e.target.value)}
                placeholder="Write the prose for this section. Support anchors appear in the margin as you place claims and evidence."
                className="w-full bg-paper border border-rule focus:border-ink rounded-[2px] p-4 font-serif text-[16px] text-ink leading-[1.7] focus:outline-none resize-y transition-colors min-h-[220px]"
              />
            </div>
          </div>
        </div>

        {/* Placed Figures & Tables as Visual Blocks */}
        <div className="flex flex-col gap-3 pt-4 border-t border-rule">
          <div className="flex items-center justify-between">
            <SectionLabel mono className="text-ink">
              PLACED FIGURES, TABLES & ARTIFACTS ({section.placedArtifacts?.length || 0})
            </SectionLabel>
            <span className="text-[11px] font-mono text-ink-muted">
              Artifacts placed from experiments
            </span>
          </div>

          {(!section.placedArtifacts || section.placedArtifacts.length === 0) ? (
            <div className="p-3 bg-surface/50 border border-dashed border-rule rounded-[2px] text-center text-xs font-sans text-ink-muted italic">
              No experiment artifacts are available or placed for the claims in this section.
            </div>
          ) : (
            <div className="space-y-4">
              {section.placedArtifacts.map((placed, pIdx) => {
                const found = findArtifactById(experiments, placed.artifactId);
                const art = found?.artifact;
                const exp = found?.experiment;

                const localLabel =
                  placed.artifactType === 'PLOT'
                    ? `Figure ${placed.localNumber}`
                    : placed.artifactType === 'TABLE'
                    ? `Table ${placed.localNumber}`
                    : `Note ${placed.localNumber}`;

                return (
                  <div
                    key={placed.id}
                    id={`draft-placed-artifact-${placed.id}`}
                    className="bg-surface border border-rule rounded-[2px] p-4 flex flex-col gap-3"
                  >
                    {/* Header: Local Label + Title + Controls */}
                    <div className="flex items-center justify-between gap-2 border-b border-rule/50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[2px] bg-ink text-paper font-mono text-[11px] font-semibold">
                          {localLabel}
                        </span>
                        <span className="font-sans text-xs font-semibold text-ink">
                          {art ? art.title : placed.artifactId}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onMoveArtifact(section.id, placed.id, 'up')}
                          disabled={pIdx === 0}
                          className="p-1 hover:bg-paper rounded text-ink-muted disabled:opacity-20 cursor-pointer"
                          title="Move figure/table up"
                        >
                          <MoveVertical className="w-3 h-3 rotate-180" />
                        </button>
                        <button
                          onClick={() => onMoveArtifact(section.id, placed.id, 'down')}
                          disabled={pIdx === section.placedArtifacts.length - 1}
                          className="p-1 hover:bg-paper rounded text-ink-muted disabled:opacity-20 cursor-pointer"
                          title="Move figure/table down"
                        >
                          <MoveVertical className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onRemoveArtifact(section.id, placed.id)}
                          className="p-1 hover:bg-paper hover:text-missing rounded text-ink-muted cursor-pointer"
                          title="Remove artifact from draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Render visual preview */}
                    {art && (
                      <div className="w-full">
                        {art.type === 'PLOT' && renderPlotBlock(art)}
                        {art.type === 'TABLE' && renderTableBlock(art)}
                        {art.type === 'NOTE' && renderNoteBlock(art)}
                      </div>
                    )}

                    {/* Metadata strip: Parent experiment & Claim */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-ink-muted">
                      {exp && <span>Experiment: {exp.name}</span>}
                      {art?.findingSummary && (
                        <>
                          <span className="text-rule">·</span>
                          <span className="text-ink">Observation: {art.findingSummary}</span>
                        </>
                      )}
                    </div>

                    {/* Required User-Written Caption Field */}
                    <div className="flex flex-col gap-1 pt-2 border-t border-rule/40">
                      <label
                        htmlFor={`caption-input-${placed.id}`}
                        className="text-[11px] font-mono font-medium text-ink flex items-center justify-between"
                      >
                        <span>User-Written Caption (Required)</span>
                        {!placed.caption?.trim() && (
                          <span className="text-[10px] text-missing font-mono font-semibold">
                            Caption missing
                          </span>
                        )}
                      </label>
                      <textarea
                        id={`caption-input-${placed.id}`}
                        rows={2}
                        value={placed.caption}
                        onChange={(e) =>
                          onUpdateArtifactCaption(section.id, placed.id, e.target.value)
                        }
                        placeholder={`Write the caption explaining what ${localLabel} shows...`}
                        className="w-full bg-paper border border-rule focus:border-ink rounded-[2px] p-2 font-serif text-xs text-ink focus:outline-none resize-y"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
