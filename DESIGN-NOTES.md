# Fashion storefront refresh

The homepage now uses department navigation, an expandable category menu, a prominent functional search field, a split campaign banner, category tiles, a horizontal Top 10 edit, promotions, women's/men's/kids' product rows and a filterable catalog. Category and product lists come from PostgreSQL. Banner and store text remain editable in the existing admin.

Reference: https://www.myntra.com/ was requested by the user. Its main URL returned a maintenance/error response during research; accessible Myntra fashion/category pages provided the department and product-type reference. This project retains its own branding, generated campaign photography and implementation.

## Preview catalog

30 sample products: 10 women, 7 men, 6 kids, 3 accessories, 2 footwear, 1 beauty and 1 home. Samples have package contents, sizes, prices, stock, search keywords, SEO text and explicit sample descriptions. Some sample listings share representative photos. No ratings, reviews, sales figures or shipping guarantees were invented.

`scripts/load-sample-store.ts` backs up previous content before populating the design. `scripts/sample-catalog.ts`, `sample-clothing.ts` and `sample-lifestyle.ts` contain the sample data. Normal startup does not re-seed or reset admin edits.

## Image assets

Built-in image generation was used, without the API/CLI fallback. Saved project assets:

- `public/images/sample/festive-family.png`
- `public/images/sample/girls-lehenga.png`

Final family campaign prompt:

> Create a premium Indian fashion ecommerce campaign photograph, landscape 1536x1024. No text, no logos, no graphic overlays. Editorial full-body group portrait in a sunlit warm peach Jaipur palace courtyard with sculpted arches, clean terracotta floor and subtle bougainvillea. Five Indian models styled as a family fashion campaign: adult woman wearing a flowing deep fuchsia pink silk saree with subtle gold border; adult woman in an ivory and peach floral straight kurta set with dupatta; adult man in muted sage green kurta and ivory trousers; a girl around age 8 in a cheerful mustard yellow modest festive lehenga, and a boy around age 7 in an ivory kurta with coral Nehru waistcoat. Friendly natural confident expressions, realistic fine fabric detail, polished luxury catalog photography. Arrange models naturally in the center and right filling frame with balanced breathing room around full outfits and feet. Soft shadows, warm cream and rose palette, elegant and vibrant, attractive professional retail campaign. No winter clothing. All children fully clothed in age appropriate festive wear. Save finished asset for website use.

Final kids product prompt:

> Use case: product-mockup. Create a polished Indian kidswear e-commerce product photograph, portrait 1024x1536, full-length including feet. One happy Indian girl age 7 wearing a modest cheerful mustard yellow lehenga skirt with fine tiny gold motifs, a matching short-sleeve fully covering blouse and lightweight yellow dupatta draped neatly. Age appropriate child fashion catalog pose, no makeup, natural hair. Warm pale cream seamless studio backdrop with subtle soft shadows, realistic textile details and professional clean lighting. Center the child, entire outfit visible, no text, no logos, no watermarks. This will be used as a sample clothing product photo.

Existing ethnic product photographs came from the user-supplied original project. Additional preview images are stored locally under `public/images/sample`; sources are reproducible in `scripts/download-sample-photos.ts`:

| Asset | Source |
| --- | --- |
| white-tee.jpg | https://images.unsplash.com/photo-1521572163474-6864f9cf17ab |
| blue-denim.jpg | https://images.unsplash.com/photo-1542272604-787c3835535d |
| red-sneakers.jpg | https://images.unsplash.com/photo-1542291026-7eec264c27ff |
| tan-handbag.jpg | https://images.unsplash.com/photo-1548036328-c9fa89d128fa |
| beauty-edit.jpg | https://images.unsplash.com/photo-1596462502278-27bfdc403348 |
| home-edit.jpg | https://images.unsplash.com/photo-1600210492486-724fe5c67fb0 |
