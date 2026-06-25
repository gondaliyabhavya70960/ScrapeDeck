import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { loadEnv } from '../scraper/lib/env';
import { sheetsClient, readRows, SHEET_ID, TABS } from '../scraper/lib/sheets';

/**
 * `pnpm export` — write a local .xlsx device copy of the store, one sheet per
 * tab. Reads from whichever backend is active (Google Sheet, or the local
 * workbook when STORAGE_BACKEND=local-xlsx). Prints the saved path.
 */
async function main() {
  const env = loadEnv();
  const date = new Date().toISOString().slice(0, 10);
  const outDir = 'exports';
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `scrapedeck-${date}.xlsx`);

  const wb = XLSX.utils.book_new();

  if (env.STORAGE_BACKEND === 'local-xlsx') {
    const src = join(env.DATA_DIR, 'scrapedeck.xlsx');
    const local = XLSX.readFile(src);
    for (const tab of Object.keys(TABS)) {
      const ws = local.Sheets[tab];
      if (ws) XLSX.utils.book_append_sheet(wb, ws, tab);
    }
    console.log(`Read local workbook: ${src}`);
  } else {
    const sheets = sheetsClient();
    for (const [tab, headers] of Object.entries(TABS)) {
      const rows = await readRows(sheets, SHEET_ID, tab);
      const ws = XLSX.utils.aoa_to_sheet([headers as unknown as string[], ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, tab);
    }
    console.log(`Read Google Sheet: ${SHEET_ID}`);
  }

  XLSX.writeFile(wb, outPath);
  console.log(`✓ Saved device copy → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
