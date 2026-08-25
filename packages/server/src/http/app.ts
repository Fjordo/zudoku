import fs from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import { config } from '../config.js';
import type { RoomManager } from '../rooms/roomManager.js';

/**
 * The app loads nothing from a third party: the webfonts are bundled and the
 * WebSocket is same-origin, so every directive can be pinned to 'self'.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  // The scoreboard writes its progress bar width as an inline style attribute.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  // Vite inlines the smallest font subsets straight into the stylesheet.
  "font-src 'self' data:",
  "worker-src 'self'",
  "manifest-src 'self'",
];

/** Characters a host name and port can be made of; anything else is not echoed back. */
const HOST_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-[]';

/** The Host header is client controlled, so it is only reused when it looks like a host. */
const isSafeHost = (host: string): boolean =>
  host.length > 0 && host.length <= 255 && [...host].every((char) => HOST_ALPHABET.includes(char));

/**
 * Safari does not reliably match ws:// against 'self', so the room socket is
 * named explicitly instead of loosening the directive to ws: wss:.
 */
export const contentSecurityPolicy = (host: string | undefined): string => {
  const connect = host && isSafeHost(host) ? `'self' ws://${host} wss://${host}` : "'self'";
  return [...CSP_DIRECTIVES, `connect-src ${connect}`].join('; ');
};

/** HTTP surface: health check plus the built client as a single-page app. */
export function createApp(rooms: RoomManager): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', contentSecurityPolicy(req.headers.host));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    // Fly terminates TLS, so the original scheme arrives in the forwarded header.
    // Browsers ignore HSTS over plain http anyway, so local development is unaffected.
    if (req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

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
