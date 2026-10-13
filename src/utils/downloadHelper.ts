import { Book } from '../types';

export interface DownloadProgress {
  bookId: string;
  loaded: number;
  total: number;
  percent: number;
  status: 'starting' | 'downloading' | 'completed' | 'error';
  errorMessage?: string;
  filename: string;
}

export function generateSafePdfFilename(book: Book): string {
  const cleanTitle = book.title
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  const cleanMedium = book.medium ? `-${book.medium}` : '';
  return `Class-${book.classNumber}-${cleanTitle}${cleanMedium}.pdf`;
}

export async function downloadBookDirectly(
  book: Book,
  onProgress?: (progress: DownloadProgress) => void
): Promise<boolean> {
  const filename = generateSafePdfFilename(book);

  if (!book.officialId && !book.pdfUrl) {
    onProgress?.({
      bookId: book.id,
      loaded: 0,
      total: 0,
      percent: 0,
      status: 'error',
      errorMessage: 'Book PDF is not available yet.',
      filename,
    });
    return false;
  }

  // Use backend direct download endpoint for reliable single-origin attachment streaming without opening extra tabs
  const downloadEndpoint = book.officialId
    ? `/api/pdf/download?id=${encodeURIComponent(book.officialId)}&filename=${encodeURIComponent(filename)}`
    : `/api/pdf/download?url=${encodeURIComponent(book.pdfUrl || '')}&filename=${encodeURIComponent(filename)}`;

  onProgress?.({
    bookId: book.id,
    loaded: 0,
    total: 0,
    percent: 0,
    status: 'starting',
    filename,
  });

  try {
    const response = await fetch(downloadEndpoint);

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch {
        // use fallback status text
      }
      throw new Error(errorMsg);
    }

    const contentLengthHeader = response.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
      // Fallback if ReadableStream is not available
      const blob = await response.blob();
      triggerBrowserDownload(blob, filename);
      onProgress?.({
        bookId: book.id,
        loaded: blob.size,
        total: blob.size,
        percent: 100,
        status: 'completed',
        filename,
      });
      return true;
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        receivedBytes += value.length;

        const percent = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 0;
        onProgress?.({
          bookId: book.id,
          loaded: receivedBytes,
          total: totalBytes,
          percent,
          status: 'downloading',
          filename,
        });
      }
    }

    // Verify PDF header magic bytes (%PDF) to prevent saving HTML error pages as .pdf
    if (chunks.length > 0 && chunks[0].length >= 4) {
      const firstBytes = String.fromCharCode(...chunks[0].slice(0, 4));
      if (!firstBytes.startsWith('%PDF')) {
        throw new Error('Downloaded content is not a valid PDF document (official server may be temporarily busy).');
      }
    }

    // Combine chunks into Blob
    const combinedBlob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
    triggerBrowserDownload(combinedBlob, filename);

    onProgress?.({
      bookId: book.id,
      loaded: receivedBytes,
      total: totalBytes || receivedBytes,
      percent: 100,
      status: 'completed',
      filename,
    });

    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Download failed';
    console.error(`Failed to download ${filename}:`, message);

    onProgress?.({
      bookId: book.id,
      loaded: 0,
      total: 0,
      percent: 0,
      status: 'error',
      errorMessage: message,
      filename,
    });
    return false;
  }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
