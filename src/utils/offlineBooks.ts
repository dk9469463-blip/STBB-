import { Book } from '../types';

export interface OfflineBookRecord {
  bookId: string;
  title: string;
  classNumber: number;
  subjectName: string;
  medium: string;
  savedAt: number;
  blob: Blob;
}

export interface OfflineSaveProgress {
  loaded: number;
  total: number;
  percent: number | null;
}

const DATABASE_NAME = 'stbb-offline-books';
const DATABASE_VERSION = 1;
const BOOKS_STORE = 'books';
// Protect browser memory on devices with limited RAM. Very large books remain available
// through the normal Download button, which uses the browser's native download manager.
const MAX_OFFLINE_BOOK_BYTES = 150 * 1024 * 1024;

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Offline book storage is not supported in this browser.'));
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BOOKS_STORE)) {
        database.createObjectStore(BOOKS_STORE, { keyPath: 'bookId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error('Could not open offline book storage.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('Close older STBB Books tabs to enable offline storage.'));
    };
  });

  return databasePromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(BOOKS_STORE, mode);
    const request = action(transaction.objectStore(BOOKS_STORE));
    let result: T;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => {
      reject(request.error || new Error('Offline storage operation failed.'));
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => {
      reject(transaction.error || request.error || new Error('Offline storage operation failed.'));
    };
    transaction.onabort = () => {
      reject(transaction.error || new Error('Offline storage operation was cancelled.'));
    };
  }));
}

function streamUrlForBook(book: Book): string {
  if (book.driveFileId) return `/api/pdf/drive-stream?id=${encodeURIComponent(book.driveFileId)}`;
  if (book.officialId) return `/api/pdf/stream?id=${encodeURIComponent(book.officialId)}`;
  if (book.pdfUrl) return `/api/pdf/stream?url=${encodeURIComponent(book.pdfUrl)}`;
  throw new Error('A PDF link is not available for this textbook yet.');
}

export async function saveBookForOffline(
  book: Book,
  onProgress?: (progress: OfflineSaveProgress) => void
): Promise<void> {
  onProgress?.({ loaded: 0, total: 0, percent: null });

  const response = await fetch(streamUrlForBook(book), {
    headers: { Accept: 'application/pdf, application/octet-stream' },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `Textbook server returned HTTP ${response.status}.`;
    try {
      const data = await response.json();
      if (typeof data.error === 'string') message = data.error;
    } catch {
      // Keep the status-based message when no JSON error is provided.
    }
    throw new Error(message);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
    throw new Error('The server did not return a PDF file.');
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_OFFLINE_BOOK_BYTES) {
    throw new Error('This PDF is too large to keep safely inside the app. Use the regular Download button instead.');
  }

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate().catch(() => undefined);
    if (estimate?.quota && estimate.usage !== undefined && contentLength > 0) {
      const free = Math.max(0, estimate.quota - estimate.usage);
      if (contentLength > free * 0.85) {
        throw new Error('There is not enough browser storage for this book. Remove saved offline books or use Download.');
      }
    }
  }

  let blob: Blob;
  const reader = response.body?.getReader();

  if (!reader) {
    blob = await response.blob();
    if (blob.size > MAX_OFFLINE_BOOK_BYTES) {
      throw new Error('This PDF is too large to keep safely inside the app. Use the regular Download button instead.');
    }
    onProgress?.({ loaded: blob.size, total: blob.size, percent: 100 });
  } else {
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        loaded += value.byteLength;
        if (loaded > MAX_OFFLINE_BOOK_BYTES) {
          await reader.cancel();
          throw new Error('This PDF is too large to keep safely inside the app. Use the regular Download button instead.');
        }

        chunks.push(value);
        onProgress?.({
          loaded,
          total: contentLength,
          percent: contentLength > 0 ? Math.min(99, Math.round((loaded / contentLength) * 100)) : null,
        });
      }
    } finally {
      reader.releaseLock();
    }

    blob = new Blob(chunks, { type: 'application/pdf' });
    if (blob.size < 4) throw new Error('The downloaded file is empty or incomplete.');

    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (String.fromCharCode(...signature) !== '%PDF') {
      throw new Error('The downloaded content is not a valid PDF file.');
    }
    onProgress?.({ loaded: blob.size, total: blob.size, percent: 100 });
  }

  const record: OfflineBookRecord = {
    bookId: book.id,
    title: book.title,
    classNumber: book.classNumber,
    subjectName: book.subjectName,
    medium: book.medium,
    savedAt: Date.now(),
    blob,
  };

  await runTransaction('readwrite', (store) => store.put(record));
}

export async function getOfflineBookBlob(bookId: string): Promise<Blob | null> {
  const record = await runTransaction<OfflineBookRecord | undefined>('readonly', (store) => store.get(bookId));
  return record?.blob instanceof Blob ? record.blob : null;
}

export async function getOfflineBooks(): Promise<OfflineBookRecord[]> {
  const records = await runTransaction<OfflineBookRecord[]>('readonly', (store) => store.getAll());
  return records.sort((a, b) => b.savedAt - a.savedAt);
}

export async function isBookSavedOffline(bookId: string): Promise<boolean> {
  const record = await runTransaction<OfflineBookRecord | undefined>('readonly', (store) => store.get(bookId));
  return Boolean(record?.blob instanceof Blob);
}

export async function removeOfflineBook(bookId: string): Promise<void> {
  await runTransaction<undefined>('readwrite', (store) => store.delete(bookId));
}
