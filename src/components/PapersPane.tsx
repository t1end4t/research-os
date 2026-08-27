import React, { useState, useRef, useEffect } from 'react';
import { PaperDoc, LeftRailMark, QuestionNode } from '../types';
import { PAPERS_CATALOG, getPaperDoc } from '../data/papersData';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Plus,
  X,
  FileText,
} from 'lucide-react';

interface PapersPaneProps {
  questions: QuestionNode[];
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
    supportReason?: string
  ) => void;
  onAskAboutSelection: (snippet: string, paperId: string) => void;
  targetPassageParagraphId?: string | null;
}

export function PapersPane({
  questions,
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
  onAskAboutSelection,
  targetPassageParagraphId,
}: PapersPaneProps) {
  const [isPaperPickerOpen, setIsPaperPickerOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'full' | 'abstract'>('full');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Text selection & floating popover state
  const [selectionRange, setSelectionRange] = useState<{
    text: string;
    top: number;
    left: number;
    paragraphId?: string;
  } | null>(null);

  const [isEvidencePopoverOpen, setIsEvidencePopoverOpen] = useState<boolean>(false);
  const [popoverClaimId, setPopoverClaimId] = useState<string>(selectedClaimId || 'c1');
  const [supportReasonText, setSupportReasonText] = useState<string>('');

  const docContainerRef = useRef<HTMLDivElement>(null);
  const paperPickerDropdownRef = useRef<HTMLDivElement>(null);

  // Flatten all claims from questions data
  const allClaims = questions.flatMap((q) =>
    q.claims.map((c) => ({
      ...c,
      questionText: q.text,
    }))
  );

  // Active paper object
  const activePaper: PaperDoc | undefined = activePaperId
    ? PAPERS_CATALOG.find((p) => p.id === activePaperId)
    : undefined;

  const currentZoomLevel = activePaperId ? paperZoomLevels[activePaperId] ?? 100 : 100;
  const currentMarks = activePaperId ? paperMarks[activePaperId] ?? activePaper?.initialMarks ?? [] : [];

  // Sync popoverClaimId when selectedClaimId prop changes
  useEffect(() => {
    if (selectedClaimId) {
      setPopoverClaimId(selectedClaimId);
    }
  }, [selectedClaimId]);

  // Restore scroll position when active paper changes
  useEffect(() => {
    if (activePaperId && docContainerRef.current) {
      const savedPos = paperScrollPositions[activePaperId] || 0;
      docContainerRef.current.scrollTop = savedPos;
    }
  }, [activePaperId]);

  // Auto-scroll to target linked passage paragraph if provided
  useEffect(() => {
    if (targetPassageParagraphId && activePaperId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetPassageParagraphId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-amber-100/40', 'dark:bg-amber-950/40');
          setTimeout(() => {
            el.classList.remove('bg-amber-100/40', 'dark:bg-amber-950/40');
          }, 2000);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [targetPassageParagraphId, activePaperId]);

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

  // Handle Document Container scroll saving
  const handleDocScroll = () => {
    if (activePaperId && docContainerRef.current) {
      onSaveScrollPosition(activePaperId, docContainerRef.current.scrollTop);
    }
  };

  // Handle Document Text Selection
  const handleMouseUp = () => {
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

    // Position relative to document container viewport
    const top = rect.top - containerRect.top + (docContainerRef.current?.scrollTop || 0) - 44;
    const left = rect.left - containerRect.left + rect.width / 2;

    // Find nearest paragraph container if any
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
    });
  };

  // Close floating toolbar on click outside
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('#selection-toolbar') ||
      target.closest('#evidence-popover')
    ) {
      return;
    }
    if (!isEvidencePopoverOpen) {
      setSelectionRange(null);
    }
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

  // Action: "Highlight" -> marks in left rail, no other effect
  const handleActionHighlight = () => {
    if (!selectionRange || !activePaper) return;
    const containerHeight = docContainerRef.current?.scrollHeight || 1000;
    const yPercent = Math.min(
      Math.max(Math.round((selectionRange.top / containerHeight) * 100), 5),
      95
    );

    const newMark: LeftRailMark = {
      id: `mark-${Date.now()}`,
      paragraphId: selectionRange.paragraphId || `par-${Date.now()}`,
      yPercent,
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

    // Add evidence to graph state
    onAddEvidenceToClaim(
      popoverClaimId,
      selectionRange.text.slice(0, 60),
      `${activePaper.authors.split('&')[0].trim()} et al. ${activePaper.year}`,
      supportReasonText.trim()
    );

    // Also add an emerald mark to left rail
    const containerHeight = docContainerRef.current?.scrollHeight || 1000;
    const yPercent = Math.min(
      Math.max(Math.round((selectionRange.top / containerHeight) * 100), 5),
      95
    );

    const newMark: LeftRailMark = {
      id: `mark-${Date.now()}`,
      paragraphId: selectionRange.paragraphId || `par-${Date.now()}`,
      yPercent,
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

  // Scroll to paragraph or mark
  const handleScrollToMark = (mark: LeftRailMark) => {
    const el = document.getElementById(mark.paragraphId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-amber-100/40', 'dark:bg-amber-950/40');
      setTimeout(() => {
        el.classList.remove('bg-amber-100/40', 'dark:bg-amber-950/40');
      }, 1500);
    } else if (docContainerRef.current) {
      const targetScroll =
        (mark.yPercent / 100) * docContainerRef.current.scrollHeight;
      docContainerRef.current.scrollTo({
        top: targetScroll - 100,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div id="papers-pane" className="flex flex-col h-full w-full bg-[#fcfcfc] dark:bg-[#141414] overflow-hidden">
      {/* 1. PAPER TAB STRIP: Functional tab strip */}
      <div
        id="paper-picker-strip"
        className="h-8 px-4 bg-[#f6f6f6] dark:bg-[#181818] border-b border-[#ececec] dark:border-[#262626] flex items-center gap-1.5 shrink-0 select-none overflow-x-auto whitespace-nowrap"
      >
        {openPaperIds.map((pId) => {
          const paper = PAPERS_CATALOG.find((p) => p.id === pId);
          if (!paper) return null;
          const isActive = paper.id === activePaperId;
          const truncatedTitle =
            paper.title.length > 24
              ? `${paper.title.slice(0, 24)}...`
              : paper.title;

          return (
            <div
              key={paper.id}
              onClick={() => onSelectPaperTab(paper.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 text-[12px] rounded-t cursor-pointer transition-colors shrink-0 max-w-[240px] ${
                isActive
                  ? 'bg-white dark:bg-[#1f1f1f] border-b-2 border-[#1a1a1a] dark:border-white text-[#1a1a1a] dark:text-[#f0f0f0] font-medium'
                  : 'bg-transparent border-transparent text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#eaeaea] dark:hover:bg-[#252525]'
              }`}
            >
              <FileText className="w-3 h-3 shrink-0 opacity-60 text-[#1a1a1a] dark:text-[#dedede]" />
              <span className="truncate" title={paper.title}>
                {truncatedTitle}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClosePaper(paper.id);
                }}
                title="Close paper"
                className="opacity-0 group-hover:opacity-100 hover:text-[#1a1a1a] dark:hover:text-white p-0.5 rounded transition-opacity cursor-pointer ml-0.5"
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
            title="Open paper from graph"
            className="p-1 text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#eaeaea] dark:hover:bg-[#252525] rounded cursor-pointer transition-colors flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Paper Catalog Dropdown: Grouped under claims with already open papers greyed out */}
          {isPaperPickerOpen && (
            <div
              id="paper-catalog-dropdown"
              className="absolute left-0 top-7 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#1e1e1e] rounded-lg border border-[#ececec] dark:border-[#2e2e2e] p-2 z-50 shadow-xl space-y-2.5 divide-y divide-[#f0f0f0] dark:divide-[#282828]"
            >
              <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                Papers in graph
              </div>

              {questions.map((q) => (
                <div key={q.id} className="pt-2 first:pt-0 space-y-2">
                  {q.claims.map((claim) => {
                    const papersUnderClaim = claim.evidence.filter(
                      (e) => e.kind === 'paper'
                    );
                    if (papersUnderClaim.length === 0) return null;

                    return (
                      <div key={claim.id} className="space-y-1">
                        <div className="px-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
                          Claim: {claim.text.slice(0, 34)}...
                        </div>
                        <div className="space-y-0.5">
                          {papersUnderClaim.map((ev) => {
                            const doc = getPaperDoc(ev.id);
                            if (!doc) return null;
                            const isOpen = openPaperIds.includes(doc.id);

                            return (
                              <button
                                key={ev.id}
                                disabled={isOpen}
                                onClick={() => {
                                  onOpenPaper(doc.id);
                                  setIsPaperPickerOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-[12px] flex flex-col transition-colors ${
                                  isOpen
                                    ? 'opacity-40 cursor-not-allowed text-[#888] dark:text-[#666]'
                                    : 'hover:bg-[#f3f4f6] dark:hover:bg-[#2a2a2a] text-[#1a1a1a] dark:text-[#dedede] cursor-pointer'
                                }`}
                              >
                                <span className="font-medium truncate">{doc.title}</span>
                                <span className="text-[10px] text-[#777] dark:text-[#888] truncate">
                                  {doc.authors} ({doc.year})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN TWO-PANE VIEW: Document reader or Empty State */}
      {!activePaper ? (
        /* Empty State when no paper is open */
        <div
          id="papers-empty-state"
          className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white dark:bg-[#181818]"
        >
          <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-[#242424] flex items-center justify-center text-stone-400 dark:text-stone-500">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-stone-700 dark:text-stone-200">
              No paper open
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select a paper from the graph to inspect literature details
            </p>
          </div>
          <button
            id="btn-open-paper-empty-state"
            onClick={() => setIsPaperPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open a paper</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex w-full h-[calc(100%-2rem)] overflow-hidden">
          {/* === DOCUMENT READER === */}
          <section
            aria-label="Document Reader"
            className="w-full h-full flex flex-col bg-white dark:bg-[#181818] overflow-hidden"
          >
            {/* Slim toolbar row above the document */}
            <div
              id="document-toolbar"
              className="h-10 px-6 border-b border-[#ececec] dark:border-[#262626] bg-white dark:bg-[#181818] flex items-center justify-between shrink-0"
            >
              {/* Segmented toggle: "Abstract | Full paper" */}
              <div className="flex items-center bg-[#f0f0f0] dark:bg-[#252525] p-0.5 rounded-md text-[12px]">
                <button
                  onClick={() => setViewMode('abstract')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                    viewMode === 'abstract'
                      ? 'bg-white dark:bg-[#1c1c1c] text-[#1a1a1a] dark:text-white font-medium shadow-2xs'
                      : 'text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white'
                  }`}
                >
                  Abstract
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                    viewMode === 'full'
                      ? 'bg-white dark:bg-[#1c1c1c] text-[#1a1a1a] dark:text-white font-medium shadow-2xs'
                      : 'text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white'
                  }`}
                >
                  Full paper
                </button>
              </div>

              {/* Page indicator & borderless zoom/download icons */}
              <div className="flex items-center gap-3 text-[12px] text-[#6b6b6b] dark:text-[#999]">
                <span className="font-mono text-[11px] text-[#888] dark:text-[#777]">
                  {currentPage} / {activePaper.pageCount}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onSaveZoomLevel(activePaper.id, Math.max(currentZoomLevel - 10, 80))
                    }
                    title="Zoom out"
                    className="p-1 hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#252525] rounded cursor-pointer transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono w-7 text-center">
                    {currentZoomLevel}%
                  </span>
                  <button
                    onClick={() =>
                      onSaveZoomLevel(activePaper.id, Math.min(currentZoomLevel + 10, 140))
                    }
                    title="Zoom in"
                    className="p-1 hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#252525] rounded cursor-pointer transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-3.5 bg-[#ececec] dark:bg-[#2e2e2e] mx-1" />
                  <button
                    onClick={() => window.print()}
                    title="Download paper"
                    className="p-1 hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#252525] rounded cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Content Area with 40px Left Rail */}
            <div className="relative flex-1 flex w-full overflow-hidden bg-[#fafafa] dark:bg-[#121212]">
              {/* 40px Left Rail down the page edge showing amber/green marks */}
              <div
                id="document-left-rail"
                className="w-10 h-full border-r border-[#ececec] dark:border-[#262626] bg-[#fdfdfd] dark:bg-[#161616] relative shrink-0 select-none"
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
                      className={`w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-135 shadow-2xs ${
                        mark.type === 'emerald'
                          ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950'
                          : 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-950'
                      }`}
                    />
                    {/* Hover tooltip for rail mark */}
                    <div className="hidden group-hover:block absolute left-7 top-1/2 -translate-y-1/2 bg-[#1a1a1a] dark:bg-[#282828] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-40 pointer-events-none shadow-md border border-stone-800">
                      {mark.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Centered Scrollable Document Page (max 720px) */}
              <div
                ref={docContainerRef}
                onScroll={handleDocScroll}
                onMouseUp={handleMouseUp}
                onMouseDown={handleContainerMouseDown}
                className="relative flex-1 h-full overflow-y-auto p-6 md:p-10"
              >
                <div
                  id="document-rendered-page"
                  style={{ fontSize: `${(currentZoomLevel / 100) * 15}px` }}
                  className="max-w-[720px] mx-auto bg-white dark:bg-[#1a1a1a] border border-[#ececec] dark:border-[#282828] rounded-xl p-8 sm:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 text-[#222] dark:text-[#e0e0e0] select-text"
                >
                  {/* Paper Header */}
                  <div className="border-b border-[#ececec] dark:border-[#282828] pb-6 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#999] dark:text-[#777]">
                      PRIMARY PAPER • {activePaper.citation}
                    </span>
                    <h1 className="text-[22px] font-semibold text-[#111] dark:text-[#f2f2f2] leading-tight">
                      {activePaper.title}
                    </h1>
                    <div className="text-[13px] text-[#666] dark:text-[#999]">
                      <span>{activePaper.authors}</span> • <span>{activePaper.year}</span>
                    </div>
                  </div>

                  {/* Abstract Section */}
                  <div
                    id="paper-abstract-block"
                    className="bg-[#f9f9f9] dark:bg-[#202020] border border-[#ececec] dark:border-[#2c2c2c] rounded-lg p-4 space-y-2"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777]">
                      Abstract
                    </div>
                    <p className="text-[14px] leading-relaxed text-[#333] dark:text-[#cccccc] italic">
                      {activePaper.abstract}
                    </p>
                  </div>

                  {/* Full Body Sections if Full Paper mode */}
                  {viewMode === 'full' && (
                    <div className="space-y-8 pt-4">
                      {activePaper.sections.map((sec) => (
                        <div key={sec.id} className="space-y-4">
                          <h2 className="text-[16px] font-semibold text-[#1a1a1a] dark:text-[#ededed] border-b border-[#f0f0f0] dark:border-[#262626] pb-1.5">
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
                                  className={`text-[14px] leading-[1.7] transition-colors rounded px-1 -mx-1 ${
                                    isLinked
                                      ? 'border-l-2 border-emerald-400 pl-3 bg-emerald-50/20 dark:bg-emerald-950/20 text-[#2e2e2e] dark:text-[#e0e0e0]'
                                      : 'text-[#2e2e2e] dark:text-[#d4d4d4]'
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

                {/* Floating Selection Toolbar directly above text */}
                {selectionRange && !isEvidencePopoverOpen && (
                  <div
                    id="selection-toolbar"
                    style={{
                      top: `${selectionRange.top}px`,
                      left: `${selectionRange.left}px`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-full mb-2 z-40 flex items-center bg-[#1a1a1a] dark:bg-[#282828] text-white rounded-lg p-1 shadow-lg border border-stone-800 dark:border-stone-700 animate-in fade-in zoom-in-95 duration-100 select-none"
                  >
                    <button
                      onClick={handleActionAsk}
                      className="px-2.5 py-1 text-[12px] font-medium hover:bg-stone-800 dark:hover:bg-stone-700 rounded transition-colors cursor-pointer"
                    >
                      Ask
                    </button>
                    <div className="w-[1px] h-3 bg-stone-700 mx-0.5" />
                    <button
                      onClick={handleActionOpenEvidence}
                      className="px-2.5 py-1 text-[12px] font-medium hover:bg-stone-800 dark:hover:bg-stone-700 rounded text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      + Evidence
                    </button>
                    <div className="w-[1px] h-3 bg-stone-700 mx-0.5" />
                    <button
                      onClick={handleActionHighlight}
                      className="px-2.5 py-1 text-[12px] font-medium hover:bg-stone-800 dark:hover:bg-stone-700 rounded text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Highlight
                    </button>
                  </div>
                )}

                {/* "+ Evidence" Small Popover */}
                {selectionRange && isEvidencePopoverOpen && (
                  <div
                    id="evidence-popover"
                    style={{
                      top: `${selectionRange.top}px`,
                      left: `${selectionRange.left}px`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-full mb-2 z-50 w-80 bg-white dark:bg-[#1e1e1e] border border-[#ececec] dark:border-[#2e2e2e] rounded-xl p-4 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-100 select-none"
                  >
                    <div className="flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#282828] pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-[#f0f0f0]">
                        Create Evidence Card
                      </span>
                      <button
                        onClick={() => setIsEvidencePopoverOpen(false)}
                        className="text-[#999] hover:text-[#1a1a1a] dark:hover:text-white p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selected text, read-only, truncated to 3 lines */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#888] dark:text-[#777]">
                        Selected text
                      </span>
                      <div className="bg-[#f7f7f7] dark:bg-[#242424] border border-[#ececec] dark:border-[#333333] rounded p-2 text-[11px] text-[#555] dark:text-[#bbb] line-clamp-3 italic">
                        "{selectionRange.text}"
                      </div>
                    </div>

                    {/* Dropdown "Under which claim?" */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#888] dark:text-[#777]">
                        Under which claim?
                      </label>
                      <select
                        value={popoverClaimId}
                        onChange={(e) => setPopoverClaimId(e.target.value)}
                        className="w-full bg-[#fcfcfc] dark:bg-[#252525] border border-[#ececec] dark:border-[#333333] rounded px-2 py-1.5 text-[12px] text-[#1a1a1a] dark:text-[#dedede] focus:outline-hidden"
                      >
                        {allClaims.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.text.length > 40
                              ? `${c.text.slice(0, 40)}...`
                              : c.text}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Single required text field */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#888] dark:text-[#777]">
                        Why does this support the claim? *
                      </label>
                      <textarea
                        rows={2}
                        value={supportReasonText}
                        onChange={(e) => setSupportReasonText(e.target.value)}
                        placeholder="e.g. Demonstrates that orthogonal activations prevent cross-talk..."
                        className="w-full bg-[#fcfcfc] dark:bg-[#252525] border border-[#ececec] dark:border-[#333333] rounded p-2 text-[12px] text-[#1a1a1a] dark:text-[#dedede] placeholder-[#aaa] dark:placeholder-[#666] focus:outline-hidden resize-none"
                      />
                    </div>

                    {/* Create Button: disabled until field has text */}
                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setIsEvidencePopoverOpen(false)}
                        className="px-2.5 py-1.5 text-[12px] text-[#777] dark:text-[#888] hover:text-[#1a1a1a] dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateEvidence}
                        disabled={!supportReasonText.trim()}
                        className="px-3.5 py-1.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded text-[12px] font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[#333] dark:hover:bg-[#eee] transition-colors cursor-pointer"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
