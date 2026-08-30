import React, { useState, useRef } from 'react';
import { pdfjsLib } from '../../lib/pdfWorker';
import { PaperDoc } from '../../types';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPaper: (paper: PaperDoc) => void;
}

export function UploadPdfModal({ isOpen, onClose, onAddPaper }: UploadPdfModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<Uint8Array | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [citation, setCitation] = useState('');
  const [pageCount, setPageCount] = useState<number>(1);
  const [abstractText, setAbstractText] = useState('');

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setIsParsing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      setPdfBuffer(uint8);

      // Inspect with PDF.js
      const doc = await pdfjsLib.getDocument({ data: uint8.slice() }).promise;
      setPageCount(doc.numPages);

      let extractedTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      let extractedAuthor = 'Unknown Author';

      try {
        const metadata = await doc.getMetadata();
        if (metadata?.info) {
          const info = metadata.info as any;
          if (info.Title && typeof info.Title === 'string' && info.Title.trim().length > 3) {
            extractedTitle = info.Title.trim();
          }
          if (info.Author && typeof info.Author === 'string') {
            extractedAuthor = info.Author.trim();
          }
          if (info.CreationDate) {
            const match = String(info.CreationDate).match(/D:(\d{4})/);
            if (match) setYear(parseInt(match[1], 10));
          }
        }
      } catch {
        // Metadata is optional
      }

      // Try reading page 1 text to get clean abstract or title
      try {
        const page1 = await doc.getPage(1);
        const textContent = await page1.getTextContent();
        const fullText = textContent.items.map((it: any) => it.str || '').join(' ');
        const abstractMatch = fullText.match(/abstract[:\s]+(.*?)(?=\n\n|\b(1|I)\.?\s+Introduction|\bkeywords|\bindex terms|$)/i);
        if (abstractMatch && abstractMatch[1].length > 40) {
          setAbstractText(abstractMatch[1].trim().slice(0, 500) + '...');
        }
      } catch {
        // Page 1 inspection optional
      }

      setTitle(extractedTitle);
      setAuthors(extractedAuthor);
      setCitation(`${extractedAuthor.split(' ')[0]} et al. (${year})`);
      setIsParsing(false);
    } catch (err) {
      console.error('Failed to parse PDF:', err);
      setError(err instanceof Error ? err.message : 'Could not read PDF structure');
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pdfBuffer) return;

    const paperId = `paper-upload-${Date.now().toString(36)}`;
    const newPaper: PaperDoc = {
      id: paperId,
      title: title.trim(),
      authors: authors.trim() || 'Author',
      year: year || new Date().getFullYear(),
      citation: citation.trim() || `${authors.split(' ')[0]} (${year})`,
      pageCount: pageCount || 1,
      abstract: abstractText.trim() || 'Uploaded research paper document.',
      sections: [
        {
          id: 'sec-full',
          heading: 'Full Document Text',
          paragraphs: [
            {
              id: `${paperId}-par-1`,
              text: title.trim(),
            },
          ],
        },
      ],
      initialMarks: [],
      pdfData: pdfBuffer,
      sourceType: 'uploaded',
    };

    onAddPaper(newPaper);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Upload Research Paper (PDF)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag & Drop Box */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-3 ${
              isDragging
                ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-[#252525]'
                : 'border-stone-300 dark:border-stone-700 hover:bg-stone-50/60 dark:hover:bg-[#222]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-[#2a2a2a] flex items-center justify-center text-stone-600 dark:text-stone-400">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                Click to browse or drop PDF here
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Supports all standard publication and preprint PDFs
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-[#242424] rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2.5 truncate">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPdfBuffer(null);
              }}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline shrink-0 ml-2"
            >
              Change
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metadata Form */}
        {selectedFile && !isParsing && (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
                Paper Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Attention Is All You Need"
                className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
                  Authors
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Vaswani, A. et al."
                  className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
                  className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
                Citation / Source
              </label>
              <input
                type="text"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                placeholder="e.g. NeurIPS 2017"
                className="w-full bg-stone-50 dark:bg-[#252525] border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>

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
                disabled={!title.trim() || !pdfBuffer}
                className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Open in Reader
              </button>
            </div>
          </form>
        )}

        {isParsing && (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing PDF structure and pages...</span>
          </div>
        )}
      </div>
    </div>
  );
}
