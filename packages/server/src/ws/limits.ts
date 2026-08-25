import type { IncomingMessage } from 'node:http';
import { config } from '../config.js';

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
}

/**
 * Per-address ceilings. Without them every budget in the gateway is per socket,
 * and a client that wants more simply opens more sockets: that is how a single
 * machine could hold every seat in a room while looking like a crowd.
 */
export class AddressLimits {
  private readonly entries = new Map<string, Entry>();

  /** Whether another socket from this address may be accepted. */
  canAccept(address: string): boolean {
    return (this.entries.get(address)?.sockets ?? 0) < config.maxSocketsPerAddress;
  }

  open(address: string): void {
    this.entry(address).sockets += 1;
  }

  close(address: string): void {
    const entry = this.entries.get(address);
    if (!entry) return;
    entry.sockets = Math.max(0, entry.sockets - 1);
    if (entry.sockets === 0) this.entries.delete(address);
  }

  private entry(address: string): Entry {
    const existing = this.entries.get(address);
    if (existing) return existing;
    const entry: Entry = { sockets: 0 };
    this.entries.set(address, entry);
    return entry;
  }
}
