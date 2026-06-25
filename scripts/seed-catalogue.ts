import { loadEnv } from '../scraper/lib/env';
import {
  sheetsClient,
  SHEET_ID,
  ensureTab,
  overwriteTab,
} from '../scraper/lib/sheets';
import {
  catalogue,
  CATALOGUE_HEADERS,
  catalogueToRow,
} from '../scraper/lib/catalogue';

/**
 * `pnpm seed:catalogue` — write ResinRiva's product catalogue (the rich
 * title…seoDescription schema) into a `Catalogue` tab of the Sheet. Whole-tab
 * overwrite, so re-running re-publishes the latest `catalogue` array without
 * duplicating rows. Requires GOOGLE_SERVICE_ACCOUNT_KEY_B64 (google-sheets).
 */
async function main() {
  loadEnv();
  const sheets = sheetsClient();
  await ensureTab(sheets, SHEET_ID, 'Catalogue', [...CATALOGUE_HEADERS]);
  const rows = catalogue.map(catalogueToRow);
  await overwriteTab(sheets, SHEET_ID, 'Catalogue', rows);
  console.log(
    `✓ Seeded ${rows.length} products into the Catalogue tab\n  https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
