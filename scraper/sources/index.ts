import type { SourceAdapter } from '../types';
import { shopifySource } from './shopify';
import { wooSource } from './woocommerce';
import { autoSource } from './auto';

/**
 * Verified seed sources — platform is known, so they use the exact adapter.
 */
const seeds: SourceAdapter[] = [
  shopifySource({
    key: 'tulsiresin',
    name: 'Tulsi Resin',
    baseUrl: 'https://tulsiresin.com',
    vertical: 'resin',
  }),
  shopifySource({
    key: 'resin24',
    name: 'Resin24',
    baseUrl: 'https://resin24.com',
    vertical: 'resin',
  }),
  shopifySource({
    key: 'resinstoresurat',
    name: 'Resin Store Surat',
    baseUrl: 'https://resinstoresurat.com',
    vertical: 'resin',
  }),
  shopifySource({
    key: 'rabh',
    name: 'RABH',
    baseUrl: 'https://www.rabh.in',
    vertical: 'resin',
  }),
  wooSource({
    key: 'canvasbypriya',
    name: 'Canvas by Priya',
    baseUrl: 'https://canvasbypriya.in',
    vertical: 'resin',
  }),
];

/**
 * Competitor sites from the market analysis. Platform is auto-detected at scrape
 * time (Shopify or WooCommerce); custom-HTML / marketplace / social sites have
 * no public feed and will be recorded `failed` in the Runs tab until a bespoke
 * adapter is added for them. Marketplaces (Etsy, Amazon, IndiaMART, TradeIndia),
 * link-in-bio storefronts, and STL libraries are intentionally omitted — they
 * cannot be scraped this way.
 */
const competitors: {
  key: string;
  name: string;
  baseUrl: string;
  vertical: string;
}[] = [
  // ── Resin studios & gifting (India + global) ──
  { key: 'sumaiyaresin', name: 'Sumaiya Resin Arts', baseUrl: 'https://sumaiyaresin.art', vertical: 'resin' },
  { key: 'resinartsjaipur', name: 'Resin Arts Jaipur', baseUrl: 'https://resinartsjaipur.com', vertical: 'resin' },
  { key: 'classyartz', name: 'ClassyArtZ', baseUrl: 'https://classyartz.com', vertical: 'resin' },
  { key: 'krupalikanjiyaarts', name: 'Krupali Kanjiya Arts', baseUrl: 'https://krupalikanjiyaarts.com', vertical: 'resin' },
  { key: 'prestogifts', name: 'Presto Gifts', baseUrl: 'https://prestogifts.com', vertical: 'resin' },
  { key: 'priartgifts', name: 'PriArt Gifts', baseUrl: 'https://priartgifts.com', vertical: 'resin' },
  { key: 'kanhakreation', name: 'Kanha Kreation', baseUrl: 'https://kanhakreation.com', vertical: 'resin' },
  { key: 'banteybanatey', name: 'BanteyBanatey', baseUrl: 'https://banteybanatey.com', vertical: 'resin' },
  { key: 'resinartstudio', name: 'Resin Art Studio', baseUrl: 'https://resinartstudio.in', vertical: 'resin' },
  { key: 'pacificresinart', name: 'Pacific Resin Art', baseUrl: 'https://pacificresinart.in', vertical: 'resin' },
  { key: 'craftpriyaa', name: 'Craftpriyaa', baseUrl: 'https://craftpriyaa.com', vertical: 'resin' },
  { key: 'designbyjulia', name: 'Design by Julia', baseUrl: 'https://www.designbyjulia.com.au', vertical: 'resin' },
  { key: 'oliveartz', name: 'Olive Artz', baseUrl: 'https://www.oliveartz.com.au', vertical: 'resin' },
  { key: 'thunderwood', name: 'ThunderWood Studio', baseUrl: 'https://thunderwood.studio', vertical: 'resin' },
  { key: 'hyperiwood', name: 'Hyperiwood', baseUrl: 'https://hyperiwood.com', vertical: 'resin' },
  { key: 'letsresin', name: "Let's Resin", baseUrl: 'https://letsresin.com', vertical: 'resin' },
  { key: 'justresin', name: 'Just Resin', baseUrl: 'https://justresin.store', vertical: 'resin' },
  { key: 'glasscast', name: 'GlassCast', baseUrl: 'https://www.glasscastresin.com', vertical: 'resin' },
  { key: 'totalboat', name: 'TotalBoat', baseUrl: 'https://www.totalboat.com', vertical: 'resin' },
  { key: 'moonkusserart', name: 'Moonkusser Art', baseUrl: 'https://moonkusserart.com', vertical: 'resin' },
  { key: 'seawavetable', name: 'SeaWaveTable', baseUrl: 'https://seawavetable.com', vertical: 'resin' },
  { key: 'dailyobjects', name: 'DailyObjects', baseUrl: 'https://www.dailyobjects.com', vertical: 'resin' },
  { key: 'confettigifts', name: 'Confetti Gifts', baseUrl: 'https://confettigifts.in', vertical: 'resin' },
  { key: 'angroos', name: 'Angroos', baseUrl: 'https://www.angroos.com', vertical: 'resin' },
  { key: 'uncommongoods', name: 'Uncommon Goods', baseUrl: 'https://www.uncommongoods.com', vertical: 'resin' },
  { key: 'igp', name: 'IGP', baseUrl: 'https://www.igp.com', vertical: 'resin' },
  { key: 'fnp', name: 'Ferns N Petals', baseUrl: 'https://www.fnp.com', vertical: 'resin' },
  // ── 3D printing (decor, lithophanes, services, supplies) ──
  { key: 'thesculptstudios', name: 'The Sculpt Studios', baseUrl: 'https://www.thesculptstudios.in', vertical: '3dprint' },
  { key: 'be3dprintshop', name: 'BE 3D Print Shop', baseUrl: 'https://be3dprintshop.com', vertical: '3dprint' },
  { key: '3dostic', name: '3DOSTIC', baseUrl: 'https://3dostic.com', vertical: '3dprint' },
  { key: 'igstore', name: 'IGStore', baseUrl: 'https://igstore.in', vertical: '3dprint' },
  { key: '3dzone', name: '3DZone', baseUrl: 'https://3dzone.in', vertical: '3dprint' },
  { key: 'think3d', name: 'think3D', baseUrl: 'https://think3d.in', vertical: '3dprint' },
  { key: 'fracktal', name: 'Fracktal Works', baseUrl: 'https://fracktal.in', vertical: '3dprint' },
  { key: 'wol3d', name: 'WOL3D', baseUrl: 'https://wol3d.com', vertical: '3dprint' },
];

export const sources: SourceAdapter[] = [
  ...seeds,
  ...competitors.map(autoSource),
];
