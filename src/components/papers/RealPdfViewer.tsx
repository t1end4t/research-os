import React, { useEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib } from '../../lib/pdfWorker';
import { LeftRailMark, PdfOutlineItem } from '../../types';
import {
  Search,
  ChevronUp,
  ChevronDown,
  BookOpen,
  X,
  AlertCircle,
  Loader2,
  Bookmark,
  Maximize2,
} from 'lucide-react';

interface TextSelectionPayload {
  text: string;
  top: number;
  left: number;
  pageNumber: number;
  paragraphId?: string;
}

interface SearchMatch {
  pageIndex: number;
  pageNumber: number;
  matchIndex: number;
  snippet: string;
}

interface RealPdfViewerProps {
  pdfData?: Uint8Array | ArrayBuffer;
  pdfUrl?: string;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  onTextSelected: (payload: TextSelectionPayload | null) => void;
  onPageChange: (pageNumber: number, totalPages: number) => void;
  currentPage: number;
  marks?: LeftRailMark[];
  targetMark?: LeftRailMark | null;
  targetPageNumber?: number | null;
  className?: string;
}

interface PageTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
}

export function RealPdfViewer({
  pdfData,
  pdfUrl,
  zoomLevel,
  onTextSelected,
  onPageChange,
  currentPage,
  targetMark,
  targetPageNumber,
  className = '',
}: RealPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Document Outline / Bookmarks
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Page text storage for search
  const pagesTextCache = useRef<Map<number, { text: string; items: PageTextItem[] }>>(new Map());

  // Rendered page refs
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasks = useRef<Map<number, any>>(new Map());

  // 1. Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    pagesTextCache.current.clear();

    const loadDoc = async () => {
      try {
        let loadingTask: any;
        if (pdfData) {
          // Copy buffer to avoid transfer detachment
          const bufferCopy = pdfData instanceof Uint8Array ? pdfData.slice() : new Uint8Array(pdfData).slice();
          loadingTask = pdfjsLib.getDocument({
            data: bufferCopy,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@6.2.108/cmaps/',
            cMapPacked: true,
          });
        } else if (pdfUrl) {
          loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@6.2.108/cmaps/',
            cMapPacked: true,
          });
        } else {
          setError('No PDF data or URL provided');
          setLoading(false);
          return;
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        onPageChange(1, doc.numPages);
        setLoading(false);

        // Fetch outline/bookmarks if available
        try {
          const rawOutline = await doc.getOutline();
          if (rawOutline && rawOutline.length > 0) {
            const parsedOutline: PdfOutlineItem[] = [];
            for (const item of rawOutline) {
              let targetPage = 1;
              if (item.dest) {
                if (typeof item.dest === 'string') {
                  const destRef = await doc.getDestination(item.dest);
                  if (destRef && destRef[0]) {
                    const pageIdx = await doc.getPageIndex(destRef[0]);
                    targetPage = pageIdx + 1;
                  }
                } else if (Array.isArray(item.dest) && item.dest[0]) {
                  const pageIdx = await doc.getPageIndex(item.dest[0]);
                  targetPage = pageIdx + 1;
                }
              }
              parsedOutline.push({
                title: item.title,
                pageNumber: targetPage,
              });
            }
            setOutline(parsedOutline);
          }
        } catch {
          // Outline parsing is optional
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF document');
        setLoading(false);
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
    };
  }, [pdfData, pdfUrl]);

  // 2. Render each page onto Canvas and construct Text Layer
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current.get(pageNumber);
      const pageContainer = pageRefs.current.get(pageNumber);
      if (!canvas || !pageContainer) return;

      try {
        // Cancel existing render task for this page if running
        const existingTask = renderTasks.current.get(pageNumber);
        if (existingTask) {
          existingTask.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        const scale = (zoomLevel / 100) * 1.35; // Standard readability scale
        const viewport = page.getViewport({ scale });

        // High DPI support
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        pageContainer.style.width = `${Math.floor(viewport.width)}px`;
        pageContainer.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasks.current.set(pageNumber, renderTask);
        await renderTask.promise;
        renderTasks.current.delete(pageNumber);

        // Render Text Layer
        const textContent = await page.getTextContent();
        let textLayerDiv = pageContainer.querySelector<HTMLDivElement>('.pdf-text-layer');
        if (!textLayerDiv) {
          textLayerDiv = document.createElement('div');
          textLayerDiv.className = 'pdf-text-layer';
          pageContainer.appendChild(textLayerDiv);
        }

        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

        // Cache page text for search
        const fullTextItems: PageTextItem[] = [];
        let combinedString = '';

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;
          combinedString += item.str + ' ';
          fullTextItems.push({
            str: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height,
            fontName: item.fontName,
          });

          // Text element for selection overlay
          const textSpan = document.createElement('span');
          textSpan.textContent = item.str;

          // Convert PDF transform matrix to CSS viewport coordinates
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.hypot(tx[2], tx[3]);

          textSpan.style.left = `${tx[4]}px`;
          textSpan.style.top = `${tx[5] - fontHeight}px`;
          textSpan.style.fontSize = `${fontHeight}px`;
          textSpan.style.fontFamily = item.fontName || 'sans-serif';
          textSpan.dataset.page = String(pageNumber);

          textLayerDiv.appendChild(textSpan);
        }

        pagesTextCache.current.set(pageNumber, {
          text: combinedString,
          items: fullTextItems,
        });
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    },
    [pdfDoc, zoomLevel]
  );

  // Trigger render of all pages when doc or zoom changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    for (let i = 1; i <= numPages; i++) {
      renderPage(i);
    }
  }, [pdfDoc, numPages, zoomLevel, renderPage]);

  // 3. Scroll tracking & active page detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollMid = scrollTop + containerHeight / 3;

      let foundPage = 1;
      for (let i = 1; i <= numPages; i++) {
        const pageEl = pageRefs.current.get(i);
        if (pageEl) {
          const top = pageEl.offsetTop;
          const height = pageEl.offsetHeight;
          if (top <= scrollMid && top + height > scrollMid) {
            foundPage = i;
            break;
          }
        }
      }

      if (foundPage !== currentPage) {
        onPageChange(foundPage, numPages);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages, currentPage, onPageChange]);

  // 4. Scroll to target page or mark
  const scrollToPage = useCallback((pageNum: number) => {
    const pageEl = pageRefs.current.get(pageNum);
    if (pageEl && containerRef.current) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (targetPageNumber && targetPageNumber >= 1 && targetPageNumber <= numPages) {
      scrollToPage(targetPageNumber);
    }
  }, [targetPageNumber, numPages, scrollToPage]);

  useEffect(() => {
    if (targetMark && targetMark.pageNumber) {
      scrollToPage(targetMark.pageNumber);
    }
  }, [targetMark, scrollToPage]);

  // 5. Handle Text Selection inside the PDF
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onTextSelected(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 3) {
      onTextSelected(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    // Detect which page container this selection is within
    let pageNumber = currentPage;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== containerRef.current) {
      if (node instanceof HTMLElement && node.dataset.pageNumber) {
        pageNumber = parseInt(node.dataset.pageNumber, 10);
        break;
      }
      node = node.parentNode;
    }

    const top = rect.top - containerRect.top + (containerRef.current?.scrollTop || 0) - 42;
    const left = rect.left - containerRect.left + rect.width / 2;

    onTextSelected({
      text,
      top: Math.max(top, 10),
      left: Math.max(Math.min(left, containerRect.width - 160), 120),
      pageNumber,
      paragraphId: `pdf-p${pageNumber}-${Date.now().toString(36)}`,
    });
  };

  // 6. In-Document Search Logic
  const handlePerformSearch = async (query: string) => {
    if (!query.trim() || !pdfDoc) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    setIsSearching(true);
    const matches: SearchMatch[] = [];
    const lowerQuery = query.toLowerCase();

    for (let p = 1; p <= numPages; p++) {
      let pageText = pagesTextCache.current.get(p)?.text;
      if (!pageText) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        pageText = textContent.items.map((it: any) => it.str || '').join(' ');
      }

      const lowerPage = pageText.toLowerCase();
      let matchIdx = lowerPage.indexOf(lowerQuery);
      while (matchIdx !== -1) {
        const startSnippet = Math.max(0, matchIdx - 20);
        const endSnippet = Math.min(pageText.length, matchIdx + query.length + 30);
        matches.push({
          pageIndex: p - 1,
          pageNumber: p,
          matchIndex: matchIdx,
          snippet: pageText.slice(startSnippet, endSnippet),
        });
        matchIdx = lowerPage.indexOf(lowerQuery, matchIdx + query.length);
      }
    }

    setSearchMatches(matches);
    setIsSearching(false);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      scrollToPage(matches[0].pageNumber);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToPage(searchMatches[nextIdx].pageNumber);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToPage(searchMatches[prevIdx].pageNumber);
  };

  return (
    <div className={`relative flex flex-col h-full w-full bg-[#f4f4f5] dark:bg-[#121212] overflow-hidden ${className}`}>
      {/* Floating Action Bars: Outline Drawer & Search Popup */}
      <div className="absolute top-3 right-5 z-30 flex items-center gap-2 select-none">
        {/* Toggle Document Outline */}
        {outline.length > 0 && (
          <button
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
            title="Document Bookmarks / Outline"
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-xs ${
              isOutlineOpen
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white'
                : 'bg-white dark:bg-[#1e1e1e] text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-[#282828]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Outline</span>
          </button>
        )}

        {/* Toggle Search Bar */}
        <button
          onClick={() => {
            setIsSearchOpen(!isSearchOpen);
            if (!isSearchOpen) {
              setTimeout(() => document.getElementById('pdf-search-input')?.focus(), 50);
            }
          }}
          title="Find in PDF"
          className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-xs ${
            isSearchOpen
              ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white'
              : 'bg-white dark:bg-[#1e1e1e] text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-[#282828]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find</span>
        </button>
      </div>

      {/* Floating In-Document Search Popover */}
      {isSearchOpen && (
        <div
          id="pdf-search-bar"
          className="absolute top-14 right-5 z-40 bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 shadow-xl flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
            <input
              id="pdf-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handlePerformSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNextMatch();
                if (e.key === 'Escape') setIsSearchOpen(false);
              }}
              placeholder="Find in document..."
              className="w-48 bg-stone-50 dark:bg-[#262626] border border-stone-200 dark:border-stone-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 min-w-16 justify-center">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : searchMatches.length > 0 ? (
              <span>
                {currentMatchIndex + 1} of {searchMatches.length}
              </span>
            ) : searchQuery.trim() ? (
              <span className="text-stone-400">0 found</span>
            ) : null}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrevMatch}
              disabled={searchMatches.length === 0}
              title="Previous Match (Shift+Enter)"
              className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2c2c2c] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={searchMatches.length === 0}
              title="Next Match (Enter)"
              className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2c2c2c] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2c2c2c]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Outline Sidebar */}
      {isOutlineOpen && outline.length > 0 && (
        <div
          id="pdf-outline-drawer"
          className="absolute top-14 right-5 bottom-8 z-40 w-72 bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xl flex flex-col select-none animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Table of Contents
            </span>
            <button
              onClick={() => setIsOutlineOpen(false)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
            {outline.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  scrollToPage(item.pageNumber);
                  setIsOutlineOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2a2a2a] flex items-center justify-between group transition-colors"
              >
                <span className="truncate pr-2">{item.title}</span>
                <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 shrink-0">
                  p.{item.pageNumber}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Scrollable Canvas & Text Layer Pages Container */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="flex-1 w-full h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center select-text relative"
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-stone-500" />
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Rendering high-resolution PDF pages...
            </p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="max-w-md my-12 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-red-900 dark:text-red-300">
                Failed to render PDF
              </h3>
              <p className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* PDF Page Frames */}
        {!loading && !error && numPages > 0 && (
          <div className="space-y-6 pb-16 flex flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                id={`pdf-page-${pageNum}`}
                data-page-number={pageNum}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el);
                  else pageRefs.current.delete(pageNum);
                }}
                className="relative bg-white dark:bg-[#1a1a1a] shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-xs border border-stone-200 dark:border-stone-800 transition-shadow select-text"
              >
                {/* Canvas Render Surface */}
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(pageNum, el);
                    else canvasRefs.current.delete(pageNum);
                  }}
                  className="block rounded-xs pointer-events-none"
                />

                {/* Page Number Label Watermark in Bottom Corner */}
                <div className="absolute bottom-2 right-3 text-[10px] font-mono text-stone-400 dark:text-stone-600 select-none pointer-events-none opacity-60">
                  {pageNum}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global CSS for PDF Text Selection Layer */}
      <style>{`
        .pdf-text-layer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0.25;
          line-height: 1;
          pointer-events: auto;
          user-select: text;
          -webkit-user-select: text;
        }
        .pdf-text-layer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .pdf-text-layer ::selection {
          background: rgba(16, 185, 129, 0.4);
          color: transparent;
        }
      `}</style>
    </div>
  );
}
