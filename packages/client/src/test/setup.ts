import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

/** In-memory stand-in for a Storage the environment failed to hand over. */
function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
    removeItem: (key) => {
      entries.delete(key);
    },
    clear: () => {
      entries.clear();
    },
  };
}

// Node 26 defines `localStorage` and `sessionStorage` itself, as stubs that read
// as undefined unless the process was started with --localstorage-file. Vitest's
// jsdom environment only copies a window property onto the global when the name
// is still free, so there the stub wins and every `localStorage.…` in a test
// throws. Stand in our own Storage whenever the global is not jsdom's; that also
// rebuilds it per test file, so files sharing a worker never inherit each other's
// saved games.
if (!(globalThis.localStorage instanceof Storage)) {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, name, {
      value: memoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
