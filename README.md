# ScrapeDeck

A competitive **price- and catalogue-monitoring** dashboard for Indian resin‑art
(and, over time, 3D‑print) stores. ScrapeDeck scrapes competitor catalogues on a
schedule, records every price and stock change, and renders it all in a designed
Next.js dashboard — with a one‑click **XLSX/CSV download** for a device copy.

Three decoupled tiers, no server to babysit:

| Tier | Runs on | Job |
| --- | --- | --- |
| **Engine** | GitHub Actions (scheduled) | A TypeScript scraper hits each store, diffs against last state, writes results. |
| **Store** | Google Sheets (in Drive) | Three tabs — `Products` (current state), `PriceHistory` (append‑only), `Runs` (per‑run log). |
| **Dashboard** | Next.js on Vercel | Reads the Sheet server‑side and renders five designed views. |

```
                ┌──────────────────────── GitHub Actions (cron: 02:00 UTC) ───────────────────────┐
                │  pnpm scrape                                                                     │
   stores  ───► │  read Products ─► per-source scrape ─► normalize ─► diff (contentHash) ─► merge  │ ─► Google Sheet
 (Shopify/Woo)  │                                       └─ on change ─► PriceHistory ─┘            │     (Products / PriceHistory / Runs)
                └─────────────────────────────────────────────────────────────────────────────────┘
                                                                                                         │ read (cached 10 min)
                                                                                                         ▼
                                                                                          Next.js on Vercel ─► Dashboard + Download (XLSX/CSV)
```

The scraper writes **only to the Sheet** — never to the repo — so there is no data
branch and no Vercel rebuild on each scrape.

---

## Seed sources (verified)

| Key | Store | Platform | How it's scraped |
| --- | --- | --- | --- |
| `tulsiresin` | Tulsi Resin | Shopify | `GET /products.json?limit=250&page=N` |
| `resin24` | Resin24 | Shopify | `GET /products.json?limit=250&page=N` |
| `resinstoresurat` | Resin Store Surat | Shopify | `GET /products.json?limit=250&page=N` |
| `rabh` | RABH | Shopify | `GET /products.json?limit=250&page=N` |
| `canvasbypriya` | Canvas by Priya | WooCommerce | `GET /wp-json/wc/store/v1/products?per_page=100&page=N` |

Shopify variants are stored as separate rows (`productId:variantId`) for precise
per‑variant price tracking. WooCommerce prices arrive in **minor units**
(`15000` with `currency_minor_unit: 2` → ₹150.00) and are converted on read.

---

## Quick start

```bash
pnpm install

# Fast smoke test — one store (~22 products) straight into the Sheet:
ONLY=rabh pnpm scrape

# Full run (all five sources):
pnpm scrape

# Dashboard:
pnpm dev            # http://localhost:3000

# Device copy of the whole store as a dated .xlsx:
pnpm export
```

`pnpm scrape`, `pnpm export`, and the dashboard all need credentials — see below.

---

## Google setup (one time)

The scraper and the dashboard authenticate to Google Sheets with a **service
account** (a robot Google account). Steps:

1. **Create a Google Cloud project** — <https://console.cloud.google.com> → *New Project*.
2. **Enable the Google Sheets API** — *APIs & Services → Library →* search
   "Google Sheets API" → **Enable**.
3. **Create a service account** — *APIs & Services → Credentials → Create
   credentials → Service account*. Give it a name; no roles needed.
4. **Create a JSON key** — open the service account → *Keys → Add key → Create
   new key → JSON*. A `service-account.json` downloads. **Treat it like a password.**
5. **Create the target Google Sheet** (a blank spreadsheet is fine). Copy its ID
   from the URL: `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`.
   The scraper auto‑creates the `Products` / `PriceHistory` / `Runs` tabs and
   headers on first run.
6. **Share the Sheet with the service account** — click *Share* and add the
   service‑account email (looks like `name@project.iam.gserviceaccount.com`) as
   an **Editor**. _Skip this and every API call returns 403._
7. **Base64‑encode the key** (avoids `private_key` `\n` corruption in env vars):

   ```bash
   base64 -w0 service-account.json          # Linux
   base64 service-account.json | tr -d '\n' # macOS
   ```

8. **Set the secrets** wherever they're needed:

   | Variable | Value |
   | --- | --- |
   | `GOOGLE_SERVICE_ACCOUNT_KEY_B64` | the base64 string from step 7 |
   | `SHEET_ID` | the ID from step 5 |

   For **local** runs, put them in a `.env` file (copy `.env.example`).
   For **GitHub Actions**, add them under *Settings → Secrets and variables →
   Actions → Secrets*.
   For **Vercel**, add them under *Project → Settings → Environment Variables*.

---

## GitHub Actions (the engine)

`.github/workflows/scrape.yml` runs `pnpm scrape` daily at **02:00 UTC** (~07:30
IST) and on manual **Run workflow** (`workflow_dispatch`).

Required repo **secrets**: `GOOGLE_SERVICE_ACCOUNT_KEY_B64`, `SHEET_ID`.
Optional: `NOTIFY_WEBHOOK_URL` (+ repo **variable** `NOTIFY_WEBHOOK_KIND` =
`discord` | `slack`) for change/failure pings. Repo **variable**
`USE_BROWSER=true` enables the Chromium install step (only needed for
browser‑mode sources).

GitHub cron is best‑effort (5‑min minimum granularity; runs near the top of the
hour can be delayed). One source failing never aborts the others — that source
is logged `failed`, the rest still write, and the job only exits non‑zero if
**every** source fails.

---

## Deploy the dashboard (Vercel)

1. Import the repo into Vercel (framework auto‑detected as Next.js).
2. Add the env vars `GOOGLE_SERVICE_ACCOUNT_KEY_B64` and `SHEET_ID`.
3. Deploy. The dashboard reads the Sheet server‑side and re‑reads it at most
   every 10 minutes (`revalidate = 600`, plus a cross‑request cache so page views
   don't each hit the Sheets API).

The five views: **Overview** (stats, recent changes, 7‑day movement, source
health) · **Products** (the primary table — search, vertical/source/category/
availability filters, sortable, drawer with price‑history chart) · **Changes**
(price/stock transitions grouped by day) · **Runs** (per‑run status) · plus the
**product detail drawer**. Every view has loading, empty, and error states.

---

## Running locally

```bash
ONLY=<key> pnpm scrape   # scrape a single source (fast iteration)
pnpm scrape              # scrape all enabled sources
pnpm dev                 # run the dashboard against the live Sheet
pnpm export              # write exports/scrapedeck-YYYY-MM-DD.xlsx (device copy)
pnpm test                # vitest (adapters, normalize, merge, local storage)
pnpm typecheck           # tsc --noEmit
pnpm build               # production build of the dashboard
```

---

## Add a source in 4 steps

Most resin / 3D‑print stores run on **Shopify or WooCommerce**, so adding one is
a single line of code:

1. **Fingerprint it:**
   ```bash
   pnpm add-source https://example-store.com --vertical resin
   #   --vertical resin|3dprint   (default: resin)
   #   --key my-key               (default: derived from the host)
   ```
2. It prints a ready‑to‑paste registry line (or names a template for other platforms).
3. **Paste** that line into `scraper/sources/index.ts`.
4. **Test:** `ONLY=<key> pnpm scrape`, then commit.

### Platform reference

| Platform | Detect by | Scrape via | Adapter | Notes |
| --- | --- | --- | --- | --- |
| Shopify | `cdn.shopify.com`, `Shopify.theme` | `/products.json?limit=250&page=N` | `shopifySource()` | Verified; one‑line add |
| WooCommerce | `wp-json`, `woocommerce` | `/wp-json/wc/store/v1/products?per_page=100&page=N` | `wooSource()` | Verified; prices in minor units |
| Squarespace | `static1.squarespace.com` | append `?format=json` to a collection URL | `_template-http.ts` | Often works; verify per‑site |
| Wix Stores | `wixstatic.com`, `parastorage.com` | rendered DOM or per‑site API | `_template-browser.ts` | JS‑heavy; usually `mode:'browser'` |
| BigCommerce | `cdn11.bigcommerce.com` | storefront API (token) or HTML | `_template-http/browser` | No public products.json |
| Custom / static HTML | data in HTML | parse listing + product pages | `_template-http.ts` | Fill selectors once |
| JS‑rendered SPA | near‑empty HTML | render then extract | `_template-browser.ts` | Heaviest; opt‑in |
| 3D‑model marketplaces (Printables, Thingiverse, Cults3D, MakerWorld) | known domains | their own APIs | dedicated adapter | Many items free → price may be 0/null |

> **3D‑print note:** filament / resin‑material / printer / accessory stores are
> overwhelmingly Shopify or WooCommerce, so the two verified adapters cover them
> with a one‑line add. Only *model* (STL) marketplaces need a bespoke API adapter.

For non‑turnkey platforms, copy `scraper/sources/_template-http.ts` (cheerio) or
`_template-browser.ts` (Playwright; set repo variable `USE_BROWSER=true`), fill
the `TODO` selectors, and register it like the others. Every source carries a
`vertical`, so the dashboard segments resin vs 3D‑print automatically — and
everything downstream (diff, Sheet write, history, dashboard) is generic and
unchanged.

---

## Storage backends

`STORAGE_BACKEND` selects where the scraper writes (behind a small `Storage`
interface, so the orchestrator is backend‑agnostic):

- **`google-sheets`** (default) — the shared Google Sheet. Needs the two secrets above.
- **`local-xlsx`** — a fully local `data/scrapedeck.xlsx`, no Google account:

  ```bash
  STORAGE_BACKEND=local-xlsx pnpm scrape
  ```

  Same merge/diff/idempotency behaviour, written to a local workbook. (The
  dashboard reads Google Sheets; local‑xlsx mode is for offline scraping +
  `pnpm export`.)

---

## Data model

**Products** (current state, whole‑tab overwrite each run):
`source · vertical · externalId · title · brand · sku · category · currency ·
price · originalPrice · availability · imageUrl · url · firstSeen · lastSeen ·
lastChanged · contentHash`

**PriceHistory** (append‑only; one row each time a product's `contentHash`
changes): `timestamp · source · externalId · title · currency · price ·
originalPrice · availability`

**Runs** (append‑only; one row per source per run): `timestamp · source ·
status · found · new · changed · durationMs · error`

`contentHash` covers **only** change‑relevant fields (title, price,
originalPrice, availability, imageUrl), so re‑running with no real change adds no
history. `firstSeen` and `vertical` are preserved across runs.

---

## Project structure

```
scrapedeck/
├── .github/workflows/scrape.yml      # the scheduled engine
├── scraper/
│   ├── index.ts                      # orchestrator: read → diff → write
│   ├── types.ts                      # ScrapedProduct / SourceAdapter / ScrapeContext
│   ├── sources/                      # shopify, woocommerce, registry, templates
│   └── lib/                          # env, fetch, robots, politeness, normalize,
│                                     #   merge, sheets, storage, context, browser, notify
├── scripts/{add-source,export-local}.ts
├── lib/{types,format,source-color,sheet-data}.ts   # dashboard data + helpers
├── app/                              # Next.js App Router dashboard
│   ├── (dashboard)/{,products,changes,runs}/       # the five views
│   ├── api/export/route.ts           # XLSX/CSV download
│   └── components/                   # design-system components
└── .env.example
```

---

## Design language

Light‑first, "quiet analytical precision." Tokens live as CSS variables in
`app/globals.css` and are mapped into Tailwind (`tailwind.config.ts`), so the
whole palette is swappable from one place. Accent indigo for interactive chrome;
rose/emerald **only** for price direction. Prices use tabular numerals (Geist
Mono); UI uses Inter. Motion is 150–200 ms and respects
`prefers-reduced-motion`; contrast targets WCAG AA.

---

## Notes & gotchas

- **Share the Sheet** with the service‑account email (Editor) or every call 403s.
- **Base64 the key** — raw JSON in an env var corrupts the `private_key` newlines.
- **Sheets hygiene:** whole‑tab overwrite for `Products`, append for the logs;
  never per‑row writes (≈60 writes/min/user limit).
- **Sheets scale:** ~10M cells/spreadsheet. If `PriceHistory` grows huge over
  years, archive old rows to a dated tab or Drive file.
- **Politeness:** honest User‑Agent, `robots.txt` honoured, rate‑limited,
  timeouts, exponential backoff. If a store disallows the JSON path, that source
  is skipped by design.
- Treat each site's Terms of Service and `robots.txt` as binding; these are
  public catalogue endpoints used for price/catalogue monitoring.
