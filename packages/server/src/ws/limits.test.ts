import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { config } from '../config.js';
import { AddressLimits, clientAddress } from './limits.js';

describe('AddressLimits', () => {
  it('caps the sockets one address may hold open, and only that address', () => {
    const limits = new AddressLimits();
    for (let opened = 0; opened < config.maxSocketsPerAddress; opened += 1) {
      expect(limits.canAccept('1.2.3.4')).toBe(true);
      limits.open('1.2.3.4');
    }

    expect(limits.canAccept('1.2.3.4')).toBe(false);
    expect(limits.canAccept('5.6.7.8')).toBe(true);

    limits.close('1.2.3.4');
    expect(limits.canAccept('1.2.3.4')).toBe(true);
  });
});

describe('client address', () => {
  const request = (headers: Record<string, string>): IncomingMessage =>
    ({ headers, socket: { remoteAddress: '1.2.3.4' } }) as unknown as IncomingMessage;

  it('ignores a forwarded address unless the deployment trusts a proxy', () => {
    expect(config.trustProxy).toBe(false);
    expect(clientAddress(request({ 'fly-client-ip': '9.9.9.9' }))).toBe('1.2.3.4');
    expect(clientAddress(request({ 'x-forwarded-for': '9.9.9.9' }))).toBe('1.2.3.4');
  });

  it('falls back to the socket peer when there is no address at all', () => {
    const headless = { headers: {}, socket: {} } as unknown as IncomingMessage;
    expect(clientAddress(headless)).toBe('unknown');
  });
});
