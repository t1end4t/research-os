import React, { useState, useRef, useEffect, useMemo } from 'react';
import { setResearchItemDragData } from '../researchItemDrag';
import { PaperDoc, LeftRailMark, QuestionNode } from '../types';
import { RealPdfViewer } from './papers/RealPdfViewer';
import { UploadPdfModal } from './papers/UploadPdfModal';
import { ArxivImportModal } from './papers/ArxivImportModal';
import { generateAcademicPdf } from '../utils/academicPdfGenerator';
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
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
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
  onAddOpenProblem?: (text: string, citation?: string) => void;
  onAskAboutSelection: (snippet: string, paperId: string) => void;
  onAddCustomPaper?: (paper: PaperDoc) => void;
  targetPassageParagraphId?: string | null;
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
  onAddOpenProblem,
  onAskAboutSelection,
  onAddCustomPaper,
  targetPassageParagraphId,
}: PapersPaneProps) {
  const [isPaperPickerOpen, setIsPaperPickerOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'text' | 'abstract'>('pdf');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isArxivModalOpen, setIsArxivModalOpen] = useState<boolean>(false);

  // PDF binary buffers cache (for generated / uploaded PDFs)
  const [pdfBuffers, setPdfBuffers] = useState<Record<string, Uint8Array>>({});

  // Text selection & floating popover state
  const [selectionRange, setSelectionRange] = useState<{
    text: string;
    top: number;
    left: number;
    paragraphId?: string;
    pageNumber?: number;
  } | null>(null);

  const [isEvidencePopoverOpen, setIsEvidencePopoverOpen] = useState<boolean>(false);
  const [popoverClaimId, setPopoverClaimId] = useState<string>(selectedClaimId || 'c1');
  const [supportReasonText, setSupportReasonText] = useState<string>('');

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
          questionText: q.text,
        }))
      ),
    [questions]
  );

  const getPaperDoc = (paperIdOrEvidenceId: string) => {
    const paperId = evidenceToPaperMap[paperIdOrEvidenceId] || paperIdOrEvidenceId;
    return papers.find((paper) => paper.id === paperId);
  };

  // Active paper object
  const activePaper: PaperDoc | undefined = activePaperId
    ? papers.find((paper) => paper.id === activePaperId)
    : undefined;

  const currentZoomLevel = activePaperId ? paperZoomLevels[activePaperId] ?? 100 : 100;
  const currentMarks = activePaperId
    ? paperMarks[activePaperId] ?? activePaper?.initialMarks ?? []
    : [];

  // Sync popoverClaimId when selectedClaimId prop changes
  useEffect(() => {
    if (selectedClaimId) {
      setPopoverClaimId(selectedClaimId);
    }
  }, [selectedClaimId]);

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
      // Dynamically generate publication-grade PDF from paper structure
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

  // Handle Document Text Selection in Text Mode
  const handleTextModeMouseUp = () => {
    if (isEvidencePopoverOpen) return;

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

  // Action: "Ask" -> opens global dock and inserts quote into paper's thread
  const handleActionAsk = () => {
    if (!selectionRange || !activePaperId) return;
    onAskAboutSelection(selectionRange.text, activePaperId);
    setSelectionRange(null);
  };

  // Action: "+ Evidence" -> opens popover
  const handleActionOpenEvidence = () => {
    if (!selectionRange) return;
    setIsEvidencePopoverOpen(true);
    setSupportReasonText('');
    setPopoverClaimId(selectedClaimId || allClaims[0]?.id || 'c1');
  };

  // Action: "Highlight" -> marks in left rail
  const handleActionHighlight = () => {
    if (!selectionRange || !activePaper) return;
    const yPercent = Math.min(
      Math.max(Math.round(((selectionRange.pageNumber || currentPage) / Math.max(totalPages, 1)) * 100), 5),
      95
    );

    const newMark: LeftRailMark = {
      id: `mark-${Date.now()}`,
      paragraphId: selectionRange.paragraphId || `par-${Date.now()}`,
      yPercent,
      pageNumber: selectionRange.pageNumber || currentPage,
      type: 'emerald',
      label: 'User highlight',
      snippet: selectionRange.text,
      claimId: selectedClaimId || undefined,
    };

    onAddMark(activePaper.id, newMark);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  // Submit "+ Evidence" Popover
  const handleCreateEvidence = () => {
    if (!selectionRange || !supportReasonText.trim() || !activePaper) return;

    const pageNum = selectionRange.pageNumber || currentPage;
    const yPercent = Math.min(
      Math.max(Math.round((pageNum / Math.max(totalPages, 1)) * 100), 5),
      95
    );

    if (popoverClaimId === 'open_problems_survey') {
      if (onAddOpenProblem) {
        const citation = `${activePaper.authors.split('&')[0].trim()} et al. ${activePaper.year} (p.${pageNum}): "${selectionRange.text.slice(0, 60)}..."`;
        onAddOpenProblem(supportReasonText.trim(), citation);
      }

      const newMark: LeftRailMark = {
        id: `mark-${Date.now()}`,
        paragraphId: selectionRange.paragraphId || `par-${Date.now()}`,
        yPercent,
        pageNumber: pageNum,
        type: 'amber',
        label: `Open problem: ${supportReasonText.slice(0, 20)}...`,
        snippet: selectionRange.text,
      };

      onAddMark(activePaper.id, newMark);
      setIsEvidencePopoverOpen(false);
      setSelectionRange(null);
      setSupportReasonText('');
      window.getSelection()?.removeAllRanges();
      return;
    }

    // Add evidence to graph state
    onAddEvidenceToClaim(
      popoverClaimId,
      selectionRange.text.slice(0, 60),
      `${activePaper.authors.split('&')[0].trim()} et al. ${activePaper.year} (p.${pageNum})`,
      supportReasonText.trim()
    );

    const newMark: LeftRailMark = {
      id: `mark-${Date.now()}`,
      paragraphId: selectionRange.paragraphId || `par-${Date.now()}`,
      yPercent,
      pageNumber: pageNum,
      type: 'emerald',
      label: `Evidence: ${supportReasonText.slice(0, 20)}...`,
      snippet: selectionRange.text,
      claimId: popoverClaimId,
    };

    onAddMark(activePaper.id, newMark);
    setIsEvidencePopoverOpen(false);
    setSelectionRange(null);
    setSupportReasonText('');
    window.getSelection()?.removeAllRanges();
  };

  // Scroll to mark in reader
  const handleScrollToMark = (mark: LeftRailMark) => {
    setTargetedMark(mark);
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

  // Active buffer for PDF rendering
  const activePdfData = activePaper ? pdfBuffers[activePaper.id] || activePaper.pdfData : undefined;

  return (
    <div id="papers-pane" className="flex flex-col h-full w-full bg-[#fcfcfc] dark:bg-[#141414] overflow-hidden">
      {/* 1. PAPER TAB STRIP & TOOLBAR */}
      <div
        id="paper-picker-strip"
        className="h-9 px-3 bg-[#f5f5f5] dark:bg-[#181818] border-b border-[#ececec] dark:border-[#262626] flex items-center justify-between shrink-0 select-none overflow-x-auto"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {openPaperIds.map((pId) => {
            const paper = papers.find((candidate) => candidate.id === pId);
            if (!paper) return null;
            const isActive = paper.id === activePaperId;
            const truncatedTitle =
              paper.title.length > 22 ? `${paper.title.slice(0, 22)}...` : paper.title;

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
                className={`group flex items-center gap-1.5 px-3 py-1 text-[12px] rounded-t cursor-grab active:cursor-grabbing transition-colors shrink-0 max-w-[240px] ${
                  isActive
                    ? 'bg-white dark:bg-[#1f1f1f] border-b-2 border-stone-900 dark:border-white text-stone-900 dark:text-stone-100 font-medium shadow-2xs'
                    : 'bg-transparent border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-[#252525]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70 text-stone-700 dark:text-stone-300" />
                <span className="truncate" title={paper.title}>
                  {truncatedTitle}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClosePaper(paper.id);
                  }}
                  title="Close paper tab"
                  className="opacity-0 group-hover:opacity-100 hover:text-stone-900 dark:hover:text-white p-0.5 rounded transition-opacity cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* "+" Button to open paper dropdown */}
          <div className="relative shrink-0" ref={paperPickerDropdownRef}>
            <button
              id="add-paper-tab-btn"
              onClick={() => setIsPaperPickerOpen(!isPaperPickerOpen)}
              title="Open or Import Papers"
              className="p-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#252525] rounded cursor-pointer transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Paper Catalog & Action Dropdown */}
            {isPaperPickerOpen && (
              <div
                id="paper-catalog-dropdown"
                className="absolute left-0 top-8 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#1e1e1e] rounded-xl border border-stone-200 dark:border-stone-800 p-2.5 z-50 shadow-2xl space-y-2.5 divide-y divide-stone-100 dark:divide-stone-800"
              >
                {/* Direct Actions: Upload PDF & Import arXiv */}
                <div className="space-y-1 pb-2">
                  <button
                    onClick={() => {
                      setIsPaperPickerOpen(false);
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium bg-stone-50 dark:bg-[#252525] hover:bg-stone-100 dark:hover:bg-[#2c2c2c] text-stone-800 dark:text-stone-200 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Upload Local PDF Document...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPaperPickerOpen(false);
                      setIsArxivModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium bg-stone-50 dark:bg-[#252525] hover:bg-stone-100 dark:hover:bg-[#2c2c2c] text-stone-800 dark:text-stone-200 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Fetch from arXiv or Web URL...</span>
                  </button>
                </div>

                {/* Papers currently linked in the graph */}
                <div className="pt-2">
                  <div className="px-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    Workspace Papers ({papers.length})
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {papers.map((p) => {
                      const isOpen = openPaperIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          disabled={isOpen}
                          onClick={() => {
                            onOpenPaper(p.id);
                            setIsPaperPickerOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex flex-col transition-colors ${
                            isOpen
                              ? 'opacity-40 cursor-not-allowed text-stone-400'
                              : 'hover:bg-stone-100 dark:hover:bg-[#2a2a2a] text-stone-800 dark:text-stone-200 cursor-pointer'
                          }`}
                        >
                          <span className="font-medium truncate">{p.title}</span>
                          <span className="text-[10px] text-stone-500 truncate">
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

        {/* Quick Action Buttons on right side of tab strip */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload PDF File"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#252525] rounded transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Upload PDF</span>
          </button>
          <button
            onClick={() => setIsArxivModalOpen(true)}
            title="Open from arXiv / Web URL"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#252525] rounded transition-colors cursor-pointer"
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">arXiv / URL</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN TWO-PANE VIEW: Real PDF Reader or Empty State */}
      {!activePaper ? (
        <div
          id="papers-empty-state"
          className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 bg-white dark:bg-[#181818]"
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-[#242424] border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Epistemic Research Paper Reader
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Open a real PDF document to extract evidence nodes, verify reasoning with the assistant, and link passages directly into your epistemic graph.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
            <button
              onClick={() => setIsArxivModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-stone-100 dark:bg-[#2a2a2a] text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-[#333] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Fetch arXiv Paper</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex w-full h-[calc(100%-2.25rem)] overflow-hidden">
          {/* === DOCUMENT READER === */}
          <section
            aria-label="Document Reader"
            className="w-full h-full flex flex-col bg-white dark:bg-[#181818] overflow-hidden"
          >
            {/* Slim toolbar row above the document */}
            <div
              id="document-toolbar"
              className="h-10 px-4 border-b border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#181818] flex items-center justify-between shrink-0 select-none"
            >
              {/* Segmented view toggle: "Real PDF | Structured Text | Abstract" */}
              <div className="flex items-center bg-stone-100 dark:bg-[#242424] p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewMode === 'pdf'
                      ? 'bg-white dark:bg-[#1c1c1c] text-stone-900 dark:text-white font-medium shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Real PDF Reader</span>
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                    viewMode === 'text'
                      ? 'bg-white dark:bg-[#1c1c1c] text-stone-900 dark:text-white font-medium shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-stone-500" />
                  <span>Structured Text</span>
                </button>
                <button
                  onClick={() => setViewMode('abstract')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    viewMode === 'abstract'
                      ? 'bg-white dark:bg-[#1c1c1c] text-stone-900 dark:text-white font-medium shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  Abstract
                </button>
              </div>

              {/* Page indicator & borderless zoom/download icons */}
              <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
                {/* Page Navigation Indicator */}
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="text-stone-500 dark:text-stone-400">
                    Page {currentPage} / {totalPages || activePaper.pageCount}
                  </span>
                </div>

                <div className="w-[1px] h-3.5 bg-stone-200 dark:bg-stone-800" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onSaveZoomLevel(activePaper.id, Math.max(currentZoomLevel - 15, 60))
                    }
                    title="Zoom out"
                    className="p-1 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#252525] rounded cursor-pointer transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono w-9 text-center">
                    {currentZoomLevel}%
                  </span>
                  <button
                    onClick={() =>
                      onSaveZoomLevel(activePaper.id, Math.min(currentZoomLevel + 15, 180))
                    }
                    title="Zoom in"
                    className="p-1 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#252525] rounded cursor-pointer transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-[1px] h-3.5 bg-stone-200 dark:bg-stone-800" />

                {/* Download PDF Binary */}
                <button
                  onClick={handleDownloadPdf}
                  title="Download Real PDF"
                  className="p-1.5 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#252525] rounded cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Content Area with 40px Left Rail */}
            <div className="relative flex-1 flex w-full overflow-hidden bg-[#f4f4f5] dark:bg-[#121212]">
              {/* 40px Left Rail showing amber/emerald marks */}
              <div
                id="document-left-rail"
                className="w-10 h-full border-r border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#161616] relative shrink-0 select-none z-20"
              >
                {currentMarks.map((mark) => (
                  <button
                    key={mark.id}
                    onClick={() => handleScrollToMark(mark)}
                    title={`${mark.label}: ${mark.snippet.slice(0, 40)}...`}
                    style={{ top: `${mark.yPercent}%` }}
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 group cursor-pointer"
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-transform group-hover:scale-135 shadow-xs ${
                        mark.type === 'emerald'
                          ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950'
                          : 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-950'
                      }`}
                    />
                    {/* Hover tooltip for rail mark */}
                    <div className="hidden group-hover:block absolute left-7 top-1/2 -translate-y-1/2 bg-stone-900 dark:bg-stone-800 text-white text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap z-40 pointer-events-none shadow-lg border border-stone-800">
                      <p className="font-semibold">{mark.label}</p>
                      <p className="text-stone-400 font-mono text-[9px]">
                        {mark.pageNumber ? `Page ${mark.pageNumber}` : 'Passage'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Viewport: Either Real PDF Viewer or Structured Text Viewer */}
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
                        if (!isEvidencePopoverOpen) setSelectionRange(null);
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

                  {/* Floating Selection Toolbar over PDF */}
                  {selectionRange && !isEvidencePopoverOpen && (
                    <div
                      id="selection-toolbar"
                      style={{
                        top: `${selectionRange.top}px`,
                        left: `${selectionRange.left}px`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-full mb-2 z-40 flex items-center bg-stone-900 dark:bg-[#282828] text-white rounded-xl p-1 shadow-2xl border border-stone-700 animate-in fade-in zoom-in-95 duration-100 select-none"
                    >
                      <button
                        onClick={handleActionAsk}
                        className="px-2.5 py-1 text-xs font-medium hover:bg-stone-800 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Ask
                      </button>
                      <div className="w-[1px] h-3 bg-stone-700 mx-0.5" />
                      <button
                        onClick={handleActionOpenEvidence}
                        className="px-2.5 py-1 text-xs font-medium hover:bg-stone-800 dark:hover:bg-stone-700 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>+ Evidence</span>
                      </button>
                      <div className="w-[1px] h-3 bg-stone-700 mx-0.5" />
                      <button
                        onClick={handleActionHighlight}
                        className="px-2.5 py-1 text-xs font-medium hover:bg-stone-800 dark:hover:bg-stone-700 rounded-lg text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        Highlight
                      </button>
                    </div>
                  )}

                  {/* "+ Evidence" Small Popover for Real PDF */}
                  {selectionRange && isEvidencePopoverOpen && (
                    <div
                      id="evidence-popover"
                      style={{
                        top: `${selectionRange.top}px`,
                        left: `${selectionRange.left}px`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-full mb-2 z-50 w-84 bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-100 select-none"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                          Create Evidence from PDF
                        </span>
                        <button
                          onClick={() => setIsEvidencePopoverOpen(false)}
                          className="text-stone-400 hover:text-stone-900 dark:hover:text-white p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Selected text */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                          Selected passage (p.{selectionRange.pageNumber || currentPage})
                        </span>
                        <div className="bg-stone-50 dark:bg-[#242424] border border-stone-200 dark:border-stone-700 rounded-lg p-2 text-xs text-stone-700 dark:text-stone-300 line-clamp-3 italic">
                          "{selectionRange.text}"
                        </div>
                      </div>

                      {/* Dropdown "Under which claim?" */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                          Under which claim?
                        </label>
                        <select
                          value={popoverClaimId}
                          onChange={(e) => setPopoverClaimId(e.target.value)}
                          className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden"
                        >
                          <option value="open_problems_survey">
                            -&gt; Open problems (no claim yet)
                          </option>
                          {allClaims.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.text.length > 40 ? `${c.text.slice(0, 40)}...` : c.text}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Single required text field */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                          {popoverClaimId === 'open_problems_survey'
                            ? 'What is still open here? *'
                            : 'Why does this support the claim? *'}
                        </label>
                        <textarea
                          rows={2}
                          value={supportReasonText}
                          onChange={(e) => setSupportReasonText(e.target.value)}
                          placeholder={
                            popoverClaimId === 'open_problems_survey'
                              ? 'e.g. Memory bandwidth limits in multi-layer training...'
                              : 'e.g. Demonstrates that sparse activations prevent cross-talk...'
                          }
                          className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg p-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden resize-none"
                        />
                      </div>

                      {/* Create Button: disabled until field has text */}
                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsEvidencePopoverOpen(false)}
                          className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateEvidence}
                          disabled={!supportReasonText.trim()}
                          className="px-3.5 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          Create Evidence
                        </button>
                      </div>
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
                    className="max-w-[720px] mx-auto bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-stone-800 rounded-xl p-8 sm:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 text-stone-800 dark:text-stone-200 select-text"
                  >
                    {/* Paper Header */}
                    <div className="border-b border-stone-200 dark:border-stone-800 pb-6 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                        PRIMARY PAPER • {activePaper.citation}
                      </span>
                      <h1 className="text-[22px] font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                        {activePaper.title}
                      </h1>
                      <div className="text-[13px] text-stone-500 dark:text-stone-400">
                        <span>{activePaper.authors}</span> • <span>{activePaper.year}</span>
                      </div>
                    </div>

                    {/* Abstract Section */}
                    <div
                      id="paper-abstract-block"
                      className="bg-stone-50 dark:bg-[#202020] border border-stone-200 dark:border-stone-700 rounded-xl p-4 space-y-2"
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Abstract
                      </div>
                      <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 italic">
                        {activePaper.abstract}
                      </p>
                    </div>

                    {/* Full Body Sections if Full Paper mode */}
                    {viewMode === 'text' && (
                      <div className="space-y-8 pt-4">
                        {activePaper.sections.map((sec) => (
                          <div key={sec.id} className="space-y-4">
                            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-1.5">
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
                                    className={`text-sm leading-relaxed transition-colors rounded px-1 -mx-1 ${
                                      isLinked
                                        ? 'border-l-2 border-emerald-500 pl-3 bg-emerald-50/20 dark:bg-emerald-950/20 text-stone-900 dark:text-stone-100'
                                        : 'text-stone-700 dark:text-stone-300'
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
                </div>
              )}
            </div>
          </section>
        </div>
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
              [newPaper.id]: newPaper.pdfData instanceof Uint8Array ? newPaper.pdfData : new Uint8Array(newPaper.pdfData!),
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
              [newPaper.id]: newPaper.pdfData instanceof Uint8Array ? newPaper.pdfData : new Uint8Array(newPaper.pdfData!),
            }));
          }
        }}
      />
    </div>
  );
}
