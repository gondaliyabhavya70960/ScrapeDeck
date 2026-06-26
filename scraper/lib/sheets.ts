import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export function sheetsClient() {
  const json = Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64!,
    'base64',
  ).toString('utf8');
  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return google.sheets({ version: 'v4', auth });
}

/**
 * The connected Google Sheet. Pre-wired here so the project points at the
 * target spreadsheet out of the box; override per-environment with the
 * SHEET_ID env var. The ID is not a secret (access is granted by *sharing* the
 * Sheet with the service account, not by knowing its ID).
 */
export const DEFAULT_SHEET_ID = '1cflR5gamM9KAHSvOzZuUElS-VHmRtiAyb7c2Y-Srxac';

export const SHEET_ID = process.env.SHEET_ID || DEFAULT_SHEET_ID;

export const TABS = {
  Products: [
    'sourceKey',
    'vertical',
    'externalId',
    'title',
    'slug',
    'category',
    'shortTagline',
    'description',
    'priceMin',
    'priceMax',
    'currency',
    'showPrice',
    'timeline',
    'materials',
    'dimensions',
    'status',
    'featured',
    'images',
    'imageAlts',
    'fields',
    'seoTitle',
    'seoDescription',
    'url',
    'firstSeen',
    'lastSeen',
    'lastChanged',
    'contentHash',
  ],
  PriceHistory: [
    'timestamp',
    'sourceKey',
    'externalId',
    'title',
    'currency',
    'priceMin',
    'priceMax',
    'status',
  ],
  Runs: [
    'timestamp',
    'source',
    'status',
    'found',
    'new',
    'changed',
    'durationMs',
    'error',
  ],
} as const;

type Sheets = ReturnType<typeof sheetsClient>;

export async function ensureTabs(sheets: Sheets, spreadsheetId: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const have = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title),
  );
  const add = Object.keys(TABS)
    .filter((t) => !have.has(t))
    .map((title) => ({ addSheet: { properties: { title } } }));
  if (add.length)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: add },
    });
  for (const [title, headers] of Object.entries(TABS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers as unknown as string[]] },
    });
  }
}

/** Ensure a single named tab exists with the given header row (idempotent). */
export async function ensureTab(
  sheets: Sheets,
  spreadsheetId: string,
  title: string,
  headers: string[],
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const have = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title),
  );
  if (!have.has(title)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  });
}

export async function readRows(
  sheets: Sheets,
  spreadsheetId: string,
  tab: string,
): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A2:AZ`,
  });
  return (res.data.values as string[][]) ?? [];
}

export async function overwriteTab(
  sheets: Sheets,
  spreadsheetId: string,
  tab: string,
  rows: (string | number)[][],
) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tab}!A2:AZ`,
  });
  if (rows.length)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });
}

export async function appendRows(
  sheets: Sheets,
  spreadsheetId: string,
  tab: string,
  rows: (string | number)[][],
) {
  if (!rows.length) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
}
