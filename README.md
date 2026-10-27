# Terra Studios — Fashion catalog & admin

Customer storefront and admin panel rebuilt from the supplied Fashion Storefront design and photos.

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS.
- Backend: separate Node.js / Express API, written in TypeScript.
- Database: PostgreSQL through Prisma ORM. No MongoDB or SQLite dependency.
- Product photos: Cloudinary; uploads are resized and compressed to WebP before upload.
- Scope: a women's fashion store with searchable storefront, product details, customer accounts, saved carts, photo reviews, delivery-address checkout, festival collections and admin controls for products, Top 10/search placement, scheduled banners, categories, stock, store settings, team permissions, support records, orders with cash on delivery or online payment, an order management panel and a sales dashboard.

See [ADMIN-GUIDE.md](ADMIN-GUIDE.md) for placement rules, banner scheduling, default policies and team permissions.

The compact Style Studio banner opens an optional quiz and recommendations dialog; it never opens automatically. It recommends office, campus, everyday and festive looks from the actual catalog. Office plans cover Monday–Friday with an optional Saturday. Customers can save their preferences in this browser, skip/reopen the quiz, remix picks or clear preferences. Admin occasion/style controls are under Top 10 & Search.

## Run locally

Use Node.js 24 LTS and PostgreSQL. On PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

```sh
npm ci
npm run setup
```

Setup creates `.env` and displays a random admin password once. Save it. It never overwrites an existing `.env`.

Edit `.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/terra_store
IMAGE_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SITE_URL=http://localhost:3000
API_URL=http://127.0.0.1:4000
```

Create the empty PostgreSQL database first, or use the connection string from your managed provider. URL-encode special characters in database passwords. Cloudinary credentials are available in your product environment settings; they belong only on the backend.

```sh
npm run db:generate
npm run db:migrate
npm run seed
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/admin`. Default admin email: `admin@terra.local`; password: the value shown by setup. Email can be changed in `.env`.

New installations start empty. `npm run seed` only checks the database connection. To set the store up as the women's fashion store with its launch catalog, run `npx tsx scripts/load-women-store.ts` (see [CATALOG-NOTES.md](CATALOG-NOTES.md)). It backs up existing content under `data/backups` first. Test fixtures under `tests/fixtures` are separate from this catalog.

### Without an installed PostgreSQL server

For development only, `npm run db:dev` starts Prisma's local PostgreSQL-compatible development database (PGlite) on port 5432. Its first run downloads a tool. Keep that terminal open, copy the `postgres://...` connection string it prints into `DATABASE_URL`, then run migration and seed in another terminal. Use normal PostgreSQL/Neon/Supabase for hosting.

Start the database again after stopping all servers or restarting your computer. `npm run dev` starts only the frontend and backend; the local database needs its own running terminal. If the catalog is unavailable, run `npx tsx scripts/check-db.ts` to check the database connection without displaying credentials.

For offline UI development, `IMAGE_STORAGE=local` saves optimized uploads under `uploads/`. Hosted deployment must use Cloudinary. The application refuses to start in Cloudinary mode when credentials are missing.

## Women's catalog

The store sells women's fashion only: Ethnic Wear, Workwear and Jewellery & Accessories. `npx tsx scripts/load-women-store.ts` loads the 11-product HD launch catalog, banners and copy, and removes earlier demo listings. See [CATALOG-NOTES.md](CATALOG-NOTES.md), including what to replace before selling.

Adding to the bag shows the product flying into the bag icon, a bounce on the icon and a toast with a shortcut to the bag (the flight is skipped when the device asks for reduced motion).

## Orders & payments

Checkout is three focused steps with their own header (Bag → Address → Payment) and sticky price/Pay bars on phones. The payment page (`/checkout/payment`) has a sticky "Pay now" bar with the delivery address, coupon entry and the price breakup. If an online payment fails or is still pending, the order page shows a 30-minute countdown, **Retry payment** and **Pay on delivery instead**.


Customers can order with **cash on delivery** out of the box. Delivery fee, free-delivery amount and COD rules are in **Admin → Store Settings → Payments & delivery**. Order handling is described in [ADMIN-GUIDE.md](ADMIN-GUIDE.md#orders).

Online payment is enabled by adding one gateway's keys to `.env` and restarting. **PayU** (PayU Hosted Checkout):

```dotenv
PAYU_MERCHANT_KEY=your_key
PAYU_MERCHANT_SALT=your_salt_v1
PAYU_MODE=test        # live after a successful test payment
SITE_URL=https://your-domain
```

Customers are sent to PayU's payment page and come back to `/api/payments/return/payu`, which checks PayU's SHA-512 hash and the amount before marking the order paid. In the PayU dashboard, add `https://YOUR-DOMAIN/api/payments/webhook/payu` as the webhook for successful and failed payments so payments are recorded even if the customer closes the browser before returning. Refunds are issued from the PayU dashboard, then recorded with **Record refund** in admin. The PayU integration is tested against PayU's documented hash formula and a simulated PayU response, not yet against a live PayU account.

To test a live gateway cheaply, create a ₹1 coupon: `npx tsx scripts/create-test-coupon.ts` makes **NAVNEET**, which turns any order into a ₹1 order (5 uses, expires in 7 days; add `--email you@example.com` to limit it to one account). Anyone who knows the code can use it, so switch it off after testing with `npx tsx scripts/create-test-coupon.ts --off` or from **Admin → Coupons**.

**Razorpay** instead:

```dotenv
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

In the Razorpay dashboard, add a webhook to `https://YOUR-DOMAIN/api/payments/webhook/razorpay` for `payment.captured` and `payment.failed`, using the same webhook secret. Customers then see **Pay online** (UPI, cards, netbanking, wallets) at checkout. Use `rzp_test_` keys first. The Razorpay integration is covered by automated tests against a simulated API but has not yet been run against a live Razorpay account, so make a test-mode payment before going live.

For local development without keys, set `PAYMENT_TEST_MODE=true`: checkout then shows a fake gateway that can simulate success or failure. It refuses to start when `NODE_ENV=production`.

How it fits together:

- `server/payments/types.ts` defines the `PaymentProvider` contract: `create` (register an attempt with the gateway), `verify` (check the browser's success callback) and optional `webhook` (server-to-server confirmation).
- `server/payments/razorpay.ts` and `test-gateway.ts` implement it; `server/payments/index.ts` picks one from the environment.
- `server/orders.ts` holds the order rules: stock reservation, totals, idempotent payment results, status transitions and expiry of unpaid orders. It never calls a gateway directly.
- `components/shop/Payment.tsx` opens the gateway's window in the browser.

To add another gateway (Stripe, PhonePe, Cashfree, PayU), implement `PaymentProvider` in a new file under `server/payments/`, select it in `index.ts`, and add a branch for its browser checkout in `Payment.tsx`. Orders, refund flags, the admin panel and the dashboard work unchanged. Each payment attempt is a `Payment` row, so retries and partial failures are kept for audit.

## Product management

From admin, choose **Add product**. Enter the name, brand, category, description, fabric, care, selling price, MRP, stock, sizes and colors. Upload 1–8 images (JPEG/PNG/WebP, maximum 5 MB each); select the cover image.

The **What's in the package** section accepts multiple items and quantities, such as Kurta × 1, Trousers × 1, Dupatta × 1. These are stored as related PostgreSQL records and shown on the customer product page. Saving the product and its package contents is atomic.

**Policies & additional details** contains per-product exchange rules, return/refund rules, shipping/delivery information, warranty/guarantee and additional information. Enter the actual rules for your store. Saved text appears on the product page; blank fields are hidden. These fields publish information, not a return/exchange request processing system.

To remove unchanged products from the previous demo catalog, run `npx tsx scripts/remove-demo-products.ts`. It compares all original demo fields, preserves edited products, writes a backup in `data/backups/`, and deletes only unchanged demo records. It does not clear the whole database.

Enable **Published on storefront** to make it public. Drafts are excluded from public APIs, product pages and the sitemap. **Feature this product** prioritizes it in the catalog. Stock of zero displays an out-of-stock label. Inventory edits use the product editor. Stock is per product, not per size/color variant.

Deleting a product removes its database record and packet records. Uploaded Cloudinary assets are intentionally retained to avoid deleting images reused elsewhere. Periodically remove unused images in Cloudinary to keep storage usage down; cancelled uploads can also leave unused assets.

## SEO

Public pages render product content on the server. Product titles/descriptions, canonical URLs, Open Graph metadata, Product JSON-LD, robots.txt and a dynamic sitemap are included. Admin is marked noindex. Set the real `SITE_URL` before building/deploying. New public products appear in the sitemap automatically. This provides SEO infrastructure; ranking is not guaranteed.

## Production

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run build
npm start
```

`npm start` runs Next.js on port 3000 and the API on port 4000. Put HTTPS/reverse proxy in front of Next.js. Set `COOKIE_SECURE=true` and `SITE_URL=https://your-domain.com`. Keep the API private when both processes run on the same host. The API's origin check must match the public frontend origin exactly.

For separate services, run `npm run start:api` for Express (`API_HOST=0.0.0.0` and the provider's `PORT`) and `npm run start:web` for Next.js. Set `API_URL` on the frontend to the API's HTTPS address **before build** and at runtime. Browser calls still use the frontend's `/api` proxy, keeping cookies on the frontend domain. Do not set an API-only `PORT` on the combined process setup.

Cloudinary keys and `ADMIN_PASSWORD_HASH` stay on the API server. `DATABASE_URL` stays on the API/migration environment. If your database provider gives pooled and direct URLs, use the pooler in `DATABASE_URL` and the direct connection in `DIRECT_URL` for migrations. Follow the provider's TLS connection settings; never disable certificate verification for hosted databases.

Keep `.env`, `node_modules`, `.next`, `generated`, local uploads and development database files out of the source ZIP and Git. Prisma Client is recreated by `npm run db:generate` or `npm run build`.

## Verification

```sh
npm run typecheck
npm run build
npm test
```

API tests require `TEST_DATABASE_URL` pointing at a development PostgreSQL database; the default is `postgresql://postgres:postgres@localhost:5432/terra_store`. They create a uniquely named `terra_test_*` schema and remove only that schema. Do not point tests at production. The suite checks auth/cookies, cross-origin rejection, drafts, packet contents, persistent records, uniqueness, validation, upload processing, deletion and rate limiting.

For browser checks, start the app and set `E2E_PASSWORD` to the local admin password, then run `npm run test:e2e`. This creates and deletes a temporary product. Browser tests use installed Google Chrome and save screenshots under `test-results/`.

Application source files are split into modules of at most 300 lines. Prisma-generated files and dependency lockfiles are machine-generated and excluded from that limit.

Verification covers TypeScript, production build, API integration and Chrome storefront/admin flows. Live Cloudinary upload and your hosted PostgreSQL connection still need verification with your own credentials.

See [HOSTING.md](HOSTING.md) for budget hosting and image storage notes.

Customer accounts, guest-cart merging, photo reviews, spelling suggestions and checkout are documented in [SHOPPING-GUIDE.md](SHOPPING-GUIDE.md). Checkout saves an address and reviews the bag; payments and order placement are not enabled.
