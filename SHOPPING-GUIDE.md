# Customer shopping

The existing Next.js frontend and separate TypeScript Express API now support customer accounts, persistent shopping bags, photo reviews and an address/review checkout page. Apply migrations with `npm run db:migrate`, regenerate Prisma with `npm run db:generate`, then run `npm run dev`.

- `/account`: customer registration, login and logout. Customer accounts are separate from admin/team credentials. Passwords use salted scrypt; customer sessions use a separate HTTP-only cookie and hashed tokens in PostgreSQL.
- `/product/[slug]`: select an offered size and colour, add to bag, read reviews and submit a rating/comment with up to three photos. No reviews are fabricated. Reviews are labelled customer reviews, not verified purchases. A customer has one review per product; resubmitting updates it.
- `/cart`: guest items persist in this browser. Signing in merges them into the customer's PostgreSQL cart, preserving sizes and colours. Merge tokens make retries idempotent. Logging out hides the account cart; signing in again restores it. Browser storage must be available for guest persistence.
- `/checkout`: requires customer login, checks current prices, publication, category visibility, valid options and total product stock, and saves an Indian delivery address to the account. The customer then picks **Pay online** (when a gateway is configured) or **Cash on delivery**, sees the MRP discount, delivery fee and any COD fee, and places the order. A retried or double-clicked order returns the same order instead of a duplicate.
- `/orders` and `/orders/[number]`: the customer's orders, a delivery progress tracker, shipping/tracking details, price breakdown, payment status, a **Pay** button for unpaid online orders and **Cancel order** until the order is packed.

Inventory currently tracks total product stock, not separate stock by size/colour. Bags hold up to 50 different variants, with up to 10 units of each variant. Adding to the bag does not reserve stock; placing an order does.

Review uploads accept JPEG, PNG or WebP up to 5 MB and pass through the existing image validation/optimisation adapter. Photos persist locally until Cloudinary credentials and storage mode are configured. Only photos owned by the signed-in customer can be attached. There is a 12-photo daily allowance per account. Names and submitted photos are public; customer emails are not returned by the review API. The current review feed displays the most recent 100 reviews and aggregates all ratings.

# Banners and search

The style quiz opens only when the visitor clicks the compact style banner or My style. The saved plan is shown in a closable dialog. Existing admin occasion controls still determine matching.

`scripts/load-women-store.ts` adds three hero banners (festive, workwear collection, bridal) and two promotions. Edit title, images, CTA, position, dates and visibility in Admin → Banners. Multiple active hero banners rotate every five seconds. Pause/play and manual navigation are available; hover, focus, reduced motion and background tabs stop automatic advancement.

Both header suggestions and catalog filtering normalise common spelling variants: sari/saree, pent/paint/pants/trousers, kurtha/kurta and more. Suggestions come from published products and obey existing search priorities. This is a fashion alias dictionary, not a general spellchecker. Package contents are searchable too.

# Validation

`npm test` with `TEST_DATABASE_URL` exercises isolated database migrations, admin access, customer/account separation, repeated cart merge, checkout validation and persistence, review/photo ownership, rating updates and logout. Browser tests in `e2e/shopping.spec.ts` cover actual guest → registration → saved cart → checkout → logout/login, spelling suggestions, automatic banners and mobile widths 360/390/414. Test customer records are removed afterwards.
