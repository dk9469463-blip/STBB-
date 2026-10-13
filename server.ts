import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import dns from 'dns';
import { GoogleGenAI } from '@google/genai';

// CRITICAL FIX: Force IPv4 first DNS lookup to prevent connection timeouts/hangs on dual-stack hosts
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Gemini SDK with telemetry header User-Agent: aistudio-build
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON & Body Parsing for AI chat & image uploads
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

// In-Memory Metadata Cache for Official STBB PDF Documents
interface PdfMetadata {
  contentLength: number;
  contentType: string;
  filename: string;
  acceptRanges: boolean;
  fetchedAt: number;
}
const pdfMetadataCache = new Map<string, PdfMetadata>();
const inFlightProbes = new Map<string, Promise<PdfMetadata | null>>();

async function fetchPdfMetadata(targetUrl: string): Promise<PdfMetadata | null> {
  const cached = pdfMetadataCache.get(targetUrl);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < 1000 * 60 * 60 * 24) {
    return cached;
  }

  return probeWithRange(targetUrl);
}

function probeWithRange(targetUrl: string): Promise<PdfMetadata | null> {
  const cached = pdfMetadataCache.get(targetUrl);
  if (cached && cached.contentLength > 0) return Promise.resolve(cached);

  const existingProbe = inFlightProbes.get(targetUrl);
  if (existingProbe) return existingProbe;

  const probePromise = new Promise<PdfMetadata | null>((resolve) => {
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
          Range: 'bytes=0-1',
          Connection: 'close',
        },
        family: 4,
        timeout: 10000,
      },
      (res) => {
        let contentLength = 0;
        const cr = res.headers['content-range'];
        if (cr) {
          const match = cr.match(/\/(\d+)$/);
          if (match && match[1]) {
            contentLength = parseInt(match[1], 10);
          }
        }
        res.resume();
        req.destroy();

        if (contentLength > 0) {
          const meta: PdfMetadata = {
            contentLength,
            contentType: res.headers['content-type'] || 'application/pdf',
            filename: 'STBB-Textbook.pdf',
            acceptRanges: true,
            fetchedAt: Date.now(),
          };
          pdfMetadataCache.set(targetUrl, meta);
          return resolve(meta);
        }
        resolve(null);
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  }).finally(() => {
    inFlightProbes.delete(targetUrl);
  });

  inFlightProbes.set(targetUrl, probePromise);
  return probePromise;
}

// 1. Enable CORS for API routes
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
    officialSource: 'https://ebooks.stbb.edu.pk/',
    totalCachedMetadata: pdfMetadataCache.size,
  });
});

// STREAM PDF FOR IN-APP READER (with Suffix Range Normalization & HEAD support)
app.all('/api/pdf/stream', async (req: Request, res: Response) => {
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawId = (req.query.id as string) || '';
  const cleanId = rawId.replace(/^stbb-official-/, '');
  let targetUrl = '';

  if (cleanId && /^\d+$/.test(cleanId)) {
    targetUrl = `https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=${cleanId}`;
  } else if (req.query.url && typeof req.query.url === 'string') {
    if (isAllowedUrl(req.query.url)) {
      targetUrl = req.query.url;
    } else {
      return res.status(403).json({ error: 'Target domain not authorized by STBB security policy' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid or missing book ID' });
  }

  // If client sends a HEAD request (PDF.js initial probe)
  if (method === 'HEAD') {
    let meta = pdfMetadataCache.get(targetUrl);
    if (!meta || meta.contentLength <= 0) {
      meta = (await fetchPdfMetadata(targetUrl)) || undefined;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (meta?.contentLength) {
      res.setHeader('Content-Length', meta.contentLength.toString());
    }
    return res.status(200).end();
  }

  // Handle GET streaming
  const clientHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
    Accept: 'application/pdf, */*',
    Connection: 'close',
  };

  const incomingRange = req.headers.range;

  // CRITICAL FIX: Rewrite suffix ranges (e.g., bytes=-65536) to explicit ranges (bytes=START-END)
  // Official STBB PHP proxy breaks or hangs on suffix ranges for large textbooks (100MB+).
  if (incomingRange) {
    const suffixMatch = incomingRange.match(/bytes=-(\d+)$/);
    if (suffixMatch) {
      let meta = pdfMetadataCache.get(targetUrl);
      if (!meta || meta.contentLength <= 0) {
        meta = (await fetchPdfMetadata(targetUrl)) || undefined;
      }

      if (meta && meta.contentLength > 0) {
        const suffixBytes = parseInt(suffixMatch[1], 10);
        const start = Math.max(0, meta.contentLength - suffixBytes);
        const end = meta.contentLength - 1;
        clientHeaders['Range'] = `bytes=${start}-${end}`;
      } else {
        // Fallback to start chunk if length is completely unknown
        clientHeaders['Range'] = 'bytes=0-65535';
      }
    } else {
      clientHeaders['Range'] = incomingRange;
    }
  }

  const client = targetUrl.startsWith('https') ? https : http;
  const timeoutMs = 45000;

  const request = client.get(targetUrl, { headers: clientHeaders, family: 4, timeout: timeoutMs }, (upstreamRes) => {
    // If upstream returned content-range, automatically populate metadata cache
    const cr = upstreamRes.headers['content-range'];
    if (cr) {
      const match = cr.match(/\/(\d+)$/);
      if (match && match[1]) {
        const totalLen = parseInt(match[1], 10);
        if (totalLen > 0 && !pdfMetadataCache.has(targetUrl)) {
          pdfMetadataCache.set(targetUrl, {
            contentLength: totalLen,
            contentType: upstreamRes.headers['content-type'] || 'application/pdf',
            filename: 'STBB-Textbook.pdf',
            acceptRanges: true,
            fetchedAt: Date.now(),
          });
        }
      }
    }

    // Follow redirect if 301/302
    if ((upstreamRes.statusCode === 301 || upstreamRes.statusCode === 302) && upstreamRes.headers.location) {
      const redirectUrl = upstreamRes.headers.location;
      if (!isAllowedUrl(redirectUrl)) {
        return res.status(403).json({ error: 'Redirect target not permitted' });
      }
      const redirClient = redirectUrl.startsWith('https') ? https : http;
      const redirReq = redirClient.get(redirectUrl, { headers: clientHeaders, family: 4, timeout: timeoutMs }, (redirRes) => {
        forwardPdfStream(redirRes, res, targetUrl);
      });
      redirReq.on('error', (err) => {
        console.error('Redirect stream error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Failed to stream redirected PDF' });
      });
      res.on('close', () => redirReq.destroy());
      return;
    }

    forwardPdfStream(upstreamRes, res, targetUrl);
  });

  // Gracefully handle client aborts and closures without unhandled exceptions
  res.on('close', () => {
    request.destroy();
  });

  request.on('timeout', () => {
    request.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'Connection to official STBB server timed out' });
    }
  });

  request.on('error', (err) => {
    console.error('Error streaming PDF from STBB:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Unable to reach official STBB textbook repository' });
    }
  });
});

function forwardPdfStream(upstreamRes: http.IncomingMessage, res: Response, targetUrl?: string) {
  if (upstreamRes.statusCode && upstreamRes.statusCode >= 400) {
    return res.status(upstreamRes.statusCode).json({
      error: `Upstream STBB server returned status ${upstreamRes.statusCode}`,
    });
  }

  const upstreamCt = (upstreamRes.headers['content-type'] || '').toLowerCase();
  if (upstreamCt.includes('text/html') || upstreamCt.includes('text/plain')) {
    let body = '';
    upstreamRes.on('data', (chunk) => {
      if (body.length < 300) body += chunk.toString();
    });
    upstreamRes.on('end', () => {
      if (!res.headersSent) {
        res.status(upstreamRes.statusCode === 404 ? 404 : 502).json({
          error: `Official STBB repository returned an error response instead of a PDF file. ${body.replace(/<[^>]*>/g, '').slice(0, 120).trim()}`,
        });
      }
    });
    return;
  }

  res.status(upstreamRes.statusCode || 200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Accept-Ranges', 'bytes');

  if (upstreamRes.headers['content-length']) {
    res.setHeader('Content-Length', upstreamRes.headers['content-length']);
  }
  if (upstreamRes.headers['content-range']) {
    res.setHeader('Content-Range', upstreamRes.headers['content-range']);
  }

  // Graceful piping with error suppression on client disconnect
  upstreamRes.on('error', (err) => {
    console.warn('Upstream PDF read error:', err.message);
    if (!res.headersSent) res.status(502).end();
  });

  res.on('error', (err) => {
    console.warn('Client response stream error:', err.message);
    upstreamRes.destroy();
  });

  upstreamRes.pipe(res);
}

// DIRECT PDF DOWNLOAD ENDPOINT (Content-Disposition: attachment, meaningful filename)
app.get('/api/pdf/download', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  const urlParam = req.query.url as string;
  const requestedName = (req.query.filename as string) || `STBB-Textbook-${id || 'book'}.pdf`;
  const filename = sanitizeFilename(requestedName);
  const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');

  let targetUrl = '';
  if (id && /^\d+$/.test(id)) {
    targetUrl = `https://portal.stbb.edu.pk/ebooks/pdf_proxy.php?id=${id}&download=1`;
  } else if (urlParam && isAllowedUrl(urlParam)) {
    targetUrl = urlParam;
  } else {
    return res.status(400).json({ error: 'Invalid book identifier or unauthorized URL' });
  }

  const clientHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
    Accept: 'application/pdf, */*',
    Connection: 'close',
  };
  if (req.headers.range) {
    clientHeaders['Range'] = req.headers.range;
  }

  const client = targetUrl.startsWith('https') ? https : http;

  const request = client.get(targetUrl, { headers: clientHeaders, family: 4, timeout: 45000 }, (upstreamRes) => {
    if (upstreamRes.statusCode && upstreamRes.statusCode >= 400) {
      return res.status(upstreamRes.statusCode).json({
        error: `Failed to download: STBB server returned status ${upstreamRes.statusCode}`,
      });
    }

    const upstreamCt = (upstreamRes.headers['content-type'] || '').toLowerCase();
    if (upstreamCt.includes('text/html') || upstreamCt.includes('text/plain')) {
      let body = '';
      upstreamRes.on('data', (chunk) => {
        if (body.length < 300) body += chunk.toString();
      });
      upstreamRes.on('end', () => {
        if (!res.headersSent) {
          res.status(upstreamRes.statusCode === 404 ? 404 : 502).json({
            error: `Failed to download: Official STBB server returned HTML error instead of PDF. ${body.replace(/<[^>]*>/g, '').slice(0, 120).trim()}`,
          });
        }
      });
      return;
    }

    res.status(upstreamRes.statusCode || 200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Accept-Ranges', 'bytes');

    if (upstreamRes.headers['content-length']) {
      res.setHeader('Content-Length', upstreamRes.headers['content-length']);
    }
    if (upstreamRes.headers['content-range']) {
      res.setHeader('Content-Range', upstreamRes.headers['content-range']);
    }

    upstreamRes.on('error', () => {
      if (!res.headersSent) res.status(502).end();
    });

    res.on('error', () => upstreamRes.destroy());
    upstreamRes.pipe(res);
  });

  res.on('close', () => {
    request.destroy();
  });

  request.on('error', (err) => {
    console.error('Error downloading PDF from STBB:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to retrieve PDF from official source' });
    }
  });
});

// COVER IMAGE PROXY
app.get('/api/image/proxy', (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || !isAllowedUrl(imageUrl)) {
    return res.status(403).json({ error: 'Image URL not permitted' });
  }

  const client = imageUrl.startsWith('https') ? https : http;
  const request = client.get(
    imageUrl,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) STBB-Books/2.0',
        Referer: 'https://ebooks.stbb.edu.pk/',
        Connection: 'close',
      },
      family: 4,
      timeout: 15000,
    },
    (upstreamRes) => {
      if (upstreamRes.statusCode && upstreamRes.statusCode >= 400) {
        return res.status(upstreamRes.statusCode).end();
      }
      res.setHeader('Content-Type', upstreamRes.headers['content-type'] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      upstreamRes.pipe(res);
    }
  );

  request.on('error', () => {
    if (!res.headersSent) res.status(502).end();
  });
});

// UNIVERSAL AI STUDY ASSISTANT ENDPOINT
// Real supported Gemini 3.8 Flash model on server-side
app.post('/api/ai/study-assist', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      language = 'english',
      mode = 'general',
      bookContext,
      imageBase64,
      imageMimeType = 'image/jpeg',
      history = [],
      batchIndex = 0,
    } = req.body;

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Either text prompt or page image is required.' });
    }

    // Determine Language Directive
    let languageDirective = 'Respond strictly in English. Use clear, educational, student-friendly language.';
    if (language === 'urdu') {
      languageDirective =
        'براہ کرم اپنا پورا جواب مکمل اور معیاری اردو رسم الخط میں تحریر کریں۔ اصطلاحات اور ریاضیاتی حل کی وضاحت اردو میں دیجیے اور جہاں ضروری ہو انگریزی اصطلاح بریکٹ میں لکھیے۔';
    } else if (language === 'sindhi') {
      languageDirective =
        'مهرباني ڪري پنهنجو مڪمل جواب معياري سنڌي عربي رسم الخط ۾ تحرير ڪريو. اصطلاحن ۽ رياضياتي حل جي وضاحت سنڌي ٻوليءَ ۾ ڏيو، ۽ جتي ضروري هجي اتي انگريزي اصطلاح بريڪيٽ ۾ لکو.';
    }

    // Context details from real STBB catalog
    const contextDetails: string[] = [];
    if (bookContext?.classNumber) contextDetails.push(`Class: Class ${bookContext.classNumber}`);
    if (bookContext?.subjectName) contextDetails.push(`Subject: ${bookContext.subjectName}`);
    if (bookContext?.bookTitle) contextDetails.push(`Official Book: ${bookContext.bookTitle}`);
    if (bookContext?.chapter) contextDetails.push(`Chapter/Unit: ${bookContext.chapter}`);
    if (bookContext?.exercise) contextDetails.push(`Exercise: ${bookContext.exercise}`);
    if (bookContext?.pageNumber) contextDetails.push(`Printed Page Number: ${bookContext.pageNumber}`);
    if (bookContext?.questionNumber) contextDetails.push(`Question Number: ${bookContext.questionNumber}`);
    if (bookContext?.selectedText) contextDetails.push(`Selected Textbook Text: "${bookContext.selectedText}"`);

    const contextHeader =
      contextDetails.length > 0
        ? `\n### Verified STBB Textbook Context:\n${contextDetails.join('\n')}\n`
        : '';

    const systemInstruction = `
You are the Universal AI Study Assistant for the Sindh Textbook Board (STBB), Jamshoro, Sindh, Pakistan.
You assist students and teachers from Class 1 through Class 12 across all subjects:
- Mathematics, General Mathematics
- English, Urdu, Sindhi
- Islamiat, Ethics, Quranic Studies
- General Science, Biology, Physics, Chemistry
- Computer Science
- Social Studies, Pakistan Studies, and all secondary & intermediate streams.

Educational Rules:
1. Ground answers strictly in the official Sindh Textbook Board (STBB) curriculum.
2. ${languageDirective}
3. When solving textbook exercises or questions:
   - Identify the exact question being asked.
   - Show the step-by-step mathematical derivation or scientific explanation.
   - State formulas, definitions, and theorems clearly.
   - Provide the final answer prominently (e.g., "**Final Answer:** ...").
   - If solving an exercise, solve questions systematically in sequential order.
4. When explaining vocabulary, words, or selected passages:
   - Provide the definition, phonetic pronunciation if applicable, context in the lesson, synonyms/antonyms, and an illustrative example sentence.
5. When answering MCQs:
   - State the correct option letter & text.
   - Explain why that option is correct and why other options are incorrect according to the textbook.
6. When explaining page screenshots or images:
   - Read the scanned textbook question carefully using visual understanding.
   - Quote the question text before answering.
7. Tone: Encouraging, academic, structured, and pedagogical. Use Markdown with clean bold headers and bullet points.
`.trim();

    // Assemble parts (text + optional image)
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (imageBase64) {
      // Strip any data:image/...;base64, prefix if present
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: cleanBase64,
        },
      });
    }

    // Build the user message prompt
    let userPromptText = `${contextHeader}\n\n`;

    if (mode === 'solve-exercise') {
      userPromptText += `Please solve the requested exercise/question(s) in batch ${batchIndex + 1}:\n${prompt || 'Solve all identifiable questions in order with complete steps.'}`;
    } else if (mode === 'vocabulary') {
      userPromptText += `Explain the meaning and usage of the following word/phrase:\n${prompt}`;
    } else if (mode === 'mcq') {
      userPromptText += `Provide the correct answer and detailed explanation for this MCQ:\n${prompt}`;
    } else {
      userPromptText += prompt;
    }

    parts.push({ text: userPromptText });

    // Call Gemini 3.8 Flash model with automatic retry for transient 503 demand spikes
    let response;
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });
        break;
      } catch (geminiErr: any) {
        if (attempts >= 3 || (!geminiErr?.message?.includes('503') && !geminiErr?.message?.includes('demand'))) {
          throw geminiErr;
        }
        await new Promise((r) => setTimeout(r, 1200 * attempts));
      }
    }

    if (!response) {
      throw new Error('AI assistant did not receive a response from the service. Please retry.');
    }
    const aiText = response.text || 'No response generated.';

    // Extract potential follow-up suggestions
    const followUps: string[] = [];
    if (language === 'urdu') {
      followUps.push('اس کی مزید آسان وضاحت کیجیے');
      followUps.push('اگلا سوال حل کریں');
      followUps.push('اس موضوع سے متعلق اہم ایم سی کیوز بنائیں');
    } else if (language === 'sindhi') {
      followUps.push('هن کي وڌيڪ آسان لفظن ۾ سمجهايو');
      followUps.push('ايندڙ سوال حل ڪريو');
      followUps.push('هن موضوع تي ايم سي ڪيوز (MCQs) ٺاهيو');
    } else {
      followUps.push('Explain this in simpler terms');
      followUps.push('Solve the next question');
      followUps.push('Generate 3 practice MCQs on this topic');
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
      error: 'The AI Study Assistant encountered a temporary processing issue. Please try again.',
      details: err.message.includes('API key')
        ? 'AI Studio API key configuration is pending.'
        : err.message.slice(0, 150),
    });
  }
});

// START EXPRESS SERVER WITH VITE INTEGRATION
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STBB Books server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
