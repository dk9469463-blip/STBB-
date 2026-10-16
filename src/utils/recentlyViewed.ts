import { Book } from '../types';

const STORAGE_KEY = 'stbb_recently_viewed_v1';
const MAX_RECENT_BOOKS = 8;

export function recordRecentlyViewedBook(book: Book): void {
  if (typeof window === 'undefined' || !book?.id) return;

  try {
    const current = getRecentlyViewedBookIds();
    const next = [book.id, ...current.filter((id) => id !== book.id)].slice(0, MAX_RECENT_BOOKS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Recent history is an enhancement; do not interrupt reading if storage is unavailable.
  }
}

export function getRecentlyViewedBookIds(validBookIds?: ReadonlySet<string>): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const ids = parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
    const cleaned = validBookIds ? ids.filter((id) => validBookIds.has(id)) : ids;
    const unique = [...new Set(cleaned)].slice(0, MAX_RECENT_BOOKS);

    if (JSON.stringify(unique) !== JSON.stringify(ids)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    }

    return unique;
  } catch {
    return [];
  }
}
