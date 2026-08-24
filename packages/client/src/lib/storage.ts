/** localStorage helpers that never throw (private mode, quota, disabled storage). */
export function readJson<T>(key: string, storage: Storage = localStorage): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown, storage: Storage = localStorage): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state simply is not persisted */
  }
}

export function remove(key: string, storage: Storage = localStorage): void {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}
