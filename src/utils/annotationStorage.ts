import { AnnotationStroke } from '../types/annotations';

const ANNOTATION_KEY_PREFIX = 'stbb_annotations_v2_';
const BOOKMARK_KEY_PREFIX = 'stbb_bookmarks_v1_';

export function getAnnotationStorageKey(bookId: string, pageNumber: number): string {
  const sanitizedId = bookId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${ANNOTATION_KEY_PREFIX}${sanitizedId}_p${pageNumber}`;
}

export function getBookmarkStorageKey(bookId: string): string {
  const sanitizedId = bookId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${BOOKMARK_KEY_PREFIX}${sanitizedId}`;
}

export function getStoredPageAnnotations(bookId: string, pageNumber: number): AnnotationStroke[] {
  try {
    const key = getAnnotationStorageKey(bookId, pageNumber);
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Could not read annotations for book ${bookId} page ${pageNumber}:`, err);
    return [];
  }
}

export function saveStoredPageAnnotations(
  bookId: string,
  pageNumber: number,
  strokes: AnnotationStroke[]
): void {
  try {
    const key = getAnnotationStorageKey(bookId, pageNumber);
    if (strokes.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(strokes));
    }
  } catch (err) {
    console.warn(`Could not save annotations for book ${bookId} page ${pageNumber}:`, err);
  }
}

export function clearStoredPageAnnotations(bookId: string, pageNumber: number): void {
  try {
    const key = getAnnotationStorageKey(bookId, pageNumber);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Could not clear annotations for book ${bookId} page ${pageNumber}:`, err);
  }
}

export function getStoredBookmarks(bookId: string): number[] {
  try {
    const key = getBookmarkStorageKey(bookId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Could not read bookmarks for book ${bookId}:`, err);
    return [];
  }
}

export function toggleStoredBookmark(bookId: string, pageNumber: number): number[] {
  try {
    const key = getBookmarkStorageKey(bookId);
    const current = getStoredBookmarks(bookId);
    let updated: number[];
    if (current.includes(pageNumber)) {
      updated = current.filter((p) => p !== pageNumber);
    } else {
      updated = [...current, pageNumber].sort((a, b) => a - b);
    }
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn(`Could not toggle bookmark for book ${bookId}:`, err);
    return [];
  }
}
