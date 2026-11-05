# Workari website: audit and requirements checklist

Status against the Workari website specification. Last updated 5 November 2026.

**Legend:** ✅ Done and tested · 🟡 Partly done · ❌ Not built yet · 🔒 Built, but needs Workari's approved information before launch

Nothing below marked ✅ depends on invented business information. Where the site shows placeholder content (products, prices, sizes, policies, copy), it is marked 🔒.

---

## Phase 0 — Audit of the current website

| ID | Finding |
|---|---|
| AUD-01 | **Platform:** custom code, not a hosted shop builder. Next.js (storefront and admin) + Node/Express API + PostgreSQL via Prisma. Hosted on the VPS with nginx and pm2. Payments: Razorpay Standard Checkout or PayU Hosted Checkout (chosen by `.env`), plus cash on delivery. Images stored locally or on Cloudinary. No paid apps or plugins. |
| AUD-02 | **Pages:** home `/`, product `/product/<slug>`, collection `/collection/<id>`, bag `/cart`, address `/checkout`, payment `/checkout/payment`, orders `/orders` and `/orders/<number>`, account `/account`, six policy pages under `/policies/…`, admin `/admin`. Navigation: Workwear Sets, Kurtis, New arrivals, About. |
| AUD-03 | **Cart/checkout/payments:** bag stored per browser and per account; three-step checkout; online payments are signature-verified, checked against the order amount, and idempotent. Covered by automated API and browser tests. |
| AUD-04 | **Inventory and orders:** stock is one number **per product** (not per size/colour). It is reserved when an order is placed and released on cancel, return or unpaid timeout (30 minutes). Order status is moved by staff in Admin → Orders: Confirmed → Packed → Shipped → Out for delivery → Delivered, or Cancelled/Returned. No courier integration. |
| AUD-05 | **Analytics:** none installed. No GA4, Search Console verification, or ad pixels. |
| AUD-06 | **Obsolete content:** the earlier "Terra Studios" demo (men's, kids', footwear, low-resolution photos) has been removed. Festive and bridal pieces are kept as drafts. Old demo product URLs now return 404 (see SEO-05). `pdn.bullalways.in` should redirect to `workari.in` once payment webhooks are moved. |
| AUD-07 | **Main gaps:** guest checkout, per-size inventory, size guide/measurements, emails (order confirmation, password reset), FAQ, return-request process and analytics. Details are in the tables below. |

## Phase 1 — Brand and business

| ID | Status | Notes |
|---|---|---|
| BR-01 | 🟡 | Store name defaults to Workari; titles, footer and policies follow the name set in admin. The logo is a letter mark until the approved logo is supplied. |
| BR-02 | 🔒 | Palette and typography are applied consistently (plum, rose, gold; serif display headings). Needs the approved Workari logo, colours and fonts. |
| BR-03 | ✅ | Page titles, meta descriptions, sharing previews and favicon use Workari. |
| BR-04 | ✅ | Only workwear is live: Workwear Sets and Kurtis. Festive and bridal pieces are drafts, and men's and kids' items were removed. |
| BR-05 | ❌ | The site sends no emails or SMS yet; order confirmations are on screen only. Needs an email provider. |
| BR-06 | 🔒 | Registered business name and address fields exist (Store Settings) and are not yet filled in. |
| BR-07 | 🔒 | Email `spoken.3764@gmail.com` and phone `+91 70040 23078` are shown. Confirm they are monitored, and the support hours. |
| BR-08 | 🔒 | Shipping, payment, refund and return policy pages exist with **template** text (for example, a 7-day return window). Every policy must be confirmed or rewritten in Store Settings. |
| BR-09 | 🔒 | GST, invoicing and legal requirements are not handled by the site (no GST invoice). |

## Phase 2 — Customer experience and design

| ID | Status | Notes |
|---|---|---|
| UX-01 | ✅ | Hero banners with a frosted-glass text panel, editable in Admin → Banners with a live preview. |
| UX-02 | ✅ | "Shop workwear" goes to the Workwear Sets collection. |
| UX-03 | ✅ | Category tiles and the navigation only show categories that have live products. |
| UX-04 | ✅ | New arrivals = newest live products. Bestsellers come from real orders and stay hidden until there are sales. |
| UX-05 | 🔒 | A brand-story block exists; its text is placeholder copy and needs approved claims. |
| UX-06 | ✅ | Trust strip (built from real delivery and COD settings), footer contact details, policy links and WhatsApp (when a number is set). |
| UX-07 | 🟡 | Sign-up form with an unticked consent box; addresses are stored and exportable as CSV in admin. Not connected to an email platform yet. |
| UX-08 | ✅ | Every active category is in the main navigation (desktop mega-menu, mobile drawer). |
| UX-09 | ✅ | Search, account and bag are available on desktop and mobile. |
| UX-10 | ✅ | Bag count updates on add and remove (with animation). |
| UX-11 | ✅ | Mobile drawer, bottom tab bar and sticky action bars. |
| Nav | 🟡 | Live: Shop all, Workwear Sets, Kurtis, New arrivals, About Workari. "Shirts" and "Trousers" were left out because there are no separate products for them yet. |
| UX-12 | ✅ | Shared card, button and heading styles across pages. |
| UX-13 | ✅ | Tested at 360–414 px widths with no horizontal scroll. |
| UX-14 | ✅ | Buttons and links describe their action. |
| UX-15 | ✅ | No automatic pop-ups. The style quiz opens only on request, and the add-to-bag toast does not block anything. |
| UX-16 | ✅ | Large product images with zoom. |

## Phase 3 — Catalogue and discovery

| ID | Status | Notes |
|---|---|---|
| CAT-01 | 🟡 | Every product has a unique ID and URL slug. There is no SKU field, and variants have no IDs. |
| CAT-02 | 🔒 | The 7 live products are placeholders: AI-generated or sample photos with invented names, fabrics and prices. Replace them with the real catalogue. |
| CAT-03 | ❌ | Price and stock are per product, not per size/colour. |
| CAT-04 | 🔒 | Images and specifications are attached to products; the content needs replacing. |
| CAT-05 | 🟡 | Sold-out products cannot be bought. Sold-out *sizes* cannot be blocked until CAT-03 is built. |
| CAT-06 | ✅ | Categories plus admin-built collections. |
| CAT-07 | ✅ | Sort by recommended, newest, and price low–high or high–low. |
| CAT-08 | ✅ | Size, colour and price filters with clear/reset. |
| CAT-09 | ❌ | No fabric, fit or occasion filters (needs verified attributes). |
| CAT-10 | ✅ | Empty-results message with reset. |
| CAT-11 | ✅ | Cards open the correct product. |
| 7.3 cards | ✅ | Image, name, price, MRP and discount, colours, out-of-stock badge. Quick view, wishlist and quick add are not built (optional). |

## Phase 4 — Product pages

| ID | Status | Notes |
|---|---|---|
| PDP-01 | ✅ | Name and price. |
| PDP-02 | 🟡 | Size and colour chips. Availability is per product (see CAT-03). |
| PDP-03, 04, 06 | 🔒 | Description, fabric and care are shown; the content is placeholder. |
| PDP-05 | ❌ | No garment measurements. |
| PDP-07 | ❌ | No SKU field. |
| PDP-08, 09 | 🟡 | Three images per product, but they are crops of one photo. Real front, back and detail shots are needed. |
| PDP-10 | 🔒 | Model photos are illustrations; they must be replaced with photos of the real garments. |
| PDP-11 | ✅ | Zoom view. |
| PDP-12 | ✅ | WebP images, responsive sizes, lazy loading. |
| PDP-13, 14, 15 | ❌ | Size guide, model measurements and fit description need approved data and a template. |
| PDP-16 | ✅ | A size must be chosen before adding to the bag. |
| PDP-17 | ✅ | Size and colour carry through bag, checkout and order. |
| PDP-18 | ✅ | Add-to-bag animation, toast with "View bag", and the button changes to "Go to bag". |
| PDP-19 | 🟡 | Delivery information text is shown open on the page. There is no PIN-code check or delivery-date estimate. |
| PDP-20 | ✅ | Return and exchange terms are shown open on the product page (content 🔒). |
| PDP-21 | ✅ | In stock / only N left / out of stock, from real stock. |
| PDP-22 | 🟡 | One price per product; variant prices are not supported. |
| PDP-23 | 🟡 | Signed-in customers can review. Reviews are not restricted to verified buyers. |
| PDP-24 | 🟡 | Customer photos are supported but published without moderation. |
| PDP-25 | ✅ | Related products from the same category. |
| PDP-26 | ❌ | No complementary-product suggestions. |

## Phase 5 — Cart, checkout and payment

| ID | Status | Notes |
|---|---|---|
| CART-01 to 06 | ✅ | Variants, quantity and remove, subtotal plus delivery, MRP savings and coupons, bag kept per browser and per account, continue-shopping and checkout actions. |
| CHECK-01 | ❌ | **Guest checkout is not built: an account is required.** This is the biggest P0 gap. |
| CHECK-02 to 05 | ✅ | Minimal fields, Indian mobile and PIN validation, full order summary, address and payment steps before the order is placed. |
| CHECK-06 | 🟡 | Razorpay/PayU online payment and COD are built and tested with test or simulated gateways. A live Razorpay payment on workari.in has not been confirmed yet. |
| CHECK-07 | ✅ | Idempotent order placement; failed or closed payments leave one unpaid order with retry or switch-to-COD. |
| CHECK-08 | 🟡 | On-screen confirmation and an order page. No confirmation email (see BR-05). |
| PAY-01 | 🔒 | The gateway account must be Workari's own, approved for `workari.in`. |
| PAY-02 | 🟡 | Test-mode UPI and card checks still need to be run on the live server. |
| PAY-03 | ✅ | COD orders are confirmed and marked paid on delivery. |
| PAY-04 | ✅ | Paid only after a verified signature or webhook with a matching amount. |
| PAY-05 | ✅ | Repeated clicks and retries return the same order; duplicate webhooks are ignored. |

## Phase 6 — Shipping, returns and support

| ID | Status | Notes |
|---|---|---|
| OPS-01 | 🔒 | Shipping policy page (template). |
| OPS-02 | ✅ | Delivery fee and COD fee are shown in the bag and at checkout before payment. |
| OPS-03 | ❌ | No delivery estimates (needs approved dispatch and delivery times). |
| OPS-04, 05 | ✅ | My Orders shows status and courier tracking. Staff update the status (no courier integration). |
| OPS-06, 07 | 🔒 | Return, exchange and refund pages (template). |
| OPS-08 | ❌ | No return or exchange request form; customers must contact support. |
| OPS-09 | ❌ | No handling for an unavailable replacement size. |
| OPS-10 | 🟡 | Product pages and policy pages read the same Store Settings text. |
| OPS-11 | ✅ | Contact Us page with working email and phone links, plus WhatsApp when a number is set. |
| OPS-12 | ❌ | No FAQ page. |
| OPS-13 | ❌ | No issue-reporting form (damaged, wrong or missing items). |
| OPS-14 | 🟡 | Support links are in the footer and on the contact page; there is no support entry on the order page. |

## Phase 7 — Accounts and retention (P1)

| ID | Status | Notes |
|---|---|---|
| RET-01 | ❌ | Depends on guest checkout. |
| RET-02 | 🟡 | Secure login (hashed passwords, HTTP-only cookies, rate limits). No password reset. |
| RET-03 | ✅ | Order history. |
| RET-04 | 🟡 | One saved address per account. |
| RET-05 | 🟡 | Order details are in the account; there is no return request flow. |
| RET-06 | ❌ | No wishlist. |
| RET-07 | 🟡 | See UX-07. |
| RET-08, 09, 10 | ❌ | No post-purchase, abandoned-cart or new-arrival emails. |

## Phase 8 — Mobile and accessibility

| ID | Status | Notes |
|---|---|---|
| MOB-01 to 06 | ✅ | Tested on phone sizes: navigation, images, size selection, bag, checkout and forms with clear errors. |
| MOB-07 | 🟡 | Native buttons and links with focus outlines throughout; no full keyboard audit yet. |
| MOB-08 | ✅ | Product images use the product name as alt text; decorative images are empty. |
| MOB-09 | 🟡 | Main text meets contrast. Text over photos depends on the chosen glass style (light or dark); check each banner. |

## Phase 9 — SEO, performance, reliability

| ID | Status | Notes |
|---|---|---|
| SEO-01, 02 | ✅ | Unique titles and descriptions; canonical URLs. |
| SEO-03, 04 | ✅ | `/sitemap.xml` and `/robots.txt` (admin and API blocked; bag, checkout, account and order pages are marked noindex). The sitemap still needs to be submitted in Search Console. |
| SEO-05 | 🟡 | Old demo URLs return 404. Redirect `pdn.bullalways.in` to `workari.in`. |
| SEO-06 | ✅ | Product structured data with real price and stock. |
| SEO-07 | 🔒 | Category and product text is placeholder. |
| SEO-08 | ✅ | Navigation, breadcrumbs, related products and footer links. |
| PERF-01, 02 | ✅ | Optimised images; the only third-party script is the payment window at checkout. |
| PERF-03, 04, 05 | ❌ | Core Web Vitals, slow-network and cross-browser testing have not been done (tests run in Chromium only). |
| PERF-06 | 🟡 | Daily database backup cron is documented. No error monitoring or alerts. |
| PERF-07 | 🟡 | Hashed passwords, HTTP-only SameSite cookies, origin checks, signed payments, secrets kept in `.env`. No formal security review. |

## Phase 10 — Analytics (P1)

| ID | Status | Notes |
|---|---|---|
| ANA-01 to 05 | ❌ | No GA4, Search Console, ad pixels or consent banner. |
| Events | ❌ | None of the listed ecommerce events are tracked. |
| Reporting | 🟡 | The admin dashboard shows revenue (today, 7 and 30 days), orders, average order value, payment mix, top products, top regions and low stock. There are no session or funnel metrics. |

---

## Decisions needed from Workari (section 18)

| Decision | Current state on the site |
|---|---|
| Product catalogue | 7 placeholder workwear products. Need the final products, categories, variants and prices. |
| Sizing | XS–XXL labels only. Need size charts, garment measurements and fit descriptions. |
| Photography | AI-generated or sample illustrations. Need the approved product and model photos. |
| Shipping | ₹79 fee, free delivery over ₹999, COD up to ₹10,000 (placeholders in Store Settings). Need dispatch times, delivery estimates and COD rules. |
| Returns | Template text (7-day window). Need eligibility, timelines, return shipping and refund rules. |
| Customer support | Email and phone shown. Need confirmed channels and hours. |
| Brand | Letter-mark logo, plum/rose palette. Need the approved logo, colours, fonts and messaging. |
| Marketing | Sign-up text promises "new arrivals and workwear edits". Need the sign-up offer, consent wording and email platform. |

## Recommended next build (P0 order)

1. Guest checkout (CHECK-01) and order confirmation emails (BR-05, CHECK-08).
2. Size/colour variants with their own stock and SKU (CAT-03, CAT-05, PDP-07).
3. Size guide and fit fields on products (PDP-05, PDP-13 to 15).
4. FAQ, return/exchange request and issue-report forms (OPS-08, 12, 13).
5. GA4 with consent and ecommerce events (ANA-01 to 05).

## Managing the site (handover)

- **Products, stock, orders, coupons:** Admin sections of the same names. See [ADMIN-GUIDE.md](ADMIN-GUIDE.md).
- **Homepage order, top strip, trust strip, footer, social links, newsletter and subscribers:** Admin → Homepage & Footer.
- **Hero and promotion banners** (glass position and style, schedule, collections): Admin → Banners, with a live preview.
- **Policies, contact details, delivery and COD settings:** Admin → Store Settings.
- **Payments:** `.env` keys; see README "Orders & payments".
