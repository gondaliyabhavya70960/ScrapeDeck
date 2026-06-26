import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStorage } from '../lib/storage';
import type { Env } from '../lib/env';

const dir = mkdtempSync(join(tmpdir(), 'scrapedeck-test-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function localEnv(): Env {
  return { STORAGE_BACKEND: 'local-xlsx', DATA_DIR: dir } as Env;
}

const productRow = [
  'rabh', // sourceKey
  'resin', // vertical
  '1', // externalId
  'Resin 1kg', // title
  'p1', // slug
  'Resin', // category
  'Pour-ready kit', // shortTagline
  'A clear pour resin.', // description
  100, // priceMin
  150, // priceMax
  'INR', // currency
  'TRUE', // showPrice
  '', // timeline
  '', // materials
  '', // dimensions
  'active', // status
  'FALSE', // featured
  'https://www.rabh.in/img/p1.jpg', // images
  '', // imageAlts
  '{}', // fields
  '', // seoTitle
  '', // seoDescription
  'https://www.rabh.in/products/p1', // url
  't1', // firstSeen
  't1', // lastSeen
  't1', // lastChanged
  'abc123', // contentHash
];

describe('LocalXlsxStorage (backs `pnpm export` + STORAGE_BACKEND=local-xlsx)', () => {
  it('creates the workbook with all three tabs on init', async () => {
    const storage = createStorage(localEnv());
    expect(storage.kind).toBe('local-xlsx');
    await storage.init();
    expect(existsSync(join(dir, 'scrapedeck.xlsx'))).toBe(true);
  });

  it('round-trips Products through whole-tab overwrite', async () => {
    const storage = createStorage(localEnv());
    await storage.init();
    await storage.writeProducts([productRow]);
    const rows = await storage.readProducts();
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]).toBe('rabh');
    expect(rows[0]![8]).toBe('100'); // price read back as a string
  });

  it('appends history and runs without clobbering products', async () => {
    const storage = createStorage(localEnv());
    await storage.init();
    await storage.writeProducts([productRow]);
    await storage.appendHistory([
      ['t2', 'rabh', '1', 'Resin 1kg', 'INR', 120, 150, 'in_stock'],
    ]);
    await storage.appendRuns([['t2', 'rabh', 'ok', 1, 0, 1, 42, '']]);
    const rows = await storage.readProducts();
    expect(rows).toHaveLength(1); // products untouched by the appends
  });
});
