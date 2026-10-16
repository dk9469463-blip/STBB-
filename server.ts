import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { Readable } from 'node:stream';
import { GoogleGenAI } from '@google/genai';
import {
  resolveAssistantBook,
  retrieveTextbookMaterial,
  formatBookCatalogEntry,
} from './assistantBookRetrieval';
import type { AssistantBookContext, AssistantSource } from './assistantBookRetrieval';

// Force IPv4 first DNS lookup to prevent dual-stack hangs
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Gemini is called only on the server; the API key is never sent to the browser.
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';

if (!geminiApiKey) {
  console.info('GEMINI_API_KEY is not set. The textbook library will run; AI assistance will remain disabled.');
}

interface GeminiListedModel {
  name?: string;
  supportedGenerationMethods?: string[];
  supportedActions?: string[];
}

let cachedGeminiTextModels: { fetchedAt: number; models: string[] } | null = null;

// Discover models that this particular API key can use. This avoids relying on
// model names that may be retired or unavailable to newly created API projects.
async function getAvailableGeminiTextModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedGeminiTextModels && now - cachedGeminiTextModels.fetchedAt < 5 * 60 * 1000) {
    return cachedGeminiTextModels.models;
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=100',
    {
      headers: { 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(2500),
    }
  );

  if (!response.ok) {
    throw new Error('Gemini model discovery failed with HTTP ' + response.status);
  }

  const data = await response.json() as { models?: GeminiListedModel[] };
  const listed = (Array.isArray(data.models) ? data.models : [])
    .filter((model) => {
      const name = String(model.name || '').replace(/^models\//, '');
      const methods = model.supportedGenerationMethods || model.supportedActions || [];
      return (
        name.startsWith('gemini-') &&
        methods.includes('generateContent') &&
        !/(embedding|imagen|veo|audio|tts|live|robotics|computer-use|deep-research|aqa)/i.test(name)
      );
    })
    .map((model) => String(model.name || '').replace(/^models\//, ''));

  const versionScore = (name: string): number => {
    const match = name.match(/^gemini-(\d+)(?:\.(\d+))?/i);
    return match ? Number(match[1]) * 100 + Number(match[2] || 0) : 0;
  };

  listed.sort((a, b) => {
    const rank = (name: string): number => {
      if (/flash-lite/i.test(name)) return 300;
      if (/flash/i.test(name)) return 200;
      if (/pro/i.test(name)) return 100;
      return 0;
    };
    return rank(b) + versionScore(b) - rank(a) - versionScore(a);
  });

  cachedGeminiTextModels = { fetchedAt: now, models: listed };
  return listed;
}

function getGeminiErrorDetails(error: unknown): { status: number; message: string } {
  const provider = error as { message?: string; status?: number | string; code?: number | string };
  const message = String(provider?.message || '');
  const status = Number(provider?.status || provider?.code || 0);
  return {
    status,
    message: message
      .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_API_KEY]')
      .replace(/\s+/g, ' ')
      .slice(0, 300),
  };
}

// Lightweight per-process guard against accidental or automated AI request bursts.
// Production deployments serving large shared networks should also add platform-level quotas.
const aiRequestWindows = new Map<string, { startedAt: number; count: number }>();
const AI_REQUEST_WINDOW_MS = 60 * 1000;
const AI_MAX_REQUESTS_PER_WINDOW = 40;

function allowAiRequest(req: Request, res: Response): boolean {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let window = aiRequestWindows.get(key);

  if (!window || now - window.startedAt >= AI_REQUEST_WINDOW_MS) {
    window = { startedAt: now, count: 0 };
  }

  if (window.count >= AI_MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((AI_REQUEST_WINDOW_MS - (now - window.startedAt)) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many study questions were sent from this connection. Please wait a moment and try again.' });
    return false;
  }

  window.count += 1;
  aiRequestWindows.set(key, window);

  // Discard expired entries when the map grows to keep memory use bounded.
  if (aiRequestWindows.size > 5000) {
    for (const [clientKey, entry] of aiRequestWindows) {
      if (now - entry.startedAt >= AI_REQUEST_WINDOW_MS) aiRequestWindows.delete(clientKey);
    }
  }
  return true;
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

type UpstreamFetchResponse = Awaited<ReturnType<typeof fetch>>;

async function fetchPublicDrivePdf(
  fileId: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<UpstreamFetchResponse> {
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

// UNIVERSAL STBB AI STUDY ASSISTANT ENDPOINT.
// The application uses STBB branding; the AI API key and model request remain server-side.
app.post('/api/ai/study-assist', async (req: Request, res: Response) => {
  try {
    if (!geminiApiKey) {
      return res.status(503).json({
        error: 'The AI Study Assistant is not configured yet. Please contact the app administrator.',
      });
    }
    if (!allowAiRequest(req, res)) return;

    const {
      prompt,
      language = 'english',
      mode = 'general',
      bookContext,
      imageBase64,
      imageMimeType = 'image/jpeg',
      history = [],
    } = req.body as {
      prompt?: string;
      language?: string;
      mode?: string;
      bookContext?: AssistantBookContext;
      imageBase64?: string | null;
      imageMimeType?: string;
      history?: Array<{ role?: string; content?: string }>;
    };

    if (!prompt?.trim() && !imageBase64) {
      return res.status(400).json({ error: 'Write a question or attach a textbook page image first.' });
    }
    if (typeof prompt === 'string' && prompt.length > 30000) {
      return res.status(413).json({ error: 'Please send a shorter question or split this exercise into smaller parts.' });
    }

    let languageDirective =
      'Respond in clear, plain English, with simple explanations suitable for school students.';
    if (language === 'urdu') {
      languageDirective =
        'اپنا جواب آسان، واضح اور معیاری اردو رسم الخط میں دیں۔ ریاضی اور سائنس کی اصطلاحات کو آسان اردو میں سمجھائیں۔';
    } else if (language === 'sindhi') {
      languageDirective =
        'جواب سادي، واضح ۽ معياري سنڌي عربي رسم الخط ۾ ڏيو. رياضي ۽ سائنس جون اصطلاحون سادي سنڌي ۾ سمجهايو.';
    }

    const contextDetails: string[] = [];
    if (bookContext?.classNumber) contextDetails.push('Selected class: Class ' + bookContext.classNumber);
    if (bookContext?.subjectName) contextDetails.push('Selected subject: ' + bookContext.subjectName);
    if (bookContext?.bookTitle) contextDetails.push('Selected book: ' + bookContext.bookTitle);
    if (bookContext?.chapter) contextDetails.push('Chapter or unit clue: ' + bookContext.chapter);
    if (bookContext?.exercise) contextDetails.push('Exercise clue: ' + bookContext.exercise);
    if (bookContext?.pageNumber) contextDetails.push('Requested PDF page: ' + bookContext.pageNumber);
    if (bookContext?.questionNumber) contextDetails.push('Question number: ' + bookContext.questionNumber);
    if (bookContext?.selectedText) contextDetails.push('Text selected in the reader: "' + bookContext.selectedText + '"');

    const resolved = resolveAssistantBook(bookContext, prompt || '');
    let retrievedPages: Array<{ pageNumber: number; text: string }> = [];
    let retrievalError: string | undefined;
    let pageCount = 0;

    const greetingOnly = /^(hi|hello|hey|salam|assalam(?:u|o)? alaikum|اسلام علیکم|السلام علیکم)[!. ]*$/i.test((prompt || '').trim());
    // When a specific PDF page image is supplied from the browser, use that image
    // directly instead of launching a second PDF scan that can delay the answer.
    if (
      resolved.book &&
      !greetingOnly &&
      !(imageBase64 && bookContext?.pageNumber) &&
      (prompt?.trim() || bookContext?.pageNumber || bookContext?.exercise || bookContext?.chapter)
    ) {
      const retrieved = await retrieveTextbookMaterial(resolved.book, bookContext, prompt || '');
      retrievedPages = retrieved.pages;
      retrievalError = retrieved.error;
      pageCount = retrieved.pageCount;
    }

    let sourceContext = '';
    const responseSources: AssistantSource[] = [];

    if (resolved.book) {
      const book = resolved.book;
      contextDetails.push('[Resolved catalogue record]');
      contextDetails.push(formatBookCatalogEntry(book));
      responseSources.push({
        title: book.title,
        url: book.officialPageUrl || book.pdfUrl || 'https://ebooks.stbb.edu.pk/',
        detail: retrievedPages.length
          ? 'Relevant PDF pages: ' + retrievedPages.map((page) => page.pageNumber).join(', ')
          : 'Official textbook record',
      });

      if (retrievedPages.length) {
        sourceContext = '\n[Text extracted from the selected textbook PDF. Use this source material before relying on general knowledge. PDF page numbers may differ from printed page numbers.]\n' +
          retrievedPages.map((page) => '--- PDF page ' + page.pageNumber + ' ---\n' + page.text).join('\n\n');
      } else if (retrievalError) {
        sourceContext = '\n[Textbook retrieval note: ' + retrievalError +
          ' Do not claim that you inspected the requested page or exercise. If exact wording is needed, ask the student to upload a clear page photo or tell you the PDF page number.]\n';
      }
    } else if (resolved.candidates.length) {
      const catalogList = resolved.candidates.map((book) => formatBookCatalogEntry(book)).join('\n\n');
      sourceContext = '\n[Possible matching STBB catalogue entries. The intended book is not uniquely identified; do not pretend one was selected. Ask a brief clarification if a specific book is needed.]\n' +
        catalogList + '\n';
      for (const book of resolved.candidates.slice(0, 5)) {
        responseSources.push({
          title: 'Class ' + book.classNumber + ' ' + book.subjectName + ' — ' + book.title + ' (' + book.medium + ')',
          url: book.officialPageUrl || book.pdfUrl || 'https://ebooks.stbb.edu.pk/',
          detail: 'Class ' + book.classNumber + ' • ' + book.medium + ' medium',
        });
      }
    }

    const contextHeader = contextDetails.length
      ? '\n[Student textbook context]\n' + contextDetails.join('\n') + '\n'
      : '';

    const systemInstruction = [
      'You are STBB AI Study Assistant, an independent educational tutor inside the STBB Books app. Never claim to be the Sindh Textbook Board, a government office, or a human teacher. If asked, be honest that you are an AI assistant; do not volunteer internal API/model names.',
      'You help Classes 1–12 across Mathematics, Physics, Biology, Chemistry, Computer Science, English, Urdu, Sindhi and other school subjects.',
      'Language: ' + languageDirective,
      'Accuracy and textbook rules:',
      '1. Understand informal wording, Roman Urdu, typos, shorthand and mixed English/Urdu as best you can. If the request remains ambiguous, ask one short clarification instead of guessing.',
      '2. Respect the class explicitly selected in the app. If a book is selected, search and use that book first. If no book is selected, use the selected class and recognizable topic to choose the closest subject/book from the STBB catalogue, then search relevant book text before answering. Never silently switch to a different class just because the prompt mentions one.',
      '3. When verified textbook text is provided, base textbook-specific answers on it. Do not invent chapter contents, exercise questions, page numbers, official links, or facts supposedly extracted from a book.',
      '3. If a student asks for an entire exercise, solve each visible/retrieved question in order. If the retrieved material is incomplete or too long, clearly say which questions/pages you could answer and ask to continue with the rest; never claim to have completed unseen questions.',
      '4. Solve Mathematics and Physics step by step, show formulas and substitutions, check final results when possible, and state units. For theory subjects, explain concepts in student-friendly language and distinguish textbook facts from extra explanation.',
      '5. If a book or edition is ambiguous, ask which supplied catalogue match they mean. If the student asks where to get a book, provide an official page/download link supplied in context.',
      '6. When PDF text could not be extracted, do not pretend you read the source. Ask for a page image, exact question text, or PDF page number.',
      '7. Never promise 100% certainty. If material is missing or uncertain, say so and show how the student can verify it.',
      '8. For an attached textbook image, read the visible question and answer it. If the text is blurry or cut off, ask for a clearer image.',
      '9. Format answers for school students using clean, plain text. Use short headings on their own lines, numbered steps, and simple • bullets when helpful. Avoid unnecessary long introductions.',
      '10. Do not print Markdown decoration such as # heading markers, ** emphasis markers, or --- separators. Write the words cleanly without these symbols.',
      '11. Never output raw LaTeX math wrappers or commands. Do not use dollar-sign math delimiters or commands such as fraction/text wrappers. Write equations using ordinary text and readable Unicode symbols, for example: 2x + 5 = 17, (2x)/2 = 12/2, x = 6.',
    ].join('\n');

    let userPromptText = '';
    if (mode === 'solve-exercise') {
      userPromptText = 'Solve this textbook question or exercise step by step:\n' +
        (prompt || 'Solve the question indicated in the supplied textbook context.');
    } else if (mode === 'vocabulary') {
      userPromptText = 'Explain the meaning and usage in the selected language:\n' + prompt;
    } else {
      userPromptText = prompt?.trim() || 'Please answer based on the attached textbook page.';
    }

    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{
      text: contextHeader + sourceContext + '\n' + userPromptText,
    }];

    if (imageBase64) {
      const rawImage = String(imageBase64).trim();
      const imageData = rawImage.replace(/^data:[^;]+;base64,/, '');
      userParts.push({
        inlineData: {
          mimeType: imageMimeType || 'image/jpeg',
          data: imageData,
        },
      });
    }

    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    if (Array.isArray(history)) {
      for (const turn of history.filter((item) => item && item.content).slice(-8)) {
        const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
        const textPart = { text: String(turn.content).slice(0, 12000) };

        // Gemini conversation history must start with a user turn and alternate roles.
        if (!contents.length && role === 'model') continue;
        const previous = contents[contents.length - 1];
        if (previous?.role === role) {
          previous.parts.push(textPart);
        } else {
          contents.push({ role, parts: [textPart] });
        }
      }
    }

    // If saved history ends on a user turn, merge the current prompt into it so roles alternate.
    const lastContent = contents[contents.length - 1];
    if (lastContent?.role === 'user') {
      lastContent.parts.push(...userParts);
    } else {
      contents.push({ role: 'user', parts: userParts });
    }

    const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
    let aiText = '';
    let lastTriedModel = geminiModel.replace(/^models\//, '');
    let lastGeminiFailure: { status: number; message: string } = { status: 0, message: '' };

    // Use live models available to this key. If discovery is temporarily down,
    // still try the configured model plus a few common Flash alternatives.
    let discoveredModels: string[] = [];
    try {
      discoveredModels = await getAvailableGeminiTextModels(geminiApiKey);
    } catch (discoveryError: unknown) {
      const detail = getGeminiErrorDetails(discoveryError);
      console.warn('Gemini model discovery failed' +
        (detail.status ? ' with HTTP ' + detail.status : '') + '. Trying configured model and safe fallbacks.');
    }

    const configuredModel = geminiModel.replace(/^models\//, '');
    const fallbackModels = [
      'gemini-3.8-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ];
    const modelsToTry = Array.from(new Set([
      configuredModel,
      ...discoveredModels,
      ...fallbackModels,
    ])).filter(Boolean).slice(0, 3);

    // One shared deadline bounds all fallback attempts, not 10 seconds per model.
    const generationDeadline = AbortSignal.timeout(9000);
    let shouldStop = false;
    for (const modelName of modelsToTry) {
      lastTriedModel = modelName;
      // A provider 503 can be temporary. Retry the current model once, then
      // automatically fail over to another model available to this API key.
      for (let attempt = 0; attempt < 1; attempt += 1) {
        try {
          const response = await genAI.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2,
              maxOutputTokens: 3500,
              // All model fallback attempts share one deadline.
              abortSignal: generationDeadline,
            },
          });
          aiText = (response.text || '').trim();
          if (aiText) {
            shouldStop = true;
            break;
          }
          lastGeminiFailure = { status: 502, message: 'The model returned an empty response.' };
          break;
        } catch (providerError: unknown) {
          const detail = getGeminiErrorDetails(providerError);
          lastGeminiFailure = detail;

          console.warn(
            'Gemini model "' + modelName + '" failed' +
            (detail.status ? ' with HTTP ' + detail.status : '') +
            (detail.message ? ': ' + detail.message : '.')
          );

          if (
            detail.status === 401 ||
            detail.status === 403 ||
            /API_KEY_INVALID|invalid api key|permission denied|forbidden/i.test(detail.message)
          ) {
            return res.status(503).json({
              error: 'The AI assistant needs an administrator to check its Gemini API key and permissions.',
            });
          }

          const overloaded = detail.status === 503 ||
            /UNAVAILABLE|high demand|overloaded|temporarily unavailable/i.test(detail.message);
          const quotaLimited = detail.status === 429 ||
            /RESOURCE_EXHAUSTED|quota exceeded|rate.?limit|too many requests/i.test(detail.message);
          const modelUnavailable = detail.status === 404 ||
            /not found|no longer available|unsupported model|unknown model/i.test(detail.message);

          // Quota/rate limits and model availability can differ by model. Try
          // the next eligible model instead of failing the whole student query.
          if (overloaded || quotaLimited || modelUnavailable || detail.status === 400) {
            break;
          }

          // Other failures are unlikely to be fixed by switching models.
          shouldStop = true;
          break;
        }
      }

      if (aiText || shouldStop) break;
    }

    if (!aiText) {
      console.warn(
        'All Gemini models failed. Last status: ' +
        (lastGeminiFailure.status || 'unknown') +
        '; last attempted model: ' + lastTriedModel + '.'
      );

      if (lastGeminiFailure.status === 429 ||
        /RESOURCE_EXHAUSTED|quota exceeded|rate.?limit|too many requests/i.test(lastGeminiFailure.message)) {
        return res.status(429).json({
          error: 'The Gemini API quota or rate limit has been reached for the available models. Check your Google AI Studio usage limits and try again after they reset.',
        });
      }
      if (lastGeminiFailure.status === 503 ||
        /UNAVAILABLE|high demand|overloaded|temporarily unavailable/i.test(lastGeminiFailure.message)) {
        return res.status(503).json({
          error: 'Gemini is temporarily overloaded across the available models. STBB AI tried automatic retries and model fallback; please retry shortly.',
        });
      }
      if (lastGeminiFailure.status === 404 ||
        /not found|no longer available|unsupported model|unknown model/i.test(lastGeminiFailure.message)) {
        return res.status(503).json({
          error: 'No compatible Gemini text model was found for this API key. Check Google AI Studio model availability and try again.',
        });
      }
      return res.status(502).json({
        error: 'The AI assistant could not complete this request. Please check Gemini model access and try again.',
      });
    }

    let followUps: string[];
    if (language === 'urdu') {
      followUps = ['اس کی مزید آسان وضاحت کریں', 'اگلا سوال حل کریں', 'اس سبق کے اہم نکات بتائیں'];
    } else if (language === 'sindhi') {
      followUps = ['هن کي وڌيڪ آسان نموني سمجهايو', 'اڳيون سوال حل ڪريو', 'هن سبق جا اهم نڪتا ٻڌايو'];
    } else {
      followUps = ['Explain this in simpler terms', 'Solve the next question', 'List the key points from this section'];
    }

    return res.json({
      answer: aiText,
      language,
      bookContext: bookContext || null,
      followUps,
      sources: responseSources,
      retrieval: resolved.book ? {
        bookTitle: resolved.book.title,
        extractedPages: retrievedPages.map((page) => page.pageNumber),
        totalPdfPages: pageCount || undefined,
        textAvailable: retrievedPages.length > 0,
      } : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('STBB AI Study Assistant request failed:', (err.message || 'unknown error').slice(0, 180));
    return res.status(500).json({
      error: 'The AI Study Assistant encountered a processing issue. Please try again.',
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
        // Allow port fallback during development, including when Codespaces sets PORT.
        if (error.code === 'EADDRINUSE' && attempts > 0 && isDev) {
          const nextPort = port + 1;
          console.warn(`Port ${port} is already in use; trying port ${nextPort}.`);
          resolve(listenWithFallback(nextPort, attempts - 1));
          return;
        }

        reject(error);
      });
    });

  await listenWithFallback(PORT, isDev ? 10 : 0);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
