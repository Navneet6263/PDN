# Women's launch catalog

`npx tsx scripts/load-women-store.ts` turns the store into a women-only fashion store:

- Backs up products, departments, banners and settings to `data/backups/`.
- Deletes the earlier demo listings (men, kids, footwear, low-resolution studio photos). Products you created yourself are never deleted; a department that is no longer used is hidden instead when it still holds your products.
- Adds three departments: **Ethnic Wear** (Sarees, Anarkalis, Lehengas, Kurtis), **Workwear** (Kurta Sets, Shirt & Trouser Sets, Tunic Sets) and **Jewellery & Accessories** (Jewellery Sets).
- Adds 11 products (`scripts/women-catalog.ts`), three hero banners, two promotions, a Workwear collection, Top picks and women-focused store copy. The announcement strip is built from your delivery and COD settings so it never promises more than checkout does.

Re-running it refreshes the 11 launch products and banners; nothing is duplicated.

## Photos

`public/images/women/<slug>.webp` is the full look; `-2.webp` and `-3.webp` are closer crops of the same photo for the product gallery. Only high-resolution photos without third-party logos were kept (1024 px and 1024×1536 sources).

- The six workwear looks were made with image generation; the prompts are in [OFFICE-IMAGE-NOTES.md](OFFICE-IMAGE-NOTES.md).
- The saree, Anarkali, lehenga, kurti and jewellery photos came with the original project.

**These are illustrations, not photographs of stock you hold.** Before selling, replace each photo, price, fabric, size range and stock level with the real product's details in Admin → Products, or add your own products and unpublish these.
