import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { config } from '../config.js';
import { AddressLimits, clientAddress, createWindow, withinBudget } from './limits.js';

describe('sliding window budget', () => {
  it('stops at the limit without charging the attempt it refused', () => {
    const window = createWindow(0);
    for (let spent = 0; spent < 3; spent += 1) {
      expect(withinBudget(window, 0, 3, 1000)).toBe(true);
      window.count += 1;
    }
    expect(withinBudget(window, 0, 3, 1000)).toBe(false);

    // The refusal left the counter alone, so the window still clears on time
    // instead of being held above its limit by a client that keeps hammering.
    expect(withinBudget(window, 1000, 3, 1000)).toBe(true);
  });
});

describe('AddressLimits', () => {
  it('caps the sockets one address may hold open, and only that address', () => {
    const limits = new AddressLimits();
    for (let opened = 0; opened < config.maxSocketsPerAddress; opened += 1) {
      expect(limits.canAccept('1.2.3.4')).toBe(true);
      limits.open('1.2.3.4', 0);
    }

    expect(limits.canAccept('1.2.3.4')).toBe(false);
    expect(limits.canAccept('5.6.7.8')).toBe(true);

    limits.close('1.2.3.4', 0);
    expect(limits.canAccept('1.2.3.4')).toBe(true);
  });

  it('keeps a spent budget across a reconnect', () => {
    const limits = new AddressLimits();
    limits.open('1.2.3.4', 0);
    limits.costlyWindow('1.2.3.4', 0).count = config.maxCostlyActionsPerAddressWindow;
    limits.close('1.2.3.4', 0);

    // Dropping the entry with the socket would let a client buy a fresh
    // allowance for the price of a reconnect.
    expect(limits.costlyWindow('1.2.3.4', 0).count).toBe(config.maxCostlyActionsPerAddressWindow);
  });

  it('forgets an address that holds no socket once its budget has expired', () => {
    const limits = new AddressLimits();
    limits.open('1.2.3.4', 0);
    limits.costlyWindow('1.2.3.4', 0).count = 5;
    limits.close('1.2.3.4', 0);

    limits.sweep(config.costlyActionWindowMs);
    expect(limits.costlyWindow('1.2.3.4', 0).count).toBe(0);
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
