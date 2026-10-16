import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { Readable } from 'node:stream';
import { GoogleGenAI } from '@google/genai';

// Force IPv4 first DNS lookup to prevent dual-stack hangs
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Keep the textbook library available even when no Gemini key is configured.
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

if (!ai) {
  console.info('GEMINI_API_KEY is not set. The textbook library will run; AI assistance will remain disabled.');
}

// JSON & Body Parsing for AI chat & image attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Security & SSRF Protection: Only allow official Sindh Textbook Board hosts
const ALLOWED_HOSTS = ['portal.stbb.edu.pk', 'ebooks.stbb.edu.pk'];

function isAllowedUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return ALLOWED_HOSTS.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function sanitizeFilename(name: string): string {
  const clean = name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-').trim();
  const withExt = clean.toLowerCase().endsWith('.pdf') ? clean : `${clean}.pdf`;
  return withExt.slice(0, 100);
}

// Convert any book ID or URL to the authoritative, active portal backend
function getAuthoritativeUrl(idOrUrl: string): string {
  const cleanId = idOrUrl.replace(/^stbb-official-/, '').trim();
  if (/^\d+$/.test(cleanId)) {
    // Use the same download endpoint that was verified while bulk-downloading books.
    return `https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=${cleanId}&download=1`;
  }

  const idMatch = idOrUrl.match(/id=(\d+)/);
  if (idMatch && idMatch[1]) {
    return `https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=${idMatch[1]}&download=1`;
  }

  // Rewrite ebooks.stbb.edu.pk to portal.stbb.edu.pk for high-speed reliable streaming
  return idOrUrl.replace('https://ebooks.stbb.edu.pk/', 'https://portal.stbb.edu.pk/ebooks/');
}

// In-Memory Metadata Cache for Official STBB PDF Documents
interface PdfMetadata {
  contentLength: number;
  contentType: string;
  acceptRanges: boolean;
  fetchedAt: number;
}
const pdfMetadataCache = new Map<string, PdfMetadata>();

async function getPdfMetadata(targetUrl: string): Promise<PdfMetadata | null> {
  const cached = pdfMetadataCache.get(targetUrl);
  const now = Date.now();
  if (cached && cached.contentLength > 0 && now - cached.fetchedAt < 1000 * 60 * 60 * 24) {
    return cached;
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Range: 'bytes=0-100',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    const cr = upstream.headers.get('content-range');
    let contentLength = 0;
    if (cr) {
      const match = cr.match(/\/(\d+)$/);
      if (match && match[1]) {
        contentLength = parseInt(match[1], 10);
      }
    } else {
      const cl = upstream.headers.get('content-length');
      if (cl) contentLength = parseInt(cl, 10);
    }

    const responseType = (upstream.headers.get('content-type') || '').toLowerCase();
    // Never cache an HTML/404 page as if it were valid PDF metadata.
    if (
      (upstream.ok || upstream.status === 206) &&
      !responseType.includes('text/html') &&
      !responseType.includes('text/plain') &&
      contentLength > 0
    ) {
      const meta: PdfMetadata = {
        contentLength,
        contentType: responseType || 'application/pdf',
        acceptRanges: true,
        fetchedAt: Date.now(),
      };
      pdfMetadataCache.set(targetUrl, meta);
      return meta;
    }
  } catch (err: any) {
    console.warn(`Probe metadata failed for ${targetUrl}:`, err.message);
  }

  return null;
}

// 1. Enable CORS & range headers for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Authorization');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, Accept-Ranges, Content-Disposition'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 2. Serve static assets from public/ (including pdf.worker.mjs and cmaps)
const publicDir = path.resolve(__dirname, 'public');
app.use(
  express.static(publicDir, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    },
  })
);

// 3. Serve vanilla HTML/CSS/JS site at /vanilla
const vanillaDir = path.resolve(__dirname, 'vanilla');
app.use('/vanilla', express.static(vanillaDir));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'STBB Books Service',
    timestamp: new Date().toISOString(),
    officialPortal: 'https://portal.stbb.edu.pk/ebooks/',
    totalCachedMetadata: pdfMetadataCache.size,
  });
});

// STREAM PDF FOR IN-APP READER (with fast Range handling & HEAD support)
app.all('/api/pdf/stream', async (req: Request, res: Response) => {
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawId = (req.query.id as string) || '';
  const urlParam = (req.query.url as string) || '';
  let targetUrl = '';

  if (rawId) {
    targetUrl = getAuthoritativeUrl(rawId);
  } else if (urlParam && isAllowedUrl(urlParam)) {
    targetUrl = getAuthoritativeUrl(urlParam);
  } else {
    return res.status(400).json({ error: 'Invalid or missing book ID' });
  }

  // Handle HEAD requests (PDF.js capability probe)
  if (method === 'HEAD') {
    const meta = await getPdfMetadata(targetUrl);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (meta?.contentLength) {
      res.setHeader('Content-Length', meta.contentLength.toString());
    }
    return res.status(200).end();
  }

  // Prepare GET request headers
  const forwardHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
    Accept: 'application/pdf, */*',
  };

  const incomingRange = req.headers.range;

  // Handle suffix ranges (bytes=-65536) for PDF.js xref/trailer retrieval
  if (incomingRange) {
    const suffixMatch = incomingRange.match(/bytes=-(\d+)$/);
    if (suffixMatch) {
      const suffixBytes = parseInt(suffixMatch[1], 10);
      const meta = await getPdfMetadata(targetUrl);
      if (meta && meta.contentLength > 0) {
        const start = Math.max(0, meta.contentLength - suffixBytes);
        const end = meta.contentLength - 1;
        forwardHeaders['Range'] = `bytes=${start}-${end}`;
      } else {
        forwardHeaders['Range'] = 'bytes=0-65535';
      }
    } else {
      forwardHeaders['Range'] = incomingRange;
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: forwardHeaders,
      signal: AbortSignal.timeout(45000),
    });

    // Check if textbook is genuinely unavailable on the official board server (404)
    if (upstream.status === 404) {
      return res.status(404).json({
        error: 'The official Sindh Textbook Board has not published this PDF yet. Original file is pending upload on portal.',
        status: 'pending',
      });
    }

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({
        error: `Official STBB portal returned status ${upstream.status}`,
      });
    }

    const ct = (upstream.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') || ct.includes('text/plain')) {
      const text = await upstream.text();
      return res.status(502).json({
        error: `STBB returned HTML instead of PDF: ${text.replace(/<[^>]*>/g, '').slice(0, 150).trim()}`,
      });
    }

    // Cache total length from Content-Range header
    const cr = upstream.headers.get('content-range');
    if (cr) {
      const match = cr.match(/\/(\d+)$/);
      if (match && match[1]) {
        const totalLen = parseInt(match[1], 10);
        if (totalLen > 0 && !pdfMetadataCache.has(targetUrl)) {
          pdfMetadataCache.set(targetUrl, {
            contentLength: totalLen,
            contentType: ct || 'application/pdf',
            acceptRanges: true,
            fetchedAt: Date.now(),
          });
        }
      }
    }

    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');

    const cl = upstream.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);

    if (!upstream.body) {
      return res.end();
    }

    const nodeStream = Readable.fromWeb(upstream.body as any);
    res.on('close', () => {
      nodeStream.destroy();
    });
    nodeStream.on('error', (err) => {
      console.warn('PDF stream pipe error:', err.message);
    });

    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Error streaming PDF from STBB:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: `Unable to stream PDF from official STBB source: ${err.message}` });
    }
  }
});

// DIRECT PDF DOWNLOAD ENDPOINT (Content-Disposition: attachment)
app.get('/api/pdf/download', async (req: Request, res: Response) => {
  const rawId = (req.query.id as string) || '';
  const urlParam = (req.query.url as string) || '';
  const requestedName = (req.query.filename as string) || `STBB-Textbook-${rawId || 'book'}.pdf`;
  const filename = sanitizeFilename(requestedName);
  const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');

  let targetUrl = '';
  if (rawId) {
    targetUrl = getAuthoritativeUrl(rawId);
  } else if (urlParam && isAllowedUrl(urlParam)) {
    targetUrl = getAuthoritativeUrl(urlParam);
  } else {
    return res.status(400).json({ error: 'Invalid book identifier or unauthorized URL' });
  }

  try {
    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
      Accept: 'application/pdf, */*',
    };
    if (req.headers.range) {
      forwardHeaders['Range'] = req.headers.range;
    }

    const upstream = await fetch(targetUrl, {
      headers: forwardHeaders,
      signal: AbortSignal.timeout(60000),
    });

    if (upstream.status === 404) {
      return res.status(404).json({
        error: 'The official STBB PDF file for this title is currently pending on the portal.',
      });
    }

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({
        error: `STBB server returned status ${upstream.status}`,
      });
    }

    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Accept-Ranges', 'bytes');

    const cl = upstream.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);
    const cr = upstream.headers.get('content-range');
    if (cr) res.setHeader('Content-Range', cr);

    if (!upstream.body) return res.end();

    const nodeStream = Readable.fromWeb(upstream.body as any);
    res.on('close', () => nodeStream.destroy());
    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Error downloading PDF from STBB:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to retrieve PDF from official STBB source' });
    }
  }
});

// Google Drive PDF streaming for the publicly shared textbooks in the catalog.
// This endpoint accepts a file ID only (not an arbitrary URL), preventing SSRF.
function isValidDriveFileId(fileId: string): boolean {
  return /^[A-Za-z0-9_-]{10,200}$/.test(fileId);
}

async function fetchPublicDrivePdf(
  fileId: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<Response> {
  const targets = [
    'https://drive.usercontent.google.com/download?id=' + encodeURIComponent(fileId) + '&export=download&confirm=t',
    'https://drive.google.com/uc?export=download&confirm=t&id=' + encodeURIComponent(fileId),
  ];
  let lastStatus = 502;
  let lastMessage = 'Google Drive did not return a PDF file.';

  for (const targetUrl of targets) {
    try {
      const upstream = await fetch(targetUrl, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });
      const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
      const usableStatus = upstream.ok || upstream.status === 206;
      if (usableStatus && !contentType.startsWith('text/')) {
        return upstream;
      }

      lastStatus = upstream.status;
      lastMessage = contentType.startsWith('text/')
        ? 'Google Drive returned a web page instead of PDF bytes. Check that the file is shared as Anyone with the link → Viewer.'
        : 'Google Drive returned HTTP ' + upstream.status + '.';

      try {
        await upstream.body?.cancel();
      } catch {
        // Ignore cancellation errors while trying the alternate Drive endpoint.
      }
    } catch (err: any) {
      lastMessage = err?.message || lastMessage;
    }
  }

  const failure = new Error(lastMessage) as Error & { status?: number };
  failure.status = lastStatus === 404 ? 404 : lastStatus === 403 ? 403 : 502;
  throw failure;
}

app.all('/api/pdf/drive-stream', async (req: Request, res: Response) => {
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fileId = (req.query.id as string) || '';
  if (!isValidDriveFileId(fileId)) {
    return res.status(400).json({ error: 'Invalid Google Drive file ID.' });
  }

  const forwardHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
    Accept: 'application/pdf, application/octet-stream, */*',
  };

  if (method === 'HEAD') {
    // Probe one byte for total length without downloading a large textbook.
    forwardHeaders.Range = 'bytes=0-0';
  } else if (req.headers.range) {
    forwardHeaders.Range = req.headers.range;
  }

  try {
    const upstream = await fetchPublicDrivePdf(fileId, forwardHeaders, method === 'HEAD' ? 30000 : 120000);
    const contentRange = upstream.headers.get('content-range');
    const contentLength = upstream.headers.get('content-length');

    if (method === 'HEAD') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'private, max-age=300');
      if (contentRange) {
        const total = contentRange.match(/\/(\d+)$/)?.[1];
        if (total) res.setHeader('Content-Length', total);
        res.setHeader('Accept-Ranges', 'bytes');
      } else if (upstream.status === 200 && contentLength) {
        res.setHeader('Content-Length', contentLength);
        res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'none');
      }
      try {
        await upstream.body?.cancel();
      } catch {
        // Ignore metadata-probe cleanup errors.
      }
      return res.status(200).end();
    }

    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
      res.setHeader('Accept-Ranges', 'bytes');
    } else {
      res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'none');
    }

    if (!upstream.body) return res.end();

    const nodeStream = Readable.fromWeb(upstream.body as any);
    res.on('close', () => nodeStream.destroy());
    nodeStream.on('error', (err) => {
      console.warn('Google Drive PDF stream error:', err.message);
    });
    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Google Drive stream failed:', err.message);
    if (!res.headersSent) {
      res.status(err?.status || 502).json({
        error: err.message || 'Unable to stream PDF from Google Drive.',
      });
    }
  }
});

app.get('/api/pdf/drive-download', async (req: Request, res: Response) => {
  const fileId = (req.query.id as string) || '';
  const requestedName = (req.query.filename as string) || ('STBB-Textbook-' + (fileId || 'book') + '.pdf');
  const filename = sanitizeFilename(requestedName);
  const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');

  if (!isValidDriveFileId(fileId)) {
    return res.status(400).json({ error: 'Invalid Google Drive file ID.' });
  }

  try {
    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
      Accept: 'application/pdf, application/octet-stream, */*',
    };
    if (req.headers.range) forwardHeaders.Range = req.headers.range;

    const upstream = await fetchPublicDrivePdf(fileId, forwardHeaders, 15 * 60 * 1000);
    const contentRange = upstream.headers.get('content-range');
    const contentLength = upstream.headers.get('content-length');

    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="' + asciiFilename + '"; filename*=UTF-8\'\'' + encodeURIComponent(filename)
    );
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
      res.setHeader('Accept-Ranges', 'bytes');
    }

    if (!upstream.body) return res.end();

    const nodeStream = Readable.fromWeb(upstream.body as any);
    res.on('close', () => nodeStream.destroy());
    nodeStream.on('error', (err) => {
      console.warn('Google Drive download stream error:', err.message);
    });
    nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Google Drive download failed:', err.message);
    if (!res.headersSent) {
      res.status(err?.status || 502).json({
        error: err.message || 'Unable to download PDF from Google Drive.',
      });
    }
  }
});

// COVER IMAGE PROXY
app.get('/api/image/proxy', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || !isAllowedUrl(imageUrl)) {
    return res.status(403).json({ error: 'Image URL not permitted' });
  }

  // Rewrite ebooks.stbb.edu.pk to portal.stbb.edu.pk for reliable image loading
  const targetImageUrl = imageUrl.replace('https://ebooks.stbb.edu.pk/', 'https://portal.stbb.edu.pk/ebooks/');

  try {
    const upstream = await fetch(targetImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
        Referer: 'https://portal.stbb.edu.pk/',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return res.status(upstream.status).end();
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');

    if (!upstream.body) return res.end();
    const nodeStream = Readable.fromWeb(upstream.body as any);
    res.on('close', () => nodeStream.destroy());
    nodeStream.pipe(res);
  } catch (err) {
    if (!res.headersSent) res.status(502).end();
  }
});

// UNIVERSAL AI STUDY ASSISTANT ENDPOINT
app.post('/api/ai/study-assist', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'The AI Study Assistant is unavailable until GEMINI_API_KEY is configured.',
      });
    }

    const {
      prompt,
      language = 'english',
      mode = 'general',
      bookContext,
      imageBase64,
      imageMimeType = 'image/jpeg',
      history = [],
    } = req.body;

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Either question text or a page image is required.' });
    }

    // Determine Language Directive
    let languageDirective =
      'Respond strictly in clear, plain English. Use simple, student-friendly explanations.';
    if (language === 'urdu') {
      languageDirective =
        'براہ کرم اپنا پورا جواب مکمل اور معیاری اردو رسم الخط میں تحریر کریں۔ اصطلاحات کی وضاحت اردو میں دیجیے۔';
    } else if (language === 'sindhi') {
      languageDirective =
        'مهرباني ڪري پنهنجو مڪمل جواب معياري سنڌي عربي رسم الخط ۾ تحرير ڪريو. اصطلاحن ۽ رياضياتي حل جي وضاحت سنڌي ٻوليءَ ۾ ڏيو.';
    }

    // Context details from actual STBB catalog and current user selection
    const contextDetails: string[] = [];
    if (bookContext?.classNumber) contextDetails.push(`Class: Class ${bookContext.classNumber}`);
    if (bookContext?.subjectName) contextDetails.push(`Subject: ${bookContext.subjectName}`);
    if (bookContext?.bookTitle) contextDetails.push(`Official Book: ${bookContext.bookTitle}`);
    if (bookContext?.chapter) contextDetails.push(`Chapter/Unit: ${bookContext.chapter}`);
    if (bookContext?.exercise) contextDetails.push(`Exercise: ${bookContext.exercise}`);
    if (bookContext?.pageNumber) contextDetails.push(`Page Number: ${bookContext.pageNumber}`);
    if (bookContext?.questionNumber) contextDetails.push(`Question Number: ${bookContext.questionNumber}`);
    if (bookContext?.selectedText) contextDetails.push(`Textbook Excerpt: "${bookContext.selectedText}"`);

    const contextHeader =
      contextDetails.length > 0
        ? `[STBB Textbook Context]\n${contextDetails.join('\n')}\n`
        : '';

    const systemInstruction = `
You are the official AI Study Assistant for the Sindh Textbook Board (STBB), Jamshoro, Sindh, Pakistan.
You support students and teachers from Class 1 through Class 12 across all STBB subjects (Mathematics, Biology, Physics, Chemistry, Computer Science, English, Urdu, Sindhi, General Science, Social Studies, Islamiat, Pakistan Studies).

Core Guidelines:
1. Follow the user's specific request directly. Do not output generic summaries or unrelated introductions.
2. Ground your answers strictly in the official Sindh Textbook Board curriculum. For textbook questions, use the provided textbook context (class, subject, book, chapter, exercise, page). Never invent textbook content, exercises, or citations.
3. Language: ${languageDirective}
4. Text Format: Use simple, readable plain text. Avoid decorative formatting, ASCII banners, complex Markdown tables, or unnecessary sample templates. Use numbered steps or mathematical equations only when useful for explaining a solution.
5. If the user asks for a step-by-step solution, show the clear numbered steps and state the final result clearly.
6. When an image of a textbook page is attached, read the specific question requested from the image and solve it directly.
`.trim();

    // Build multi-turn Gemini contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];

    // Add prior conversation history if provided
    if (Array.isArray(history) && history.length > 0) {
      // Limit to last 8 turns to stay focused and fast
      const recentHistory = history.slice(-8);
      for (const turn of recentHistory) {
        if (!turn.content) continue;
        const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: turn.content }],
        });
      }
    }

    // Build current user message parts
    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: cleanBase64,
        },
      });
    }

    let userPromptText = '';
    if (contextHeader) {
      userPromptText += `${contextHeader}\n`;
    }

    if (mode === 'solve-exercise') {
      userPromptText += `Solve this textbook question with clear step-by-step method:\n${prompt || 'Solve the question indicated above.'}`;
    } else if (mode === 'vocabulary') {
      userPromptText += `Explain the meaning and usage of:\n${prompt}`;
    } else {
      userPromptText += prompt || 'Please answer my question based on the textbook context.';
    }

    currentParts.push({ text: userPromptText });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    // Call Gemini with automatic model fallback for 429 quota or 503 demand spikes
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let response;
    let lastErr: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${modelName} warning:`, err.message?.slice(0, 120));
      }
    }

    if (!response || !response.text) {
      throw lastErr || new Error('No response returned from the assistant service.');
    }

    const aiText = response.text || 'No response generated.';

    // Follow-up suggestions in selected language
    const followUps: string[] = [];
    if (language === 'urdu') {
      followUps.push('اس کی مزید وضاحت کریں');
      followUps.push('اگلا سوال حل کریں');
      followUps.push('اس سبق سے متعلق اہم نکات بتائیں');
    } else if (language === 'sindhi') {
      followUps.push('هن جي وڌيڪ آسان سمجهاڻي ڏيو');
      followUps.push('ايندڙ سوال حل ڪريو');
      followUps.push('هن سبق جا اهم نڪتا ٻڌايو');
    } else {
      followUps.push('Explain this in simpler terms');
      followUps.push('Solve the next question');
      followUps.push('List the key points from this section');
    }

    return res.json({
      answer: aiText,
      language,
      bookContext: bookContext || null,
      followUps,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Gemini Study Assistant Error:', err.message);

    return res.status(500).json({
      error: 'The AI Study Assistant encountered a processing issue. Please try again.',
      details: err.message.slice(0, 150),
    });
  }
});

// START EXPRESS SERVER WITH VITE INTEGRATION
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      // The embedded Codespaces preview can already occupy Vite's separate
      // HMR WebSocket port. Disable that socket to avoid startup conflicts.
      // Refresh the preview manually after code edits.
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listenWithFallback = (port: number, attempts: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const server = app.listen(port, '0.0.0.0');

      server.once('listening', () => {
        const address = server.address();
        const activePort = address && typeof address === 'object' ? address.port : port;
        console.log(`STBB Books server running on port ${activePort}`);
        resolve();
      });

      server.once('error', (error: Error & { code?: string }) => {
        // Only auto-select another port when no explicit deployment PORT was set.
        if (error.code === 'EADDRINUSE' && attempts > 0 && !process.env.PORT) {
          const nextPort = port + 1;
          console.warn(`Port ${port} is already in use; trying port ${nextPort}.`);
          resolve(listenWithFallback(nextPort, attempts - 1));
          return;
        }

        reject(error);
      });
    });

  await listenWithFallback(PORT, process.env.PORT ? 0 : 10);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
