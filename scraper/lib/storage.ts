import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import * as XLSX from 'xlsx';
import {
  sheetsClient,
  ensureTabs,
  readRows,
  overwriteTab,
  appendRows,
  TABS,
  DEFAULT_SHEET_ID,
} from './sheets';
import type { Env } from './env';

/**
 * Backend-agnostic store. The orchestrator only ever talks to this interface,
 * so swapping Google Sheets ⇄ local XLSX is a one-line config change
 * (STORAGE_BACKEND) with no orchestrator edits.
 */
export interface Storage {
  readonly kind: 'google-sheets' | 'local-xlsx';
  /** Human-readable location (Sheet URL / file path) for logs. */
  readonly location: string;
  init(): Promise<void>;
  readProducts(): Promise<string[][]>;
  writeProducts(rows: (string | number)[][]): Promise<void>;
  appendHistory(rows: (string | number)[][]): Promise<void>;
  appendRuns(rows: (string | number)[][]): Promise<void>;
}

// ── Google Sheets backend ───────────────────────────────────────────────────
class SheetsStorage implements Storage {
  readonly kind = 'google-sheets' as const;
  private sheets = sheetsClient();
  constructor(private readonly spreadsheetId: string) {}

  get location() {
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;
  }
  async init() {
    await ensureTabs(this.sheets, this.spreadsheetId);
  }
  readProducts() {
    return readRows(this.sheets, this.spreadsheetId, 'Products');
  }
  writeProducts(rows: (string | number)[][]) {
    return overwriteTab(this.sheets, this.spreadsheetId, 'Products', rows);
  }
  appendHistory(rows: (string | number)[][]) {
    return appendRows(this.sheets, this.spreadsheetId, 'PriceHistory', rows);
  }
  appendRuns(rows: (string | number)[][]) {
    return appendRows(this.sheets, this.spreadsheetId, 'Runs', rows);
  }
}

// ── Local XLSX backend (no Google account) ──────────────────────────────────
class LocalXlsxStorage implements Storage {
  readonly kind = 'local-xlsx' as const;
  constructor(private readonly filePath: string) {}

  get location() {
    return this.filePath;
  }

  private load(): XLSX.WorkBook {
    if (existsSync(this.filePath)) return XLSX.readFile(this.filePath);
    return XLSX.utils.book_new();
  }

  private save(wb: XLSX.WorkBook) {
    mkdirSync(dirname(this.filePath), { recursive: true });
    XLSX.writeFile(wb, this.filePath);
  }

  private sheetRows(wb: XLSX.WorkBook, tab: string): (string | number)[][] {
    const ws = wb.Sheets[tab];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  }

  private writeSheet(
    wb: XLSX.WorkBook,
    tab: string,
    rows: (string | number)[][],
  ) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (wb.Sheets[tab]) {
      wb.Sheets[tab] = ws;
    } else {
      XLSX.utils.book_append_sheet(wb, ws, tab);
    }
  }

  async init() {
    const wb = this.load();
    for (const [tab, headers] of Object.entries(TABS)) {
      if (!wb.Sheets[tab]) {
        this.writeSheet(wb, tab, [headers as unknown as string[]]);
      }
    }
    this.save(wb);
  }

  async readProducts() {
    const wb = this.load();
    const rows = this.sheetRows(wb, 'Products');
    return rows.slice(1).map((r) => r.map((c) => String(c ?? ''))); // drop header
  }

  async writeProducts(rows: (string | number)[][]) {
    const wb = this.load();
    this.writeSheet(wb, 'Products', [
      TABS.Products as unknown as string[],
      ...rows,
    ]);
    this.save(wb);
  }

  private append(tab: 'PriceHistory' | 'Runs', rows: (string | number)[][]) {
    if (!rows.length) return;
    const wb = this.load();
    const existing = this.sheetRows(wb, tab);
    const header = existing.length
      ? existing[0]!
      : (TABS[tab] as unknown as string[]);
    const body = existing.length ? existing.slice(1) : [];
    this.writeSheet(wb, tab, [header, ...body, ...rows]);
    this.save(wb);
  }

  async appendHistory(rows: (string | number)[][]) {
    this.append('PriceHistory', rows);
  }
  async appendRuns(rows: (string | number)[][]) {
    this.append('Runs', rows);
  }
}

/** Pick the storage backend from validated env. */
export function createStorage(env: Env): Storage {
  if (env.STORAGE_BACKEND === 'local-xlsx') {
    return new LocalXlsxStorage(join(env.DATA_DIR, 'scrapedeck.xlsx'));
  }
  return new SheetsStorage(env.SHEET_ID || DEFAULT_SHEET_ID);
}
