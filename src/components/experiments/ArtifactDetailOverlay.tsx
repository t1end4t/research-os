import React, { useState, useEffect, useRef } from 'react';
import {
  ArtifactItem,
  ExperimentGroup,
  LinkStatus,
} from '../../types';
import { ModelBlock, SectionLabel, UserText, StatusDot } from '../ui/instrument';
import {
  X,
  LineChart,
  FileSpreadsheet,
  StickyNote,
  User,
  AlertCircle,
  Check,
  FileCode,
  Calendar,
  Layers,
} from 'lucide-react';

export interface ArtifactDetailOverlayProps {
  artifact: ArtifactItem;
  experiment: ExperimentGroup;
  questionText?: string;
  claimText: string;
  claimStatus?: LinkStatus;
  onlyMine?: boolean;
  onClose: () => void;
  onSaveFinding: (findingText: string) => void;
}

export function ArtifactDetailOverlay({
  artifact,
  experiment,
  questionText,
  claimText,
  claimStatus = 'holds',
  onlyMine = false,
  onClose,
  onSaveFinding,
}: ArtifactDetailOverlayProps) {
  const [findingText, setFindingText] = useState(artifact.findingSummary || '');
  const [savedRecently, setSavedRecently] = useState(false);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const isDone = experiment.status === 'done';
  const hasObservation = Boolean(findingText.trim());
  const canSave = !isDone || hasObservation;

  // Track previous focus and handle Escape
  useEffect(() => {
    triggerElementRef.current = document.activeElement as HTMLElement;
    textareaRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerElementRef.current?.focus();
    };
  }, [onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    onSaveFinding(findingText.trim());
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2500);
  };

  // High-res Plot rendering
  const renderLargePlot = () => {
    const points = artifact.plotPoints || [
      { x: 4, y: 14.2, y2: 18.5, label: '4x' },
      { x: 8, y: 9.8, y2: 13.1, label: '8x' },
      { x: 16, y: 5.4, y2: 8.9, label: '16x' },
      { x: 32, y: 3.1, y2: 5.2, label: '32x' },
      { x: 64, y: 2.2, y2: 3.7, label: '64x' },
    ];

    const width = 600;
    const height = 300;
    const pad = 48;

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
      <div className="w-full flex flex-col items-center justify-center p-4 bg-surface rounded-[2px] border border-rule">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[320px]">
          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            className="fill-ink-muted text-[11px] font-mono"
          >
            {artifact.plotLabels?.x || 'Parameter Sweep Axis'}
          </text>
          <text
            x={16}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${height / 2})`}
            className="fill-ink-muted text-[11px] font-mono"
          >
            {artifact.plotLabels?.y || 'Metric Value'}
          </text>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
            const yVal = maxY * step;
            const yPos = toSvgY(yVal);
            return (
              <g key={idx}>
                <line
                  x1={pad}
                  y1={yPos}
                  x2={width - pad}
                  y2={yPos}
                  stroke="currentColor"
                  className="text-rule/60"
                  strokeDasharray={step === 0 ? undefined : '3,3'}
                  strokeWidth="1"
                />
                <text
                  x={pad - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-ink-muted text-[9px] font-mono"
                >
                  {yVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X ticks */}
          {points.map((p, idx) => {
            const xPos = toSvgX(p.x);
            return (
              <g key={idx}>
                <line
                  x1={xPos}
                  y1={height - pad}
                  x2={xPos}
                  y2={height - pad + 5}
                  stroke="currentColor"
                  className="text-rule"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={height - pad + 16}
                  textAnchor="middle"
                  className="fill-ink-muted text-[9px] font-mono"
                >
                  {p.label || p.x}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <path
            d={linePath1}
            fill="none"
            stroke="currentColor"
            className="text-ink"
            strokeWidth={2.2}
          />
          <path
            d={linePath2}
            fill="none"
            stroke="currentColor"
            className="text-ink-muted"
            strokeWidth={1.8}
            strokeDasharray="4,3"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y)}
                r={4}
                className="fill-ink hover:r-5 cursor-pointer transition-all"
              />
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y2 || p.y)}
                r={3.5}
                className="fill-ink-muted"
              />
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="w-full flex items-center justify-center gap-6 mt-3 pt-2 border-t border-rule/50 text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-ink" />
            <span className="text-ink font-semibold">Primary Intervention Run</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-ink-muted border-t border-dashed" />
            <span>Baseline Comparison</span>
          </div>
        </div>
      </div>
    );
  };

  // Full Table Rendering
  const renderLargeTable = () => {
    const headers = artifact.tableHeaders || ['Property', 'Model Basis', 'Physiology Target', 'Verdict'];
    const rows = artifact.tableRows || [
      ['Aspect Ratio', '1.82 ± 0.31', '1.95 ± 0.44', 'Pass'],
      ['Orient. Bandwidth', '38.4°', '41.2°', 'Pass'],
      ['Spatial Freq. Peak', '1.85 cpd', '2.10 cpd', 'Partial'],
      ['High-Freq Cutoff', '3.40 cpd', '5.80 cpd', 'Mismatch'],
      ['Bandwidth Q-factor', '1.42', '1.50', 'Pass'],
      ['Orthogonality Index', '0.88', '0.92', 'Pass'],
    ];

    return (
      <div className="w-full bg-surface rounded-[2px] border border-rule overflow-hidden text-[12px] font-mono">
        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-paper border-b border-rule">
              <tr className="text-ink-muted text-[11px]">
                {headers.map((h, i) => (
                  <th key={i} className="py-2 px-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/50 text-ink">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-paper/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Full Note Rendering
  const renderLargeNote = () => {
    const text =
      artifact.noteContent ||
      'Trained using conjugate gradient descent over 100,000 16x16 natural image patches drawn from standard luminance statistics. Sparsity penalty lambda was swept from 0.05 to 0.40. Convergence stabilized at step 62,000 without basis dead-units.';

    return (
      <div className="w-full p-4 bg-surface rounded-[2px] border border-rule text-ink leading-relaxed space-y-3 font-sans text-[13px]">
        <div className="flex items-center gap-2 pb-2 border-b border-rule/50 text-[11px] font-mono text-ink-muted">
          <FileCode className="w-3.5 h-3.5" />
          <span>Research Log Excerpt</span>
        </div>
        <p className="whitespace-pre-line text-ink leading-relaxed font-normal">
          {text}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div className="bg-paper border border-rule rounded-[2px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="h-11 px-4 border-b border-rule flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink shrink-0">
              ARTIFACT INSPECTION
            </span>
            <span className="text-rule font-mono text-[10px]">/</span>
            <span className="font-mono text-[11px] text-ink-muted truncate">
              {artifact.title}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close overlay"
            className="p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] border border-transparent hover:border-rule transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two-Column Layout */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Full Artifact Preview (Cols 1-7) */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-ink-muted">
                  {artifact.type === 'PLOT' && <LineChart className="w-3.5 h-3.5 text-ink-muted" />}
                  {artifact.type === 'TABLE' && <FileSpreadsheet className="w-3.5 h-3.5 text-ink-muted" />}
                  {artifact.type === 'NOTE' && <StickyNote className="w-3.5 h-3.5 text-ink-muted" />}
                  <span>{artifact.type}</span>
                </span>
                {artifact.filename && (
                  <span className="text-ink-muted text-[11px] font-mono">
                    • {artifact.filename}
                  </span>
                )}
              </div>
              <h2
                id="artifact-overlay-title"
                className="font-sans text-[16px] font-bold text-ink"
              >
                {artifact.title}
              </h2>
              <p className="text-[12px] font-sans text-ink-muted mt-0.5">
                {artifact.caption}
              </p>
            </div>

            {/* Primary Artifact Rendering */}
            <div className="py-1">
              {artifact.type === 'PLOT' && renderLargePlot()}
              {artifact.type === 'TABLE' && renderLargeTable()}
              {artifact.type === 'NOTE' && renderLargeNote()}
            </div>

            {/* Metadata Footer */}
            <div className="p-2.5 bg-surface border border-rule rounded-[2px] flex items-center justify-between text-[11px] font-mono text-ink-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Produced: {artifact.date}</span>
              </div>
              <div>
                <span>ID: {artifact.id}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Reasoning Context & "What did this show?" (Cols 8-12) */}
          <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Context Block */}
              <div className="p-3.5 bg-surface border border-rule rounded-[2px] space-y-2.5">
                {questionText && (
                  <div className="space-y-0.5">
                    <SectionLabel>Parent Question</SectionLabel>
                    <p className="font-serif text-[13px] text-ink-muted leading-snug">
                      {questionText}
                    </p>
                  </div>
                )}

                <div className="space-y-0.5 pt-2 border-t border-rule/50">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Tested Claim</SectionLabel>
                    <StatusDot status={claimStatus} />
                  </div>
                  <UserText size="sm" className="font-serif text-ink leading-snug font-medium">
                    {claimText}
                  </UserText>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-rule/50">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Experiment</SectionLabel>
                    <span className="font-mono text-[10px] text-ink-muted uppercase">
                      {experiment.status}
                    </span>
                  </div>
                  <p className="font-sans text-[12px] font-semibold text-ink leading-snug">
                    {experiment.name}
                  </p>
                </div>

                {experiment.targetStatement && (
                  <div className="space-y-0.5 pt-2 border-t border-rule/50">
                    <SectionLabel>Target Statement</SectionLabel>
                    <p className="font-serif text-[12px] text-ink italic leading-snug">
                      "{experiment.targetStatement}"
                    </p>
                  </div>
                )}
              </div>

              {/* Target Check Result (if available and not onlyMine) */}
              {!onlyMine && experiment.checkResult && (
                <ModelBlock
                  modelId={experiment.checkResult.modelId || 'cx/gpt-5.6-sol'}
                  badge="AI EXAMINER TARGET VERDICT"
                >
                  <p className="text-[12px] text-ink leading-relaxed">
                    {experiment.checkResult.finding}
                  </p>
                </ModelBlock>
              )}

              {/* Explicit Target Mismatch Highlight if present */}
              {experiment.targetMismatchNote && !onlyMine && (
                <div className="p-3 bg-missing/10 border-l-4 border-l-missing border border-rule/60 rounded-[2px] text-missing space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Target Mismatch</span>
                  </div>
                  <p className="font-sans text-[12px] text-ink leading-snug">
                    {experiment.targetMismatchNote}
                  </p>
                </div>
              )}

              {/* User Field: What did this show? */}
              <form onSubmit={handleSave} className="space-y-2 pt-2 border-t border-rule">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="what-did-this-show-textarea"
                    className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-ink-muted" />
                    <span>What did this show?</span>
                  </label>

                  <span
                    className={`font-mono text-[10px] ${
                      isDone
                        ? 'text-missing font-medium'
                        : 'text-ink-muted italic'
                    }`}
                  >
                    {isDone ? 'Required (completed)' : 'Optional until done'}
                  </span>
                </div>

                <textarea
                  id="what-did-this-show-textarea"
                  ref={textareaRef}
                  value={findingText}
                  onChange={(e) => setFindingText(e.target.value)}
                  placeholder="Record your observation."
                  rows={4}
                  className="w-full p-2.5 bg-paper border border-rule focus:border-ink rounded-[2px] font-serif text-[13px] text-ink placeholder:text-ink-muted/60 focus:outline-none leading-relaxed resize-none transition-colors"
                />

                {/* Validation Note if disabled */}
                {isDone && !hasObservation && (
                  <p className="text-[11px] font-sans text-missing flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Observation required for completed experiments before saving.</span>
                  </p>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-[12px] font-sans text-ink-muted hover:text-ink hover:bg-surface rounded-[2px] border border-transparent hover:border-rule transition-colors cursor-pointer"
                  >
                    Close (Esc)
                  </button>

                  <div className="flex items-center gap-2">
                    {savedRecently && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-holds">
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={!canSave}
                      className={`px-3.5 py-1.5 text-[12px] font-sans font-medium rounded-[2px] border transition-all cursor-pointer ${
                        canSave
                          ? 'bg-ink text-paper border-ink hover:bg-ink/90 active:scale-[0.99]'
                          : 'bg-surface text-ink-muted/50 border-rule cursor-not-allowed'
                      }`}
                    >
                      Save Observation
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
