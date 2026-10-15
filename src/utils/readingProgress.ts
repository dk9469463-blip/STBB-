export interface StoredReadingProgress {
  bookId: string;
  pageNumber: number;
  updatedAt: number;
}

const STORAGE_KEY = 'stbb_reading_progress_v1';

type ReadingProgressMap = Record<string, StoredReadingProgress>;

function readProgressMap(): ReadingProgressMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const result: ReadingProgressMap = {};
    for (const [bookId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue;

      const item = value as Partial<StoredReadingProgress>;
      if (
        typeof bookId === 'string' &&
        typeof item.pageNumber === 'number' &&
        Number.isFinite(item.pageNumber) &&
        item.pageNumber >= 1
      ) {
        result[bookId] = {
          bookId,
          pageNumber: Math.floor(item.pageNumber),
          updatedAt:
            typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt)
              ? item.updatedAt
              : 0,
        };
      }
    }
    return result;
  } catch {
    // localStorage may be unavailable in private browsing or restricted contexts.
    return {};
  }
}

function writeProgressMap(progress: ReadingProgressMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Keep the reader usable if storage is full or disabled.
  }
}

export function getStoredReadingPage(bookId: string): number | null {
  const entry = readProgressMap()[bookId];
  return entry ? entry.pageNumber : null;
}

export function saveReadingProgress(bookId: string, pageNumber: number): void {
  if (!bookId || !Number.isFinite(pageNumber) || pageNumber < 1) return;

  const progress = readProgressMap();
  progress[bookId] = {
    bookId,
    pageNumber: Math.floor(pageNumber),
    updatedAt: Date.now(),
  };
  writeProgressMap(progress);
}

export function getMostRecentReadingProgress(
  validBookIds?: ReadonlySet<string>
): StoredReadingProgress | null {
  const progress = readProgressMap();
  let changed = false;

  if (validBookIds) {
    for (const bookId of Object.keys(progress)) {
      if (!validBookIds.has(bookId)) {
        delete progress[bookId];
        changed = true;
      }
    }
  }

  if (changed) writeProgressMap(progress);

  const entries = Object.values(progress);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b.updatedAt - a.updatedAt);
  return entries[0];
}
