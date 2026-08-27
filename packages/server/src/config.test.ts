import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { config } from './config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

const manifest = (...segments: string[]) =>
  JSON.parse(readFileSync(path.join(repoRoot, ...segments, 'package.json'), 'utf8')) as {
    name?: string;
    version?: string;
    workspaces?: string[];
  };

const root = manifest();

describe('app version', () => {
  it('is read from the root manifest', () => {
    expect(root.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(config.version).toBe(root.version);
  });

  /**
   * The invariant is repo-wide rather than server-specific, but it lives here
   * because `config.ts` is what reads the root manifest at runtime: a version
   * reintroduced next to a workspace is the thing that makes that read wrong.
   */
  it('is written in exactly one manifest', () => {
    const workspaces = root.workspaces ?? [];

    // Guard against the loop below passing because it iterates nothing.
    expect(workspaces.length).toBeGreaterThan(0);
    expect([...workspaces].sort()).toEqual(
      readdirSync(path.join(repoRoot, 'packages'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `packages/${entry.name}`)
        .sort(),
    );

    for (const workspace of workspaces) {
      const pkg = manifest(workspace);
      expect(pkg.name, `${workspace} must declare a name`).toBeTruthy();
      expect(pkg.version, `${workspace} must not carry a version of its own`).toBeUndefined();
    }
  });
});
