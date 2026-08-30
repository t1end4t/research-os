import React, { useState, useEffect, useRef } from 'react';
import { ArtifactType, ArtifactItem } from '../../types';
import { X, LineChart, FileSpreadsheet, StickyNote, AlertCircle } from 'lucide-react';

export interface AddArtifactModalProps {
  experimentId: string;
  claimId: string;
  claimText: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newArtifact: ArtifactItem) => void;
}

export function AddArtifactModal({
  experimentId,
  claimId,
  claimText,
  isOpen,
  onClose,
  onAdd,
}: AddArtifactModalProps) {
  const [type, setType] = useState<ArtifactType>('PLOT');
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [caption, setCaption] = useState('');
  const [findingSummary, setFindingSummary] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setFilename('');
      setCaption('');
      setFindingSummary('');
      setNoteContent('');
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newArtifact: ArtifactItem = {
      id: `art-${Date.now()}`,
      type,
      title: title.trim(),
      filename: filename.trim() || undefined,
      caption: caption.trim() || `Generated output artifact for ${title.trim()}`,
      date: 'Just now',
      claimId,
      claimText,
      experimentId,
      findingSummary: findingSummary.trim() || undefined,
      findingAuthor: findingSummary.trim() ? 'user' : undefined,
      noteContent: type === 'NOTE' ? noteContent.trim() : undefined,
      plotPoints:
        type === 'PLOT'
          ? [
              { x: 1, y: 10, y2: 12 },
              { x: 2, y: 25, y2: 30 },
              { x: 4, y: 45, y2: 48 },
              { x: 8, y: 35, y2: 40 },
            ]
          : undefined,
      plotLabels:
        type === 'PLOT' ? { x: 'Parameter Sweep', y: 'Measured Value' } : undefined,
      tableHeaders:
        type === 'TABLE' ? ['Metric', 'Recorded', 'Expected', 'Status'] : undefined,
      tableRows:
        type === 'TABLE'
          ? [
              ['Metric A', '0.84', '0.90', 'Pass'],
              ['Metric B', '12.4', '14.0', 'Pass'],
              ['Metric C', '1.20', '2.50', 'Partial'],
            ]
          : undefined,
    };

    onAdd(newArtifact);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[1px] animate-in fade-in duration-150"
    >
      <div className="bg-paper border border-rule rounded-[2px] shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-10 px-4 border-b border-rule flex items-center justify-between bg-surface">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
            ADD ARTIFACT
          </span>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Artifact Type Selector */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] font-bold uppercase text-ink-muted">
              Artifact Kind
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('PLOT')}
                className={`py-2 px-3 flex items-center justify-center gap-2 rounded-[2px] border font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                  type === 'PLOT'
                    ? 'bg-ink text-paper border-ink font-semibold'
                    : 'bg-surface text-ink border-rule hover:border-ink-muted'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Plot</span>
              </button>

              <button
                type="button"
                onClick={() => setType('TABLE')}
                className={`py-2 px-3 flex items-center justify-center gap-2 rounded-[2px] border font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                  type === 'TABLE'
                    ? 'bg-ink text-paper border-ink font-semibold'
                    : 'bg-surface text-ink border-rule hover:border-ink-muted'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setType('NOTE')}
                className={`py-2 px-3 flex items-center justify-center gap-2 rounded-[2px] border font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                  type === 'NOTE'
                    ? 'bg-ink text-paper border-ink font-semibold'
                    : 'bg-surface text-ink border-rule hover:border-ink-muted'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Note</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] font-bold uppercase text-ink-muted">
              Artifact Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Learned Basis Functions vs V1 Simple Cells"
              className="w-full px-3 py-1.5 bg-surface border border-rule focus:border-ink rounded-[2px] font-sans text-[13px] text-ink focus:outline-none"
            />
          </div>

          {/* Filename */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] font-bold uppercase text-ink-muted">
              Filename / Source Path
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. learned_basis_functions.png"
              className="w-full px-3 py-1.5 bg-surface border border-rule focus:border-ink rounded-[2px] font-mono text-[12px] text-ink focus:outline-none"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] font-bold uppercase text-ink-muted">
              Short Description / Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. 2D spatial profiles and orientation tuning curves"
              className="w-full px-3 py-1.5 bg-surface border border-rule focus:border-ink rounded-[2px] font-sans text-[12px] text-ink focus:outline-none"
            />
          </div>

          {/* Note content if type is NOTE */}
          {type === 'NOTE' && (
            <div className="space-y-1">
              <label className="font-mono text-[10px] font-bold uppercase text-ink-muted">
                Note Content
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log observation notes, hyperparameter settings, or convergence findings..."
                rows={3}
                className="w-full p-2 bg-surface border border-rule focus:border-ink rounded-[2px] font-sans text-[12px] text-ink focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Initial observation */}
          <div className="space-y-1 pt-1 border-t border-rule/60">
            <label className="font-mono text-[10px] font-bold uppercase text-ink-muted flex items-center justify-between">
              <span>What did this show? (Optional for now)</span>
            </label>
            <textarea
              value={findingSummary}
              onChange={(e) => setFindingSummary(e.target.value)}
              placeholder="Record your observation if ready..."
              rows={2}
              className="w-full p-2 bg-surface border border-rule focus:border-ink rounded-[2px] font-serif text-[12px] text-ink focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-sans text-ink-muted hover:text-ink rounded-[2px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 text-[12px] font-sans font-medium bg-ink text-paper rounded-[2px] hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Add Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
