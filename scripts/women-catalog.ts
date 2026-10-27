import { productSchema } from "../server/validation";

// The launch catalog: one product per HD photograph, each with a full-look
// image, a closer view and a detail view under /images/women.
type Row = {
  slug: string;
  name: string;
  category: "ethnic-wear" | "workwear" | "jewellery-accessories";
  subCategory: string;
  price: number;
  mrp: number;
  colors: string[];
  material: string;
  description: string;
  care: string;
  pack: [string, number][];
  sizes?: string[];
  moods: string[];
  style: "ethnic" | "minimal" | "bold";
  rank?: number;
};

const apparelCare =
  "Dry clean recommended for the first wash. Then hand wash separately in cold water with mild detergent. Dry in shade. Warm iron on the reverse.";
const cottonCare =
  "Hand or gentle machine wash cold, separately for the first two washes. Do not bleach. Dry in shade. Warm iron.";

const rows: Row[] = [
  {
    slug: "banarasi-zari-silk-saree",
    name: "Banarasi Zari Silk Saree",
    category: "ethnic-wear",
    subCategory: "Sarees",
    price: 3499,
    mrp: 5999,
    colors: ["Wine"],
    material: "Art silk with zari weave",
    description:
      "A deep wine Banarasi saree with a rich zari pallu, woven buttis across the drape and a wide gold border. It falls in clean, fluid pleats and photographs beautifully, from weddings and festive pujas to evening receptions. Comes with an unstitched blouse piece in a matching shade.",
    care: "Dry clean only. Store folded in a muslin cloth and refold every few months to protect the zari.",
    pack: [
      ["Saree (5.5 m)", 1],
      ["Unstitched blouse piece (0.8 m)", 1],
    ],
    sizes: ["Free Size"],
    moods: ["festive"],
    style: "ethnic",
    rank: 1,
  },
  {
    slug: "emerald-embroidered-anarkali-set",
    name: "Emerald Embroidered Anarkali Set",
    category: "ethnic-wear",
    subCategory: "Anarkalis",
    price: 2899,
    mrp: 4999,
    colors: ["Emerald green"],
    material: "Georgette with zari and sequin embroidery",
    description:
      "A floor-length emerald Anarkali with an embroidered yoke, a flared kali skirt finished with a gold motif border, and a sheer embroidered dupatta. Fitted through the bodice, easy through the flare, and made for sangeets, family functions and Diwali evenings.",
    care: apparelCare,
    pack: [
      ["Anarkali kurta", 1],
      ["Churidar", 1],
      ["Embroidered dupatta", 1],
    ],
    moods: ["festive"],
    style: "ethnic",
    rank: 2,
  },
  {
    slug: "scarlet-bridal-lehenga-set",
    name: "Scarlet Bridal Lehenga Set",
    category: "ethnic-wear",
    subCategory: "Lehengas",
    price: 8999,
    mrp: 14999,
    colors: ["Scarlet red"],
    material: "Silk blend with zari and thread embroidery",
    description:
      "A classic scarlet bridal lehenga covered in gold zari motifs, with a heavily bordered hem, a half-sleeve embroidered blouse and a sheer dupatta edged in gold. Generous flare for the phera walk, structured enough for every photograph.",
    care: "Dry clean only. Store in the garment bag provided, away from moisture.",
    pack: [
      ["Lehenga skirt", 1],
      ["Blouse (semi-stitched)", 1],
      ["Dupatta", 1],
    ],
    moods: ["festive"],
    style: "bold",
    rank: 3,
  },
  {
    slug: "pastel-block-print-kurti-set",
    name: "Pastel Block-Print Cotton Kurti",
    category: "ethnic-wear",
    subCategory: "Kurtis",
    price: 899,
    mrp: 1499,
    colors: ["Blush pink", "Mint", "Lemon yellow"],
    material: "Pure cotton with gold-tone block print",
    description:
      "Breathable everyday cotton kurtis in soft pastel shades, hand-block printed with gold floral motifs and finished with a printed placket. Straight fit, three-quarter sleeves and side slits: easy for college, errands and long summer days. Pick your colour.",
    care: cottonCare,
    pack: [["Kurti", 1]],
    moods: ["college", "everyday"],
    style: "minimal",
    rank: 4,
  },
  {
    slug: "kundan-jhumka-and-potli-set",
    name: "Kundan Jhumka & Potli Gift Set",
    category: "jewellery-accessories",
    subCategory: "Jewellery Sets",
    price: 1299,
    mrp: 2199,
    colors: ["Gold and maroon"],
    material:
      "Gold-tone alloy with kundan stones; velvet potli with zari embroidery",
    description:
      "Gold-tone kundan jhumkas with pearl drops, paired with a maroon velvet potli hand-embroidered in zari and a soft gold silk dupatta. Ready to gift for weddings, Raksha Bandhan and Diwali, or keep for your own festive season.",
    care: "Keep jewellery away from water and perfume. Store in the pouch provided. Spot clean the potli and dupatta.",
    pack: [
      ["Jhumka earrings (pair)", 1],
      ["Velvet potli bag", 1],
      ["Silk dupatta", 1],
    ],
    sizes: ["One Size"],
    moods: ["festive"],
    style: "ethnic",
    rank: 5,
  },
  {
    slug: "powder-blue-chikan-kurta-set",
    name: "Powder Blue Chikankari Kurta Set",
    category: "workwear",
    subCategory: "Kurta Sets",
    price: 1699,
    mrp: 2799,
    colors: ["Powder blue"],
    material: "Cotton with chikankari-style embroidery",
    description:
      "A calm powder-blue straight kurta with delicate white chikankari-style embroidery, paired with ivory trousers and a light white dupatta. Polished enough for Monday's first meeting, comfortable enough for the whole day.",
    care: cottonCare,
    pack: [
      ["Kurta", 1],
      ["Trousers", 1],
      ["Dupatta", 1],
    ],
    moods: ["office", "everyday"],
    style: "minimal",
    rank: 6,
  },
  {
    slug: "sage-straight-kurta-set",
    name: "Sage Linen-Blend Kurta Set",
    category: "workwear",
    subCategory: "Kurta Sets",
    price: 1499,
    mrp: 2499,
    colors: ["Sage green"],
    material: "Linen-cotton blend",
    description:
      "A crisp sage straight kurta with a shirt collar and button placket, worn over ivory trousers. The textured linen-blend weave keeps its shape through long workdays, and the clean lines work with flats or block heels.",
    care: cottonCare,
    pack: [
      ["Kurta", 1],
      ["Trousers", 1],
    ],
    moods: ["office", "college"],
    style: "minimal",
  },
  {
    slug: "rose-block-print-kurta-set",
    name: "Rose Block-Print Kurta Set",
    category: "workwear",
    subCategory: "Kurta Sets",
    price: 1299,
    mrp: 2199,
    colors: ["Dusty rose"],
    material: "Cotton with hand block print",
    description:
      "A dusty-rose cotton kurta with all-over buttis and a printed border hem, matched with straight pants in the same shade. A soft, easy colour for midweek meetings and evening plans after work.",
    care: cottonCare,
    pack: [
      ["Kurta", 1],
      ["Pants", 1],
    ],
    moods: ["office", "everyday"],
    style: "ethnic",
  },
  {
    slug: "ivory-shirt-and-trouser-set",
    name: "Ivory Shirt & Tailored Trouser Set",
    category: "workwear",
    subCategory: "Shirt & Trouser Sets",
    price: 1899,
    mrp: 3199,
    colors: ["Ivory and beige"],
    material: "Viscose crepe shirt; poly-viscose trousers",
    description:
      "A relaxed ivory shirt tucked into high-rise, wide-leg beige trousers with front pleats. Clean, modern and boardroom-ready, and it splits into two pieces you'll wear separately all week.",
    care: "Gentle machine wash cold inside out. Do not wring. Line dry. Cool iron.",
    pack: [
      ["Shirt", 1],
      ["Trousers", 1],
    ],
    moods: ["office"],
    style: "minimal",
    rank: 7,
  },
  {
    slug: "navy-geometric-kurta-set",
    name: "Navy Geometric Print Kurta Set",
    category: "workwear",
    subCategory: "Kurta Sets",
    price: 1599,
    mrp: 2599,
    colors: ["Navy"],
    material: "Cotton with geometric foil print",
    description:
      "A deep navy straight kurta with a fine geometric print and a notched neckline, paired with ivory trousers. A sharp, easy Friday look that goes from your last meeting straight to dinner.",
    care: cottonCare,
    pack: [
      ["Kurta", 1],
      ["Trousers", 1],
    ],
    moods: ["office", "college"],
    style: "minimal",
  },
  {
    slug: "teal-asymmetric-tunic-set",
    name: "Teal Asymmetric Tunic Set",
    category: "workwear",
    subCategory: "Tunic Sets",
    price: 2199,
    mrp: 3499,
    colors: ["Teal"],
    material: "Cotton slub with metallic buttis",
    description:
      "A statement teal tunic with an asymmetric handkerchief hem and fine metallic buttis, over slim ivory pants. Bold enough for a Saturday at the office and relaxed enough for brunch after.",
    care: cottonCare,
    pack: [
      ["Tunic", 1],
      ["Pants", 1],
    ],
    moods: ["office", "everyday"],
    style: "bold",
    rank: 8,
  },
];

export const womenProducts = rows.map((r, i) =>
  productSchema.parse({
    name: r.name,
    slug: r.slug,
    brand: "Terra Studios",
    category: r.category,
    subCategory: r.subCategory,
    price: r.price,
    originalPrice: r.mrp,
    stock: [18, 12, 6, 40, 24, 20, 22, 26, 15, 21, 9][i],
    image: `/images/women/${r.slug}.webp`,
    gallery: [1, 2, 3].map(
      (n) => `/images/women/${r.slug}${n === 1 ? "" : `-${n}`}.webp`,
    ),
    description: r.description,
    material: r.material,
    care: r.care,
    colors: r.colors,
    sizes: r.sizes || ["XS", "S", "M", "L", "XL", "XXL"],
    packageContents: r.pack.map(([name, quantity]) => ({ name, quantity })),
    published: true,
    featured: Boolean(r.rank && r.rank <= 4),
    topTenRank: r.rank ?? null,
    displayOrder: i + 1,
    searchPriority: 100 - i,
    searchKeywords: [
      r.subCategory.toLowerCase(),
      ...r.colors.map((c) => c.toLowerCase()),
      ...r.moods.map((m) => `mood:${m}`),
      `style:${r.style}`,
    ],
    seoTitle: `${r.name} | Terra Studios`.slice(0, 70),
    seoDescription: r.description.slice(0, 167).replace(/\s+\S*$/, "") + "…",
  }),
);

export const womenDepartments = [
  {
    slug: "ethnic-wear",
    label: "Ethnic Wear",
    image: "/images/women/emerald-embroidered-anarkali-set-2.webp",
    subCategories: ["Sarees", "Anarkalis", "Lehengas", "Kurtis"],
  },
  {
    slug: "workwear",
    label: "Workwear",
    image: "/images/women/ivory-shirt-and-trouser-set-2.webp",
    subCategories: ["Kurta Sets", "Shirt & Trouser Sets", "Tunic Sets"],
  },
  {
    slug: "jewellery-accessories",
    label: "Jewellery & Accessories",
    image: "/images/women/kundan-jhumka-and-potli-set-2.webp",
    subCategories: ["Jewellery Sets"],
  },
];
