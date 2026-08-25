import type { IncomingMessage } from 'node:http';
import { config } from '../config.js';

/** A sliding window of `count` events since `start`. */
export interface Window {
  start: number;
  count: number;
}

export const createWindow = (now: number): Window => ({ start: now, count: 0 });

/** Rolls an expired window and reports whether the budget still has room. */
export function withinBudget(window: Window, now: number, limit: number, windowMs: number): boolean {
  if (now - window.start >= windowMs) {
    window.start = now;
    window.count = 0;
  }
  return window.count < limit;
}

/**
 * The address a request really came from. The forwarded header is read only
 * when the deployment says a proxy is in front, and then from the *last* hop:
 * a proxy appends the peer it saw, so earlier entries are whatever the client
 * chose to send.
 */
export function clientAddress(req: IncomingMessage): string {
  if (config.trustProxy) {
    const fly = header(req, 'fly-client-ip');
    if (fly) return fly;
    const forwarded = header(req, 'x-forwarded-for');
    const last = forwarded?.split(',').pop()?.trim();
    if (last) return last;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

const header = (req: IncomingMessage, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

interface Entry {
  sockets: number;
  costly: Window;
}

/**
 * Per-address ceilings. Without them every budget in the gateway is per socket,
 * and a client that wants more simply opens more sockets: that is how a single
 * machine could hold every seat in a room and exhaust the shared allowance.
 */
export class AddressLimits {
  private readonly entries = new Map<string, Entry>();

  /** Whether another socket from this address may be accepted. */
  canAccept(address: string): boolean {
    return (this.entries.get(address)?.sockets ?? 0) < config.maxSocketsPerAddress;
  }

  open(address: string, now: number): void {
    this.entry(address, now).sockets += 1;
  }

  close(address: string, now: number): void {
    const entry = this.entries.get(address);
    if (!entry) return;
    entry.sockets = Math.max(0, entry.sockets - 1);
    // The spent budget outlives the socket on purpose: dropping it here would
    // let a client reset its allowance by reconnecting.
    if (entry.sockets === 0 && this.isSpent(entry, now)) this.entries.delete(address);
  }

  /** The costly-action window for this address, created on first use. */
  costlyWindow(address: string, now: number): Window {
    return this.entry(address, now).costly;
  }

  /** Drops addresses that hold no socket and no live budget. */
  sweep(now: number): void {
    for (const [address, entry] of this.entries) {
      if (entry.sockets === 0 && this.isSpent(entry, now)) this.entries.delete(address);
    }
  }

  private entry(address: string, now: number): Entry {
    const existing = this.entries.get(address);
    if (existing) return existing;
    const entry: Entry = { sockets: 0, costly: createWindow(now) };
    this.entries.set(address, entry);
    return entry;
  }

  private isSpent(entry: Entry, now: number): boolean {
    return now - entry.costly.start >= config.costlyActionWindowMs;
  }
}
