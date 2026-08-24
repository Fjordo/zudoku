import fs from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import { config } from '../config.js';
import type { RoomManager } from '../rooms/roomManager.js';

/** HTTP surface: health check plus the built client as a single-page app. */
export function createApp(rooms: RoomManager): Express {
  const app = express();
  app.disable('x-powered-by');

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
  });

  const indexFile = path.join(config.clientDir, 'index.html');
  if (!fs.existsSync(indexFile)) return app;

  // Hashed assets are immutable; the shell and service worker must stay fresh.
  app.use(
    express.static(config.clientDir, {
      index: false,
      setHeaders: (res, filePath) => {
        const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
        res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/ws')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });

  return app;
}
