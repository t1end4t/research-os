import React, { useState } from 'react';
import { PaperDoc } from '../../types';
import { Globe, Link as LinkIcon, X, AlertCircle, Loader2, Download } from 'lucide-react';

interface ArxivImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPaper: (paper: PaperDoc) => void;
}

export function ArxivImportModal({ isOpen, onClose, onAddPaper }: ArxivImportModalProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = inputUrl.trim();
      let paperId = `paper-arxiv-${Date.now().toString(36)}`;
      let defaultTitle = 'Research Paper';
      let defaultAuthors = 'arXiv Author';
      let defaultCitation = 'arXiv Preprint';
      let year = new Date().getFullYear();

      // Check if arXiv ID
      const arxivMatch = query.match(/(\d{4}\.\d{4,5})/);
      if (arxivMatch) {
        paperId = `arxiv-${arxivMatch[1]}`;
        defaultCitation = `arXiv:${arxivMatch[1]}`;
      }

      // Fetch PDF via backend proxy
      const proxyUrl = `/api/pdf/proxy?url=${encodeURIComponent(query)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF (${response.status}: ${response.statusText})`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      if (uint8.length < 100) {
        throw new Error('Received invalid or empty PDF file.');
      }

      // Quick title guess
      if (arxivMatch) {
        defaultTitle = `arXiv:${arxivMatch[1]} Document`;
      } else {
        try {
          const u = new URL(query);
          const pathname = u.pathname;
          defaultTitle = pathname.split('/').pop()?.replace('.pdf', '') || 'Web Research Paper';
        } catch {
          // ignore
        }
      }

      const newPaper: PaperDoc = {
        id: paperId,
        title: defaultTitle,
        authors: defaultAuthors,
        year: year,
        citation: defaultCitation,
        pageCount: 1, // Will be updated on render
        abstract: `Imported from ${query}`,
        sections: [
          {
            id: 'sec-full',
            heading: 'Document',
            paragraphs: [
              {
                id: `${paperId}-par-1`,
                text: defaultTitle,
              },
            ],
          },
        ],
        initialMarks: [],
        pdfData: uint8,
        sourceType: 'arxiv',
      };

      onAddPaper(newPaper);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Open from arXiv or Web PDF
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFetchPaper} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
              arXiv ID or PDF URL *
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="e.g. 1706.03762 or https://arxiv.org/abs/2312.00752"
                className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg pl-9 pr-3 py-2 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Enter any arXiv identifier (e.g. 1706.03762) or direct https link to a research PDF.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#282828] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputUrl.trim() || isLoading}
              className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Load Paper</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
