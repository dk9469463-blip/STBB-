import { Book } from '../types';

export interface OfflineBookRecord {
  bookId: string;
  title: string;
  classNumber: number;
  subjectName: string;
  medium: string;
  savedAt: number;
  // Existing saved books from database v1 store the Blob directly. New saves
  // keep metadata here and store the PDF as smaller Blob chunks.
  blob?: Blob;
}

interface OfflineBookChunkRecord {
  bookId: string;
  chunkIndex: number;
  blob: Blob;
}

export interface OfflineSaveProgress {
  loaded: number;
  total: number;
  percent: number | null;
  attempt?: number;
}

const DATABASE_NAME = 'stbb-offline-books';
const DATABASE_VERSION = 2;
const BOOKS_STORE = 'books';
const CHUNKS_STORE = 'bookChunks';
const DOWNLOAD_CHUNK_BYTES = 4 * 1024 * 1024;
// A larger safety ceiling now that file data is written as small IndexedDB Blobs
// instead of retaining the entire PDF in JavaScript memory. Storage quota is
// also checked below where the browser supports the Storage API.
const MAX_OFFLINE_BOOK_BYTES = 512 * 1024 * 1024;

let databasePromise: Promise<IDBDatabase> | null = null;
let savedBookIdsPromise: Promise<Set<string>> | null = null;

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
      if (!database.objectStoreNames.contains(CHUNKS_STORE)) {
        database.createObjectStore(CHUNKS_STORE, { keyPath: ['bookId', 'chunkIndex'] });
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

function putOfflineChunk(record: OfflineBookChunkRecord): Promise<void> {
  return openDatabase().then((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CHUNKS_STORE, 'readwrite');
    transaction.objectStore(CHUNKS_STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not save a PDF chunk.'));
    transaction.onabort = () => reject(transaction.error || new Error('Saving a PDF chunk was cancelled.'));
  }));
}

function getOfflineChunks(bookId: string): Promise<OfflineBookChunkRecord[]> {
  return openDatabase().then((database) => new Promise<OfflineBookChunkRecord[]>((resolve, reject) => {
    const transaction = database.transaction(CHUNKS_STORE, 'readonly');
    const range = IDBKeyRange.bound([bookId, 0], [bookId, Number.MAX_SAFE_INTEGER]);
    const request = transaction.objectStore(CHUNKS_STORE).getAll(range);
    request.onsuccess = () => resolve(request.result as OfflineBookChunkRecord[]);
    request.onerror = () => reject(request.error || new Error('Could not read the saved offline book.'));
  }));
}

function deleteOfflineChunks(bookId: string): Promise<void> {
  return openDatabase().then((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CHUNKS_STORE, 'readwrite');
    const store = transaction.objectStore(CHUNKS_STORE);
    const range = IDBKeyRange.bound([bookId, 0], [bookId, Number.MAX_SAFE_INTEGER]);
    const request = store.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    request.onerror = () => reject(request.error || new Error('Could not clean up the incomplete offline download.'));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not clean up the incomplete offline download.'));
    transaction.onabort = () => reject(transaction.error || new Error('Offline cleanup was cancelled.'));
  }));
}

function streamUrlForBook(book: Book): string {
  if (book.driveFileId) return `/api/pdf/drive-stream?id=${encodeURIComponent(book.driveFileId)}`;
  if (book.officialId) return `/api/pdf/stream?id=${encodeURIComponent(book.officialId)}`;
  if (book.pdfUrl) return `/api/pdf/stream?url=${encodeURIComponent(book.pdfUrl)}`;
  throw new Error('A PDF link is not available for this textbook yet.');
}

async function assertStorageAvailable(requiredBytes: number): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;

  const estimate = await navigator.storage.estimate().catch(() => undefined);
  if (!estimate?.quota || estimate.usage === undefined) return;

  const free = Math.max(0, estimate.quota - estimate.usage);
  // Keep a margin because browsers may reserve some storage for other site data.
  if (requiredBytes > 0 && requiredBytes > free * 0.85) {
    throw new Error('There is not enough browser storage for this book. Remove saved offline books or use Download.');
  }
}

async function saveBookForOfflineAttempt(
  book: Book,
  onProgress: ((progress: OfflineSaveProgress) => void) | undefined,
  attempt: number
): Promise<void> {
  // Clear leftovers from an earlier interrupted attempt before starting again.
  await deleteOfflineChunks(book.id);
  onProgress?.({ loaded: 0, total: 0, percent: null, attempt });

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
    throw new Error('This PDF is larger than the 512 MiB offline limit. Use the regular Download button instead.');
  }
  await assertStorageAvailable(contentLength);

  let loaded = 0;
  let chunkIndex = 0;
  const header = new Uint8Array(4);
  let headerBytes = 0;

  const persistChunk = async (parts: Uint8Array[], partBytes: number): Promise<void> => {
    if (partBytes === 0) return;
    const blobParts: BlobPart[] = parts.map((part) => {
      const copy = new Uint8Array(part.byteLength);
      copy.set(part);
      return copy.buffer;
    });
    await putOfflineChunk({
      bookId: book.id,
      chunkIndex,
      blob: new Blob(blobParts, { type: 'application/pdf' }),
    });
    chunkIndex += 1;
  };

  const reader = response.body?.getReader();

  if (!reader) {
    // Compatibility fallback for browsers without a readable response stream.
    const blob = await response.blob();
    if (blob.size > MAX_OFFLINE_BOOK_BYTES) {
      throw new Error('This PDF is larger than the 512 MiB offline limit. Use the regular Download button instead.');
    }
    await assertStorageAvailable(blob.size);
    if (blob.size < 4) throw new Error('The downloaded file is empty or incomplete.');
    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (String.fromCharCode(...signature) !== '%PDF') {
      throw new Error('The downloaded content is not a valid PDF file.');
    }

    for (let offset = 0; offset < blob.size; offset += DOWNLOAD_CHUNK_BYTES) {
      const part = blob.slice(offset, Math.min(offset + DOWNLOAD_CHUNK_BYTES, blob.size), 'application/pdf');
      await putOfflineChunk({ bookId: book.id, chunkIndex, blob: part });
      chunkIndex += 1;
      loaded = Math.min(offset + DOWNLOAD_CHUNK_BYTES, blob.size);
      onProgress?.({
        loaded,
        total: blob.size,
        percent: Math.min(99, Math.round((loaded / blob.size) * 100)),
        attempt,
      });
    }
  } else {
    let pendingParts: Uint8Array[] = [];
    let pendingBytes = 0;

    const flushPending = async (): Promise<void> => {
      if (!pendingBytes) return;
      await persistChunk(pendingParts, pendingBytes);
      pendingParts = [];
      pendingBytes = 0;
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        loaded += value.byteLength;
        if (loaded > MAX_OFFLINE_BOOK_BYTES) {
          await reader.cancel();
          throw new Error('This PDF is larger than the 512 MiB offline limit. Use the regular Download button instead.');
        }

        if (headerBytes < header.length) {
          const copyLength = Math.min(header.length - headerBytes, value.byteLength);
          header.set(value.subarray(0, copyLength), headerBytes);
          headerBytes += copyLength;
        }

        pendingParts.push(value);
        pendingBytes += value.byteLength;

        if (pendingBytes >= DOWNLOAD_CHUNK_BYTES) {
          await flushPending();
        }

        onProgress?.({
          loaded,
          total: contentLength,
          percent: contentLength > 0 ? Math.min(99, Math.round((loaded / contentLength) * 100)) : null,
          attempt,
        });

        // If content-length is missing or inaccurate, avoid filling storage
        // indefinitely. Check free quota occasionally while streaming.
        if (loaded % (32 * 1024 * 1024) < value.byteLength) {
          await assertStorageAvailable(DOWNLOAD_CHUNK_BYTES);
        }
      }
      await flushPending();
    } finally {
      reader.releaseLock();
    }

    if (loaded < 4 || headerBytes < 4) {
      throw new Error('The downloaded file is empty or incomplete.');
    }
    if (String.fromCharCode(...header) !== '%PDF') {
      throw new Error('The downloaded content is not a valid PDF file.');
    }
  }

  if (loaded < 4) throw new Error('The downloaded file is empty or incomplete.');

  const record: OfflineBookRecord = {
    bookId: book.id,
    title: book.title,
    classNumber: book.classNumber,
    subjectName: book.subjectName,
    medium: book.medium,
    savedAt: Date.now(),
  };

  // Publish the metadata only after all chunks have been written and validated;
  // incomplete downloads therefore never appear as saved books.
  await runTransaction('readwrite', (store) => store.put(record));
  savedBookIdsPromise = null;
  onProgress?.({ loaded, total: contentLength || loaded, percent: 100, attempt });
}

function isRetryableOfflineSaveError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /HTTP (408|425|429|500|502|503|504)\b|failed to fetch|networkerror|network request failed|connection reset|socket hang up|timed? ?out/i.test(message);
}

/**
 * Slow or unstable connections get up to three attempts. Download data is stored
 * in 4 MiB IndexedDB chunks as it arrives, instead of collecting the full PDF in RAM.
 */
export async function saveBookForOffline(
  book: Book,
  onProgress?: (progress: OfflineSaveProgress) => void
): Promise<void> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await saveBookForOfflineAttempt(book, onProgress, attempt);
      return;
    } catch (error) {
      await deleteOfflineChunks(book.id).catch(() => undefined);
      if (attempt >= maxAttempts || !isRetryableOfflineSaveError(error)) {
        throw error;
      }

      onProgress?.({ loaded: 0, total: 0, percent: null, attempt: attempt + 1 });
      await new Promise<void>((resolve) => window.setTimeout(resolve, 900 * attempt));
    }
  }
}

export async function getOfflineBookBlob(bookId: string): Promise<Blob | null> {
  const record = await runTransaction<OfflineBookRecord | undefined>('readonly', (store) => store.get(bookId));
  if (!record) return null;

  // Preserve compatibility with books saved by the earlier database format.
  if (record.blob instanceof Blob) return record.blob;

  const chunks = await getOfflineChunks(bookId);
  if (!chunks.length) return null;
  return new Blob(chunks.map((chunk) => chunk.blob), { type: 'application/pdf' });
}

export async function getOfflineBooks(): Promise<OfflineBookRecord[]> {
  const records = await runTransaction<OfflineBookRecord[]>('readonly', (store) => store.getAll());
  return records.sort((a, b) => b.savedAt - a.savedAt);
}

export async function isBookSavedOffline(bookId: string): Promise<boolean> {
  if (!savedBookIdsPromise) {
    savedBookIdsPromise = getOfflineBooks()
      .then((records) => new Set(records.map((record) => record.bookId)))
      .catch((error) => {
        savedBookIdsPromise = null;
        throw error;
      });
  }
  return (await savedBookIdsPromise).has(bookId);
}

export async function removeOfflineBook(bookId: string): Promise<void> {
  await runTransaction<undefined>('readwrite', (store) => store.delete(bookId));
  await deleteOfflineChunks(bookId);
  savedBookIdsPromise = null;
}
