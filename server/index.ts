import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Value } from 'typebox/value';
import type { AssistantRequest } from '../src/assistantApi';
import { runAssistant } from './assistant/runtime';
import { AssistantRequestSchema } from './assistant/schemas';
import { loadWorkspace } from './workspace';

const app = express();
const port = Number(process.env.PORT || 3000);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.use(express.json({ limit: '300kb' }));

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

app.listen(port, '127.0.0.1', () => {
  console.log(`Instrument listening on http://127.0.0.1:${port}`);
});
