import * as pdfjsLib from 'pdfjs-dist';
import type { Book } from '../types';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

/**
 * Render one selected textbook PDF page to a compact JPEG data URL.
 * This lets the AI read scanned pages when they contain no selectable text.
 */
export async function captureBookPdfPage(
  book: Book,
  pageNumber: number
): Promise<string> {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Error('Enter a valid PDF page number.');
  }

  const url = book.driveFileId
    ? '/api/pdf/drive-stream?id=' + encodeURIComponent(book.driveFileId)
    : book.officialId
      ? '/api/pdf/stream?id=' + encodeURIComponent(book.officialId)
      : '/api/pdf/stream?url=' + encodeURIComponent(book.pdfUrl || '');

  const loadingTask = pdfjsLib.getDocument({
    url,
    withCredentials: false,
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    disableAutoFetch: true,
    disableStream: false,
    rangeChunkSize: 128 * 1024,
  });

  let canvas: HTMLCanvasElement | null = null;

  try {
    const pdf = await loadingTask.promise;
    if (pageNumber > pdf.numPages) {
      throw new Error('That PDF page number is higher than the page count of this book.');
    }

    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1400 / baseViewport.width);
    const viewport = page.getViewport({ scale });

    canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not prepare the page image in this browser.');
    }

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    try {
      await loadingTask.destroy();
    } catch {
      // Ignore normal PDF.js cleanup races after rendering.
    }
  }
}
