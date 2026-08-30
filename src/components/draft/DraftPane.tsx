import React, { useState, useMemo } from 'react';
import {
  DraftManuscript,
  DraftSection,
  DraftPlacedReference,
  DraftPlacedArtifact,
  QuestionNode,
  ClaimNode,
  EvidenceItem,
  ExperimentGroup,
  ArtifactItem,
  AppTab,
} from '../../types';
import {
  analyzeManuscript,
  findClaimById,
  getNextAnchorCode,
} from '../../utils/draftHelpers';
import { DraftHeader } from './DraftHeader';
import { DraftOutline } from './DraftOutline';
import { DraftSectionEditor } from './DraftSectionEditor';
import { DraftSupportLedger, LedgerMode } from './DraftSupportLedger';
import { DraftDriftModal } from './DraftDriftModal';
import { Layers, Bookmark, AlertCircle, X, Menu } from 'lucide-react';
import { SurfaceNote } from '../../guidance';

export interface DraftPaneProps {
  manuscript: DraftManuscript;
  onUpdateManuscript: (updated: DraftManuscript) => void;
  questions: QuestionNode[];
  experiments: ExperimentGroup[];
  onNavigateToTab?: (tab: AppTab, contextId?: string) => void;
  onOpenPaper?: (paperId: string) => void;
}

export function DraftPane({
  manuscript,
  onUpdateManuscript,
  questions,
  experiments,
  onNavigateToTab,
  onOpenPaper,
}: DraftPaneProps) {
  // Active Section Selection
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    return manuscript.sections[0]?.id || 'sec-1';
  });

  // Ledger Mode state
  const [ledgerMode, setLedgerMode] = useState<LedgerMode>('claims');

  // Mobile Drawer toggles
  const [isOutlineDrawerOpen, setIsOutlineDrawerOpen] = useState(false);
  const [isLedgerDrawerOpen, setIsLedgerDrawerOpen] = useState(false);

  // Drift Modal state
  const [driftModalState, setDriftModalState] = useState<{
    reference: DraftPlacedReference;
    claim: ClaimNode;
  } | null>(null);

  // Compute Manuscript Analysis and Gaps
  const analysis = useMemo(() => {
    return analyzeManuscript(manuscript, questions, experiments);
  }, [manuscript, questions, experiments]);

  const activeSection = useMemo(() => {
    return (
      manuscript.sections.find((s) => s.id === activeSectionId) ||
      manuscript.sections[0] ||
      null
    );
  }, [manuscript.sections, activeSectionId]);

  const activeSectionAnalysis = activeSection
    ? analysis.sectionAnalyses[activeSection.id]
    : undefined;

  // Header Title Update
  const handleUpdateManuscriptTitle = (newTitle: string) => {
    onUpdateManuscript({
      ...manuscript,
      title: newTitle,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Section Add
  const handleAddSection = () => {
    const newIndex = manuscript.sections.length + 1;
    const newSection: DraftSection = {
      id: `sec-${Date.now()}`,
      title: `${newIndex}. New Section`,
      purpose: '',
      prose: '',
      placedReferences: [],
      placedArtifacts: [],
    };
    onUpdateManuscript({
      ...manuscript,
      sections: [...manuscript.sections, newSection],
      lastEditedTimestamp: Date.now(),
    });
    setActiveSectionId(newSection.id);
  };

  // Section Rename
  const handleRenameSection = (sectionId: string, newTitle: string) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId ? { ...s, title: newTitle } : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Section Delete
  const handleDeleteSection = (sectionId: string) => {
    const filtered = manuscript.sections.filter((s) => s.id !== sectionId);
    onUpdateManuscript({
      ...manuscript,
      sections: filtered,
      lastEditedTimestamp: Date.now(),
    });
    if (activeSectionId === sectionId) {
      setActiveSectionId(filtered[0]?.id || '');
    }
  };

  // Section Move
  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = manuscript.sections.findIndex((s) => s.id === sectionId);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === manuscript.sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...manuscript.sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    onUpdateManuscript({
      ...manuscript,
      sections: reordered,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Reorder Sections Drag & Drop
  const handleReorderSections = (draggedId: string, targetId: string) => {
    const fromIndex = manuscript.sections.findIndex((s) => s.id === draggedId);
    const toIndex = manuscript.sections.findIndex((s) => s.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const reordered = [...manuscript.sections];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    onUpdateManuscript({
      ...manuscript,
      sections: reordered,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Update Section Title inline
  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId ? { ...s, title } : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Update Section Purpose
  const handleUpdateSectionPurpose = (sectionId: string, purpose: string) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId ? { ...s, purpose } : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Update Section Prose
  const handleUpdateSectionProse = (sectionId: string, prose: string) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId ? { ...s, prose } : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Add Reference to Section (Claim or Evidence)
  const handleAddReference = (
    sectionId: string,
    targetType: 'claim' | 'evidence',
    targetId: string,
    version?: number | string
  ) => {
    const sec = manuscript.sections.find((s) => s.id === sectionId);
    if (!sec) return;

    // Check if already placed in this section
    const alreadyPlaced = sec.placedReferences?.some(
      (r) => r.targetType === targetType && r.targetId === targetId
    );
    if (alreadyPlaced) return;

    const anchorCode = getNextAnchorCode(
      targetType,
      sec.placedReferences || [],
      sec.placedArtifacts || []
    );

    const newRef: DraftPlacedReference = {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetType,
      targetId,
      placedVersion: version,
      anchorCode,
      placedTimestamp: Date.now(),
    };

    const updated = manuscript.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            placedReferences: [...(s.placedReferences || []), newRef],
          }
        : s
    );

    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Remove Reference from Section
  const handleRemoveReference = (sectionId: string, refId: string) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            placedReferences: s.placedReferences.filter((r) => r.id !== refId),
          }
        : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Move Reference to another Section
  const handleMoveReferenceToSection = (
    sourceSectionId: string,
    targetSectionId: string,
    refId: string
  ) => {
    const sourceSec = manuscript.sections.find((s) => s.id === sourceSectionId);
    const targetSec = manuscript.sections.find((s) => s.id === targetSectionId);
    if (!sourceSec || !targetSec) return;

    const ref = sourceSec.placedReferences?.find((r) => r.id === refId);
    if (!ref) return;

    const newAnchorCode = getNextAnchorCode(
      ref.targetType,
      targetSec.placedReferences || [],
      targetSec.placedArtifacts || []
    );

    const updatedRef = { ...ref, anchorCode: newAnchorCode };

    const updated = manuscript.sections.map((s) => {
      if (s.id === sourceSectionId) {
        return {
          ...s,
          placedReferences: s.placedReferences.filter((r) => r.id !== refId),
        };
      }
      if (s.id === targetSectionId) {
        return {
          ...s,
          placedReferences: [...(s.placedReferences || []), updatedRef],
        };
      }
      return s;
    });

    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Add Artifact to Section
  const handleAddArtifact = (
    sectionId: string,
    artifactId: string,
    artifactType: 'PLOT' | 'TABLE' | 'NOTE'
  ) => {
    const sec = manuscript.sections.find((s) => s.id === sectionId);
    if (!sec) return;

    const alreadyPlaced = sec.placedArtifacts?.some((a) => a.artifactId === artifactId);
    if (alreadyPlaced) return;

    const existingOfType = (sec.placedArtifacts || []).filter(
      (a) => a.artifactType === artifactType
    );
    const localNumber = existingOfType.length + 1;

    const anchorCode = getNextAnchorCode(
      artifactType,
      sec.placedReferences || [],
      sec.placedArtifacts || []
    );

    const newArtifact: DraftPlacedArtifact = {
      id: `art-placed-${Date.now()}`,
      artifactId,
      artifactType,
      localNumber,
      caption: '', // Required user caption, empty by default to prompt user
      anchorCode,
    };

    const updated = manuscript.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            placedArtifacts: [...(s.placedArtifacts || []), newArtifact],
          }
        : s
    );

    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Remove Artifact from Section
  const handleRemoveArtifact = (sectionId: string, placedId: string) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            placedArtifacts: s.placedArtifacts.filter((a) => a.id !== placedId),
          }
        : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Update Artifact Caption
  const handleUpdateArtifactCaption = (
    sectionId: string,
    placedId: string,
    caption: string
  ) => {
    const updated = manuscript.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            placedArtifacts: s.placedArtifacts.map((a) =>
              a.id === placedId ? { ...a, caption } : a
            ),
          }
        : s
    );
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Move Artifact up/down in section
  const handleMoveArtifact = (
    sectionId: string,
    placedId: string,
    direction: 'up' | 'down'
  ) => {
    const sec = manuscript.sections.find((s) => s.id === sectionId);
    if (!sec || !sec.placedArtifacts) return;

    const index = sec.placedArtifacts.findIndex((a) => a.id === placedId);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sec.placedArtifacts.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...sec.placedArtifacts];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = manuscript.sections.map((s) =>
      s.id === sectionId ? { ...s, placedArtifacts: reordered } : s
    );

    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  // Select Anchor from Margin or Card -> switch ledger mode and focus
  const handleSelectAnchorInLedger = (
    anchorCode: string,
    targetId: string,
    targetType: 'claim' | 'evidence' | 'artifact'
  ) => {
    if (targetType === 'claim') setLedgerMode('claims');
    else if (targetType === 'evidence') setLedgerMode('findings');
    else if (targetType === 'artifact') setLedgerMode('artifacts');
  };

  // Standing Strip click routing
  const handleSelectStandingFilter = (
    filterType: 'tentative' | 'contrary' | 'unwritten' | 'gaps'
  ) => {
    if (filterType === 'tentative') setLedgerMode('claims');
    else if (filterType === 'contrary') setLedgerMode('findings');
    else if (filterType === 'unwritten') setLedgerMode('gaps');
    else if (filterType === 'gaps') setLedgerMode('gaps');
  };

  // Drift resolution: update reference to current version
  const handleUseCurrentVersion = (refId: string, currentVersion: number) => {
    const updated = manuscript.sections.map((s) => ({
      ...s,
      placedReferences: s.placedReferences.map((r) =>
        r.id === refId ? { ...r, placedVersion: currentVersion } : r
      ),
    }));
    onUpdateManuscript({
      ...manuscript,
      sections: updated,
      lastEditedTimestamp: Date.now(),
    });
  };

  return (
    <div
      id="draft-surface-container"
      className="flex-1 flex flex-col h-full bg-paper overflow-hidden select-none"
    >
      {/* Draft Header */}
      <DraftHeader
        manuscriptTitle={manuscript.title}
        onUpdateManuscriptTitle={handleUpdateManuscriptTitle}
        standingCounts={analysis.standingCounts}
        onSelectStandingFilter={handleSelectStandingFilter}
      />

      {/* Dismissible Surface Purpose Note */}
      <SurfaceNote surfaceId="draft" />

      {/* Mobile Drawer Toggle Bar on small screens */}
      <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-surface border-b border-rule font-mono text-xs">
        <button
          onClick={() => setIsOutlineDrawerOpen(!isOutlineDrawerOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-paper border border-rule text-ink cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Outline</span>
        </button>

        <span className="font-serif text-xs font-semibold text-ink truncate max-w-[140px]">
          {activeSection?.title || 'Section'}
        </span>

        <button
          onClick={() => setIsLedgerDrawerOpen(!isLedgerDrawerOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-paper border border-rule text-ink cursor-pointer relative"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Ledger</span>
          {analysis.allGaps.length > 0 && (
            <span className="px-1 rounded-full bg-missing text-white text-[9px] font-bold">
              {analysis.allGaps.length}
            </span>
          )}
        </button>
      </div>

      {/* 3-Column Working Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Outline */}
        <div className="hidden lg:flex h-full">
          <DraftOutline
            sections={manuscript.sections}
            activeSectionId={activeSectionId}
            sectionAnalyses={analysis.sectionAnalyses}
            onSelectSection={(id) => setActiveSectionId(id)}
            onAddSection={handleAddSection}
            onRenameSection={handleRenameSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onReorderSections={handleReorderSections}
          />
        </div>

        {/* Center Column: Section Editor */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-paper overflow-hidden">
          {activeSection ? (
            <DraftSectionEditor
              section={activeSection}
              allSections={manuscript.sections}
              analysis={activeSectionAnalysis}
              questions={questions}
              experiments={experiments}
              onUpdateSectionTitle={handleUpdateSectionTitle}
              onUpdateSectionPurpose={handleUpdateSectionPurpose}
              onUpdateSectionProse={handleUpdateSectionProse}
              onAddReference={handleAddReference}
              onRemoveReference={handleRemoveReference}
              onMoveReferenceToSection={handleMoveReferenceToSection}
              onAddArtifact={handleAddArtifact}
              onRemoveArtifact={handleRemoveArtifact}
              onUpdateArtifactCaption={handleUpdateArtifactCaption}
              onMoveArtifact={handleMoveArtifact}
              onSelectAnchorInLedger={handleSelectAnchorInLedger}
              onOpenWorkbenchForClaim={(claimId) => {
                if (onNavigateToTab) onNavigateToTab('detail', claimId);
              }}
              onOpenPaper={onOpenPaper}
              onReviewDrift={(ref, claim) => {
                setDriftModalState({ reference: ref, claim });
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-ink-muted text-sm font-sans italic">
              No sections yet. Add the first section and state what it must establish.
            </div>
          )}
        </main>

        {/* Right Column: Support Ledger */}
        <div className="hidden lg:flex h-full">
          <DraftSupportLedger
            activeSection={activeSection}
            allSections={manuscript.sections}
            activeSectionAnalysis={activeSectionAnalysis}
            allGaps={analysis.allGaps}
            questions={questions}
            experiments={experiments}
            ledgerMode={ledgerMode}
            onSelectLedgerMode={setLedgerMode}
            onAddReference={handleAddReference}
            onAddArtifact={handleAddArtifact}
            onSelectSection={(id) => setActiveSectionId(id)}
            onOpenWorkbenchForClaim={(claimId) => {
              if (onNavigateToTab) onNavigateToTab('detail', claimId);
            }}
            onOpenPaper={onOpenPaper}
            onReviewDrift={(ref, claim) => {
              setDriftModalState({ reference: ref, claim });
            }}
          />
        </div>

        {/* Mobile Outline Drawer */}
        {isOutlineDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 flex">
            <div className="w-4/5 max-w-xs bg-surface h-full flex flex-col shadow-xl">
              <div className="p-3 border-b border-rule flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase">OUTLINE</span>
                <button
                  onClick={() => setIsOutlineDrawerOpen(false)}
                  className="p-1 text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DraftOutline
                  sections={manuscript.sections}
                  activeSectionId={activeSectionId}
                  sectionAnalyses={analysis.sectionAnalyses}
                  onSelectSection={(id) => {
                    setActiveSectionId(id);
                    setIsOutlineDrawerOpen(false);
                  }}
                  onAddSection={handleAddSection}
                  onRenameSection={handleRenameSection}
                  onDeleteSection={handleDeleteSection}
                  onMoveSection={handleMoveSection}
                  onReorderSections={handleReorderSections}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsOutlineDrawerOpen(false)} />
          </div>
        )}

        {/* Mobile Ledger Drawer */}
        {isLedgerDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 flex justify-end">
            <div className="flex-1" onClick={() => setIsLedgerDrawerOpen(false)} />
            <div className="w-4/5 max-w-sm bg-surface h-full flex flex-col shadow-xl">
              <div className="p-3 border-b border-rule flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase">SUPPORT LEDGER</span>
                <button
                  onClick={() => setIsLedgerDrawerOpen(false)}
                  className="p-1 text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DraftSupportLedger
                  activeSection={activeSection}
                  allSections={manuscript.sections}
                  activeSectionAnalysis={activeSectionAnalysis}
                  allGaps={analysis.allGaps}
                  questions={questions}
                  experiments={experiments}
                  ledgerMode={ledgerMode}
                  onSelectLedgerMode={setLedgerMode}
                  onAddReference={handleAddReference}
                  onAddArtifact={handleAddArtifact}
                  onSelectSection={(id) => {
                    setActiveSectionId(id);
                    setIsLedgerDrawerOpen(false);
                  }}
                  onOpenWorkbenchForClaim={(claimId) => {
                    if (onNavigateToTab) onNavigateToTab('detail', claimId);
                  }}
                  onOpenPaper={onOpenPaper}
                  onReviewDrift={(ref, claim) => {
                    setDriftModalState({ reference: ref, claim });
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drift Modal */}
      {driftModalState && (
        <DraftDriftModal
          reference={driftModalState.reference}
          claim={driftModalState.claim}
          onClose={() => setDriftModalState(null)}
          onUseCurrentVersion={handleUseCurrentVersion}
        />
      )}
    </div>
  );
}
