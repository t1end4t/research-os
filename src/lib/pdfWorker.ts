import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Use worker from unpkg CDN matching the installed pdfjs-dist version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker initialization fallback:', e);
  }
}

export { pdfjsLib };
