import React, { useState, useRef, useEffect, useMemo } from 'react';
import { setResearchItemDragData } from '../researchItemDrag';
import { PaperDoc, LeftRailMark, QuestionNode, LinkStatus } from '../types';
import { RealPdfViewer } from './papers/RealPdfViewer';
import { UploadPdfModal } from './papers/UploadPdfModal';
import { ArxivImportModal } from './papers/ArxivImportModal';
import { ReadHeader } from './papers/ReadHeader';
import { FindingCaptureSlip, FindingDraftPayload } from './papers/FindingCaptureSlip';
import { LinkedPassageRail } from './papers/LinkedPassageRail';
import { PaperInfoModal } from './papers/PaperInfoModal';
import { generateAcademicPdf } from '../utils/academicPdfGenerator';
import { SectionLabel, UserText, Button } from './ui/instrument';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Plus,
  X,
  FileText,
  Upload,
  Globe,
  FileCode,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Info,
  RotateCcw,
  CheckCircle,
  Quote,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface PapersPaneProps {
  questions: QuestionNode[];
  papers: PaperDoc[];
  evidenceToPaperMap: Record<string, string>;
  selectedClaimId: string | null;
  openPaperIds: string[];
  activePaperId: string | null;
  onOpenPaper: (paperId: string) => void;
  onClosePaper: (paperId: string) => void;
  onSelectPaperTab: (paperId: string) => void;
  paperScrollPositions: Record<string, number>;
  onSaveScrollPosition: (paperId: string, pos: number) => void;
  paperZoomLevels: Record<string, number>;
  onSaveZoomLevel: (paperId: string, zoom: number) => void;
  paperMarks: Record<string, LeftRailMark[]>;
  onAddMark: (paperId: string, mark: LeftRailMark) => void;
  onAddEvidenceToClaim: (
    claimId: string,
    evidenceTitle: string,
    citation: string,
    supportReason: string
  ) => void;
  onRemoveEvidence?: (claimId: string, evidenceId: string) => void;
  onNavigateToClaim?: (claimId: string) => void;
  onAddOpenProblem?: (text: string, citation?: string) => void;
  onAskAboutSelection: (snippet: string, paperId: string) => void;
  onAddCustomPaper?: (paper: PaperDoc) => void;
  targetPassageParagraphId?: string | null;
}

interface ConfirmationToast {
  id: string;
  claimId: string;
  evidenceId: string;
  claimText: string;
  findingTitle: string;
  timestamp: number;
}

export function PapersPane({
  questions,
  papers,
  evidenceToPaperMap,
  selectedClaimId,
  openPaperIds,
  activePaperId,
  onOpenPaper,
  onClosePaper,
  onSelectPaperTab,
  paperScrollPositions,
  onSaveScrollPosition,
  paperZoomLevels,
  onSaveZoomLevel,
  paperMarks,
  onAddMark,
  onAddEvidenceToClaim,
  onRemoveEvidence,
  onNavigateToClaim,
  onAddOpenProblem,
  onAskAboutSelection,
  onAddCustomPaper,
  targetPassageParagraphId,
}: PapersPaneProps) {
  // Session Metrics: Tracks findings and highlights made during this reading session
  const [sessionFindingCount, setSessionFindingCount] = useState<number>(0);
  const [sessionHighlightCount, setSessionHighlightCount] = useState<number>(0);

  // View Mode & Page State
  const [viewMode, setViewMode] = useState<'pdf' | 'text' | 'abstract'>('pdf');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals & Panels
  const [isPaperPickerOpen, setIsPaperPickerOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isArxivModalOpen, setIsArxivModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isFindingSlipOpen, setIsFindingSlipOpen] = useState<boolean>(false);

  // Confirmation banner with Undo
  const [confirmationToast, setConfirmationToast] = useState<ConfirmationToast | null>(null);

  // PDF binary buffers cache (for generated / uploaded PDFs)
  const [pdfBuffers, setPdfBuffers] = useState<Record<string, Uint8Array>>({});

  // Text selection state
  const [selectionRange, setSelectionRange] = useState<{
    text: string;
    top: number;
    left: number;
    paragraphId?: string;
    pageNumber?: number;
  } | null>(null);

  // Target jump for marks
  const [targetedMark, setTargetedMark] = useState<LeftRailMark | null>(null);

  const docContainerRef = useRef<HTMLDivElement>(null);
  const paperPickerDropdownRef = useRef<HTMLDivElement>(null);

  // Flatten all claims from questions data
  const allClaims = useMemo(
    () =>
      questions.flatMap((q) =>
        q.claims.map((c) => ({
          ...c,
          questionId: q.id,
          questionText: q.text,
        }))
      ),
    [questions]
  );

  // Active paper object
  const activePaper: PaperDoc | undefined = activePaperId
    ? papers.find((paper) => paper.id === activePaperId)
    : undefined;

  const currentZoomLevel = activePaperId ? paperZoomLevels[activePaperId] ?? 100 : 100;
  const currentMarks = activePaperId
    ? paperMarks[activePaperId] ?? activePaper?.initialMarks ?? []
    : [];

  // Generate or prepare PDF buffer for the active paper if not present
  useEffect(() => {
    if (!activePaper) return;

    if (activePaper.pdfData) {
      const buffer =
        activePaper.pdfData instanceof Uint8Array
          ? activePaper.pdfData
          : new Uint8Array(activePaper.pdfData);
      setPdfBuffers((prev) => ({ ...prev, [activePaper.id]: buffer }));
      return;
    }

    if (activePaper.pdfUrl) {
      return;
    }

    // If already generated and cached
    if (pdfBuffers[activePaper.id]) return;

    try {
      const generated = generateAcademicPdf(activePaper);
      setPdfBuffers((prev) => ({ ...prev, [activePaper.id]: generated }));
    } catch (err) {
      console.warn('Academic PDF generation fallback:', err);
    }
  }, [activePaper, pdfBuffers]);

  // Restore scroll position when active paper changes (for text mode)
  useEffect(() => {
    if (activePaperId && docContainerRef.current) {
      const savedPos = paperScrollPositions[activePaperId] || 0;
      docContainerRef.current.scrollTop = savedPos;
    }
  }, [activePaperId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        paperPickerDropdownRef.current &&
        !paperPickerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsPaperPickerOpen(false);
      }
    };
    if (isPaperPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPaperPickerOpen]);

  // Handle escape key to cancel selection or close slip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFindingSlipOpen) {
          setIsFindingSlipOpen(false);
        } else if (selectionRange) {
          setSelectionRange(null);
          window.getSelection()?.removeAllRanges();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFindingSlipOpen, selectionRange]);

  // Handle Document Text Selection in Text Mode
  const handleTextModeMouseUp = () => {
    if (isFindingSlipOpen) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionRange(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 3) {
      setSelectionRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = docContainerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    const top = rect.top - containerRect.top + (docContainerRef.current?.scrollTop || 0) - 44;
    const left = rect.left - containerRect.left + rect.width / 2;

    let parId: string | undefined;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== docContainerRef.current) {
      if (node instanceof HTMLElement && node.dataset.paragraphId) {
        parId = node.dataset.paragraphId;
        break;
      }
      node = node.parentNode;
    }

    setSelectionRange({
      text,
      top: Math.max(top, 10),
      left: Math.max(Math.min(left, containerRect.width - 160), 120),
      paragraphId: parId,
      pageNumber: currentPage,
    });
  };

  // 1. Passage Action: "Ask" -> opens Examiner dock with quote and context
  const handleActionAsk = () => {
    if (!selectionRange || !activePaperId) return;
    onAskAboutSelection(selectionRange.text, activePaperId);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // 2. Passage Action: "Make finding" -> opens FindingCaptureSlip
  const handleActionMakeFinding = () => {
    if (!selectionRange) return;
    setIsFindingSlipOpen(true);
  };

  // 3. Passage Action: "Highlight" -> creates local reading mark & increments count
  const handleActionHighlight = () => {
    if (!selectionRange || !activePaper) return;
    const pageNum = selectionRange.pageNumber || currentPage;
    const yPercent = Math.min(
      Math.max(Math.round((pageNum / Math.max(totalPages, 1)) * 100), 5),
      95
    );

    const newMark: LeftRailMark = {
      id: `mark-${Date.now()}`,
      paragraphId: selectionRange.paragraphId || `par-${Date.now()}`,
      yPercent,
      pageNumber: pageNum,
      type: 'emerald',
      label: 'Local reading highlight',
      snippet: selectionRange.text,
      claimId: undefined, // Pure highlight, not linked to a claim
    };

    onAddMark(activePaper.id, newMark);
    setSessionHighlightCount((prev) => prev + 1);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // Submit Finding from FindingCaptureSlip
  const handleSubmitFinding = (draft: FindingDraftPayload) => {
    if (!activePaper) return;

    const pageNum = draft.pageNumber || currentPage;
    const yPercent = Math.min(
      Math.max(Math.round((pageNum / Math.max(totalPages, 1)) * 100), 5),
      95
    );

    const citation = `${activePaper.authors.split('&')[0].trim()} et al. (${activePaper.year}) · page ${pageNum}`;

    // Add evidence finding to graph state
    onAddEvidenceToClaim(
      draft.claimId,
      draft.finding,
      citation,
      draft.userReason
    );

    // Create mark on the linked rail
    const newMark: LeftRailMark = {
      id: `mark-${Date.now()}`,
      paragraphId: draft.paragraphId || `par-${Date.now()}`,
      yPercent,
      pageNumber: pageNum,
      type: 'emerald',
      label: `Finding: ${draft.finding.slice(0, 32)}...`,
      snippet: draft.passageText,
      claimId: draft.claimId,
    };

    onAddMark(activePaper.id, newMark);
    setSessionFindingCount((prev) => prev + 1);

    // Find claim text for confirmation line
    const targetClaim = allClaims.find((c) => c.id === draft.claimId);
    const claimText = targetClaim ? targetClaim.text : 'selected claim';

    // Show Confirmation banner with Undo
    setConfirmationToast({
      id: `toast-${Date.now()}`,
      claimId: draft.claimId,
      evidenceId: `paper-ev-${Date.now()}`, // Generated in handleAddEvidenceFromPaper
      claimText,
      findingTitle: draft.finding,
      timestamp: Date.now(),
    });

    // Close slip & clear selection
    setIsFindingSlipOpen(false);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // Handle Undo on Confirmation Toast
  const handleUndoToast = () => {
    if (!confirmationToast) return;

    if (onRemoveEvidence) {
      onRemoveEvidence(confirmationToast.claimId, confirmationToast.evidenceId);
    }
    setSessionFindingCount((prev) => Math.max(0, prev - 1));
    setConfirmationToast(null);
  };

  // Scroll to mark in reader
  const handleScrollToMark = (mark: LeftRailMark) => {
    setTargetedMark(mark);
    if (mark.pageNumber) {
      setCurrentPage(mark.pageNumber);
    }
    if (viewMode === 'text' || viewMode === 'abstract') {
      const el = document.getElementById(mark.paragraphId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-amber-100/40', 'dark:bg-amber-950/40');
        setTimeout(() => {
          el.classList.remove('bg-amber-100/40', 'dark:bg-amber-950/40');
        }, 1500);
      }
    }
  };

  // Download real PDF
  const handleDownloadPdf = () => {
    if (!activePaper) return;
    const buffer = pdfBuffers[activePaper.id] || activePaper.pdfData;
    if (buffer) {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activePaper.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (activePaper.pdfUrl) {
      window.open(activePaper.pdfUrl, '_blank');
    } else {
      window.print();
    }
  };

  // Compute number of findings in current paper for tabs badge
  const getPaperFindingsCount = (paperId: string) => {
    const paper = papers.find((p) => p.id === paperId);
    if (!paper) return 0;
    let count = 0;
    questions.forEach((q) => {
      q.claims.forEach((c) => {
        c.evidence.forEach((e) => {
          if (
            (e.paperId && e.paperId === paper.id) ||
            (e.citation && e.citation.includes(paper.authors.split('&')[0].trim()))
          ) {
            count++;
          }
        });
      });
    });
    return count;
  };

  // Active buffer for PDF rendering
  const activePdfData = activePaper ? pdfBuffers[activePaper.id] || activePaper.pdfData : undefined;

  return (
    <div id="read-pane" className="flex flex-col h-full w-full bg-paper overflow-hidden">
      {/* 1. COMPACT READ HEADER */}
      <ReadHeader
        sessionFindingCount={sessionFindingCount}
        sessionHighlightCount={sessionHighlightCount}
        activePaperTitle={activePaper?.title}
        onOpenInfo={() => setIsInfoModalOpen(true)}
      />

      {/* 2. MULTI-PAPER TAB STRIP */}
      <div
        id="paper-tab-strip"
        className="h-10 px-3 bg-surface border-b border-rule flex items-center justify-between shrink-0 select-none overflow-x-auto gap-2"
      >
        {/* Left: Open Paper Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 flex-1 min-w-0">
          {openPaperIds.map((pId) => {
            const paper = papers.find((candidate) => candidate.id === pId);
            if (!paper) return null;
            const isActive = paper.id === activePaperId;
            const findingsCount = getPaperFindingsCount(paper.id);
            const shortTitle =
              paper.title.length > 24 ? `${paper.title.slice(0, 24)}...` : paper.title;

            return (
              <div
                key={paper.id}
                draggable
                onDragStart={(event) =>
                  setResearchItemDragData(event.dataTransfer, {
                    id: paper.id,
                    type: 'PAPER',
                    label: paper.title,
                  })
                }
                onClick={() => onSelectPaperTab(paper.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-[2px] cursor-grab active:cursor-grabbing transition-colors shrink-0 max-w-[260px] border ${
                  isActive
                    ? 'bg-paper text-ink border-rule border-b-transparent font-medium shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    : 'bg-transparent border-transparent text-ink-muted hover:text-ink hover:bg-paper/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
                <span className="truncate font-serif text-[13px]" title={paper.title}>
                  {shortTitle}
                </span>
                <span className="text-[10px] font-mono text-ink-muted/80 shrink-0">
                  ({paper.year})
                </span>

                {/* Finding count badge if paper has produced findings */}
                {findingsCount > 0 && (
                  <span
                    title={`${findingsCount} findings attached to claims`}
                    className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-surface border border-rule text-ink rounded-full"
                  >
                    {findingsCount}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClosePaper(paper.id);
                  }}
                  title="Close paper tab"
                  className="opacity-0 group-hover:opacity-100 hover:text-ink hover:bg-surface p-0.5 rounded-[2px] transition-opacity cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* "+" Button to open paper dropdown */}
          <div className="relative shrink-0" ref={paperPickerDropdownRef}>
            <button
              id="open-paper-dropdown-btn"
              onClick={() => setIsPaperPickerOpen(!isPaperPickerOpen)}
              title="Open or Import Papers"
              className="px-2 py-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-sans border border-rule/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Open paper</span>
            </button>

            {/* Paper Catalog & Action Dropdown */}
            {isPaperPickerOpen && (
              <div
                id="paper-catalog-dropdown"
                className="absolute left-0 top-9 w-84 max-h-96 overflow-y-auto bg-paper border border-rule rounded-[2px] p-2.5 z-50 shadow-xl space-y-2.5 divide-y divide-rule"
              >
                {/* Actions: Upload PDF & Import arXiv */}
                <div className="space-y-1 pb-2">
                  <button
                    onClick={() => {
                      setIsPaperPickerOpen(false);
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-[2px] text-xs font-medium bg-surface hover:bg-paper text-ink flex items-center gap-2 cursor-pointer transition-colors border border-rule/50"
                  >
                    <Upload className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Upload Local PDF Document...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPaperPickerOpen(false);
                      setIsArxivModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-[2px] text-xs font-medium bg-surface hover:bg-paper text-ink flex items-center gap-2 cursor-pointer transition-colors border border-rule/50"
                  >
                    <Globe className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Fetch arXiv / Web URL...</span>
                  </button>
                </div>

                {/* Workspace Papers Catalog */}
                <div className="pt-2">
                  <div className="px-1 mb-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-ink-muted">
                    Workspace Papers ({papers.length})
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {papers.map((p) => {
                      const isOpen = openPaperIds.includes(p.id);
                      const fCount = getPaperFindingsCount(p.id);
                      return (
                        <button
                          key={p.id}
                          disabled={isOpen}
                          onClick={() => {
                            onOpenPaper(p.id);
                            setIsPaperPickerOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[2px] text-xs flex flex-col transition-colors ${
                            isOpen
                              ? 'opacity-40 cursor-not-allowed text-ink-muted bg-surface/50'
                              : 'hover:bg-surface text-ink cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-serif text-[13px] text-ink truncate">{p.title}</span>
                            {fCount > 0 && (
                              <span className="text-[9px] font-mono text-ink-muted">
                                {fCount} {fCount === 1 ? 'finding' : 'findings'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-ink-muted truncate">
                            {p.authors} ({p.year})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons on right */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload PDF File"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden md:inline">Upload PDF</span>
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setIsArxivModalOpen(true)}
            title="Open from arXiv / Web URL"
          >
            <Globe className="w-3 h-3" />
            <span className="hidden md:inline">arXiv / URL</span>
          </Button>
        </div>
      </div>

      {/* 3. CONFIRMATION BANNER WITH UNDO */}
      {confirmationToast && (
        <div
          id="finding-confirmation-banner"
          className="px-4 py-2 bg-surface border-b border-rule flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150 select-none shrink-0"
        >
          <div className="flex items-center gap-2 truncate pr-4">
            <CheckCircle className="w-3.5 h-3.5 text-holds shrink-0" />
            <span className="text-ink-muted">Finding added under:</span>
            <span className="font-serif text-ink truncate">"{confirmationToast.claimText}"</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUndoToast}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-paper border border-rule hover:border-missing text-ink hover:text-missing font-mono text-[11px] cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
            <button
              onClick={() => setConfirmationToast(null)}
              className="p-1 text-ink-muted hover:text-ink cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN TWO-PANE WORKSPACE: Viewer + Finding Slip */}
      {!activePaper ? (
        <div
          id="papers-empty-state"
          className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 bg-paper"
        >
          <div className="w-12 h-12 rounded-[2px] bg-surface border border-rule flex items-center justify-center text-ink-muted">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="font-serif text-[18px] text-ink font-normal">
              No Paper Selected
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              The reader's purpose is to produce findings. Open a research paper to select passages, write findings, and link them to your claims.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="primary"
              size="base"
              onClick={() => setIsPaperPickerOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Open from Workspace</span>
            </Button>
            <Button
              variant="secondary"
              size="base"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="base"
              onClick={() => setIsArxivModalOpen(true)}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Fetch arXiv</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex w-full h-full overflow-hidden">
          {/* Main Paper Reader Section */}
          <section
            aria-label="Document Reader"
            className="flex-1 h-full flex flex-col bg-paper overflow-hidden min-w-0"
          >
            {/* Restrained Viewer Toolbar */}
            <div
              id="document-toolbar"
              className="h-10 px-4 border-b border-rule bg-paper flex items-center justify-between shrink-0 select-none gap-3"
            >
              {/* Segmented View Mode Toggle */}
              <div className="flex items-center bg-surface p-0.5 rounded-[2px] border border-rule text-xs">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-2.5 py-1 rounded-[2px] cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewMode === 'pdf'
                      ? 'bg-paper text-ink font-medium shadow-[0_1px_1px_rgba(0,0,0,0.04)]'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <FileText className="w-3 h-3 text-ink-muted" />
                  <span>PDF Viewer</span>
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-2.5 py-1 rounded-[2px] cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewMode === 'text'
                      ? 'bg-paper text-ink font-medium shadow-[0_1px_1px_rgba(0,0,0,0.04)]'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <FileCode className="w-3 h-3 text-ink-muted" />
                  <span>Structured Text</span>
                </button>
                <button
                  onClick={() => setViewMode('abstract')}
                  className={`px-2.5 py-1 rounded-[2px] cursor-pointer transition-all ${
                    viewMode === 'abstract'
                      ? 'bg-paper text-ink font-medium shadow-[0_1px_1px_rgba(0,0,0,0.04)]'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <span>Abstract</span>
                </button>
              </div>

              {/* Page Nav, Zoom, Info & Download */}
              <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                {/* Page Navigation */}
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    title="Previous page"
                    className="p-1 hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-ink">
                    {currentPage} / {totalPages || activePaper.pageCount}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    title="Next page"
                    className="p-1 hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-[1px] h-3.5 bg-rule" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onSaveZoomLevel(activePaper.id, Math.max(currentZoomLevel - 15, 60))
                    }
                    title="Zoom out"
                    className="p-1 hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono w-9 text-center text-ink">
                    {currentZoomLevel}%
                  </span>
                  <button
                    onClick={() =>
                      onSaveZoomLevel(activePaper.id, Math.min(currentZoomLevel + 15, 180))
                    }
                    title="Zoom in"
                    className="p-1 hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-[1px] h-3.5 bg-rule" />

                {/* Paper Info / Metadata Modal trigger */}
                <button
                  onClick={() => setIsInfoModalOpen(true)}
                  title="Paper provenance & metadata"
                  className="p-1 hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-sans text-[11px]">Info</span>
                </button>

                {/* Download PDF */}
                <button
                  onClick={handleDownloadPdf}
                  title="Download PDF"
                  className="p-1 hover:text-ink hover:bg-surface rounded-[2px] cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Content with LinkedPassageRail */}
            <div className="relative flex-1 flex w-full overflow-hidden bg-surface">
              {/* Linked Passage Rail */}
              <LinkedPassageRail
                marks={currentMarks}
                questions={questions}
                onScrollToMark={handleScrollToMark}
                onNavigateToClaim={onNavigateToClaim}
              />

              {/* Viewport: Real PDF Viewer or Text Fallback */}
              {viewMode === 'pdf' ? (
                <div className="relative flex-1 h-full w-full overflow-hidden">
                  <RealPdfViewer
                    pdfData={activePdfData}
                    pdfUrl={activePaper.pdfUrl}
                    zoomLevel={currentZoomLevel}
                    currentPage={currentPage}
                    onPageChange={(pageNum, total) => {
                      setCurrentPage(pageNum);
                      setTotalPages(total);
                    }}
                    onTextSelected={(payload) => {
                      if (!payload) {
                        if (!isFindingSlipOpen) setSelectionRange(null);
                        return;
                      }
                      setSelectionRange({
                        text: payload.text,
                        top: payload.top,
                        left: payload.left,
                        pageNumber: payload.pageNumber,
                        paragraphId: payload.paragraphId,
                      });
                    }}
                    targetMark={targetedMark}
                  />

                  {/* Passage Selection Floating Toolbar over PDF */}
                  {selectionRange && !isFindingSlipOpen && (
                    <div
                      id="selection-toolbar"
                      style={{
                        top: `${selectionRange.top}px`,
                        left: `${selectionRange.left}px`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-full mb-2 z-40 flex items-center bg-ink text-paper rounded-[2px] p-1 shadow-xl border border-ink/80 animate-in fade-in zoom-in-95 duration-100 select-none gap-0.5"
                    >
                      <button
                        onClick={handleActionAsk}
                        title="Ask about passage in Examiner thread"
                        className="px-2.5 py-1 text-xs font-sans hover:bg-paper/20 rounded-[2px] transition-colors cursor-pointer"
                      >
                        Ask
                      </button>
                      <div className="w-[1px] h-3 bg-paper/30 mx-0.5" />
                      <button
                        onClick={handleActionMakeFinding}
                        title="Extract finding and attach to a claim"
                        className="px-2.5 py-1 text-xs font-medium font-sans hover:bg-paper/20 rounded-[2px] text-paper transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Quote className="w-3 h-3" />
                        <span>Make finding</span>
                      </button>
                      <div className="w-[1px] h-3 bg-paper/30 mx-0.5" />
                      <button
                        onClick={handleActionHighlight}
                        title="Create local reading highlight"
                        className="px-2.5 py-1 text-xs font-sans hover:bg-paper/20 text-paper/80 hover:text-paper rounded-[2px] transition-colors cursor-pointer"
                      >
                        Highlight
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Structured Text or Abstract Mode */
                <div
                  ref={docContainerRef}
                  onMouseUp={handleTextModeMouseUp}
                  className="relative flex-1 h-full overflow-y-auto p-6 md:p-10"
                >
                  <div
                    id="document-rendered-page"
                    style={{ fontSize: `${(currentZoomLevel / 100) * 15}px` }}
                    className="max-w-[720px] mx-auto bg-paper border border-rule rounded-[2px] p-8 sm:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 text-ink select-text"
                  >
                    {/* Paper Title Header */}
                    <div className="border-b border-rule pb-6 space-y-2">
                      <SectionLabel className="text-[10px] text-ink-muted">
                        PRIMARY SOURCE · {activePaper.citation}
                      </SectionLabel>
                      <h1 className="font-serif text-[22px] text-ink leading-tight">
                        {activePaper.title}
                      </h1>
                      <div className="text-[13px] text-ink-muted font-sans">
                        <span>{activePaper.authors}</span> · <span>{activePaper.year}</span>
                      </div>
                    </div>

                    {/* Abstract Section */}
                    <div
                      id="paper-abstract-block"
                      className="bg-surface border border-rule rounded-[2px] p-4 space-y-2"
                    >
                      <SectionLabel className="text-[10px] text-ink-muted">Abstract</SectionLabel>
                      <p className="font-serif italic text-sm leading-relaxed text-ink">
                        {activePaper.abstract}
                      </p>
                    </div>

                    {/* Full Body Sections */}
                    {viewMode === 'text' && (
                      <div className="space-y-8 pt-4">
                        {activePaper.sections.map((sec) => (
                          <div key={sec.id} className="space-y-4">
                            <h2 className="font-sans text-sm font-semibold text-ink border-b border-rule pb-1.5 uppercase tracking-wide">
                              {sec.heading}
                            </h2>
                            <div className="space-y-3.5">
                              {sec.paragraphs.map((par) => {
                                const isLinked = par.linkedClaimId;
                                return (
                                  <p
                                    key={par.id}
                                    id={par.id}
                                    data-paragraph-id={par.id}
                                    className={`font-serif text-sm leading-relaxed transition-colors rounded-[2px] px-1 -mx-1 ${
                                      isLinked
                                        ? 'border-l-2 border-ink pl-3 bg-surface text-ink'
                                        : 'text-ink'
                                    }`}
                                  >
                                    {par.text}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Passage Selection Floating Toolbar over Text */}
                  {selectionRange && !isFindingSlipOpen && (
                    <div
                      id="selection-toolbar-text"
                      style={{
                        top: `${selectionRange.top}px`,
                        left: `${selectionRange.left}px`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-full mb-2 z-40 flex items-center bg-ink text-paper rounded-[2px] p-1 shadow-xl border border-ink/80 animate-in fade-in zoom-in-95 duration-100 select-none gap-0.5"
                    >
                      <button
                        onClick={handleActionAsk}
                        className="px-2.5 py-1 text-xs font-sans hover:bg-paper/20 rounded-[2px] transition-colors cursor-pointer"
                      >
                        Ask
                      </button>
                      <div className="w-[1px] h-3 bg-paper/30 mx-0.5" />
                      <button
                        onClick={handleActionMakeFinding}
                        className="px-2.5 py-1 text-xs font-medium font-sans hover:bg-paper/20 rounded-[2px] text-paper transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Quote className="w-3 h-3" />
                        <span>Make finding</span>
                      </button>
                      <div className="w-[1px] h-3 bg-paper/30 mx-0.5" />
                      <button
                        onClick={handleActionHighlight}
                        className="px-2.5 py-1 text-xs font-sans hover:bg-paper/20 text-paper/80 hover:text-paper rounded-[2px] transition-colors cursor-pointer"
                      >
                        Highlight
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Finding-Capture Slip Side Panel */}
          {selectionRange && isFindingSlipOpen && (
            <FindingCaptureSlip
              isOpen={isFindingSlipOpen}
              onClose={() => setIsFindingSlipOpen(false)}
              passageText={selectionRange.text}
              pageNumber={selectionRange.pageNumber || currentPage}
              paragraphId={selectionRange.paragraphId}
              paper={activePaper}
              questions={questions}
              initialClaimId={selectedClaimId}
              onSubmitFinding={handleSubmitFinding}
              onViewInContext={() => {
                // Keep passage in view
              }}
            />
          )}
        </div>
      )}

      {/* Paper Info / Metadata Modal */}
      {activePaper && (
        <PaperInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          paper={activePaper}
          questions={questions}
          onNavigateToClaim={onNavigateToClaim}
          onJumpToPage={(pNum) => {
            setCurrentPage(pNum);
            setIsInfoModalOpen(false);
          }}
        />
      )}

      {/* Upload PDF Modal */}
      <UploadPdfModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddPaper={(newPaper) => {
          if (onAddCustomPaper) {
            onAddCustomPaper(newPaper);
          }
          if (newPaper.pdfData) {
            setPdfBuffers((prev) => ({
              ...prev,
              [newPaper.id]:
                newPaper.pdfData instanceof Uint8Array
                  ? newPaper.pdfData
                  : new Uint8Array(newPaper.pdfData!),
            }));
          }
        }}
      />

      {/* arXiv Import Modal */}
      <ArxivImportModal
        isOpen={isArxivModalOpen}
        onClose={() => setIsArxivModalOpen(false)}
        onAddPaper={(newPaper) => {
          if (onAddCustomPaper) {
            onAddCustomPaper(newPaper);
          }
          if (newPaper.pdfData) {
            setPdfBuffers((prev) => ({
              ...prev,
              [newPaper.id]:
                newPaper.pdfData instanceof Uint8Array
                  ? newPaper.pdfData
                  : new Uint8Array(newPaper.pdfData!),
            }));
          }
        }}
      />
    </div>
  );
}
