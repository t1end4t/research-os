import React from 'react';
import {
  ArtifactItem,
  ExperimentStatus,
  LinkStatus,
} from '../../types';
import { setResearchItemDragData } from '../../researchItemDrag';
import {
  LineChart,
  FileSpreadsheet,
  StickyNote,
  GripVertical,
  User,
  AlertCircle,
  ExternalLink,
  Link2,
} from 'lucide-react';

export interface ArtifactCardProps {
  key?: React.Key;
  artifact: ArtifactItem;
  experimentStatus: ExperimentStatus;
  onlyMine?: boolean;
  onClick: () => void;
  onLinkClick: (e: React.MouseEvent) => void;
}

export function ArtifactCard({
  artifact,
  experimentStatus,
  onlyMine = false,
  onClick,
  onLinkClick,
}: ArtifactCardProps): React.ReactElement {
  const hasObservation = Boolean(artifact.findingSummary && artifact.findingSummary.trim());
  const isDone = experimentStatus === 'done';
  const isMissingRequiredObservation = isDone && !hasObservation;

  // Render Vector Plot preview
  const renderPlotPreview = () => {
    const points = artifact.plotPoints || [
      { x: 4, y: 14.2, y2: 18.5 },
      { x: 8, y: 9.8, y2: 13.1 },
      { x: 16, y: 5.4, y2: 8.9 },
      { x: 32, y: 3.1, y2: 5.2 },
      { x: 64, y: 2.2, y2: 3.7 },
    ];

    const width = 240;
    const height = 120;
    const pad = 16;

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
      <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-paper/60 dark:bg-[#15181a] rounded-[2px] border border-rule/50">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[105px]">
          {/* Subtle Gridlines */}
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
            y1={toSvgY(maxY / 2)}
            x2={width - pad}
            y2={toSvgY(maxY / 2)}
            stroke="currentColor"
            className="text-rule/60"
            strokeDasharray="2,2"
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

          {/* Primary Curve */}
          <path
            d={linePath1}
            fill="none"
            stroke="currentColor"
            className="text-ink"
            strokeWidth={1.75}
          />
          {/* Secondary Curve */}
          <path
            d={linePath2}
            fill="none"
            stroke="currentColor"
            className="text-ink-muted"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y)}
                r={2.5}
                className="fill-ink"
              />
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y2 || p.y)}
                r={2}
                className="fill-ink-muted"
              />
            </g>
          ))}
        </svg>

        {/* Labels & Legend */}
        <div className="w-full flex items-center justify-between text-[9px] font-mono text-ink-muted px-1 mt-1">
          <span className="truncate">{artifact.plotLabels?.x || 'Param'}</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5">
              <span className="w-2 h-[1px] bg-ink" />
              <span>Series 1</span>
            </span>
            <span className="inline-flex items-center gap-0.5">
              <span className="w-2 h-[1px] bg-ink-muted border-t border-dashed" />
              <span>Series 2</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Table Preview
  const renderTablePreview = () => {
    const headers = artifact.tableHeaders || ['Property', 'Model', 'Target', 'Verdict'];
    const rows = artifact.tableRows || [
      ['Aspect Ratio', '1.82', '1.95', 'Pass'],
      ['Orient. Bandwidth', '38.4°', '41.2°', 'Pass'],
      ['Spatial Freq.', '1.85', '2.10', 'Partial'],
      ['Cutoff', '3.40', '5.80', 'Mismatch'],
    ];

    const displayRows = rows.slice(0, 3);

    return (
      <div className="w-full flex flex-col justify-between text-[10px] p-2 bg-paper/60 dark:bg-[#15181a] rounded-[2px] border border-rule/50 font-mono overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule text-ink-muted text-[9px]">
              {headers.map((h, i) => (
                <th key={i} className="pb-1 font-semibold pr-2 truncate">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/40 text-ink">
            {displayRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-surface transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-0.5 pr-2 truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {artifact.totalRows && artifact.totalRows > 3 && (
          <div className="pt-1 text-center text-[9px] text-ink-muted italic border-t border-rule/30 mt-1">
            +{artifact.totalRows - 3} more rows
          </div>
        )}
      </div>
    );
  };

  // Render Note Preview
  const renderNotePreview = () => {
    const text =
      artifact.noteContent ||
      'Feature activations converge toward near-orthogonal geometry without substantial weight interference.';

    return (
      <div className="w-full p-2.5 bg-paper/60 dark:bg-[#15181a] rounded-[2px] border border-rule/50 text-[11px] font-sans text-ink leading-relaxed">
        <p className="line-clamp-4 italic text-ink-muted">
          "{text}"
        </p>
      </div>
    );
  };

  return (
    <div
      id={`artifact-card-${artifact.id}`}
      tabIndex={0}
      role="button"
      aria-label={`Artifact: ${artifact.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      draggable
      onDragStart={(e) => {
        setResearchItemDragData(e.dataTransfer, {
          id: artifact.id,
          type: 'EXPERIMENT',
          label: `${artifact.type}: ${artifact.title || artifact.caption}`,
        });
      }}
      onClick={onClick}
      className={`group relative bg-surface border rounded-[2px] p-3 flex flex-col justify-between transition-all duration-150 cursor-pointer select-none min-h-[250px] ${
        isMissingRequiredObservation
          ? 'border-missing/80 hover:border-missing'
          : 'border-rule hover:border-ink-muted'
      }`}
    >
      {/* Top Header: Drag handle + Type label + Filename + Actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            title="Drag artifact to Assistant panel"
            className="opacity-30 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-ink-muted shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-[0.06em] text-ink-muted shrink-0">
            {artifact.type === 'PLOT' && <LineChart className="w-3 h-3 text-ink-muted" />}
            {artifact.type === 'TABLE' && <FileSpreadsheet className="w-3 h-3 text-ink-muted" />}
            {artifact.type === 'NOTE' && <StickyNote className="w-3 h-3 text-ink-muted" />}
            <span>{artifact.type}</span>
          </span>

          {artifact.filename && (
            <span className="font-mono text-[10px] text-ink-muted/80 truncate max-w-[110px]" title={artifact.filename}>
              • {artifact.filename}
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity shrink-0"
        >
          <button
            onClick={onClick}
            className="text-[10px] font-sans font-medium text-ink hover:underline cursor-pointer flex items-center gap-0.5"
            title="Open artifact overlay"
          >
            <span>Inspect</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          <span className="text-rule">|</span>
          <button
            onClick={onLinkClick}
            className="text-[10px] font-sans font-medium text-ink hover:underline cursor-pointer flex items-center gap-0.5"
            title="Link artifact to a claim"
          >
            <Link2 className="w-2.5 h-2.5" />
            <span>Link</span>
          </button>
        </div>
      </div>

      {/* Artifact Title */}
      <div className="mb-1.5">
        <h4 className="font-sans text-[12px] font-semibold text-ink leading-snug line-clamp-1">
          {artifact.title}
        </h4>
      </div>

      {/* Body Visual Preview */}
      <div className="flex-1 flex flex-col justify-center my-1 overflow-hidden">
        {artifact.type === 'PLOT' && renderPlotPreview()}
        {artifact.type === 'TABLE' && renderTablePreview()}
        {artifact.type === 'NOTE' && renderNotePreview()}
      </div>

      {/* Caption & Metadata */}
      <div className="pt-2 border-t border-rule/60 space-y-1.5 mt-2">
        <p className="text-[11px] font-sans text-ink-muted leading-tight line-clamp-1" title={artifact.caption}>
          {artifact.caption}
        </p>

        {/* Authorship & Observation Status */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-ink-muted/80">{artifact.date}</span>

          {hasObservation ? (
            <span
              className="inline-flex items-center gap-1 text-ink font-sans font-medium"
              title={`User observation: ${artifact.findingSummary}`}
            >
              <User className="w-3 h-3 text-ink-muted" />
              <span className="text-[10px]">Observation recorded</span>
            </span>
          ) : isMissingRequiredObservation ? (
            <span
              className="inline-flex items-center gap-1 text-missing font-sans font-medium"
              title="Required observation missing for completed experiment"
            >
              <AlertCircle className="w-3 h-3 text-missing" />
              <span className="text-[10px]">Missing result</span>
            </span>
          ) : (
            <span className="text-ink-muted text-[10px] font-sans italic">
              Observation pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
