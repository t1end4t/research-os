import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Value } from 'typebox/value';
import type { AssistantRequest } from '../src/assistantApi';
import { runAssistant } from './assistant/runtime';
import { AssistantRequestSchema } from './assistant/schemas';
import { loadWorkspace } from './workspace';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const rootDir = process.cwd();

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/pdf/proxy', async (request, response) => {
    const rawUrl = request.query.url;
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
      response.status(400).json({ error: 'Missing url query parameter.' });
      return;
    }

    try {
      let targetUrl = rawUrl.trim();
      // Handle arXiv identifiers or abs URLs
      if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(targetUrl)) {
        targetUrl = `https://arxiv.org/pdf/${targetUrl}.pdf`;
      } else if (targetUrl.includes('arxiv.org/abs/')) {
        targetUrl = targetUrl.replace('arxiv.org/abs/', 'arxiv.org/pdf/') + '.pdf';
      }

      const parsed = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        response.status(400).json({ error: 'Invalid protocol. Only HTTP/HTTPS supported.' });
        return;
      }

      const fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/pdf,*/*',
        },
      });

      if (!fetchRes.ok) {
        response.status(fetchRes.status).json({ error: `Failed to fetch PDF: ${fetchRes.statusText}` });
        return;
      }

      const buffer = await fetchRes.arrayBuffer();
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', 'inline');
      response.send(Buffer.from(buffer));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to proxy PDF.';
      response.status(500).json({ error: message });
    }
  });

  app.get('/api/workspace', async (_request, response) => {
    try {
      response.json(await loadWorkspace());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Workspace load failed.';
      response.status(500).json({ error: message });
    }
  });

  app.post('/api/assistant', async (request, response) => {
    if (!Value.Check(AssistantRequestSchema, request.body)) {
      response.status(400).json({ error: 'Invalid assistant request.' });
      return;
    }

    try {
      response.json(await runAssistant(request.body as AssistantRequest));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assistant request failed.';
      response.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(rootDir, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_request, response) => response.sendFile(path.join(distDir, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      root: rootDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Instrument listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
