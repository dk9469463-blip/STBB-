import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ALL_VERIFIED_BOOKS } from './src/data/stbbData';
import type { Book } from './src/types';

export interface AssistantBookContext {
  bookId?: string;
  officialId?: string;
  classNumber?: number;
  subjectName?: string;
  bookTitle?: string;
  medium?: string;
  chapter?: string;
  exercise?: string;
  pageNumber?: number;
  questionNumber?: string;
  selectedText?: string;
}

export interface AssistantSource {
  title: string;
  url: string;
  detail?: string;
}

export interface ResolvedAssistantBook {
  book: Book | null;
  candidates: Book[];
}

export interface RetrievedTextbookMaterial {
  pages: Array<{ pageNumber: number; text: string }>;
  pageCount: number;
  error?: string;
}

interface CachedBookText {
  pageCount: number;
  pages: Map<number, string>;
  touchedAt: number;
}

const assistantBookTextCache = new Map<string, CachedBookText>();
const MAX_ASSISTANT_BOOK_CACHES = 4;
const MAX_CACHED_PAGES_PER_BOOK = 280;
const OFFICIAL_HOSTS = new Set(['portal.stbb.edu.pk', 'ebooks.stbb.edu.pk']);

export function normalizeAssistantText(value: unknown): string {
  return typeof value === 'string'
    ? value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s.-]/gu, ' ').replace(/\s+/g, ' ').trim()
    : '';
}

function inferClassNumber(prompt: string): number | undefined {
  const patterns = [
    /\b(?:class|grade|standard|std\.?)\s*(1[0-2]|[1-9])\b/i,
    /\b(1[0-2]|[1-9])(?:st|nd|rd|th)\s*(?:class|grade|standard)\b/i,
    /\b(?:class|grade|standard)\s+(?:i{1,3}|iv|v|vi{0,3}|ix|x|xi|xii)\b/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match) continue;
    if (match[1]) return Number(match[1]);

    const roman = match[0].toLowerCase().replace(/^(?:class|grade|standard)\s+/i, '').trim();
    const romanMap: Record<string, number> = {
      i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
    };
    if (romanMap[roman]) return romanMap[roman];
  }

  const wordClasses: Array<{ number: number; pattern: RegExp }> = [
    { number: 1, pattern: /\b(?:class|grade|standard)\s+(?:one|first)\b|\b(?:one|first)\s+(?:class|grade|standard)\b/i },
    { number: 2, pattern: /\b(?:class|grade|standard)\s+(?:two|second)\b|\b(?:two|second)\s+(?:class|grade|standard)\b/i },
    { number: 3, pattern: /\b(?:class|grade|standard)\s+(?:three|third)\b|\b(?:three|third)\s+(?:class|grade|standard)\b/i },
    { number: 4, pattern: /\b(?:class|grade|standard)\s+(?:four|fourth)\b|\b(?:four|fourth)\s+(?:class|grade|standard)\b/i },
    { number: 5, pattern: /\b(?:class|grade|standard)\s+(?:five|fifth)\b|\b(?:five|fifth)\s+(?:class|grade|standard)\b/i },
    { number: 6, pattern: /\b(?:class|grade|standard)\s+(?:six|sixth)\b|\b(?:six|sixth)\s+(?:class|grade|standard)\b/i },
    { number: 7, pattern: /\b(?:class|grade|standard)\s+(?:seven|seventh)\b|\b(?:seven|seventh)\s+(?:class|grade|standard)\b/i },
    { number: 8, pattern: /\b(?:class|grade|standard)\s+(?:eight|eighth)\b|\b(?:eight|eighth)\s+(?:class|grade|standard)\b/i },
    { number: 9, pattern: /\b(?:class|grade|standard)\s+(?:nine|ninth)\b|\b(?:nine|ninth)\s+(?:class|grade|standard)\b|\b9th\b/i },
    { number: 10, pattern: /\b(?:class|grade|standard)\s+(?:ten|tenth)\b|\b(?:ten|tenth)\s+(?:class|grade|standard)\b|\b10th\b/i },
    { number: 11, pattern: /\b(?:class|grade|standard)\s+(?:eleven|eleventh)\b|\b(?:eleven|eleventh)\s+(?:class|grade|standard)\b|\b11th\b/i },
    { number: 12, pattern: /\b(?:class|grade|standard)\s+(?:twelve|twelfth)\b|\b(?:twelve|twelfth)\s+(?:class|grade|standard)\b|\b12th\b/i },
  ];

  return wordClasses.find((entry) => entry.pattern.test(prompt))?.number;
}
function inferSubjectFromPrompt(prompt: string): string | undefined {
  const normalized = normalizeAssistantText(prompt);

  // Recognise common textbook concepts even when the student does not name a
  // subject. This helps route general questions to the matching book in the
  // class currently selected in the UI.
  const topicAliases: Array<{ subject: string; pattern: RegExp }> = [
    { subject: 'Biology', pattern: /\\b(?:photosynthesis|chlorophyll|cell membrane|mitochondria|osmosis|diffusion|digestion|respiration in plants|human respiration|ecosystem|food chain|reproduction in plants|genetics|heredity|blood circulation|excretion)\\b/i },
    { subject: 'Physics', pattern: /\\b(?:newton.?s laws?|force and motion|laws of motion|gravity|gravitational force|velocity|acceleration|electric current|ohm.?s law|magnetic field|electromagnetic induction|refraction|reflection of light|wave length|wavelength|frequency|simple harmonic motion|pressure in fluids|work and energy|kinetic energy|potential energy)\\b/i },
    { subject: 'Chemistry', pattern: /\\b(?:periodic table|chemical equation|chemical reaction|atomic number|mass number|valency|covalent bond|ionic bond|acid and base|acids and bases|pH scale|mole concept|oxidation|reduction|electrolysis|hydrocarbon|organic chemistry)\\b/i },
    { subject: 'Mathematics', pattern: /\\b(?:quadratic equation|linear equation|simultaneous equations|trigonometry|trigonometric ratios|pythagoras theorem|circle theorem|tangent to a circle|sets and functions|factorisation|factorization|polynomial|matrices|determinant|arithmetic progression|geometric progression|probability|coordinate geometry|slope of a line|condition of tangency)\\b/i },
    { subject: 'Computer Science', pattern: /\\b(?:algorithm|flowchart|programming language|binary number|computer network|database|python programming|html and css|operating system|input and output devices)\\b/i },
    { subject: 'English', pattern: /\\b(?:parts of speech|direct and indirect speech|active and passive voice|tenses|punctuation|comprehension passage|essay writing|letter writing|subject verb agreement)\\b/i },
  ];
  for (const entry of topicAliases) {
    if (entry.pattern.test(normalized)) return entry.subject;
  }

  const aliases: Array<{ subject: string; pattern: RegExp }> = [
    { subject: 'Biology', pattern: /\b(?:biology|bio)\b/i },
    { subject: 'Physics', pattern: /\bphysics\b/i },
    { subject: 'Chemistry', pattern: /\b(?:chemistry|chem)\b/i },
    { subject: 'Mathematics', pattern: /\b(?:mathematics|maths|math)\b/i },
    { subject: 'Computer Science', pattern: /\b(?:computer science|computer|ics)\b/i },
    { subject: 'English', pattern: /\benglish\s+(?:book|textbook|subject|chapter|exercise|grammar|reader)\b|\b(?:book|textbook|subject|chapter|exercise)\s+(?:of\s+)?english\b|\b(?:class\s*)?(?:1[0-2]|[1-9])\s+english\b/i },
    { subject: 'Urdu', pattern: /\burdu\s+(?:book|textbook|subject|chapter|exercise)\b|\b(?:book|textbook|subject|chapter|exercise)\s+(?:of\s+)?urdu\b|\b(?:class\s*)?(?:1[0-2]|[1-9])\s+urdu\b/i },
    { subject: 'Sindhi', pattern: /\bsindhi\s+(?:book|textbook|subject|chapter|exercise)\b|\b(?:book|textbook|subject|chapter|exercise)\s+(?:of\s+)?sindhi\b|\b(?:class\s*)?(?:1[0-2]|[1-9])\s+sindhi\b/i },
    { subject: 'Islamiat', pattern: /\b(?:islamiat|islamiyat|islamic studies)\b/i },
    { subject: 'Pakistan Studies', pattern: /\b(?:pakistan studies|pak studies)\b/i },
    { subject: 'General Science', pattern: /\bgeneral science\b/i },
    { subject: 'Social Studies', pattern: /\bsocial studies\b/i },
    { subject: 'General Mathematics', pattern: /\bgeneral maths|general math|general mathematics\b/i },
  ];

  for (const entry of aliases) {
    if (entry.pattern.test(normalized)) return entry.subject;
  }

  const catalogueSubjects = [...new Set(ALL_VERIFIED_BOOKS.map((book) => book.subjectName))]
    .sort((a, b) => b.length - a.length);
  return catalogueSubjects.find((subject) => normalized.includes(normalizeAssistantText(subject)));
}

function inferMedium(prompt: string, context?: AssistantBookContext): string | undefined {
  // Explicit wording in the student's message overrides any older UI selection.
  if (/\b(?:sindhi|سنڌي)\s+medium\b/i.test(prompt)) return 'sindhi';
  if (/\b(?:urdu|اردو)\s+medium\b/i.test(prompt)) return 'urdu';
  if (/\benglish\s+medium\b/i.test(prompt)) return 'english';
  if (context?.medium) return normalizeAssistantText(context.medium);
  return undefined;
}

export function resolveAssistantBook(
  context: AssistantBookContext | undefined,
  prompt: string
): ResolvedAssistantBook {
  const normalizedPrompt = normalizeAssistantText(prompt);
  const promptClass = inferClassNumber(prompt);
  const contextClass = context?.classNumber && context.classNumber >= 1 && context.classNumber <= 12
    ? context.classNumber
    : undefined;
  // The class chosen in the UI is authoritative. Do not silently switch classes
  // just because the student mentions a different class in a general question.
  const selectedClass = contextClass || promptClass;
  const promptSubject = normalizeAssistantText(inferSubjectFromPrompt(prompt));
  const selectedSubject = normalizeAssistantText(context?.subjectName) || promptSubject;
  const selectedMedium = inferMedium(prompt, context);
  const selectedTitle = normalizeAssistantText(context?.bookTitle);

  // Recognise an exact title typed directly in the chat, even when the student
  // did not use the class/book selectors.
  const titleMatches = ALL_VERIFIED_BOOKS.filter((book) => {
    if (selectedClass && book.classNumber !== selectedClass) return false;
    if (selectedSubject && normalizeAssistantText(book.subjectName) !== selectedSubject) return false;
    if (selectedMedium && normalizeAssistantText(book.medium) !== selectedMedium) return false;
    const titles = [book.title, book.titleSindhi, book.titleUrdu]
      .filter((title): title is string => Boolean(title))
      .map((title) => normalizeAssistantText(title))
      .filter((title) => title.length >= 4);
    return titles.some((title) => normalizedPrompt.includes(title));
  });
  if (titleMatches.length === 1) {
    return { book: titleMatches[0], candidates: titleMatches };
  }

  const byId = ALL_VERIFIED_BOOKS.find((book) => book.id === context?.bookId);
  const byOfficialId = context?.officialId
    ? ALL_VERIFIED_BOOKS.find((book) => book.officialId === String(context.officialId))
    : undefined;
  const direct = byId || byOfficialId;

  // An explicitly chosen book is strongest context unless the message clearly
  // names a different class.
  if (direct && (!promptClass || direct.classNumber === promptClass)) {
    return { book: direct, candidates: [direct] };
  }

  if (selectedTitle) {
    const exactTitle = ALL_VERIFIED_BOOKS.find((book) =>
      normalizeAssistantText(book.title) === selectedTitle &&
      (!selectedClass || book.classNumber === selectedClass) &&
      (!selectedSubject || normalizeAssistantText(book.subjectName) === selectedSubject)
    );
    if (exactTitle) return { book: exactTitle, candidates: [exactTitle] };
  }

  let candidates = ALL_VERIFIED_BOOKS.filter((book) =>
    (!selectedClass || book.classNumber === selectedClass) &&
    (!selectedSubject || normalizeAssistantText(book.subjectName) === selectedSubject) &&
    (!selectedMedium || normalizeAssistantText(book.medium) === selectedMedium)
  );

  if (!candidates.length && selectedMedium) {
    candidates = ALL_VERIFIED_BOOKS.filter((book) =>
      (!selectedClass || book.classNumber === selectedClass) &&
      (!selectedSubject || normalizeAssistantText(book.subjectName) === selectedSubject)
    );
  }

  // If a class and subject uniquely point to one English-medium edition,
  // use it as the default only when the student did not specify a medium.
  if (!selectedMedium && candidates.length > 1 && selectedSubject) {
    const englishEdition = candidates.filter((book) => normalizeAssistantText(book.medium) === 'english');
    if (englishEdition.length === 1) {
      return { book: englishEdition[0], candidates: englishEdition };
    }
  }

  if (candidates.length > 1) {
    const ranked = candidates.map((book) => {
      const title = normalizeAssistantText(book.title);
      const words = title.split(' ').filter((word) =>
        word.length > 2 && !['book', 'class', 'textbook'].includes(word)
      );
      const overlap = words.filter((word) => normalizedPrompt.includes(word)).length;
      const titleScore = selectedTitle && (title.includes(selectedTitle) || selectedTitle.includes(title))
        ? 20
        : overlap;
      return { book, score: titleScore };
    }).sort((a, b) => b.score - a.score);

    if (ranked[0]?.score > 0 && ranked[0].score > (ranked[1]?.score ?? -1)) {
      return { book: ranked[0].book, candidates: [ranked[0].book] };
    }
  }

  if (candidates.length === 1) return { book: candidates[0], candidates };
  return { book: null, candidates: candidates.slice(0, 8) };
}

function getSafeBookPdfUrl(book: Book): string | null {
  if (book.officialId && /^\d+$/.test(book.officialId)) {
    return 'https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=' +
      encodeURIComponent(book.officialId) + '&download=1';
  }

  if (book.pdfUrl) {
    try {
      const parsed = new URL(book.pdfUrl);
      if (!OFFICIAL_HOSTS.has(parsed.hostname.toLowerCase()) ||
          (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')) {
        return null;
      }
      return book.pdfUrl.replace('https://ebooks.stbb.edu.pk/', 'https://portal.stbb.edu.pk/ebooks/');
    } catch {
      return null;
    }
  }
  return null;
}

function getAssistantBookCache(bookId: string): CachedBookText {
  let cache = assistantBookTextCache.get(bookId);
  if (!cache) {
    cache = { pageCount: 0, pages: new Map<number, string>(), touchedAt: Date.now() };
    assistantBookTextCache.set(bookId, cache);
  }
  cache.touchedAt = Date.now();

  while (assistantBookTextCache.size > MAX_ASSISTANT_BOOK_CACHES) {
    const oldest = [...assistantBookTextCache.entries()]
      .sort((a, b) => a[1].touchedAt - b[1].touchedAt)[0];
    if (!oldest) break;
    assistantBookTextCache.delete(oldest[0]);
  }
  return cache;
}

async function getAssistantPageText(pdfDocument: any, book: Book, pageNumber: number): Promise<string> {
  const cache = getAssistantBookCache(book.id);
  const existing = cache.pages.get(pageNumber);
  if (existing !== undefined) return existing;

  const page = await pdfDocument.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const text = (textContent.items as Array<{ str?: string }>)
    .map((item) => typeof item.str === 'string' ? item.str : '')
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  cache.pages.set(pageNumber, text);
  cache.pageCount = pdfDocument.numPages;
  cache.touchedAt = Date.now();

  while (cache.pages.size > MAX_CACHED_PAGES_PER_BOOK) {
    const oldestPage = cache.pages.keys().next().value;
    if (oldestPage === undefined) break;
    cache.pages.delete(oldestPage);
  }
  return text;
}

function scoreAssistantPage(
  text: string,
  prompt: string,
  context: AssistantBookContext | undefined
): number {
  const normalizedText = normalizeAssistantText(text);
  if (!normalizedText) return 0;

  const normalizedPrompt = normalizeAssistantText(prompt);
  const chapter = normalizeAssistantText(context?.chapter);
  const exercise = normalizeAssistantText(context?.exercise);
  const question = normalizeAssistantText(context?.questionNumber);
  let score = 0;

  if (chapter && normalizedText.includes(chapter)) score += 8;
  if (exercise && normalizedText.includes(exercise)) score += 16;
  if (/review\s+exercise/.test(exercise) && /review\s+exercise/.test(normalizedText)) score += 18;

  if (question) {
    const questionDigits = question.match(/\d+/)?.[0];
    const questionPattern = questionDigits
      ? new RegExp('(?:question|q\\.?|^|\\s)\\s*' + questionDigits + '(?:\\b|[.)])', 'i')
      : null;
    if (questionPattern?.test(normalizedText)) score += 7;
  }

  const stopWords = new Set([
    'please', 'solve', 'explain', 'answer', 'question', 'questions', 'book', 'textbook',
    'class', 'chapter', 'exercise', 'review', 'page', 'from', 'this', 'that', 'with',
    'what', 'where', 'when', 'which', 'make', 'give', 'need', 'want', 'show', 'tell',
    'complete', 'whole', 'entire', 'every', 'all', 'into', 'about', 'help', 'the', 'and',
    'for', 'are', 'was', 'were', 'from', 'this', 'that', 'have', 'has', 'can', 'you',
  ]);
  const tokens = normalizedPrompt.split(' ')
    .filter((token) => token.length >= 4 && !stopWords.has(token))
    .slice(0, 24);
  for (const token of new Set(tokens)) {
    if (normalizedText.includes(token)) score += 1;
  }

  if (/review\s+exercise/.test(normalizedText)) score += 2;
  if (/\bexercise\b/.test(normalizedText)) score += 1;
  return score;
}

export async function retrieveTextbookMaterial(
  book: Book,
  context: AssistantBookContext | undefined,
  prompt: string
): Promise<RetrievedTextbookMaterial> {
  // Pull simple references directly from natural-language questions too, so the
  // student does not have to fill every locator field in the interface.
  const inferredPage = prompt.match(/\b(?:page|p\.?)\s*(?:number\s*)?(\d{1,4})\b/i)?.[1];
  const inferredChapter = prompt.match(/\b(?:chapter|unit|lesson)\s*(\d+(?:\.\d+)?)\b/i)?.[0];
  const inferredExercise = prompt.match(/\b(?:review\s+exercise|exercise|review\s+questions?)\s*(?:no\.?\s*)?(\d+(?:\.\d+)?)?/i)?.[0];
  const inferredQuestion = prompt.match(/\b(?:question|ques\.?|q\.?)\s*(?:no\.?\s*)?(\d+(?:\.\d+)?|[a-z])\b/i)?.[0];
  const lookupContext: AssistantBookContext = {
    ...context,
    pageNumber: context?.pageNumber || (inferredPage ? Number(inferredPage) : undefined),
    chapter: context?.chapter || inferredChapter,
    exercise: context?.exercise || inferredExercise,
    questionNumber: context?.questionNumber || inferredQuestion,
  };
  const sourceUrl = getSafeBookPdfUrl(book);
  if (!sourceUrl) {
    return { pages: [], pageCount: 0, error: 'No official PDF stream is available for this catalogue record.' };
  }

  let loadingTask: any = null;
  let pdfDocument: any = null;

  try {
    // PDF.js uses byte-range requests where the official source supports them.
    loadingTask = pdfjsLib.getDocument({
      url: sourceUrl,
      rangeChunkSize: 64 * 1024,
      disableAutoFetch: true,
      disableStream: true,
    });
    pdfDocument = await loadingTask.promise;

    const pageCount = Number(pdfDocument.numPages) || 0;
    getAssistantBookCache(book.id).pageCount = pageCount;
    if (!pageCount) return { pages: [], pageCount: 0, error: 'The PDF did not report any pages.' };

    const requestedPage = Number(lookupContext.pageNumber);
    let selectedPageNumbers: number[] = [];

    if (Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= pageCount) {
      // The neighbouring pages help when an exercise continues over a page break.
      selectedPageNumbers = [requestedPage - 1, requestedPage, requestedPage + 1]
        .filter((page) => page >= 1 && page <= pageCount);
    } else {
      // Searching every PDF page sequentially can exceed the web preview's request
      // timeout. Read small batches concurrently and stop as soon as the requested
      // chapter/exercise heading is found.
      // Search textbook pages in parallel batches. The old sequential 260-page
      // scan could exceed the Codespaces/proxy request timeout before answering.
      const hasSpecificLocator = Boolean(lookupContext.chapter || lookupContext.exercise);
      // Keep general questions quick while still checking the selected textbook.
      // Explicit chapter/exercise lookups receive a slightly larger search budget.
      const scanLimit = Math.min(pageCount, hasSpecificLocator ? 140 : 80);
      const SCAN_BUDGET_MS = hasSpecificLocator ? 6500 : 3500;
      const SCAN_BATCH_SIZE = 10;
      const scanStartedAt = Date.now();
      const scoredPages: Array<{ pageNumber: number; text: string; score: number }> = [];
      const explicitChapter = normalizeAssistantText(lookupContext.chapter);
      const explicitExercise = normalizeAssistantText(lookupContext.exercise);
      const exerciseNumber = explicitExercise.match(/\d+(?:\.\d+)?/)?.[0];
      const chapterLabel = explicitChapter.replace(/^(?:chapter|unit|lesson)\s*/, '').trim();
      const numericChapter = /^\d+(?:\.\d+)?$/.test(chapterLabel) ? chapterLabel : '';

      const matchesChapter = (text: string): boolean => {
        if (!explicitChapter) return false;
        const normalized = normalizeAssistantText(text);
        if (numericChapter) {
          return normalized.includes('chapter ' + numericChapter) ||
            normalized.includes('unit ' + numericChapter) ||
            normalized.includes('lesson ' + numericChapter);
        }
        return chapterLabel.length >= 3 && normalized.includes(chapterLabel);
      };

      const matchesExercise = (text: string): boolean => {
        if (!explicitExercise) return false;
        const normalized = normalizeAssistantText(text);
        if (/review\s+exercise/.test(explicitExercise)) {
          return /review\s+exercise/.test(normalized);
        }
        if (exerciseNumber) {
          // Match the full exercise label so Exercise 7.1 does not accidentally
          // match Exercise 7.10. Remove spaces around decimal points from PDF text
          // because some PDFs split heading text into separate text items.
          const compactText = normalized.replace(/\s*\.\s*/g, '.');
          const escapedNumber = exerciseNumber.replace('.', '\\.');
          const exactHeading = new RegExp(
            '\\bexercise\\s*(?:no\\.?\\s*)?' + escapedNumber + '(?![\\d.])',
            'i'
          );
          return exactHeading.test(compactText);
        }
        return normalized.includes(explicitExercise) && /\bexercise\b/.test(normalized);
      };

      let lastChapterMarkerPage = 0;
      let locatedAnchor = 0;
      let latestChapterPage = 0;

      for (let batchStart = 1; batchStart <= scanLimit; batchStart += SCAN_BATCH_SIZE) {
        if (Date.now() - scanStartedAt >= SCAN_BUDGET_MS) break;

        const batchEnd = Math.min(scanLimit, batchStart + SCAN_BATCH_SIZE - 1);
        const remainingBudget = Math.max(1, SCAN_BUDGET_MS - (Date.now() - scanStartedAt));
        let batchTimer: ReturnType<typeof setTimeout> | undefined;
        const batchResult = await Promise.race([
          Promise.all(
            Array.from({ length: batchEnd - batchStart + 1 }, async (_unused, index) => {
              const pageNumber = batchStart + index;
              try {
                return { pageNumber, text: await getAssistantPageText(pdfDocument, book, pageNumber) };
              } catch {
                return { pageNumber, text: '' };
              }
            })
          ),
          new Promise<null>((resolve) => {
            batchTimer = setTimeout(() => resolve(null), remainingBudget);
          }),
        ]);
        if (batchTimer) clearTimeout(batchTimer);
        if (!batchResult) break;

        for (const page of batchResult) {
          if (!page.text) continue;
          const score = scoreAssistantPage(page.text, prompt, lookupContext);
          if (score > 0) scoredPages.push({ ...page, score });

          if (matchesChapter(page.text)) {
            lastChapterMarkerPage = page.pageNumber;
            latestChapterPage = page.pageNumber;
            if (!explicitExercise) {
              locatedAnchor = page.pageNumber;
              break;
            }
          }

          if (matchesExercise(page.text)) {
            const chapterIsNearby = !explicitChapter ||
              (lastChapterMarkerPage > 0 &&
                page.pageNumber >= lastChapterMarkerPage &&
                page.pageNumber - lastChapterMarkerPage <= 45);
            if (chapterIsNearby) {
              locatedAnchor = page.pageNumber;
              break;
            }
          }
        }

        if (locatedAnchor) break;
      }

      if (locatedAnchor) {
        // Fetch a small neighborhood around the exercise heading; this also
        // captures questions that continue onto the next page.
        const firstPage = Math.max(1, locatedAnchor - 1);
        const lastPage = Math.min(scanLimit, locatedAnchor + 5);
        const pageNumbers = Array.from(
          { length: lastPage - firstPage + 1 },
          (_unused, index) => firstPage + index
        );
        const nearbyPages = await Promise.all(
          pageNumbers.map(async (pageNumber) => {
            try {
              return { pageNumber, text: await getAssistantPageText(pdfDocument, book, pageNumber) };
            } catch {
              return { pageNumber, text: '' };
            }
          })
        );
        const confirmedPages = nearbyPages.filter((page) => page.text);
        // Keep the whole small neighborhood. Chapter titles may repeat in running
        // page headers, so don't mistake a repeated heading for a new exercise.
        selectedPageNumbers = confirmedPages.map((page) => page.pageNumber);
      }

      if (!selectedPageNumbers.length && scoredPages.length) {
        if (explicitExercise && explicitChapter && latestChapterPage) {
          const sameChapter = scoredPages.filter((page) =>
            page.pageNumber >= latestChapterPage && page.pageNumber <= latestChapterPage + 45
          );
          if (sameChapter.length) {
            const top = sameChapter.sort((a, b) => b.score - a.score).slice(0, 6);
            const pageNumbers = new Set<number>();
            for (const page of top) {
              pageNumbers.add(page.pageNumber);
              if (page.pageNumber > 1) pageNumbers.add(page.pageNumber - 1);
              if (page.pageNumber < scanLimit) pageNumbers.add(page.pageNumber + 1);
            }
            selectedPageNumbers = [...pageNumbers].sort((a, b) => a - b).slice(0, 12);
          }
        }

        // Fall back to the strongest text matches if heading markers differ between editions.
        if (!selectedPageNumbers.length) {
          const top = scoredPages.sort((a, b) => b.score - a.score).slice(0, 6);
          const pageNumbers = new Set<number>();
          for (const page of top) {
            pageNumbers.add(page.pageNumber);
            if (page.pageNumber > 1) pageNumbers.add(page.pageNumber - 1);
            if (page.pageNumber < scanLimit) pageNumbers.add(page.pageNumber + 1);
          }
          selectedPageNumbers = [...pageNumbers].sort((a, b) => a - b).slice(0, 12);
        }
      }
    }

    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (const pageNumber of selectedPageNumbers.slice(0, 12)) {
      const text = await getAssistantPageText(pdfDocument, book, pageNumber);
      if (text) pages.push({ pageNumber, text: text.slice(0, 6500) });
    }

    if (!pages.length) {
      return {
        pages: [],
        pageCount,
        error: 'No selectable text was extracted from the selected PDF pages. Enter the PDF page number in the locator to target a page directly. If the PDF page is scanned as an image, the assistant needs that page image to read its questions.',
      };
    }
    return { pages, pageCount };
  } catch (error) {
    const err = error as Error;
    console.warn('Textbook text retrieval failed for record ' + (book.officialId || book.id) + ': ' +
      (err.message || 'unknown error').slice(0, 180));
    return {
      pages: [],
      pageCount: 0,
      error: 'The PDF text could not be read automatically. The book may be scanned or the official source may be temporarily unavailable.',
    };
  } finally {
    if (loadingTask) {
      try { await loadingTask.destroy(); } catch { /* Expected cleanup. */ }
    } else if (pdfDocument && typeof pdfDocument.destroy === 'function') {
      try { await pdfDocument.destroy(); } catch { /* Expected cleanup. */ }
    }
  }
}

export function formatBookCatalogEntry(book: Book): string {
  return [
    'Title: ' + book.title,
    'Class: ' + book.classNumber,
    'Subject: ' + book.subjectName,
    'Medium: ' + book.medium,
    'Edition: ' + book.editionYear,
    'Official page: ' + (book.officialPageUrl || 'https://ebooks.stbb.edu.pk/'),
    'PDF: ' + (book.pdfUrl || 'not listed'),
    'Download: ' + (book.downloadUrl || 'not listed'),
  ].join('\n');
}
