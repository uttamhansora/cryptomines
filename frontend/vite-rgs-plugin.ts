import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { handleRgsRequest } from '../packages/rgs-mock/src/handler.ts';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

export function rgsMockPlugin(): Plugin {
  return {
    name: 'crypto-mines-rgs-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/rgs')) {
          next();
          return;
        }
        void (async () => {
          const pathname = url.replace(/^\/api\/rgs/, '') || '/';
          let body: Record<string, unknown> = {};
          if (req.method === 'POST') {
            try {
              body = JSON.parse(await readBody(req)) as Record<string, unknown>;
            } catch {
              body = {};
            }
          }
          try {
            const result = await handleRgsRequest(pathname, req.method ?? 'GET', body);
            (res as ServerResponse).statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
          } catch (e) {
            (res as ServerResponse).statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
        })();
      });
    },
  };
}
