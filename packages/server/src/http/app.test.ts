import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RoomManager } from '../rooms/roomManager.js';
import { contentSecurityPolicy, createApp } from './app.js';

let server: Server;
let base: string;

beforeEach(async () => {
  server = createServer(createApp(new RoomManager({ ttlMs: 60_000 })));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('http surface', () => {
  it('sends the hardening headers on every response', async () => {
    const response = await fetch(`${base}/healthz`);
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('reports the version from the root manifest, the only place it is written', async () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const { version } = JSON.parse(
      readFileSync(path.resolve(here, '../../../../package.json'), 'utf8'),
    ) as { version: string };

    const body = (await (await fetch(`${base}/healthz`)).json()) as { version: string };

    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(body.version).toBe(version);
  });

  it('sends HSTS only for requests that reached the proxy over https', async () => {
    const plain = await fetch(`${base}/healthz`);
    expect(plain.headers.get('strict-transport-security')).toBeNull();

    const secure = await fetch(`${base}/healthz`, { headers: { 'x-forwarded-proto': 'https' } });
    expect(secure.headers.get('strict-transport-security')).toContain('max-age=31536000');
  });
});

describe('content security policy', () => {
  it('names the same-origin socket so Safari accepts the connection', () => {
    expect(contentSecurityPolicy('zudoku.fly.dev')).toContain(
      "connect-src 'self' ws://zudoku.fly.dev wss://zudoku.fly.dev",
    );
  });

  it('ignores a Host header that could smuggle extra directives', () => {
    const injected = contentSecurityPolicy("evil.test' 'unsafe-inline");
    expect(injected).toContain("connect-src 'self'");
    expect(injected).not.toContain('unsafe-inline evil');
    expect(injected).not.toContain('evil.test');
  });

  it('falls back to self when no Host header is present', () => {
    expect(contentSecurityPolicy(undefined)).toContain("connect-src 'self'");
  });
});
