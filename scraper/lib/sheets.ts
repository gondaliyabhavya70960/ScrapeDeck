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

export const SHEET_ID = process.env.SHEET_ID!;

export const TABS = {
  Products: [
    'source',
    'vertical',
    'externalId',
    'title',
    'brand',
    'sku',
    'category',
    'currency',
    'price',
    'originalPrice',
    'availability',
    'imageUrl',
    'url',
    'firstSeen',
    'lastSeen',
    'lastChanged',
    'contentHash',
  ],
  PriceHistory: [
    'timestamp',
    'source',
    'externalId',
    'title',
    'currency',
    'price',
    'originalPrice',
    'availability',
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

export async function readRows(
  sheets: Sheets,
  spreadsheetId: string,
  tab: string,
): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A2:Z`,
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
    range: `${tab}!A2:Z`,
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
