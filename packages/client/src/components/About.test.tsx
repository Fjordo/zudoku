import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../i18n';
import { About } from './About';

/**
 * The app ships as one unit, so its version is written only in the root
 * manifest; `vite.config.ts` reads it from there and bakes it into the bundle
 * as `__APP_VERSION__`. Point that read at a manifest without a version and the
 * colophon silently prints "Version undefined", so the wiring is tested rather
 * than assumed.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const { version: rootVersion } = JSON.parse(
  readFileSync(path.resolve(here, '../../../../package.json'), 'utf8'),
) as { version?: string };

const openColophon = async () => {
  const user = userEvent.setup();
  render(
    <I18nProvider>
      <About />
    </I18nProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'About Zudoku' }));
  return user;
};

describe('app version', () => {
  it('is baked into the bundle from the root manifest', () => {
    expect(rootVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(__APP_VERSION__).toBe(rootVersion);
  });

  it('is printed in the colophon', async () => {
    await openColophon();

    expect(screen.getByText(`Version ${rootVersion}`)).toBeTruthy();
  });

  it('never reaches the colophon as a missing value', async () => {
    await openColophon();

    expect(screen.getByRole('dialog').textContent).not.toMatch(/undefined|null/);
  });
});
