import type { SourceAdapter } from '../types';
import { shopifySource } from './shopify';
import { wooSource } from './woocommerce';

export const sources: SourceAdapter[] = [
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
  // ── add new resin / 3dprint sites here (via `pnpm add-source <url> --vertical 3dprint`) ──
];
