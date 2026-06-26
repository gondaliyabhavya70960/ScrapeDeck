import type { SourceAdapter } from '../types';
import { shopifySource } from './shopify';
import { wooSource } from './woocommerce';

/**
 * Full source registry, verified by live platform fingerprint. Each site uses
 * the exact adapter for its platform (Shopify `/products.json` or WooCommerce
 * Store API). Supply-only stores (raw materials/kits, not finished gift
 * products) ship `enabled: false` — flip to `true` to also track their pricing.
 *
 * Sites that need a browser/bespoke adapter, and the marketplaces we
 * deliberately exclude (Amazon/Etsy/IndiaMART…), are documented in the README,
 * not registered here. Run `pnpm add-source <url>` to fingerprint a new site.
 */
export const sources: SourceAdapter[] = [
  // ───────── SHOPIFY (resin) ─────────
  shopifySource({ key: 'tulsiresin',      name: 'Tulsi Resin',        baseUrl: 'https://tulsiresin.com',        vertical: 'resin',   enabled: false }), // supply
  shopifySource({ key: 'resin24',         name: 'Resin24',            baseUrl: 'https://resin24.com',           vertical: 'resin' }),
  shopifySource({ key: 'resinstoresurat', name: 'Resin Store Surat',  baseUrl: 'https://resinstoresurat.com',   vertical: 'resin' }),
  shopifySource({ key: 'rabh',            name: 'RABH',               baseUrl: 'https://www.rabh.in',           vertical: 'resin' }),
  shopifySource({ key: 'classyartz',      name: 'ClassyArtZ',         baseUrl: 'https://classyartz.com',        vertical: 'resin' }),
  shopifySource({ key: 'pacificresinart', name: 'Pacific Resin Art',  baseUrl: 'https://pacificresinart.in',    vertical: 'resin' }),
  shopifySource({ key: 'craftpriyaa',     name: 'Craftpriyaa',        baseUrl: 'https://www.craftpriyaa.com',   vertical: 'resin' }),
  shopifySource({ key: 'confettigifts',   name: 'Confetti Gifts',     baseUrl: 'https://confettigifts.in',      vertical: 'resin' }), // adjacent gifting
  // ───────── SHOPIFY (3D print) ─────────
  shopifySource({ key: 'thesculptstudios', name: 'The Sculpt Studios', baseUrl: 'https://www.thesculptstudios.in', vertical: '3dprint' }), // NOTE: returned HTTP 402 on fetch — may be password/region-gated; verify /products.json
  shopifySource({ key: 'be3dprintshop',   name: 'BE 3D Print Shop',   baseUrl: 'https://be3dprintshop.com',     vertical: '3dprint' }),
  // ───────── SHOPIFY (global resin — premium) ─────────
  shopifySource({ key: 'thunderwood',     name: 'ThunderWood Studio', baseUrl: 'https://thunderwood.studio',    vertical: 'resin' }),
  shopifySource({ key: 'hyperiwood',      name: 'Hyperiwood',         baseUrl: 'https://hyperiwood.com',        vertical: 'resin' }),
  shopifySource({ key: 'seawavetable',    name: 'SeaWaveTable',       baseUrl: 'https://seawavetable.com',      vertical: 'resin' }),
  // ───────── SHOPIFY (global supply — off by default) ─────────
  shopifySource({ key: 'letsresin',       name: "Let's Resin",        baseUrl: 'https://letsresin.com',         vertical: 'resin',   enabled: false }), // supply
  shopifySource({ key: 'justresin',       name: 'Just Resin',         baseUrl: 'https://justresin.store',       vertical: 'resin',   enabled: false }), // supply
  shopifySource({ key: 'totalboat',       name: 'TotalBoat',          baseUrl: 'https://www.totalboat.com',     vertical: 'resin',   enabled: false }), // supply

  // ───────── WOOCOMMERCE (resin) ─────────
  wooSource({ key: 'canvasbypriya',   name: 'Canvas by Priya',    baseUrl: 'https://canvasbypriya.in',     vertical: 'resin' }),
  wooSource({ key: 'sumaiyaresin',    name: 'Sumaiya Resin Arts', baseUrl: 'https://sumaiyaresin.art',     vertical: 'resin' }),
  wooSource({ key: 'resinartsjaipur', name: 'Resin Arts Jaipur',  baseUrl: 'https://resinartsjaipur.com',  vertical: 'resin' }),
  wooSource({ key: 'kanhakreation',   name: 'Kanha Kreation',     baseUrl: 'https://kanhakreation.com',    vertical: 'resin' }),
  wooSource({ key: 'banteybanatey',   name: 'BanteyBanatey',      baseUrl: 'https://banteybanatey.com',    vertical: 'resin' }),
  wooSource({ key: 'resinartstudio',  name: 'Resin Art Studio',   baseUrl: 'https://resinartstudio.in',    vertical: 'resin' }),
  wooSource({ key: 'angroos',         name: 'Angroos',            baseUrl: 'https://www.angroos.com',      vertical: 'resin' }), // adjacent gifting
  // ───────── WOOCOMMERCE (3D print) ─────────
  wooSource({ key: 'igstore',  name: 'IGStore',  baseUrl: 'https://igstore.in',     vertical: '3dprint' }),
  wooSource({ key: '3dzone',   name: '3DZone',   baseUrl: 'https://3dzone.in',      vertical: '3dprint' }),
  wooSource({ key: 'think3d',  name: 'think3D',  baseUrl: 'https://www.think3d.in', vertical: '3dprint' }),
  wooSource({ key: 'wol3d',    name: 'WOL3D',    baseUrl: 'https://wol3d.com',      vertical: '3dprint', enabled: false }), // supply
];
