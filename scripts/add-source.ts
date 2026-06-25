import process from 'node:process';

const UA = 'Mozilla/5.0 (compatible; ScrapeDeck-Recon/1.0)';
const arg = (f: string) => {
  const i = process.argv.indexOf(f);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function main() {
  const raw = process.argv[2];
  if (!raw || raw.startsWith('--')) {
    console.error(
      'Usage: pnpm add-source <url> [--vertical resin|3dprint] [--key my-key]',
    );
    process.exit(1);
  }
  const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  const base = `${url.protocol}//${url.host}`;
  const vertical = arg('--vertical') ?? 'resin';
  const key =
    arg('--key') ??
    (url.host.replace(/^www\./, '').split('.')[0] ?? 'source')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase();
  const name = url.host.replace(/^www\./, '');

  const res = await fetch(base, {
    headers: { 'user-agent': UA },
    redirect: 'follow',
  });
  const html = await res.text();
  const has = (re: RegExp) => re.test(html);
  let platform = 'unknown';
  if (has(/cdn\.shopify\.com|Shopify\.theme|cdn\/shop\//i)) platform = 'shopify';
  else if (has(/wp-content|woocommerce|wp-json/i)) platform = 'woocommerce';
  else if (has(/wixstatic\.com|parastorage\.com/i)) platform = 'wix';
  else if (has(/static1\.squarespace\.com|squarespace\.com/i))
    platform = 'squarespace';
  else if (has(/cdn11\.bigcommerce\.com|bigcommerce/i)) platform = 'bigcommerce';

  console.log(
    `\nSite:     ${base}\nServer:   ${res.headers.get('server') ?? ''}\nPlatform: ${platform}\nVertical: ${vertical}\nKey:      ${key}\n`,
  );

  if (platform === 'shopify') {
    const r = await fetch(`${base}/products.json?limit=1`, {
      headers: { 'user-agent': UA },
    });
    const ok = r.ok && (r.headers.get('content-type') || '').includes('json');
    console.log(
      ok
        ? '✓ /products.json reachable'
        : '✗ /products.json NOT reachable (store may be password-protected)',
    );
    if (ok)
      console.log(
        `\nAdd to scraper/sources/index.ts:\n  shopifySource({ key: '${key}', name: '${name}', baseUrl: '${base}', vertical: '${vertical}' }),`,
      );
  } else if (platform === 'woocommerce') {
    const r = await fetch(
      `${base}/wp-json/wc/store/v1/products?per_page=1`,
      { headers: { 'user-agent': UA } },
    );
    const total = r.headers.get('x-wp-total');
    console.log(
      r.ok
        ? `✓ Store API reachable${total ? ` (~${total} products)` : ''}`
        : '✗ Store API NOT reachable',
    );
    if (r.ok)
      console.log(
        `\nAdd to scraper/sources/index.ts:\n  wooSource({ key: '${key}', name: '${name}', baseUrl: '${base}', vertical: '${vertical}' }),`,
      );
  } else {
    console.log('No turnkey JSON adapter:');
    console.log(
      '  • Squarespace → try ?format=json on a collection URL, then adapt _template-http.ts',
    );
    console.log(
      '  • Wix / BigCommerce / JS-rendered → copy _template-browser.ts (mode: browser; set repo var USE_BROWSER=true)',
    );
    console.log(
      '  • Custom static HTML → copy _template-http.ts (cheerio) and fill TODO selectors',
    );
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
