/**
 * ResinRiva's OWN product catalogue, in the rich content schema. This is
 * original brand content — the scraped competitor data (Products tab) is market
 * reference only, never copied. Grounded in the analysis's product lines and
 * the "ResinRiva positioning" price bands.
 *
 * Seeded into a `Catalogue` tab in the Sheet by `pnpm seed:catalogue`. Image
 * URLs are branded placeholders — swap them for real product photography.
 * Extend this array and re-run the seed to grow the catalogue.
 */

export interface CustomField {
  label: string;
  type: 'text' | 'textarea' | 'select' | 'file' | 'date' | 'number';
  options?: string[];
  required?: boolean;
}

export interface CatalogueProduct {
  title: string;
  slug: string;
  category: string;
  shortTagline: string;
  description: string;
  priceMin: number;
  priceMax: number;
  showPrice: boolean;
  timeline: string;
  materials: string;
  dimensions: string;
  status: 'active' | 'draft';
  featured: boolean;
  images: string[];
  imageAlts: string[];
  fields: CustomField[];
  seoTitle: string;
  seoDescription: string;
}

export const CATALOGUE_HEADERS = [
  'title',
  'slug',
  'category',
  'shortTagline',
  'description',
  'priceMin',
  'priceMax',
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
] as const;

/** Serialize a catalogue product to a Sheet row (arrays/objects → JSON). */
export function catalogueToRow(p: CatalogueProduct): (string | number)[] {
  return [
    p.title,
    p.slug,
    p.category,
    p.shortTagline,
    p.description,
    p.priceMin,
    p.priceMax,
    p.showPrice ? 'TRUE' : 'FALSE',
    p.timeline,
    p.materials,
    p.dimensions,
    p.status,
    p.featured ? 'TRUE' : 'FALSE',
    JSON.stringify(p.images),
    JSON.stringify(p.imageAlts),
    JSON.stringify(p.fields),
    p.seoTitle,
    p.seoDescription,
  ];
}

const img = (label: string) =>
  `https://placehold.co/1000x1000/efe9df/4F46E5?text=${encodeURIComponent(label)}`;

const SIZE = (opts: string[]): CustomField => ({
  label: 'Size',
  type: 'select',
  options: opts,
  required: true,
});
const PHOTO: CustomField = { label: 'Upload photo', type: 'file', required: true };
const NOTES: CustomField = { label: 'Personalisation notes', type: 'textarea' };

export const catalogue: CatalogueProduct[] = [
  // ── Nameplates ──────────────────────────────────────────────────────────
  {
    title: 'Maithili Marble-Resin Name Plate',
    slug: 'maithili-marble-resin-name-plate',
    category: 'Nameplates',
    shortTagline: 'A doorway first impression in gold-veined resin',
    description:
      'A hand-poured nameplate where ivory marble swirls meet a single gold-leaf vein, your family name set in a serif of your choosing. Sealed in a UV-stable gloss that keeps porch light from dulling it.',
    priceMin: 2499,
    priceMax: 5999,
    showPrice: true,
    timeline: 'Design proof in 48h · ships in 6–8 days',
    materials: 'Epoxy resin, marble pigment, 24k imitation gold leaf, MDF backboard, brass standoffs',
    dimensions: '12 × 4 in · 18 × 5 in · 24 × 6 in',
    status: 'active',
    featured: true,
    images: [img('Maithili Nameplate'), img('Maithili Nameplate Detail')],
    imageAlts: [
      'Ivory marble resin nameplate with a gold vein and serif family name',
      'Close-up of the gold-leaf vein and brass standoff mounting',
    ],
    fields: [
      { label: 'Name / text', type: 'text', required: true },
      SIZE(['12 × 4 in', '18 × 5 in', '24 × 6 in']),
      { label: 'Font style', type: 'select', options: ['Classic Serif', 'Modern Sans', 'Devanagari'] },
      { label: 'Vein colour', type: 'select', options: ['Gold', 'Rose Gold', 'Silver'] },
      NOTES,
    ],
    seoTitle: 'Custom Marble Resin Name Plate for Home | ResinRiva',
    seoDescription:
      'Personalised gold-veined marble resin nameplate, hand-poured and design-approved before we make it. Made in India, ships in 6–8 days.',
  },
  {
    title: 'Peacock Tide Name Plate',
    slug: 'peacock-tide-name-plate',
    category: 'Nameplates',
    shortTagline: 'Teal-and-gold ocean swells around your name',
    description:
      'Layered teal, emerald and gold resin breaks into a lacy wave crest beside a cut-acrylic name. A statement plate for homes that want colour without losing elegance.',
    priceMin: 3299,
    priceMax: 7499,
    showPrice: true,
    timeline: 'Design proof in 48h · ships in 7–9 days',
    materials: 'Epoxy resin, alcohol inks, mica, cast acrylic lettering, marine-ply backboard',
    dimensions: '14 × 5 in · 20 × 6 in',
    status: 'active',
    featured: false,
    images: [img('Peacock Tide Nameplate')],
    imageAlts: ['Teal and gold ocean-wave resin nameplate with raised acrylic lettering'],
    fields: [
      { label: 'Name / text', type: 'text', required: true },
      SIZE(['14 × 5 in', '20 × 6 in']),
      { label: 'Lettering finish', type: 'select', options: ['Gold mirror', 'White', 'Black'] },
      NOTES,
    ],
    seoTitle: 'Peacock Ocean Resin Name Plate | ResinRiva',
    seoDescription:
      'A teal-and-gold ocean-wave resin nameplate with raised acrylic lettering. Personalised and design-approved. Pan-India delivery.',
  },

  // ── Wedding & Varmala Preservation ──────────────────────────────────────
  {
    title: 'Eternal Varmala Preservation Frame',
    slug: 'eternal-varmala-preservation-frame',
    category: 'Wedding & Varmala',
    shortTagline: 'Your wedding garlands, kept forever in glass-clear resin',
    description:
      'We courier-collect your varmala within 24 hours of the ceremony, slow-dry every petal, and set them in a deep museum-style resin block with your names and date. A heirloom of the day itself, not a photograph of it.',
    priceMin: 6999,
    priceMax: 18999,
    showPrice: true,
    timeline:
      'Courier flowers within 24h of the event → 12–15 day petal drying → design approval photo → 25–30 days total',
    materials: 'Preserved varmala flowers, deep-pour epoxy resin, solid teak frame, brass nameplate',
    dimensions: '10 × 10 in · 12 × 16 in · 18 × 24 in (multi-garland)',
    status: 'active',
    featured: true,
    images: [img('Varmala Frame'), img('Varmala Frame Detail')],
    imageAlts: [
      'Wedding varmala flowers preserved in a clear resin block inside a teak frame',
      'Detail of preserved rose and marigold petals with names and date',
    ],
    fields: [
      { label: 'Bride & groom names', type: 'text', required: true },
      { label: 'Wedding date', type: 'date', required: true },
      SIZE(['10 × 10 in', '12 × 16 in', '18 × 24 in']),
      { label: 'Number of garlands', type: 'number' },
      { label: 'Pickup city', type: 'text', required: true },
      NOTES,
    ],
    seoTitle: 'Varmala Preservation in Resin — Wedding Garland Frame | ResinRiva',
    seoDescription:
      'Preserve your wedding varmala forever in a clear resin frame. 24-hour flower pickup, slow drying, design approval. Pan-India varmala preservation.',
  },
  {
    title: 'Saat Phere Petal Dome',
    slug: 'saat-phere-petal-dome',
    category: 'Wedding & Varmala',
    shortTagline: 'A keepsake dome of your ceremony petals',
    description:
      'A half-sphere resin dome holding a curated handful of your wedding flowers above a gold-foiled base engraved with your phere date — a compact keepsake for couples and a gift for both families.',
    priceMin: 4999,
    priceMax: 9999,
    showPrice: true,
    timeline: 'Flower pickup → 12–15 day drying → 22–26 days total',
    materials: 'Preserved petals, crystal-clear resin, gold foil, walnut base',
    dimensions: '4 in dome · 6 in dome',
    status: 'active',
    featured: false,
    images: [img('Petal Dome')],
    imageAlts: ['Resin half-dome holding preserved wedding petals on a gold-foiled walnut base'],
    fields: [
      { label: 'Names', type: 'text', required: true },
      { label: 'Date', type: 'date', required: true },
      SIZE(['4 in dome', '6 in dome']),
      { label: 'Number of domes (family sets)', type: 'number' },
    ],
    seoTitle: 'Wedding Petal Dome Keepsake in Resin | ResinRiva',
    seoDescription:
      'A resin keepsake dome of your wedding petals on a gold-foiled base. Perfect couple + family gift. Made to order in India.',
  },

  // ── Ocean / Geode / River Art ───────────────────────────────────────────
  {
    title: 'Azure Tide Ocean Wall Art',
    slug: 'azure-tide-ocean-wall-art',
    category: 'Ocean & Geode Art',
    shortTagline: 'A sculpted shoreline that catches the light',
    description:
      'Sculpted 3D foam crests and pearl-white resin lace roll across a deep azure sea on a sealed wood panel. Each piece is poured freehand, so no two tides break the same way.',
    priceMin: 6999,
    priceMax: 24999,
    showPrice: true,
    timeline: 'Made to order · ships in 12–16 days',
    materials: 'Epoxy resin, alcohol inks, mica pigments, sealed birch panel',
    dimensions: '18 × 24 in · 24 × 36 in · 36 × 48 in',
    status: 'active',
    featured: true,
    images: [img('Azure Tide'), img('Azure Tide Detail')],
    imageAlts: [
      'Blue ocean resin wall art with sculpted white foam waves on a wood panel',
      'Detail of pearlescent resin lace and 3D foam crest',
    ],
    fields: [
      SIZE(['18 × 24 in', '24 × 36 in', '36 × 48 in']),
      { label: 'Palette', type: 'select', options: ['Azure', 'Emerald Lagoon', 'Sunset Coral', 'Monochrome'] },
      { label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait'] },
      NOTES,
    ],
    seoTitle: 'Ocean Resin Wall Art — Sculpted Waves | ResinRiva',
    seoDescription:
      'Hand-poured ocean resin wall art with sculpted 3D foam waves. Choose your palette and size. Luxury coastal decor, made in India.',
  },
  {
    title: 'Amethyst Geode Wall Seam',
    slug: 'amethyst-geode-wall-seam',
    category: 'Ocean & Geode Art',
    shortTagline: 'A crystal seam that splits the wall',
    description:
      'A statement geode in amethyst and smoky quartz with real crushed glass druzy and a gold-leaf agate border. Built as a single seam or a multi-panel split for large walls.',
    priceMin: 8999,
    priceMax: 34999,
    showPrice: true,
    timeline: 'Made to order · ships in 14–18 days',
    materials: 'Epoxy resin, crushed glass, real quartz points, gold leaf, birch panel',
    dimensions: '24 × 24 in · 24 × 48 in · triptych 60 in',
    status: 'active',
    featured: true,
    images: [img('Amethyst Geode')],
    imageAlts: ['Amethyst and smoky-quartz resin geode wall art with crushed-glass druzy and gold border'],
    fields: [
      SIZE(['24 × 24 in', '24 × 48 in', 'Triptych 60 in']),
      { label: 'Crystal tone', type: 'select', options: ['Amethyst', 'Rose Quartz', 'Emerald', 'Citrine'] },
      { label: 'Border', type: 'select', options: ['Gold leaf', 'Silver leaf', 'Copper'] },
      NOTES,
    ],
    seoTitle: 'Amethyst Geode Resin Wall Art | ResinRiva',
    seoDescription:
      'A luxury crushed-glass geode resin wall seam with real quartz and gold leaf. Single panel or triptych. Statement decor, made to order.',
  },

  // ── Clocks & Timepieces ─────────────────────────────────────────────────
  {
    title: 'Tidewell Silent Ocean Wall Clock',
    slug: 'tidewell-silent-ocean-wall-clock',
    category: 'Clocks & Timepieces',
    shortTagline: 'The sea on your wall, in perfect silence',
    description:
      'An ocean-pour clock face with a continuous silent-sweep movement — no ticking — and gold-leaf hour markers. The tide is poured around the spindle so the hands sweep across open water.',
    priceMin: 2899,
    priceMax: 9999,
    showPrice: true,
    timeline: 'Made to order · ships in 8–10 days',
    materials: 'Epoxy resin, mica, gold leaf, silent continuous-sweep movement, MDF face',
    dimensions: '12 in · 16 in · 24 in diameter',
    status: 'active',
    featured: true,
    images: [img('Tidewell Clock')],
    imageAlts: ['Round ocean-wave resin wall clock with gold hour markers and silent sweep hands'],
    fields: [
      SIZE(['12 in', '16 in', '24 in']),
      { label: 'Palette', type: 'select', options: ['Azure', 'Teal & Gold', 'Monochrome'] },
      { label: 'Numerals', type: 'select', options: ['Gold markers', 'Roman', 'Devanagari', 'None'] },
    ],
    seoTitle: 'Silent Ocean Resin Wall Clock | ResinRiva',
    seoDescription:
      'A hand-poured ocean resin wall clock with a silent sweep movement and gold-leaf numerals. Choose palette and size. Made in India.',
  },
  {
    title: 'Golden Geode Devanagari Clock',
    slug: 'golden-geode-devanagari-clock',
    category: 'Clocks & Timepieces',
    shortTagline: 'A crystal clock with numerals in Devanagari gold',
    description:
      'A geode-slice clock with a druzy crystal centre and your choice of Roman or hand-gilded Devanagari numerals — a quiet, luxurious nod to Indian craft on a silent movement.',
    priceMin: 4999,
    priceMax: 14999,
    showPrice: true,
    timeline: 'Made to order · ships in 9–12 days',
    materials: 'Epoxy resin, crushed glass druzy, gold leaf, silent sweep movement',
    dimensions: '14 in · 18 in diameter',
    status: 'active',
    featured: false,
    images: [img('Geode Clock')],
    imageAlts: ['Gold geode resin wall clock with Devanagari numerals and a druzy crystal centre'],
    fields: [
      SIZE(['14 in', '18 in']),
      { label: 'Numerals', type: 'select', options: ['Devanagari gold', 'Roman', 'Gold markers'] },
      { label: 'Crystal tone', type: 'select', options: ['Citrine', 'Amethyst', 'Clear'] },
    ],
    seoTitle: 'Geode Resin Wall Clock with Devanagari Numerals | ResinRiva',
    seoDescription:
      'A luxury geode resin wall clock with hand-gilded Devanagari or Roman numerals and a silent movement. Made to order in India.',
  },

  // ── Lighting & Lamps ────────────────────────────────────────────────────
  {
    title: 'Lumora Resin Mood Lamp',
    slug: 'lumora-resin-mood-lamp',
    category: 'Lighting & Lamps',
    shortTagline: 'A pour of colour that glows from within',
    description:
      'A made-to-order resin table lamp where your chosen palette is lit from behind by a warm dimmable LED, turning swirls of pigment into a soft evening glow. Each shade is a one-off pour.',
    priceMin: 3299,
    priceMax: 12999,
    showPrice: true,
    timeline: 'Made to order · ships in 10–14 days',
    materials: 'Epoxy resin, mica pigments, oak base, warm dimmable LED, BIS-marked fitting',
    dimensions: 'Small 9 in · Medium 13 in · Tall 18 in',
    status: 'active',
    featured: true,
    images: [img('Lumora Lamp')],
    imageAlts: ['Glowing resin table lamp with swirled pigment on an oak base'],
    fields: [
      SIZE(['Small 9 in', 'Medium 13 in', 'Tall 18 in']),
      { label: 'Palette', type: 'select', options: ['Amber Ember', 'Ocean', 'Aurora', 'Rose Smoke'] },
      { label: 'Base wood', type: 'select', options: ['Oak', 'Walnut', 'Black'] },
    ],
    seoTitle: 'Resin Mood Table Lamp — Made to Order | ResinRiva',
    seoDescription:
      'A one-of-a-kind resin table lamp lit by a warm dimmable LED. Choose your palette and size. Handmade decor lighting, made in India.',
  },
  {
    title: 'Aalmira Lithophane Photo Lamp',
    slug: 'aalmira-lithophane-photo-lamp',
    category: 'Lighting & Lamps',
    shortTagline: 'A photo that only appears when lit',
    description:
      'Your photograph rendered as a 3D-printed lithophane on a hand-cast resin base — flat and subtle by day, a glowing portrait by night. The resin-and-print hybrid no photo-gift shop offers.',
    priceMin: 1499,
    priceMax: 4999,
    showPrice: true,
    timeline: 'Upload photo · ships in 5–7 days',
    materials: 'PLA lithophane, hand-cast resin base, warm LED, USB-C',
    dimensions: 'Arch 14 cm · Dome 16 cm · Panel 18 cm',
    status: 'active',
    featured: false,
    images: [img('Lithophane Lamp')],
    imageAlts: ['3D-printed lithophane photo lamp glowing on a cast-resin base'],
    fields: [
      PHOTO,
      SIZE(['Arch 14 cm', 'Dome 16 cm', 'Panel 18 cm']),
      { label: 'Resin base colour', type: 'select', options: ['Marble', 'Ocean', 'Black'] },
      { label: 'Engraving (optional)', type: 'text' },
    ],
    seoTitle: 'Custom Lithophane Photo Lamp with Resin Base | ResinRiva',
    seoDescription:
      'Turn a photo into a glowing 3D-printed lithophane lamp on a hand-cast resin base. Personalised keepsake lighting, ships in 5–7 days.',
  },

  // ── Trays, Coasters & Serveware ─────────────────────────────────────────
  {
    title: 'Monsoon Marble Serving Tray',
    slug: 'monsoon-marble-serving-tray',
    category: 'Trays & Serveware',
    shortTagline: 'Petrichor in marble and gold, with handles',
    description:
      'A rectangular serving tray in grey-and-white marble resin shot with a single gold river, finished with brushed-brass handles. Food-safe sealed top for serving or styling.',
    priceMin: 2299,
    priceMax: 6999,
    showPrice: true,
    timeline: 'Ships in 6–8 days',
    materials: 'Food-safe epoxy resin, marble pigment, gold leaf, brushed-brass handles, ply base',
    dimensions: 'Small 12 × 8 in · Large 18 × 12 in',
    status: 'active',
    featured: false,
    images: [img('Marble Tray')],
    imageAlts: ['Grey-and-white marble resin serving tray with a gold vein and brass handles'],
    fields: [
      SIZE(['Small 12 × 8 in', 'Large 18 × 12 in']),
      { label: 'Vein colour', type: 'select', options: ['Gold', 'Silver', 'Copper'] },
      { label: 'Monogram (optional)', type: 'text' },
    ],
    seoTitle: 'Marble Resin Serving Tray with Brass Handles | ResinRiva',
    seoDescription:
      'A food-safe marble resin serving tray with a gold vein and brushed-brass handles. Optional monogram. Handmade serveware, made in India.',
  },
  {
    title: 'Petal Coaster Set of Four',
    slug: 'petal-coaster-set-of-four',
    category: 'Trays & Serveware',
    shortTagline: 'Real petals set under glass-clear resin',
    description:
      'A set of four coasters, each holding pressed real flowers in clear resin with a gold-rimmed edge and cork-backed base. A gentle, giftable entry into resin craft.',
    priceMin: 1299,
    priceMax: 2999,
    showPrice: true,
    timeline: 'Ships in 5–7 days',
    materials: 'Epoxy resin, pressed flowers, gold edging, cork backing',
    dimensions: '4 in round · 4 in square (set of 4)',
    status: 'active',
    featured: false,
    images: [img('Petal Coasters')],
    imageAlts: ['Set of four clear resin coasters with pressed flowers and gold rims'],
    fields: [
      { label: 'Shape', type: 'select', options: ['Round', 'Square', 'Hexagon'] },
      { label: 'Flower tone', type: 'select', options: ['Mixed', 'Rose', 'Blue', 'Marigold'] },
      { label: 'Gift box', type: 'select', options: ['Yes', 'No'] },
    ],
    seoTitle: 'Real-Flower Resin Coaster Set of 4 | ResinRiva',
    seoDescription:
      'Four clear resin coasters with pressed real flowers and gold rims, gift-boxed. A perfect housewarming gift. Made in India.',
  },

  // ── Preserved Keepsakes ─────────────────────────────────────────────────
  {
    title: 'First-Bloom Baby Keepsake Frame',
    slug: 'first-bloom-baby-keepsake-frame',
    category: 'Preserved Keepsakes',
    shortTagline: "Your baby's first locks and hospital band, kept",
    description:
      "A resin keepsake frame holding your baby's first hair, hospital band and a photo, with name, weight and date of birth in gold. A milestone made to outlast the memory.",
    priceMin: 3999,
    priceMax: 8999,
    showPrice: true,
    timeline: 'Courier keepsakes · 18–22 days total',
    materials: 'Epoxy resin, gold foil, oak frame',
    dimensions: '8 × 8 in · 10 × 12 in',
    status: 'active',
    featured: false,
    images: [img('Baby Keepsake')],
    imageAlts: ['Resin baby keepsake frame with first hair, hospital band, photo and gold details'],
    fields: [
      { label: "Baby's name", type: 'text', required: true },
      { label: 'Date of birth', type: 'date', required: true },
      { label: 'Weight / details', type: 'text' },
      PHOTO,
      SIZE(['8 × 8 in', '10 × 12 in']),
    ],
    seoTitle: 'Baby Keepsake Resin Frame — First Hair & Band | ResinRiva',
    seoDescription:
      "Preserve your baby's first hair, hospital band and photo in a resin keepsake frame with gold details. Personalised milestone gift.",
  },

  // ── Jewellery & Trinkets ────────────────────────────────────────────────
  {
    title: 'Bloom Resin Pendant',
    slug: 'bloom-resin-pendant',
    category: 'Jewellery & Trinkets',
    shortTagline: 'A real flower, worn close',
    description:
      'A pressed real bloom suspended in a gold-rimmed resin pendant on an adjustable chain — light, water-resistant and quietly personal.',
    priceMin: 599,
    priceMax: 1499,
    showPrice: true,
    timeline: 'Ships in 4–6 days',
    materials: 'Epoxy resin, pressed flower, gold-plated bezel and chain',
    dimensions: '2.5 cm pendant · 18–22 in chain',
    status: 'active',
    featured: false,
    images: [img('Bloom Pendant')],
    imageAlts: ['Gold-rimmed resin pendant with a pressed real flower on a chain'],
    fields: [
      { label: 'Flower / colour', type: 'select', options: ['Rose', 'Forget-me-not', 'Marigold', 'Mixed'] },
      { label: 'Metal tone', type: 'select', options: ['Gold', 'Rose Gold', 'Silver'] },
    ],
    seoTitle: 'Real Flower Resin Pendant Necklace | ResinRiva',
    seoDescription:
      'A pressed real-flower resin pendant with a gold rim and adjustable chain. A delicate, personal gift. Handmade in India.',
  },
  {
    title: 'Monogram Resin Keychain',
    slug: 'monogram-resin-keychain',
    category: 'Jewellery & Trinkets',
    shortTagline: 'Initials in colour, gift-boxed',
    description:
      'A made-to-order keychain with your initial in gold leaf over a colour pour of your choice — the easy return-gift and party favour that still feels handmade.',
    priceMin: 499,
    priceMax: 999,
    showPrice: true,
    timeline: 'Ships in 4–6 days · bulk 8–10 days',
    materials: 'Epoxy resin, gold leaf, metal ring',
    dimensions: '5 cm',
    status: 'active',
    featured: false,
    images: [img('Monogram Keychain')],
    imageAlts: ['Resin keychain with a gold-leaf initial over a colour pour'],
    fields: [
      { label: 'Initial / text', type: 'text', required: true },
      { label: 'Colour', type: 'select', options: ['Ocean', 'Blush', 'Emerald', 'Midnight'] },
      { label: 'Quantity (return gifts)', type: 'number' },
    ],
    seoTitle: 'Personalised Resin Keychain — Return Gifts | ResinRiva',
    seoDescription:
      'Gold-initial resin keychains in your colour, gift-boxed and available in bulk for return gifts. Handmade in India.',
  },

  // ── Corporate & Branding ────────────────────────────────────────────────
  {
    title: 'Boardroom Logo Plaque',
    slug: 'boardroom-logo-plaque',
    category: 'Corporate & Branding',
    shortTagline: 'Your logo set in batch-matched resin',
    description:
      'A corporate plaque with your logo inlaid in resin over a pigment batch matched to your brand colours — design-approved and reproducible across sets, so the 5th and the 500th match.',
    priceMin: 799,
    priceMax: 2499,
    showPrice: false,
    timeline: 'Approval sample in 5 days · bulk 12–18 days',
    materials: 'Epoxy resin, brand-matched pigments, printed inlay, walnut or acrylic backboard',
    dimensions: '6 × 8 in · 8 × 10 in (per unit, 50+ MOQ)',
    status: 'active',
    featured: true,
    images: [img('Logo Plaque')],
    imageAlts: ['Corporate resin plaque with an inlaid company logo in brand colours'],
    fields: [
      { label: 'Company name', type: 'text', required: true },
      { label: 'Logo file', type: 'file', required: true },
      { label: 'Brand colours (hex)', type: 'text' },
      { label: 'Quantity', type: 'number', required: true },
    ],
    seoTitle: 'Corporate Resin Logo Plaques — Bulk & Branded | ResinRiva',
    seoDescription:
      'Brand-matched resin logo plaques for corporate gifting, with design approval and batch consistency across large orders. Made in India.',
  },
  {
    title: 'Milestone Award Block',
    slug: 'milestone-award-block',
    category: 'Corporate & Branding',
    shortTagline: 'Recognition that sits well on a desk',
    description:
      'A solid resin award block with a suspended metallic emblem and laser-etched recipient details — a premium alternative to the standard acrylic trophy for work anniversaries and awards.',
    priceMin: 1499,
    priceMax: 3999,
    showPrice: false,
    timeline: 'Approval in 5 days · 10–15 days',
    materials: 'Deep-pour resin, metallic emblem, etched brass plate',
    dimensions: '4 × 6 in block · 5 × 7 in block',
    status: 'active',
    featured: false,
    images: [img('Award Block')],
    imageAlts: ['Clear resin award block with a suspended emblem and etched brass plate'],
    fields: [
      { label: 'Recipient & citation', type: 'textarea', required: true },
      { label: 'Emblem / logo file', type: 'file' },
      SIZE(['4 × 6 in', '5 × 7 in']),
      { label: 'Quantity', type: 'number' },
    ],
    seoTitle: 'Resin Award Block — Corporate Recognition | ResinRiva',
    seoDescription:
      'Premium resin award blocks with suspended emblems and etched details for work milestones and awards. Bulk-friendly, made in India.',
  },

  // ── 3D-Printed Decor ────────────────────────────────────────────────────
  {
    title: 'Skyline Lithophane Night Lamp',
    slug: 'skyline-lithophane-night-lamp',
    category: '3D-Printed Decor',
    shortTagline: 'Your city or your photo, glowing at night',
    description:
      'A 3D-printed lithophane night lamp of a city skyline or your own photo, on a weighted base with a warm LED — a subtle daytime object that lights up after dark.',
    priceMin: 1499,
    priceMax: 3999,
    showPrice: true,
    timeline: 'Ships in 5–7 days',
    materials: 'PLA lithophane, weighted base, warm LED, USB-C',
    dimensions: 'Curved 12 cm · 15 cm · 18 cm',
    status: 'active',
    featured: false,
    images: [img('Skyline Lamp')],
    imageAlts: ['3D-printed lithophane night lamp showing a glowing city skyline'],
    fields: [
      { label: 'Skyline city OR upload photo', type: 'text' },
      PHOTO,
      SIZE(['12 cm', '15 cm', '18 cm']),
    ],
    seoTitle: 'Lithophane Skyline Night Lamp — Custom | ResinRiva',
    seoDescription:
      'A 3D-printed lithophane night lamp of your city skyline or photo on a weighted base. Personalised lighting, ships in 5–7 days.',
  },
  {
    title: 'Terra Resin-Rim Planter',
    slug: 'terra-resin-rim-planter',
    category: '3D-Printed Decor',
    shortTagline: 'A printed planter with a resin water-line',
    description:
      'A 3D-printed geometric planter finished with a hand-poured resin rim that mimics a still water-line — the resin-and-print hybrid, with a built-in drip tray.',
    priceMin: 999,
    priceMax: 2499,
    showPrice: true,
    timeline: 'Ships in 6–8 days',
    materials: 'PLA body, epoxy resin rim, integrated drip tray',
    dimensions: 'Small 10 cm · Medium 14 cm · Large 18 cm',
    status: 'active',
    featured: false,
    images: [img('Resin Planter')],
    imageAlts: ['3D-printed geometric planter with a poured resin water-line rim'],
    fields: [
      SIZE(['Small 10 cm', 'Medium 14 cm', 'Large 18 cm']),
      { label: 'Body colour', type: 'select', options: ['Stone', 'Terracotta', 'Charcoal', 'Sage'] },
      { label: 'Resin rim tone', type: 'select', options: ['Ocean', 'Clear', 'Amber'] },
    ],
    seoTitle: '3D-Printed Planter with Resin Water-Line | ResinRiva',
    seoDescription:
      'A 3D-printed geometric planter with a hand-poured resin rim and drip tray. The resin-and-print hybrid for modern plant decor.',
  },
];
