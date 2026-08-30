import React, { useState } from 'react';
import { DraftSection, DraftSubsection } from '../../types';
import { SectionAnalysis } from '../../utils/draftHelpers';
import { SectionLabel, Button } from '../ui/instrument';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  Check,
  X,
} from 'lucide-react';

export interface DraftOutlineProps {
  sections: DraftSection[];
  activeSectionId: string | null;
  sectionAnalyses: Record<string, SectionAnalysis>;
  onSelectSection: (sectionId: string) => void;
  onAddSection: () => void;
  onRenameSection: (sectionId: string, newTitle: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onReorderSections?: (draggedId: string, targetId: string) => void;
}

export function DraftOutline({
  sections,
  activeSectionId,
  sectionAnalyses,
  onSelectSection,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onMoveSection,
  onReorderSections,
}: DraftOutlineProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const startRename = (section: DraftSection) => {
    setEditingSectionId(section.id);
    setEditingTitle(section.title);
  };

  const saveRename = (sectionId: string) => {
    if (editingTitle.trim()) {
      onRenameSection(sectionId, editingTitle.trim());
    }
    setEditingSectionId(null);
    setEditingTitle('');
  };

  return (
    <aside
      id="draft-outline-column"
      aria-label="Manuscript Outline"
      className="w-full lg:w-[240px] xl:w-[260px] bg-surface border-r border-rule flex flex-col shrink-0 select-none overflow-hidden h-full"
    >
      {/* Column Header */}
      <div className="p-3 border-b border-rule flex items-center justify-between bg-surface shrink-0">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-ink-muted" />
          <SectionLabel mono className="text-ink">
            OUTLINE
          </SectionLabel>
        </div>
        <button
          id="draft-add-section-btn"
          onClick={onAddSection}
          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-paper hover:bg-rule/40 border border-rule text-ink cursor-pointer transition-colors"
          title="Add a new section to manuscript"
        >
          <Plus className="w-3 h-3" />
          <span>Section</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.length === 0 ? (
          <div className="p-4 text-center text-ink-muted text-xs font-sans italic">
            No sections yet. Add the first section and state what it must establish.
          </div>
        ) : (
          sections.map((section, index) => {
            const isActive = section.id === activeSectionId;
            const analysis = sectionAnalyses[section.id];
            const isEditing = editingSectionId === section.id;
            const isDeleting = confirmDeleteId === section.id;

            const claimCount = analysis?.linkedClaims.length || 0;
            const findingsCount = analysis?.placedEvidenceItems.length || 0;
            const artifactsCount = analysis?.placedArtifacts.length || 0;
            const openGapsCount = analysis?.gaps.length || 0;
            const isPurposeMissing = analysis?.isPurposeUnwritten ?? false;
            const hasDrift = analysis?.hasClaimDrift ?? false;

            return (
              <div
                key={section.id}
                id={`draft-outline-section-${section.id}`}
                draggable={!isEditing}
                onDragStart={(e) => {
                  setDraggedSectionId(section.id);
                  e.dataTransfer.setData('text/plain', section.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedSectionId && draggedSectionId !== section.id) {
                    onReorderSections?.(draggedSectionId, section.id);
                  }
                  setDraggedSectionId(null);
                }}
                className={`group relative rounded-[2px] border transition-all ${
                  isActive
                    ? 'bg-paper border-ink shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    : 'bg-surface hover:bg-paper/60 border-rule/70'
                }`}
              >
                {/* Main section row */}
                <div className="p-2 flex flex-col gap-1.5">
                  {/* Title or Inline Edit */}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        id={`draft-rename-input-${section.id}`}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(section.id);
                          if (e.key === 'Escape') setEditingSectionId(null);
                        }}
                        autoFocus
                        className="flex-1 bg-surface border border-ink text-xs px-1.5 py-0.5 rounded-[2px] font-sans text-ink focus:outline-none"
                      />
                      <button
                        onClick={() => saveRename(section.id)}
                        className="p-1 rounded-[2px] bg-ink text-paper hover:bg-ink/90 cursor-pointer"
                        title="Save section title"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="p-1 rounded-[2px] hover:bg-rule/40 text-ink-muted cursor-pointer"
                        title="Cancel rename"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1">
                      <button
                        id={`draft-select-section-${section.id}`}
                        onClick={() => onSelectSection(section.id)}
                        className="text-left font-sans text-xs font-semibold text-ink flex-1 truncate hover:underline cursor-pointer"
                        title={section.title}
                      >
                        {section.title}
                      </button>

                      {/* Section actions (hover or active) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Move Up */}
                        <button
                          id={`draft-move-up-${section.id}`}
                          onClick={() => onMoveSection(section.id, 'up')}
                          disabled={index === 0}
                          className="p-0.5 hover:bg-rule/30 rounded text-ink-muted disabled:opacity-20 cursor-pointer"
                          title="Move section up"
                          aria-label="Move section up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        {/* Move Down */}
                        <button
                          id={`draft-move-down-${section.id}`}
                          onClick={() => onMoveSection(section.id, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-0.5 hover:bg-rule/30 rounded text-ink-muted disabled:opacity-20 cursor-pointer"
                          title="Move section down"
                          aria-label="Move section down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {/* Rename */}
                        <button
                          id={`draft-rename-btn-${section.id}`}
                          onClick={() => startRename(section)}
                          className="p-0.5 hover:bg-rule/30 rounded text-ink-muted cursor-pointer"
                          title="Rename section"
                          aria-label="Rename section"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {/* Delete */}
                        <button
                          id={`draft-delete-btn-${section.id}`}
                          onClick={() => setConfirmDeleteId(section.id)}
                          className="p-0.5 hover:bg-rule/30 hover:text-missing rounded text-ink-muted cursor-pointer"
                          title="Delete section"
                          aria-label="Delete section"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirmation for Delete */}
                  {isDeleting && (
                    <div className="p-1.5 my-1 bg-surface border border-missing/40 rounded-[2px] flex flex-col gap-1">
                      <span className="text-[10px] font-sans text-missing font-medium">
                        Delete this section and references?
                      </span>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] px-1.5 py-0.5 text-ink-muted hover:text-ink cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onDeleteSection(section.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-missing text-white font-medium rounded-[2px] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Compact Derived Indicators (Neutral Typography) */}
                  <div
                    onClick={() => onSelectSection(section.id)}
                    className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-ink-muted/90 cursor-pointer"
                  >
                    <span>
                      {claimCount} {claimCount === 1 ? 'claim' : 'claims'}
                    </span>
                    <span className="text-rule">·</span>
                    <span>
                      {findingsCount + artifactsCount} placed
                    </span>

                    {/* Purpose unwritten badge */}
                    {isPurposeMissing && (
                      <span className="text-ink-muted bg-rule/30 px-1 rounded-[2px] text-[9px] font-mono font-medium">
                        Purpose unwritten
                      </span>
                    )}

                    {/* Claim drift badge */}
                    {hasDrift && (
                      <span className="text-weak bg-weak/10 border border-weak/30 px-1 rounded-[2px] text-[9px] font-mono font-medium inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Changed</span>
                      </span>
                    )}

                    {/* Open gaps count */}
                    {openGapsCount > 0 && (
                      <span className="text-ink-muted/80 ml-auto text-[9px] font-mono">
                        {openGapsCount} {openGapsCount === 1 ? 'gap' : 'gaps'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
