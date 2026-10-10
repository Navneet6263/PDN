# Studio catalog (191 products)

`npx tsx scripts/load-catalog.ts` adds 191 products across Women, Men, Kids, Footwear and Accessories, adds their product types to the menus, and moves older preview listings that reused another listing's photo to drafts (nothing is deleted; a backup is written to `data/backups`). Re-running it skips products that already exist, so admin edits are kept.

## Photos

- Source: [Clothing dataset (subset)](https://github.com/alexeygrigorev/clothing-dataset-small) by Alexey Grigorev and contributors, released under **CC0 1.0** (public domain), so the photos may be used commercially without attribution.
- Processing: each photo's background was removed with [rembg](https://github.com/danielgatis/rembg) (u2net model) and the garment was placed on a warm studio backdrop with a soft shadow, at 720×960 WebP. A second "detail" image is a closer crop of the same photo.
- 191 photos were picked by hand from 320 candidates. Photos with visible hangers, brand logos, trademark patterns or poor cut-outs were left out.
- Files: `public/images/catalog/<slug>.webp` and `<slug>-detail.webp` (about 8 MB in total).

## Product details

Names, colours, materials and prices in `scripts/catalog-data.ts` were written from looking at each photo; descriptions, care text, sizes and stock levels are generated in `scripts/catalog-products.ts`. They are realistic placeholders. These are photos of real second-hand garments, not your stock: before selling, replace photos, prices, sizes, materials and stock with the details of the items you actually have.
